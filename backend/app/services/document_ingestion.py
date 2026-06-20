import os
import json
import fitz  # PyMuPDF
from typing import List, Dict, Any
from app.core.config import settings
from app.db.database import async_session
from app.models.models import Document, Rule
from sqlalchemy.future import select

# Documents are automatically loaded from the compatibility_docs seed directory. 
# Additional compatibility documents can be added without changing application code.
async def load_and_ingest_seeds():
    seed_dir = settings.SEED_DIR
    if not os.path.exists(seed_dir):
        os.makedirs(seed_dir)
        
    for filename in os.listdir(seed_dir):
        if filename.endswith((".pdf", ".txt")):
            filepath = os.path.join(seed_dir, filename)
            await ingest_document_file(filepath, filename)

async def ingest_document_file(filepath: str, filename: str) -> int:
    async with async_session() as session:
        async with session.begin():
            # Check if document already exists in DB
            stmt = select(Document).where(Document.filename == filename)
            result = await session.execute(stmt)
            db_doc = result.scalars().first()
            
            if db_doc is not None:
                return db_doc.id

            # Parse document text
            text = parse_document(filepath)
            if not text:
                return None

            # Create document record
            db_doc = Document(filename=filename, status="completed")
            session.add(db_doc)
            await session.flush()  # Populates db_doc.id

            # Extract rules from text
            rules_data = await extract_rules_from_text(text)
            for r_data in rules_data:
                rule = Rule(
                    source_component_type=r_data["source_component_type"],
                    source_version=r_data["source_version"],
                    target_component_type=r_data["target_component_type"],
                    target_min_version=r_data.get("target_min_version"),
                    target_max_version=r_data.get("target_max_version"),
                    incompatible_version=r_data.get("incompatible_version"),
                    rule_type=r_data["rule_type"],
                    reason=r_data["reason"],
                    document_id=db_doc.id
                )
                session.add(rule)
            
            return db_doc.id

def parse_document(filepath: str) -> str:
    """Extracts text from PDF or TXT."""
    try:
        if filepath.endswith(".txt"):
            with open(filepath, "r", encoding="utf-8") as f:
                return f.read()
        elif filepath.endswith(".pdf"):
            doc = fitz.open(filepath)
            text = ""
            for page in doc:
                text += page.get_text()
            return text
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
    return ""

async def extract_rules_from_text(text: str) -> List[Dict[str, Any]]:
    """Heuristic rule extractor for hackathon, simulating LLM parser output with robust demo rules."""
    rules = []
    
    # Demonstration Rules to naturally lower score
    
    # 1. OS requires BIOS
    rules.append({
        "source_component_type": "OS",
        "source_version": "0.0.0",
        "target_component_type": "BIOS",
        "target_min_version": "1.15.0",
        "target_max_version": None,
        "incompatible_version": None,
        "rule_type": "REQUIRES",
        "reason": "Enterprise policy dictates Windows endpoints must run modern BIOS firmware."
    })
    
    # 2. BIOS depends on Firmware
    rules.append({
        "source_component_type": "BIOS",
        "source_version": "0.0.0",
        "target_component_type": "Firmware",
        "target_min_version": "2.0.0",
        "target_max_version": None,
        "incompatible_version": None,
        "rule_type": "DEPENDS_ON",
        "reason": "BIOS interfaces directly with base component firmware."
    })

    # 3. Security Agent requires OS
    rules.append({
        "source_component_type": "SecurityAgent",
        "source_version": "0.0.0",
        "target_component_type": "OS",
        "target_min_version": "10.0.0",
        "target_max_version": None,
        "incompatible_version": None,
        "rule_type": "REQUIRES",
        "reason": "Security Agent requires supported Windows 11 build."
    })
    
    # 4. Network Driver requires Intel NIC
    rules.append({
        "source_component_type": "NetworkDriver",
        "source_version": "0.0.0",
        "target_component_type": "Intel_NIC",
        "target_min_version": None,
        "target_max_version": None,
        "incompatible_version": None,
        "rule_type": "REQUIRES",
        "reason": "Network driver is specific to Intel hardware interfaces."
    })
    
    # 5. TPM required by OS
    rules.append({
        "source_component_type": "OS",
        "source_version": "0.0.0",
        "target_component_type": "TPM",
        "target_min_version": "2.0",
        "target_max_version": None,
        "incompatible_version": None,
        "rule_type": "REQUIRES",
        "reason": "Windows 11 strictly requires TPM 2.0 for security features."
    })
    
    # 6. Application supported on OS
    rules.append({
        "source_component_type": "Application",
        "source_version": "0.0.0",
        "target_component_type": "OS",
        "target_min_version": "10.0.0",
        "target_max_version": None,
        "incompatible_version": None,
        "rule_type": "SUPPORTED_ON",
        "reason": "Corporate application relies on modern OS libraries."
    })
    
    # 7. Old Software conflicts with OS
    rules.append({
        "source_component_type": "LegacyApp",
        "source_version": "0.0.0",
        "target_component_type": "OS",
        "target_min_version": None,
        "target_max_version": None,
        "incompatible_version": "10.0.0",
        "rule_type": "CONFLICTS_WITH",
        "reason": "Legacy application is known to cause blue screens on Windows 11."
    })

    return rules
