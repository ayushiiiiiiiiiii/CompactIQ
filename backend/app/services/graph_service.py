import networkx as nx
from typing import List, Dict, Any
from app.models.models import Rule


def parse_version(v_str: str) -> List[int]:
    if not v_str:
        return [0]
    try:
        cleaned = "".join(c if c.isdigit() or c == "." else "" for c in v_str)
        return [int(x) for x in cleaned.split(".") if x]
    except Exception:
        return [0]


class GraphService:
    def __init__(self):
        self.rules: List[Rule] = []

    def set_active_rules(self, rules: List[Rule]):
        self.rules = rules

    def validate_device(
            self, components: List[Dict[str, str]]) -> Dict[str, Any]:
        violations = []
        score = 100

        # Helper to find a component by type
        def get_comp(ctype: str):
            for c in components:
                if c["type"] == ctype:
                    return c
            return None

        # Deduplicate rules to keep only the strictest constraint per component
        # pair
        unique_rules_map = {}
        for rule in self.rules:
            sig = (
                rule.source_component_type,
                rule.target_component_type,
                rule.rule_type)
            if sig not in unique_rules_map:
                unique_rules_map[sig] = rule
            else:
                existing_rule = unique_rules_map[sig]
                if rule.rule_type == "REQUIRES":
                    v_existing = parse_version(
                        existing_rule.target_min_version)
                    v_new = parse_version(rule.target_min_version)
                    if v_new > v_existing:
                        unique_rules_map[sig] = rule
                elif rule.rule_type == "INCOMPATIBLE_WITH":
                    # For incompatible, a lower version limit is stricter (less tolerant)
                    # But if one is None, it means totally incompatible, which
                    # is strictest
                    if rule.incompatible_version is None:
                        unique_rules_map[sig] = rule
                    elif existing_rule.incompatible_version is not None:
                        v_existing = parse_version(
                            existing_rule.incompatible_version)
                        v_new = parse_version(rule.incompatible_version)
                        if v_new < v_existing:
                            unique_rules_map[sig] = rule

        processed_rules = list(unique_rules_map.values())

        # Process each rule against the actual device components
        for rule in processed_rules:
            src_comp = get_comp(rule.source_component_type)
            if not src_comp:
                continue  # Rule doesn't apply if source component is missing

            if rule.rule_type == "INCOMPATIBLE_WITH":
                tgt_comp = get_comp(rule.target_component_type)
                if tgt_comp:
                    # Check version threshold if specified, else direct
                    # conflict
                    conflict = False
                    if rule.incompatible_version:
                        if parse_version(
                                tgt_comp["version"]) <= parse_version(
                                rule.incompatible_version):
                            conflict = True
                    else:
                        conflict = True

                    if conflict:
                        score -= 20
                        violations.append(
                            {
                                "severity": "CRITICAL",
                                "source_component": src_comp["type"],
                                "target_component": tgt_comp["type"],
                                "root_cause_explanation": rule.reason,
                                "source_document": f"DocID:{
                                    rule.document_id}",
                                "what_failed": f"{
                                    src_comp['type']} conflicts with {
                                    tgt_comp['type']}",
                                "why_failed": f"{
                                    tgt_comp['type']} version {
                                    tgt_comp['version']} is blacklisted.",
                                "dependency": "INCOMPATIBLE",
                                "affected_components": [
                                    src_comp["type"],
                                    tgt_comp["type"]],
                                "business_impact": "System instability, kernel crashes, or network drops.",
                                "recommended_action": f"Upgrade {
                                    tgt_comp['type']} to a version higher than {
                                        rule.incompatible_version}"})

            elif rule.rule_type == "REQUIRES":
                tgt_comp = get_comp(rule.target_component_type)
                if not tgt_comp:
                    score -= 15
                    violations.append(
                        {
                            "severity": "HIGH",
                            "source_component": src_comp["type"],
                            "target_component": f"{
                                rule.target_component_type} (Missing)",
                            "root_cause_explanation": "Missing required dependency.",
                            "source_document": f"DocID:{
                                rule.document_id}",
                            "what_failed": f"{
                                src_comp['type']} is missing a requirement.",
                            "why_failed": f"Required component {
                                rule.target_component_type} is not installed.",
                            "dependency": "REQUIRES",
                            "affected_components": [
                                src_comp["type"]],
                            "business_impact": "Feature degradation or application failure.",
                            "recommended_action": f"Install {
                                rule.target_component_type} version {
                                    rule.target_min_version} or higher."})
                else:
                    if rule.target_min_version and parse_version(
                            tgt_comp["version"]) < parse_version(
                            rule.target_min_version):
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

    def generate_knowledge_graph(self,
                                 label_id: str,
                                 components: List[Dict[str,
                                                       Any]],
                                 violations: List[Dict[str,
                                                       Any]]) -> Dict[str,
                                                                      Any]:
        G = nx.DiGraph()

        for idx, comp in enumerate(components):
            comp_type = comp["type"]
            if not G.has_node(comp_type):
                G.add_node(
                    comp_type,
                    label=f"{comp_type} v{
                        comp.get(
                            'version',
                            'Unknown')}",
                    status="Compliant",
                    version=comp.get(
                        "version",
                        "Unknown"))

        for v in violations:
            tgt = v.get("target_component", "")
            if "(Missing)" in tgt:
                tgt_clean = tgt.replace(" (Missing)", "")
                if not G.has_node(tgt_clean):
                    G.add_node(
                        tgt_clean,
                        label=f"{tgt_clean} (Missing)",
                        status="Missing",
                        version="N/A")

        for v in violations:
            src = v.get("source_component")
            tgt = v.get("target_component", "").replace(" (Missing)", "")
            sev = v.get("severity")

            for node in [src, tgt]:
                if node and G.has_node(node):
                    if G.nodes[node]["status"] != "Missing":
                        if sev == "CRITICAL":
                            G.nodes[node]["status"] = "Non-Compliant"
                        elif sev == "HIGH" and G.nodes[node]["status"] != "Non-Compliant":
                            G.nodes[node]["status"] = "Warning"
                        elif G.nodes[node]["status"] == "Compliant":
                            G.nodes[node]["status"] = "Warning"

        edge_idx = 0
        seen_edges = set()

        for rule in self.rules:
            src = rule.source_component_type
            tgt = rule.target_component_type

            if G.has_node(src) and G.has_node(tgt):
                edge_key = f"{src}-{tgt}-{rule.rule_type}"
                if edge_key not in seen_edges:
                    seen_edges.add(edge_key)
                    is_violation = False
                    for v in violations:
                        v_src = v.get("source_component")
                        v_tgt = v.get(
                            "target_component", "").replace(
                            " (Missing)", "")
                        if v_src == src and v_tgt == tgt:
                            is_violation = True
                            break

                    G.add_edge(
                        src,
                        tgt,
                        label=rule.rule_type,
                        is_violation=is_violation)

        G.add_node(
            "endpoint-device",
            label=f"Endpoint ({label_id})",
            status="Endpoint",
            version="N/A")

        for node in list(G.nodes()):
            if node != "endpoint-device" and G.in_degree(node) == 0:
                G.add_edge(
                    "endpoint-device",
                    node,
                    label="HAS_COMPONENT",
                    is_violation=False)

        elements = []

        if nx.is_directed_acyclic_graph(G):
            generations = list(nx.topological_generations(G))
        else:
            generations = [list(G.nodes())]

        y_start = 50
        y_gap = 180
        x_gap = 250

        node_positions = {}
        for gen_idx, gen in enumerate(generations):
            x_start = 400 - (len(gen) * x_gap) / 2
            for i, node in enumerate(gen):
                node_positions[node] = {
                    "x": x_start + i * x_gap,
                    "y": y_start + gen_idx * y_gap}

        for node in G.nodes():
            data = G.nodes[node]
            status = data.get("status", "Compliant")

            style = {
                "borderRadius": "8px",
                "padding": "10px",
                "background": "#f0fdf4",
                "border": "2px solid #10b981",
                "color": "#1e293b"}
            if status == "Missing":
                style = {
                    "border": "2px dashed #f59e0b",
                    "background": "#fff",
                    "color": "#1e293b"}
            elif status == "Non-Compliant":
                style = {
                    "border": "2px solid #ef4444",
                    "background": "#fef2f2",
                    "color": "#1e293b"}
            elif status == "Warning":
                style = {
                    "border": "2px solid #f59e0b",
                    "background": "#fffbeb",
                    "color": "#1e293b"}
            elif status == "Endpoint":
                style = {
                    "background": "#0076CE",
                    "color": "#fff",
                    "border": "2px solid #005A9E"}

            elements.append({
                "id": node,
                "data": {
                    "label": data.get("label"),
                    "componentName": node,
                    "version": data.get("version"),
                    "status": status
                },
                "position": node_positions.get(node, {"x": 400, "y": 50}),
                "style": style
            })

        for u, v, data in G.edges(data=True):
            label = data.get("label", "DEPENDS_ON")
            is_violation = data.get("is_violation", False)

            style = {"stroke": "#94a3b8", "strokeWidth": 2}
            animated = False

            if is_violation:
                if label == "INCOMPATIBLE_WITH" or label == "CONFLICTS_WITH":
                    style = {"stroke": "#ef4444", "strokeWidth": 2}
                else:
                    style = {"stroke": "#f59e0b", "strokeWidth": 2}
                animated = True
            elif label == "REQUIRES" or label == "DEPENDS_ON" or label == "SUPPORTED_ON":
                style = {"stroke": "#3b82f6", "strokeWidth": 2}
            elif label == "HAS_COMPONENT":
                style = {
                    "stroke": "#cbd5e1",
                    "strokeWidth": 1,
                    "strokeDasharray": "5 5"}

            elements.append({
                "id": f"edge-{u}-{v}-{edge_idx}",
                "source": u,
                "target": v,
                "label": label,
                "style": style,
                "animated": animated
            })
            edge_idx += 1

        return {"elements": elements}


graph_engine = GraphService()
