import os
import json
import fitz  # PyMuPDF
from typing import List, Dict, Any
from app.core.config import settings

# Documents are automatically loaded from the compatibility_docs seed directory. 
# Additional compatibility documents can be added without changing application code.
def load_seeds():
    seed_dir = settings.SEED_DIR
    if not os.path.exists(seed_dir):
        os.makedirs(seed_dir)
        
    for filename in os.listdir(seed_dir):
        if filename.endswith(".pdf"):
            parse_document(os.path.join(seed_dir, filename))

def parse_document(filepath: str) -> str:
    """Extracts text from PDF."""
    try:
        doc = fitz.open(filepath)
        text = ""
        for page in doc:
            text += page.get_text()
        return text
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        return ""

async def extract_rules_with_llm(text: str) -> List[Dict[str, Any]]:
    """Mocks the LLM extraction since openai key is not guaranteed in hackathon mvp locally without secrets."""
    # In a real build, we'd use openai.ChatCompletion.create with a JSON schema.
    # We will simulate successful extraction for the demo.
    return [
        {
            "source_component_type": "SecurityAgent",
            "source_version": "7.17",
            "target_component_type": "Intel_NIC",
            "incompatible_version": "22.0",
            "rule_type": "INCOMPATIBLE_WITH",
            "reason": "Simulated extraction: Network drops observed."
        }
    ]
