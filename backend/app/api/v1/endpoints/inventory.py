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

@router.post("/", response_model=ComplianceResponse)
async def submit_inventory(request: InventoryRequest, db: AsyncSession = Depends(get_db)):
    # 1. Rebuild graph from active rules
    rules_result = await db.execute(select(Rule))
    rules = rules_result.scalars().all()
    graph_engine.build_graph_from_rules(rules)
    
    # 2. Validate components
    component_dicts = [{"type": c.type, "version": c.version, "vendor": c.vendor} for c in request.components]
    validation_result = graph_engine.validate_device(component_dicts)
    
    # 3. Save / Update Device details in Database
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
        
    # Delete old components to refresh them
    await db.execute(delete(DeviceComponent).where(DeviceComponent.device_id == request.device_id))
    
    # Insert new components
    for c in request.components:
        db_comp = DeviceComponent(
            device_id=request.device_id,
            component_type=c.type,
            vendor=c.vendor,
            version=c.version
        )
        db.add(db_comp)
        
    await db.commit()
    
    # 4. Form Remediation if violations exist
    remed = None
    if validation_result["violations"]:
        remed = Remediation(
            recommended_action="Update target component to latest tested version.",
            safe_to_execute=True,
            simulated_script=f"Update-Component -Type {validation_result['violations'][0]['target_component']}"
        )

    response = ComplianceResponse(
        device_id=request.device_id,
        compliance_score=validation_result["score"],
        status="COMPLIANT" if validation_result["score"] == 100 else "NON_COMPLIANT",
        violations_count=len(validation_result["violations"]),
        violations=[Violation(**v) for v in validation_result["violations"]],
        remediation=remed,
        os_name=request.os.name,
        os_version=request.os.version,
        components=request.components
    )
    return response

@router.get("/graph/elements")
async def get_graph_elements(device_id: str = None, db: AsyncSession = Depends(get_db)):
    if device_id:
        device_result = await db.execute(select(Device).where(Device.id == device_id))
        device = device_result.scalars().first()
        label_id = device.id if device else "Unknown Device"
    else:
        label_id = "Unscanned Device"

    rules_result = await db.execute(select(Rule))
    rules = rules_result.scalars().all()
    graph_engine.build_graph_from_rules(rules)
    
    elements = []
    
    # Central "Endpoint" node at the top
    elements.append({
        "id": "endpoint-device",
        "type": "input",
        "data": { "label": f"Endpoint ({label_id})" },
        "position": { "x": 400, "y": 50 },
        "style": { "background": "#0076CE", "color": "#fff" }
    })
    
    # Generate nodes
    node_x_spacing = 220
    node_y_start = 180
    
    index = 0
    for node_name in graph_engine.graph.nodes:
        # Check if node has a specific styling
        # e.g., highlight if it's known to be incompatible
        is_red = False
        for u, v, data in graph_engine.graph.edges(data=True):
            if (u == node_name or v == node_name) and data.get("relation") == "INCOMPATIBLE":
                is_red = True
                
        pos_x = 100 + (index * node_x_spacing)
        pos_y = node_y_start
        
        node_style = {}
        if is_red:
            node_style = { "border": "2px solid red", "background": "#ffebee" }
            
        elements.append({
            "id": node_name,
            "data": { "label": node_name.replace("_", " v") },
            "position": { "x": pos_x, "y": pos_y },
            "style": node_style
        })
        
        # Link from endpoint node to this component
        elements.append({
            "id": f"edge-endpoint-{node_name}",
            "source": "endpoint-device",
            "target": node_name,
            "label": "HAS_COMPONENT"
        })
        
        index += 1
        
    # Generate edges from rules
    edge_idx = 0
    for u, v, data in graph_engine.graph.edges(data=True):
        relation = data.get("relation", "DEPENDS")
        edge_style = {}
        animated = False
        if relation == "INCOMPATIBLE":
            edge_style = { "stroke": "red" }
            animated = True
            
        elements.append({
            "id": f"edge-rel-{edge_idx}",
            "source": u,
            "target": v,
            "label": relation,
            "style": edge_style,
            "animated": animated
        })
        edge_idx += 1
        
    return {"elements": elements}

@router.get("/{device_id}", response_model=ComplianceResponse)
async def get_compliance(device_id: str, db: AsyncSession = Depends(get_db)):
    # 1. Retrieve device from DB with its components loaded
    if device_id == "latest":
        stmt = select(Device).options(selectinload(Device.components)).order_by(Device.last_scanned.desc())
    else:
        stmt = select(Device).options(selectinload(Device.components)).where(Device.id == device_id)
        
    result = await db.execute(stmt)
    device = result.scalars().first()
    
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    device_id = device.id # Update in case we used 'latest'
        
    # 2. Rebuild active rules graph
    rules_result = await db.execute(select(Rule))
    rules = rules_result.scalars().all()
    graph_engine.build_graph_from_rules(rules)
    
    # 3. Validate components retrieved from DB
    component_dicts = [{"type": c.component_type, "version": c.version, "vendor": c.vendor} for c in device.components]
    validation_result = graph_engine.validate_device(component_dicts)
    
    # 4. Form Remediation if violations exist
    remed = None
    if validation_result["violations"]:
        remed = Remediation(
            recommended_action="Update target component to latest tested version.",
            safe_to_execute=True,
            simulated_script=f"Update-Component -Type {validation_result['violations'][0]['target_component']}"
        )

    components_info = [
        ComponentInfo(type=c.component_type, vendor=c.vendor, version=c.version)
        for c in device.components
    ]

    return ComplianceResponse(
        device_id=device_id,
        compliance_score=validation_result["score"],
        status="COMPLIANT" if validation_result["score"] == 100 else "NON_COMPLIANT",
        violations_count=len(validation_result["violations"]),
        violations=[Violation(**v) for v in validation_result["violations"]],
        remediation=remed,
        os_name=device.os_name,
        os_version=device.os_version,
        components=components_info
    )
