from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class OSInfo(BaseModel):
    name: str
    version: str
    hostname: Optional[str] = None

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
    source_component: str
    target_component: str
    root_cause_explanation: str
    source_document: str
    what_failed: Optional[str] = None
    why_failed: Optional[str] = None
    dependency: Optional[str] = None
    affected_components: Optional[List[str]] = None
    business_impact: Optional[str] = None
    recommended_action: Optional[str] = None

class Remediation(BaseModel):
    recommended_action: str
    safe_to_execute: bool
    simulated_script: str
    roadmap: Optional[List[str]] = None

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
    scan_status: Optional[str] = None
    last_scanned: Optional[datetime] = None
    graph_elements: Optional[dict] = None

class DocumentUploadResponse(BaseModel):
    task_id: str
    status: str

class ChatRequest(BaseModel):
    device_id: str
    query: str

class ChatResponse(BaseModel):
    answer: str

class AdminActionRequest(BaseModel):
    password: str
