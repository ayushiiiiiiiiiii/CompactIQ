from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.schemas.schemas import ChatRequest, ChatResponse
from app.api.dependencies import get_db
from app.models.models import Device
from app.core.config import settings
from google import genai

router = APIRouter()

try:
    client = genai.Client(api_key=settings.GEMINI_API_KEY)
except Exception as e:
    client = None
    print(f"Failed to initialize Gemini Client: {e}")


@router.post("/", response_model=ChatResponse)
async def chat_assistant(
        request: ChatRequest,
        db: AsyncSession = Depends(get_db)):
    if not client:
        return ChatResponse(
            answer="Error: Gemini API is not configured or failed to initialize.")

    stmt = select(Device).options(
        selectinload(
            Device.components)).where(
        Device.id == request.device_id)
    result = await db.execute(stmt)
    device = result.scalars().first()

    if not device:
        return ChatResponse(
            answer="I couldn't find any compliance records for that device.")

    prompt = f"""You are the 'CompactIQ Compliance Assistant', an expert AI focused exclusively on enterprise device security and compatibility.

STRICT BOUNDARIES:
- You must politely refuse to answer any questions that are completely unrelated to IT, device compliance, system architecture, or the provided device context.
- Keep your tone professional, concise, and helpful.

DEVICE CONTEXT:
- Operating System: {device.os_name} {device.os_version}
- Current Compliance Score: {device.compliance_score}/100

INSTALLED COMPONENTS:
"""
    for comp in device.components:
        prompt += f"- {comp.component_type}: {comp.vendor} v{comp.version}\n"

    prompt += f"""
USER INQUIRY: "{request.query}"

INSTRUCTIONS:
Using the device context above, answer the user's inquiry. If they are asking why their device is non-compliant, analyze the components and explain the likely root cause (e.g., outdated agents, incompatible drivers). Do not hallucinate fixes, just explain the conflict clearly."""

    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt
        )
        answer = response.text
    except Exception as e:
        answer = f"Error generating response: {e}"

    return ChatResponse(answer=answer)
