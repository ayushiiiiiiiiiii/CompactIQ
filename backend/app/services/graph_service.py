import networkx as nx
from typing import List, Dict, Any
from app.models.models import Rule

def parse_version(v_str: str) -> List[int]:
    """Helper to parse a version string into a list of integers for comparison."""
    if not v_str:
        return [0]
    try:
        # Strip letters if any, split by dots
        cleaned = "".join(c if c.isdigit() or c == "." else "" for c in v_str)
        return [int(x) for x in cleaned.split(".") if x]
    except Exception:
        return [0]

class GraphService:
    def __init__(self):
        self.graph = nx.DiGraph()

    def build_graph_from_rules(self, rules: List[Rule]):
        self.graph.clear()
        for rule in rules:
            src_node = f"{rule.source_component_type}_{rule.source_version}"
            
            if rule.rule_type == "INCOMPATIBLE_WITH":
                tgt_node = f"{rule.target_component_type}_{rule.incompatible_version}"
                self.graph.add_edge(
                    src_node, tgt_node, 
                    relation="INCOMPATIBLE", 
                    reason=rule.reason, 
                    document_id=rule.document_id
                )
            elif rule.rule_type == "REQUIRES":
                tgt_node_min = f"{rule.target_component_type}_{rule.target_min_version}"
                self.graph.add_edge(
                    src_node, tgt_node_min, 
                    relation="REQUIRES", 
                    target_type=rule.target_component_type,
                    min_version=rule.target_min_version,
                    reason=rule.reason, 
                    document_id=rule.document_id
                )
    
    def validate_device(self, components: List[Dict[str, str]]) -> Dict[str, Any]:
        violations = []
        score = 100
        
        # 1. Validation for Incompatibility (Incompatible edges)
        for c1 in components:
            src = f"{c1['type']}_{c1['version']}"
            if src not in self.graph:
                continue
                
            for c2 in components:
                tgt = f"{c2['type']}_{c2['version']}"
                if src != tgt and self.graph.has_edge(src, tgt):
                    edge_data = self.graph.get_edge_data(src, tgt)
                    if edge_data.get("relation") == "INCOMPATIBLE":
                        score -= 50
                        violations.append({
                            "severity": "CRITICAL",
                            "source_component": src,
                            "target_component": tgt,
                            "root_cause_explanation": edge_data.get("reason", "Incompatibility detected"),
                            "source_document": f"DocID:{edge_data.get('document_id')}"
                        })

        # 2. Validation for Requirement (Requires edges)
        for c in components:
            src = f"{c['type']}_{c['version']}"
            if src not in self.graph:
                continue
                
            # Find all outgoing edges from this node
            for successor in self.graph.successors(src):
                edge_data = self.graph.get_edge_data(src, successor)
                if edge_data.get("relation") == "REQUIRES":
                    target_type = edge_data.get("target_type")
                    min_version = edge_data.get("min_version")
                    reason = edge_data.get("reason", "Requirement not satisfied")
                    doc_id = edge_data.get("document_id")
                    
                    # Look up if target component exists in the device inventory
                    matching = [comp for comp in components if comp["type"] == target_type]
                    if not matching:
                        # Target component is missing
                        score -= 30
                        violations.append({
                            "severity": "CRITICAL",
                            "source_component": src,
                            "target_component": f"{target_type} (Missing)",
                            "root_cause_explanation": f"Required dependency component '{target_type}' is missing. {reason}",
                            "source_document": f"DocID:{doc_id}"
                        })
                    else:
                        for m_comp in matching:
                            if parse_version(m_comp["version"]) < parse_version(min_version):
                                score -= 30
                                violations.append({
                                    "severity": "HIGH",
                                    "source_component": src,
                                    "target_component": f"{m_comp['type']}_{m_comp['version']}",
                                    "root_cause_explanation": f"Required dependency version is too low (current: {m_comp['version']}, required: >= {min_version}). {reason}",
                                    "source_document": f"DocID:{doc_id}"
                                })

        return {
            "score": max(0, score),
            "violations": violations
        }

graph_engine = GraphService()
