import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete
from sqlalchemy.orm import selectinload
from app.schemas.schemas import InventoryRequest, ComplianceResponse, Violation, Remediation, ComponentInfo
from app.api.dependencies import get_db
from app.models.models import Rule, Device, DeviceComponent
from app.services.graph_service import graph_engine
from app.core.config import settings
from google import genai


async def generate_remediation_script(violations: list[dict]) -> str:
    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        prompt = """You are an Expert Windows System Administrator and Security Engineer.
Write a highly robust, safe, and IDEMPOTENT PowerShell script to remediate the following compliance violations.

STRICT REQUIREMENTS:
1. Idempotency: You MUST check if the fix is actually needed before applying it. Do not blindly execute commands.
2. Safety: Include Try/Catch blocks for error handling.
3. Logging: Output clear Write-Host messages indicating what is being checked, changed, or if it failed.
4. Output Format: Return ONLY the raw PowerShell script code. DO NOT wrap it in markdown blocks (no ```powershell). DO NOT include any explanatory text.

Violations to Remediate:
"""
        for v in violations:
            prompt += f"- Conflict: {
                v.get('source_component')} vs {
                v.get('target_component')}\n  Root Cause: {
                v.get('root_cause_explanation')}\n\n"

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt
        )
        return response.text.strip().replace("```powershell", "").replace("```", "")
    except Exception as e:
        print(f"Error generating script: {e}")
        return "# Failed to generate dynamic script\nInvoke-CompactIQRemediation -AutoFix"

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/", response_model=ComplianceResponse)
async def submit_inventory(
        request: InventoryRequest,
        db: AsyncSession = Depends(get_db)):
    try:
        logger.info(
            f"Inventory Request Received for device: {
                request.device_id}")

        rules_result = await db.execute(select(Rule))
        rules = rules_result.scalars().all()
        graph_engine.set_active_rules(rules)

        # Inject OS into components array for Graph Engine validation
        component_dicts = [{"type": "OS",
                            "version": request.os.version,
                            "vendor": request.os.name}]
        component_dicts.extend([{"type": c.type,
                                 "version": c.version,
                                 "vendor": c.vendor} for c in request.components])

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
                roadmap_steps.append(
                    v.get(
                        "recommended_action",
                        "Address violation"))
            roadmap_steps.append("Restart Device")
            roadmap_steps.append("Re-run Validation Check")

            remed = Remediation(
                recommended_action="Execute the recommended resolution roadmap sequentially.",
                safe_to_execute=True,
                simulated_script=await generate_remediation_script(validation_result["violations"]),
                roadmap=roadmap_steps
            )

        graph_data = graph_engine.generate_knowledge_graph(
            request.device_id, component_dicts, validation_result["violations"])

        response = ComplianceResponse(
            device_id=request.device_id,
            compliance_score=validation_result["score"],
            status="COMPLIANT" if validation_result["score"] >= 100 else "NON_COMPLIANT",
            violations_count=len(
                validation_result["violations"]),
            violations=[
                Violation(
                    **v) for v in validation_result["violations"]],
            remediation=remed,
            os_name=request.os.name,
            os_version=request.os.version,
            components=request.components,
            scan_status=device.scan_status,
            last_scanned=device.last_scanned,
            graph_elements=graph_data)
        return response
    except Exception as e:
        logger.exception(f"Unhandled Exception in submit_inventory: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/graph/elements")
async def get_graph_elements_endpoint(
        device_id: str = None,
        db: AsyncSession = Depends(get_db)):
    raise HTTPException(
        status_code=410,
        detail="Deprecated: Graph elements are returned directly via POST /inventory/ or GET /inventory/{device_id}.")


@router.get("/rules")
async def get_all_rules(db: AsyncSession = Depends(get_db)):
    rules_result = await db.execute(select(Rule).options(selectinload(Rule.document)))
    rules = rules_result.scalars().all()

    rules_data = []
    for r in rules:
        source_doc = r.document.filename if r.document else "Unknown Origin"
        rules_data.append(
            {
                "id": r.id,
                "source_component": f"{
                    r.source_component_type} v{
                    r.source_version}",
                "target_component": f"{
                    r.target_component_type} {
                    r.target_min_version or ''} {
                    r.incompatible_version or ''}".strip(),
                "relation": r.rule_type,
                "reason": r.reason,
                "confidence": 95,
                "ambiguous": False,
                "source_document": source_doc})

    return {"rules": rules_data}


@router.get("/{device_id}", response_model=ComplianceResponse)
async def get_compliance(device_id: str, db: AsyncSession = Depends(get_db)):
    if device_id == "latest":
        stmt = select(Device).options(
            selectinload(
                Device.components)).order_by(
            Device.last_scanned.desc())
    else:
        stmt = select(Device).options(
            selectinload(
                Device.components)).where(
            Device.id == device_id)

    result = await db.execute(stmt)
    device = result.scalars().first()

    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    device_id = device.id

    rules_result = await db.execute(select(Rule))
    rules = rules_result.scalars().all()
    graph_engine.set_active_rules(rules)

    component_dicts = [{"type": "OS",
                        "version": device.os_version,
                        "vendor": device.os_name}]
    component_dicts.extend([{"type": c.component_type,
                             "version": c.version,
                             "vendor": c.vendor} for c in device.components])

    validation_result = graph_engine.validate_device(component_dicts)

    remed = None
    if validation_result["violations"]:
        roadmap_steps = []
        for v in validation_result["violations"]:
            roadmap_steps.append(
                v.get(
                    "recommended_action",
                    "Address violation"))
        roadmap_steps.append("Restart Device")
        roadmap_steps.append("Re-run Validation Check")

        remed = Remediation(
            recommended_action="Execute the recommended resolution roadmap sequentially.",
            safe_to_execute=True,
            simulated_script=await generate_remediation_script(validation_result["violations"]),
            roadmap=roadmap_steps
        )

    components_info = [
        ComponentInfo(type=c.component_type, vendor=c.vendor, version=c.version)
        for c in device.components
    ]

    graph_data = graph_engine.generate_knowledge_graph(
        device_id, component_dicts, validation_result["violations"])

    return ComplianceResponse(
        device_id=device_id,
        compliance_score=validation_result["score"],
        status="COMPLIANT" if validation_result["score"] >= 100 else "NON_COMPLIANT",
        violations_count=len(
            validation_result["violations"]),
        violations=[
            Violation(
                **v) for v in validation_result["violations"]],
        remediation=remed,
        os_name=device.os_name,
        os_version=device.os_version,
        components=components_info,
        scan_status=device.scan_status,
        last_scanned=device.last_scanned,
        graph_elements=graph_data)
