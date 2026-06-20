import os
import json
import logging
import fitz  # PyMuPDF
from typing import List, Dict, Any
from app.core.config import settings
from app.db.database import async_session
from app.models.models import Document, Rule
from sqlalchemy.future import select
from openai import AsyncOpenAI

logger = logging.getLogger(__name__)

aclient = AsyncOpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None

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
                logger.error(f"Failed to extract text from {filepath}")
                return None

            # Create document record
            db_doc = Document(filename=filename, status="completed")
            session.add(db_doc)
            await session.flush()  # Populates db_doc.id

            # Extract rules from text
            rules_data = await extract_rules_from_text(text)
            for r_data in rules_data:
                rule = Rule(
                    source_component_type=r_data.get("source_component_type"),
                    source_version=r_data.get("source_version", "0.0.0"),
                    target_component_type=r_data.get("target_component_type"),
                    target_min_version=r_data.get("target_min_version"),
                    target_max_version=r_data.get("target_max_version"),
                    incompatible_version=r_data.get("incompatible_version"),
                    rule_type=r_data.get("rule_type", "REQUIRES"),
                    reason=r_data.get("reason"),
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
        logger.error(f"Error reading {filepath}: {e}")
    return ""

async def extract_rules_from_text(text: str) -> List[Dict[str, Any]]:
    """Uses an LLM to extract dependency rules from document text."""
    if not aclient:
        logger.warning("OPENAI_API_KEY is not set. Falling back to mock rules.")
        return [
            {
                "source_component_type": "OS",
                "source_version": "0.0.0",
                "target_component_type": "BIOS",
                "target_min_version": "1.15.0",
                "target_max_version": None,
                "incompatible_version": None,
                "rule_type": "REQUIRES",
                "reason": "Enterprise policy dictates Windows endpoints must run modern BIOS firmware."
            }
        ]

    system_prompt = """You are a technical compliance expert. Extract system compatibility rules from the provided text.
Return the rules as a JSON array of objects.
Each object must have:
- source_component_type (str)
- source_version (str, default '0.0.0')
- target_component_type (str)
- target_min_version (str or null)
- target_max_version (str or null)
- incompatible_version (str or null)
- rule_type (str, either 'REQUIRES' or 'INCOMPATIBLE_WITH')
- reason (str)

Example Output:
[
  {
    "source_component_type": "SecurityAgent",
    "source_version": "0.0.0",
    "target_component_type": "Intel_NIC",
    "target_min_version": null,
    "target_max_version": null,
    "incompatible_version": "22.0",
    "rule_type": "INCOMPATIBLE_WITH",
    "reason": "Security Agents experience kernel deadlocks with older Intel NIC drivers."
  }
]
"""
    try:
        # We only pass a chunk of text to save tokens and prevent huge inputs
        snippet = text[:4000]
        
        response = await aclient.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Extract rules from the following text:\n\n{snippet}"}
            ],
            temperature=0,
            response_format={ "type": "json_object" }
        )
        
        content = response.choices[0].message.content
        # Sometimes the model wraps the array in an object like {"rules": [...]}
        data = json.loads(content)
        if isinstance(data, dict):
            # Try to find the array
            for key, val in data.items():
                if isinstance(val, list):
                    return val
            return []
        elif isinstance(data, list):
            return data
            
        return []
    except Exception as e:
        logger.error(f"Error extracting rules via OpenAI: {e}")
        return []
