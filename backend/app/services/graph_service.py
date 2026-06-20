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
                self.graph.add_edge(
                    tgt_node, src_node, 
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
                    document_id=rule.document_id,
                    degrades_silently_if_unmet=rule.degrades_silently_if_unmet
                )
    
    def validate_device(self, components: List[Dict[str, str]]) -> Dict[str, Any]:
        violations = []
        score = 100
        
        dev_nodes = [f"{c['type']}_{c['version']}" for c in components]
        
        # 1. Validation for Requirement and Degraded Performance
        for c in components:
            src = f"{c['type']}_{c['version']}"
            if src not in self.graph:
                continue
                
            for successor in self.graph.successors(src):
                edge_data = self.graph.get_edge_data(src, successor)
                if edge_data.get("relation") == "REQUIRES":
                    target_type = edge_data.get("target_type")
                    min_version = edge_data.get("min_version")
                    reason = edge_data.get("reason", "Requirement not satisfied")
                    doc_id = edge_data.get("document_id")
                    is_silent = edge_data.get("degrades_silently_if_unmet", False)
                    
                    matching = [comp for comp in components if comp["type"] == target_type]
                    if not matching:
                        penalty = 10 if is_silent else 30
                        severity = "MEDIUM" if is_silent else "CRITICAL"
                        score -= penalty
                        violations.append({
                            "severity": severity,
                            "type": "DEGRADED_PERFORMANCE" if is_silent else "MISSING_REQUIREMENT",
                            "source_component": src,
                            "target_component": f"{target_type} (Missing)",
                            "root_cause_explanation": f"{'Performance Degraded' if is_silent else 'Required component missing'}: {target_type}. {reason}",
                            "source_document": f"DocID:{doc_id}"
                        })
                    else:
                        for m_comp in matching:
                            if parse_version(m_comp["version"]) < parse_version(min_version):
                                penalty = 10 if is_silent else 30
                                severity = "MEDIUM" if is_silent else "HIGH"
                                score -= penalty
                                violations.append({
                                    "severity": severity,
                                    "type": "DEGRADED_PERFORMANCE" if is_silent else "MISSING_REQUIREMENT",
                                    "source_component": src,
                                    "target_component": f"{m_comp['type']}_{m_comp['version']}",
                                    "root_cause_explanation": f"Version too low (current: {m_comp['version']}, required: >= {min_version}). {reason}",
                                    "source_document": f"DocID:{doc_id}"
                                })

        # 2. Validation for 1-hop, 2-hop, 3-hop Conflicts
        seen_conflicts = set()
        for c1 in dev_nodes:
            if c1 not in self.graph:
                continue
            for c2 in dev_nodes:
                if c2 not in self.graph or c1 == c2:
                    continue
                # Find path from c1 to c2
                paths = list(nx.all_simple_paths(self.graph, c1, c2, cutoff=3))
                for path in paths:
                    # Check if the last edge is INCOMPATIBLE
                    u, v = path[-2], path[-1]
                    edge_data = self.graph.get_edge_data(u, v)
                    if edge_data.get("relation") == "INCOMPATIBLE":
                        hop_count = len(path) - 1
                        conflict_sig = tuple(sorted([c1, c2]))
                        if conflict_sig in seen_conflicts:
                            continue
                        seen_conflicts.add(conflict_sig)
                        
                        score -= 40
                        hop_str = f"Transitive Conflict ({hop_count}-hop)" if hop_count > 1 else "Direct Conflict"
                        violations.append({
                            "severity": "CRITICAL",
                            "type": "TRANSITIVE_CONFLICT" if hop_count > 1 else "CONFLICT",
                            "source_component": c1,
                            "target_component": c2,
                            "root_cause_explanation": f"{hop_str}: {c1} -> ... -> {c2}. {edge_data.get('reason', '')}",
                            "source_document": f"DocID:{edge_data.get('document_id')}"
                        })

        return {
            "score": max(0, score),
            "violations": violations
        }
        
    def generate_remediation(self, violations: List[Dict[str, Any]], device_id: str) -> Dict[str, Any]:
        if not violations:
            return None
            
        v = violations[0]
        v_type = v.get("type", "")
        
        if v_type in ["CONFLICT", "TRANSITIVE_CONFLICT"]:
            target_comp = v["target_component"].split("_")[0] if "_" in v["target_component"] else v["target_component"]
            script = f"# Auto-generated Remediation Script for {device_id}\n# Action: UPGRADE_OR_DOWNGRADE\n# Component: {target_comp}\n\nWrite-Host 'Resolving conflict for {target_comp}...'\n# Invoke-WebRequest -Uri 'https://internal.repo/{target_comp}_safe.exe' -OutFile 'C:\\temp\\installer.exe'\nWrite-Host 'Executing silent install...'\n# Start-Process -FilePath 'C:\\temp\\installer.exe' -ArgumentList '/S' -Wait -NoNewWindow\nWrite-Host 'Conflict resolved. Please verify telemetry.'\n"
            
            return {
                "recommended_action": f"Upgrade or Downgrade conflicting component: {target_comp}",
                "safe_to_execute": True,
                "simulated_script": script
            }
        else:
            target_comp = v["target_component"].replace(" (Missing)", "").split("_")[0]
            script = f"# Auto-generated Remediation Script for {device_id}\n# Action: INSTALL_OR_UPGRADE\n# Component: {target_comp}\n\nWrite-Host 'Downloading {target_comp}...'\n# Invoke-WebRequest -Uri 'https://internal.repo/{target_comp}_latest.exe' -OutFile 'C:\\temp\\installer.exe'\nWrite-Host 'Executing silent install...'\n# Start-Process -FilePath 'C:\\temp\\installer.exe' -ArgumentList '/S' -Wait -NoNewWindow\nWrite-Host 'Installation complete. Please verify telemetry.'\n"
            
            return {
                "recommended_action": f"Install or Upgrade required component: {target_comp}",
                "safe_to_execute": True,
                "simulated_script": script
            }

graph_engine = GraphService()
