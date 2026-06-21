import os
import json
import asyncio
import fitz  # PyMuPDF
from typing import List, Dict, Any
from app.core.config import settings
from app.db.database import async_session
from app.models.models import Document, Rule
from sqlalchemy.future import select

import logging

logger = logging.getLogger(__name__)

# Documents are automatically loaded from the compatibility_docs seed directory. 
# Additional compatibility documents can be added without changing application code.
async def load_and_ingest_seeds():
    seed_dir = settings.SEED_DIR
    logger.info(f"Startup Ingestion: Discovering documents in {seed_dir}")
    
    if not os.path.exists(seed_dir):
        logger.warning(f"Startup Ingestion: Seed directory does not exist: {seed_dir}")
        os.makedirs(seed_dir)
        
    discovered_files = [f for f in os.listdir(seed_dir) if f.endswith((".pdf", ".txt"))]
    logger.info(f"Startup Ingestion: {len(discovered_files)} files discovered: {discovered_files}")
    
    files_processed = 0
    total_rules_inserted = 0

    for filename in discovered_files:
        filepath = os.path.join(seed_dir, filename)
        doc_id, rules_extracted = await ingest_document_file(filepath, filename)
        logger.info(f"Startup Ingestion: File processed: {filename} | Rules extracted: {rules_extracted}")
        total_rules_inserted += rules_extracted
        files_processed += 1
        
    logger.info(f"Startup Ingestion Complete: {files_processed} total files processed, {total_rules_inserted} total rules inserted.")

    # Validation
    from sqlalchemy import text
    async with async_session() as session:
        doc_count_result = await session.execute(text("SELECT COUNT(*) FROM documents"))
        rule_count_result = await session.execute(text("SELECT COUNT(*) FROM rules"))
        doc_count = doc_count_result.scalar()
        rule_count = rule_count_result.scalar()
        
        logger.info(f"Database State post-ingestion: {doc_count} documents, {rule_count} rules.")
        
        if len(discovered_files) > 0 and rule_count == 0:
            logger.error("Startup Ingestion Validation Failed: Compatibility documents are present, but ZERO rules exist in the database!")


async def ingest_document_file(filepath: str, filename: str) -> tuple[int, int]:
    async with async_session() as session:
        async with session.begin():
            # Check if document already exists in DB
            stmt = select(Document).where(Document.filename == filename)
            result = await session.execute(stmt)
            db_doc = result.scalars().first()
            
            if db_doc is not None:
                return db_doc.id, 0

            # Parse document text
            text = await asyncio.to_thread(parse_document, filepath)
            if not text:
                db_doc = Document(filename=filename, status="failed")
                session.add(db_doc)
                await session.flush()
                return db_doc.id, 0

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
            
            return db_doc.id, len(rules_data)

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

from pydantic import BaseModel, Field
from google import genai
from google.genai import types

class ExtractedRule(BaseModel):
    source_component_type: str = Field(description="The component type requiring or conflicting with something (e.g., OS, SecurityAgent, BIOS)")
    source_version: str = Field(description="The version of the source component, or * if not specified")
    target_component_type: str = Field(description="The component type being required or conflicted with")
    target_min_version: str | None = Field(default=None, description="Minimum required version, if applicable")
    target_max_version: str | None = Field(default=None, description="Maximum allowed version, if applicable")
    incompatible_version: str | None = Field(default=None, description="Specific version that is incompatible, if applicable")
    rule_type: str = Field(description="Type of relationship: REQUIRES, DEPENDS_ON, SUPPORTED_ON, CONFLICTS_WITH")
    reason: str = Field(description="Explanation of why this rule exists based on the document")

class ExtractedRulesList(BaseModel):
    rules: list[ExtractedRule]

async def extract_rules_from_text(text: str) -> List[Dict[str, Any]]:
    """Uses Gemini LLM to extract dependency rules from document text."""
    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        
        if len(text) > 50000:
            print(f"Warning: Document text exceeds 50,000 characters. Truncating to prevent token limits.")
            text = text[:50000]
        
        prompt = f"""You are an expert AI building a structural Knowledge Graph for an Enterprise Compatibility Matrix. Your job is to analyze the following document text and extract architectural dependency or conflict rules strictly conforming to the requested schema.

Strict Versioning Guidelines:
1. Look closely for specific version numbers of the Source Component. If the document says "CrowdStrike Falcon Sensor v7.18 requires...", then the source_version is "7.18".
2. If the document states a general compatibility rule without mentioning a specific version for the source component (e.g., "SecurityAgent requires Software 1.0"), you MUST use "*" as a wildcard meaning "All Versions".
3. Do NOT default to "0.0.0" unless that exact literal string is explicitly written in the text. If it applies universally or no version is specified, use "*".

Document Text to Process:
---
{text}
---"""
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=ExtractedRulesList,
                temperature=0.1
            ),
        )
        
        result_json = json.loads(response.text)
        # Ensure we return a list of dicts that match what the DB insertion expects
        return result_json.get("rules", [])
        
    except Exception as e:
        print(f"Error extracting rules via Gemini: {e}")
        # Fallback to empty rules if LLM fails
        return []
