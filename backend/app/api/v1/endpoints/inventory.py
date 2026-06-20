import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete
from sqlalchemy.orm import selectinload
from app.schemas.schemas import InventoryRequest, ComplianceResponse, Violation, Remediation, ComponentInfo
from app.db.database import get_db
from app.models.models import Rule, Device, DeviceComponent
from app.services.graph_service import graph_engine

router = APIRouter()
logger = logging.getLogger(__name__)

def generate_graph_elements(label_id: str, components: list, violations: list):
    elements = []
    
    # Central Endpoint Node
    elements.append({
        "id": "endpoint-device",
        "type": "input",
        "data": { "label": f"Endpoint ({label_id})" },
        "position": { "x": 400, "y": 50 },
        "style": { "background": "#0076CE", "color": "#fff", "border": "2px solid #005A9E", "borderRadius": "8px", "padding": "10px" }
    })
    
    node_x_spacing = 220
    node_y_start = 180
    
    # Process actual components
    seen_nodes = set()
    for idx, comp in enumerate(components):
        base_node_id = comp["type"]
        node_id = base_node_id
        
        # Ensure unique node IDs
        if node_id in seen_nodes:
            node_id = f"{base_node_id}-{idx}"
        seen_nodes.add(node_id)
        
        is_red = False
        is_yellow = False
        for v in violations:
            if v.get("source_component") == base_node_id or v.get("target_component") == base_node_id:
                if v.get("severity") == "CRITICAL":
                    is_red = True
                else:
                    is_yellow = True
                    
        node_style = { "border": "2px solid #10b981", "background": "#f0fdf4", "borderRadius": "8px", "padding": "10px" } 
        status_label = "Compliant"
        if is_red:
            node_style = { "border": "2px solid #ef4444", "background": "#fef2f2", "borderRadius": "8px", "padding": "10px" }
            status_label = "Non-Compliant"
        elif is_yellow:
            node_style = { "border": "2px solid #f59e0b", "background": "#fffbeb", "borderRadius": "8px", "padding": "10px" }
            status_label = "Warning"
            
        elements.append({
            "id": node_id,
            "data": { 
                "label": f"{comp['type']} v{comp['version']}",
                "componentName": comp['type'],
                "version": comp['version'],
                "status": status_label
            },
            "position": { "x": 100 + (idx % 4) * node_x_spacing, "y": node_y_start + (idx // 4) * 150 },
            "style": node_style
        })
        
        # Edge from endpoint with unique ID
        elements.append({
            "id": f"edge-endpoint-{node_id}-{idx}",
            "source": "endpoint-device",
            "target": node_id,
            "label": "HAS_COMPONENT",
            "style": { "stroke": "#cbd5e1" }
        })
        
    # Generate edges from violations
    edge_idx = 0
    ghost_x = 100
    seen_violation_edges = set()
    seen_ghost_nodes = set()
    
    for v in violations:
        src = v.get("source_component")
        tgt = v.get("target_component")
        dep = v.get("dependency", "DEPENDS_ON")
        
        if "(Missing)" in tgt:
            tgt_clean = tgt.replace(" (Missing)", "")
            if tgt_clean not in seen_ghost_nodes:
                elements.append({
                    "id": tgt_clean,
                    "data": { 
                        "label": f"{tgt_clean} (Missing)",
                        "componentName": tgt_clean,
                        "version": "N/A",
                        "status": "Missing"
                    },
                    "position": { "x": ghost_x, "y": node_y_start + 150 },
                    "style": { "border": "2px dashed #f59e0b", "background": "#fff", "borderRadius": "8px", "padding": "10px" }
                })
                seen_ghost_nodes.add(tgt_clean)
                ghost_x += 220
            tgt = tgt_clean
            
        # Deduplicate identical source-target violation edges
        edge_key = f"{src}-{tgt}-{dep}"
        if edge_key in seen_violation_edges:
            continue
        seen_violation_edges.add(edge_key)
            
        elements.append({
            "id": f"edge-rel-{src}-{tgt}-{edge_idx}",
            "source": src,
            "target": tgt,
            "label": dep,
            "style": { "stroke": "#ef4444", "strokeWidth": 2 } if dep == "INCOMPATIBLE" else { "stroke": "#f59e0b", "strokeWidth": 2 },
            "animated": True
        })
        edge_idx += 1
        
    return {"elements": elements}

@router.post("/", response_model=ComplianceResponse)
async def submit_inventory(request: InventoryRequest, db: AsyncSession = Depends(get_db)):
    try:
        logger.info(f"Inventory Request Received for device: {request.device_id}")
        
        rules_result = await db.execute(select(Rule))
        rules = rules_result.scalars().all()
        graph_engine.set_active_rules(rules)
        
        # Inject OS into components array for Graph Engine validation
        component_dicts = [{"type": "OS", "version": request.os.version, "vendor": request.os.name}]
        component_dicts.extend([{"type": c.type, "version": c.version, "vendor": c.vendor} for c in request.components])
        
        validation_result = graph_engine.validate_device(component_dicts)
        
        stmt = select(Device).where(Device.id == request.device_id)
        result = await db.execute(stmt)
        device = result.scalars().first()
        
        if not device:
            device = Device(
                id=request.device_id, 
                os_name=request.os.name, 
                os_version=request.os.version,
                compliance_score=validation_result["score"]
            )
            db.add(device)
        else:
            device.os_name = request.os.name
            device.os_version = request.os.version
            device.compliance_score = validation_result["score"]
            
        await db.execute(delete(DeviceComponent).where(DeviceComponent.device_id == request.device_id))
        
        for c in request.components:
            db_comp = DeviceComponent(
                device_id=request.device_id,
                component_type=c.type,
                vendor=c.vendor,
                version=c.version
            )
            db.add(db_comp)
            
        await db.commit()
        await db.refresh(device)
        
        # Form Remediation Roadmap
        remed = None
        if validation_result["violations"]:
            roadmap_steps = []
            for v in validation_result["violations"]:
                roadmap_steps.append(v.get("recommended_action", "Address violation"))
            roadmap_steps.append("Restart Device")
            roadmap_steps.append("Re-run Validation Check")

            remed = Remediation(
                recommended_action="Execute the recommended resolution roadmap sequentially.",
                safe_to_execute=True,
                simulated_script="Invoke-CompactIQRemediation -AutoFix",
                roadmap=roadmap_steps
            )

        graph_data = generate_graph_elements(request.device_id, component_dicts, validation_result["violations"])

        response = ComplianceResponse(
            device_id=request.device_id,
            compliance_score=validation_result["score"],
            status="COMPLIANT" if validation_result["score"] >= 100 else "NON_COMPLIANT",
            violations_count=len(validation_result["violations"]),
            violations=[Violation(**v) for v in validation_result["violations"]],
            remediation=remed,
            os_name=request.os.name,
            os_version=request.os.version,
            components=request.components,
            scan_status=device.scan_status,
            last_scanned=device.last_scanned,
            graph_elements=graph_data
        )
        return response
    except Exception as e:
        logger.exception(f"Unhandled Exception in submit_inventory: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/graph/elements")
async def get_graph_elements_endpoint(device_id: str = None, db: AsyncSession = Depends(get_db)):
    raise HTTPException(status_code=410, detail="Deprecated: Graph elements are returned directly via POST /inventory/ or GET /inventory/{device_id}.")

@router.get("/rules")
async def get_all_rules(db: AsyncSession = Depends(get_db)):
    rules_result = await db.execute(select(Rule).options(selectinload(Rule.document)))
    rules = rules_result.scalars().all()
    
    rules_data = []
    for r in rules:
        source_doc = r.document.filename if r.document else "Unknown Origin"
        rules_data.append({
            "id": r.id,
            "source_component": f"{r.source_component_type} v{r.source_version}",
            "target_component": f"{r.target_component_type} {r.target_min_version or ''} {r.incompatible_version or ''}".strip(),
            "relation": r.rule_type,
            "reason": r.reason,
            "confidence": 95,
            "ambiguous": False,
            "source_document": source_doc
        })
        
    return {"rules": rules_data}

@router.get("/{device_id}", response_model=ComplianceResponse)
async def get_compliance(device_id: str, db: AsyncSession = Depends(get_db)):
    if device_id == "latest":
        stmt = select(Device).options(selectinload(Device.components)).order_by(Device.last_scanned.desc())
    else:
        stmt = select(Device).options(selectinload(Device.components)).where(Device.id == device_id)
        
    result = await db.execute(stmt)
    device = result.scalars().first()
    
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    device_id = device.id 
        
    rules_result = await db.execute(select(Rule))
    rules = rules_result.scalars().all()
    graph_engine.set_active_rules(rules)
    
    component_dicts = [{"type": "OS", "version": device.os_version, "vendor": device.os_name}]
    component_dicts.extend([{"type": c.component_type, "version": c.version, "vendor": c.vendor} for c in device.components])
    
    validation_result = graph_engine.validate_device(component_dicts)
    
    remed = None
    if validation_result["violations"]:
        roadmap_steps = []
        for v in validation_result["violations"]:
            roadmap_steps.append(v.get("recommended_action", "Address violation"))
        roadmap_steps.append("Restart Device")
        roadmap_steps.append("Re-run Validation Check")

        remed = Remediation(
            recommended_action="Execute the recommended resolution roadmap sequentially.",
            safe_to_execute=True,
            simulated_script="Invoke-CompactIQRemediation -AutoFix",
            roadmap=roadmap_steps
        )

    components_info = [
        ComponentInfo(type=c.component_type, vendor=c.vendor, version=c.version)
        for c in device.components
    ]

    graph_data = generate_graph_elements(device_id, component_dicts, validation_result["violations"])

    return ComplianceResponse(
        device_id=device_id,
        compliance_score=validation_result["score"],
        status="COMPLIANT" if validation_result["score"] >= 100 else "NON_COMPLIANT",
        violations_count=len(validation_result["violations"]),
        violations=[Violation(**v) for v in validation_result["violations"]],
        remediation=remed,
        os_name=device.os_name,
        os_version=device.os_version,
        components=components_info,
        scan_status=device.scan_status,
        last_scanned=device.last_scanned,
        graph_elements=graph_data
    )

