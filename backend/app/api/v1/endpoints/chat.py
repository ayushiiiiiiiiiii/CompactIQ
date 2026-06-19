from fastapi import APIRouter
from app.schemas.schemas import ChatRequest, ChatResponse

router = APIRouter()

@router.post("/", response_model=ChatResponse)
async def chat_assistant(request: ChatRequest):
    # Mock Response for Hackathon MVP
    return ChatResponse(
        answer=f"Endpoint {request.device_id} is currently non-compliant because the Security Agent 7.17 conflicts with Intel NIC driver 22.0."
    )
