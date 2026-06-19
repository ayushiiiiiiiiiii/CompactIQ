from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.schemas.schemas import InventoryRequest, ComplianceResponse, Violation, Remediation
from app.db.database import get_db
from app.models.models import Rule, Device, DeviceComponent
from app.services.graph_service import graph_engine

router = APIRouter()

@router.post("/", response_model=ComplianceResponse)
async def submit_inventory(request: InventoryRequest, db: AsyncSession = Depends(get_db)):
    # 1. Rebuild graph for MVP (in a real app, this is cached/singleton)
    rules_result = await db.execute(select(Rule))
    rules = rules_result.scalars().all()
    graph_engine.build_graph_from_rules(rules)
    
    # 2. Validate
    component_dicts = [{"type": c.type, "version": c.version, "vendor": c.vendor} for c in request.components]
    validation_result = graph_engine.validate_device(component_dicts)
    
    # 3. Form Remediation if violations
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
        remediation=remed
    )
    return response

@router.get("/{device_id}", response_model=ComplianceResponse)
async def get_compliance(device_id: str, db: AsyncSession = Depends(get_db)):
    # Mocking retrieval for simplicity in MVP. Actual implementation would query `devices` DB.
    return ComplianceResponse(
        device_id=device_id,
        compliance_score=100,
        status="COMPLIANT",
        violations_count=0
    )

@router.get("/graph/elements")
async def get_graph_elements(db: AsyncSession = Depends(get_db)):
    rules_result = await db.execute(select(Rule))
    rules = rules_result.scalars().all()
    graph_engine.build_graph_from_rules(rules)
    
    elements = []
    
    # Central "Endpoint (DEVICE-XYZ-123)" node at the top
    elements.append({
        "id": "endpoint-device",
        "type": "input",
        "data": { "label": "Endpoint (DEVICE-XYZ-123)" },
        "position": { "x": 250, "y": 50 },
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

