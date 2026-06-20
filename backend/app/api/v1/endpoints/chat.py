import logging
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.schemas.schemas import ChatRequest, ChatResponse
from app.db.database import get_db
from app.models.models import Device, Rule
from app.services.graph_service import graph_engine
from app.core.config import settings
from openai import AsyncOpenAI

router = APIRouter()
logger = logging.getLogger(__name__)

# Initialize OpenAI client if API key is present
aclient = AsyncOpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None

@router.post("/", response_model=ChatResponse)
async def chat_assistant(request: ChatRequest, db: AsyncSession = Depends(get_db)):
    logger.info(f"Chat request received for device: {request.device_id}")

    # Fallback if OpenAI is not configured
    if not aclient:
        logger.warning("OPENAI_API_KEY is not set. Falling back to mock response.")
        return ChatResponse(
            answer=f"Endpoint {request.device_id} is currently non-compliant because the Security Agent 7.17 conflicts with Intel NIC driver 22.0. (Mocked response - Configure OPENAI_API_KEY for real AI)."
        )

    # 1. Fetch the Device Context
    if request.device_id == "latest":
        stmt = select(Device).options(selectinload(Device.components)).order_by(Device.last_scanned.desc())
    else:
        stmt = select(Device).options(selectinload(Device.components)).where(Device.id == request.device_id)

    result = await db.execute(stmt)
    device = result.scalars().first()

    if not device:
        raise HTTPException(status_code=404, detail="Device not found for chat context.")

    # 2. Fetch Rules and Run Validation to get Violations Context
    rules_result = await db.execute(select(Rule))
    rules = rules_result.scalars().all()
    graph_engine.set_active_rules(rules)

    component_dicts = [{"type": "OS", "version": device.os_version, "vendor": device.os_name}]
    component_dicts.extend([{"type": c.component_type, "version": c.version, "vendor": c.vendor} for c in device.components])
    validation_result = graph_engine.validate_device(component_dicts)

    # 3. Construct System Prompt
    system_prompt = f"""You are CompactIQ, an expert IT compliance AI assistant.
You are helping an administrator understand the compliance status of a specific device.
Always be professional, concise, and helpful. Do not output raw JSON unless asked.

Device Context:
- ID: {device.id}
- OS: {device.os_name} {device.os_version}
- Score: {validation_result["score"]}/100

Installed Components:
{json.dumps(component_dicts, indent=2)}

Active Violations:
{json.dumps(validation_result["violations"], indent=2)}

Use this context to answer the user's query accurately. If there are no violations, inform them the system is healthy.
"""

    # 4. Call OpenAI
    try:
        response = await aclient.chat.completions.create(
            model="gpt-4o", # Using a standard modern model
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": request.query}
            ],
            temperature=0.7,
            max_tokens=500
        )
        answer = response.choices[0].message.content
        return ChatResponse(answer=answer)
    except Exception as e:
        logger.error(f"OpenAI API Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to communicate with AI provider.")
