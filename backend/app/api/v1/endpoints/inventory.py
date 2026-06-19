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
