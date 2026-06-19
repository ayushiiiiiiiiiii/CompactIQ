import networkx as nx
from typing import List, Dict, Any
from app.models.models import Rule

class GraphService:
    def __init__(self):
        self.graph = nx.DiGraph()

    def build_graph_from_rules(self, rules: List[Rule]):
        self.graph.clear()
        for rule in rules:
            src_node = f"{rule.source_component_type}_{rule.source_version}"
            
            if rule.rule_type == "INCOMPATIBLE_WITH":
                tgt_node = f"{rule.target_component_type}_{rule.incompatible_version}"
                self.graph.add_edge(src_node, tgt_node, relation="INCOMPATIBLE", reason=rule.reason, document_id=rule.document_id)
            elif rule.rule_type == "REQUIRES":
                tgt_node_min = f"{rule.target_component_type}_{rule.target_min_version}"
                self.graph.add_edge(src_node, tgt_node_min, relation="REQUIRES", reason=rule.reason, document_id=rule.document_id)
    
    def validate_device(self, components: List[Dict[str, str]]) -> Dict[str, Any]:
        violations = []
        score = 100
        
        # O(N^2) naive check for hackathon mvp since networkx is local
        for c1 in components:
            src = f"{c1['type']}_{c1['version']}"
            if src not in self.graph:
                continue
                
            for c2 in components:
                tgt = f"{c2['type']}_{c2['version']}"
                if src != tgt and self.graph.has_edge(src, tgt):
                    edge_data = self.graph.get_edge_data(src, tgt)
                    if edge_data["relation"] == "INCOMPATIBLE":
                        score -= 50
                        violations.append({
                            "severity": "CRITICAL",
                            "source_component": src,
                            "target_component": tgt,
                            "root_cause_explanation": edge_data.get("reason", "Incompatibility detected"),
                            "source_document": f"DocID:{edge_data.get('document_id')}"
                        })

        return {
            "score": max(0, score),
            "violations": violations
        }

graph_engine = GraphService()
