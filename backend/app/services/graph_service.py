import networkx as nx
from typing import List, Dict, Any
from app.models.models import Rule

def parse_version(v_str: str) -> List[int]:
    if not v_str:
        return [0]
    try:
        cleaned = "".join(c if c.isdigit() or c == "." else "" for c in v_str)
        return [int(x) for x in cleaned.split(".") if x]
    except (ValueError, TypeError, AttributeError):
        return [0]

class GraphService:
    def __init__(self):
        self.rules: List[Rule] = []

    def set_active_rules(self, rules: List[Rule]):
        self.rules = rules
    
    def validate_device(self, components: List[Dict[str, str]]) -> Dict[str, Any]:
        violations = []
        score = 100
        
        # Helper to find a component by type
        def get_comp(ctype: str):
            for c in components:
                if c["type"] == ctype:
                    return c
            return None

        # Process each rule against the actual device components
        for rule in self.rules:
            src_comp = get_comp(rule.source_component_type)
            if not src_comp:
                continue # Rule doesn't apply if source component is missing
                
            if rule.rule_type == "INCOMPATIBLE_WITH":
                tgt_comp = get_comp(rule.target_component_type)
                if tgt_comp:
                    # Check version threshold if specified, else direct conflict
                    conflict = False
                    if rule.incompatible_version:
                        if parse_version(tgt_comp["version"]) <= parse_version(rule.incompatible_version):
                            conflict = True
                    else:
                        conflict = True
                        
                    if conflict:
                        score -= 20
                        violations.append({
                            "severity": "CRITICAL",
                            "source_component": src_comp["type"],
                            "target_component": tgt_comp["type"],
                            "root_cause_explanation": rule.reason,
                            "source_document": f"DocID:{rule.document_id}",
                            "what_failed": f"{src_comp['type']} conflicts with {tgt_comp['type']}",
                            "why_failed": f"{tgt_comp['type']} version {tgt_comp['version']} is blacklisted.",
                            "dependency": "INCOMPATIBLE",
                            "affected_components": [src_comp["type"], tgt_comp["type"]],
                            "business_impact": "System instability, kernel crashes, or network drops.",
                            "recommended_action": f"Upgrade {tgt_comp['type']} to a version higher than {rule.incompatible_version}"
                        })

            elif rule.rule_type == "REQUIRES":
                tgt_comp = get_comp(rule.target_component_type)
                if not tgt_comp:
                    score -= 15
                    violations.append({
                        "severity": "HIGH",
                        "source_component": src_comp["type"],
                        "target_component": f"{rule.target_component_type} (Missing)",
                        "root_cause_explanation": f"Missing required dependency.",
                        "source_document": f"DocID:{rule.document_id}",
                        "what_failed": f"{src_comp['type']} is missing a requirement.",
                        "why_failed": f"Required component {rule.target_component_type} is not installed.",
                        "dependency": "REQUIRES",
                        "affected_components": [src_comp["type"]],
                        "business_impact": "Feature degradation or application failure.",
                        "recommended_action": f"Install {rule.target_component_type} version {rule.target_min_version} or higher."
                    })
                else:
                    if rule.target_min_version and parse_version(tgt_comp["version"]) < parse_version(rule.target_min_version):
                        score -= 15
                        violations.append({
                            "severity": "HIGH",
                            "source_component": src_comp["type"],
                            "target_component": tgt_comp["type"],
                            "root_cause_explanation": rule.reason,
                            "source_document": f"DocID:{rule.document_id}",
                            "what_failed": f"{src_comp['type']} requirement not met.",
                            "why_failed": f"{tgt_comp['type']} version {tgt_comp['version']} is too low.",
                            "dependency": "REQUIRES",
                            "affected_components": [src_comp["type"], tgt_comp["type"]],
                            "business_impact": "Security vulnerabilities or API failures.",
                            "recommended_action": f"Upgrade {tgt_comp['type']} to >= {rule.target_min_version}"
                        })

        return {
            "score": max(0, score),
            "violations": violations
        }

graph_engine = GraphService()
