from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class OSInfo(BaseModel):
    name: str
    version: str

class ComponentInfo(BaseModel):
    type: str
    vendor: str
    version: str

class InventoryRequest(BaseModel):
    device_id: str
    os: OSInfo
    components: List[ComponentInfo]

class Violation(BaseModel):
    severity: str
    type: Optional[str] = None
    source_component: str
    target_component: str
    root_cause_explanation: str
    source_document: str

class Remediation(BaseModel):
    recommended_action: str
    safe_to_execute: bool
    simulated_script: str

class ComplianceResponse(BaseModel):
    device_id: str
    compliance_score: int
    status: str
    violations_count: int
    violations: Optional[List[Violation]] = None
    remediation: Optional[Remediation] = None
    os_name: Optional[str] = None
    os_version: Optional[str] = None
    components: Optional[List[ComponentInfo]] = None

class DocumentUploadResponse(BaseModel):
    task_id: str
    status: str

class ChatRequest(BaseModel):
    device_id: str
    query: str

class ChatResponse(BaseModel):
    answer: str
