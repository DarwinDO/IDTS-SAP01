"""Generate editable draw.io figures used by the formal IDTS BRD, SRS, and FRS.

The formal review figures deliberately use a compact, readable subset of the
canonical Mermaid/PlantUML wording.  The original source remains available
under docs/diagrams/ for technical traceability.
"""

from __future__ import annotations

from dataclasses import dataclass
from html import escape
from pathlib import Path
from uuid import uuid4


ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "docs" / "diagrams" / "drawio"


@dataclass(frozen=True)
class Node:
    key: str
    text: str
    x: int
    y: int
    w: int = 190
    h: int = 62
    kind: str = "process"


@dataclass(frozen=True)
class Edge:
    source: str
    target: str
    label: str = ""


STYLES = {
    "actor": "rounded=1;whiteSpace=wrap;html=1;fillColor=#EAF3F8;strokeColor=#0A6ED1;fontColor=#0A2F5A;fontSize=17;fontStyle=1;",
    "process": "rounded=1;whiteSpace=wrap;html=1;fillColor=#F5F9FC;strokeColor=#5B7C99;fontColor=#1B2A3A;fontSize=16;",
    "system": "rounded=1;whiteSpace=wrap;html=1;fillColor=#DCEEFF;strokeColor=#0A6ED1;fontColor=#0A2F5A;fontSize=17;fontStyle=1;",
    "decision": "shape=rhombus;whiteSpace=wrap;html=1;fillColor=#FFF3CD;strokeColor=#B95C00;fontColor=#5D3A00;fontSize=15;fontStyle=1;",
    "outcome": "rounded=1;whiteSpace=wrap;html=1;fillColor=#E8F5E9;strokeColor=#2B7D2B;fontColor=#1C5C1C;fontSize=16;fontStyle=1;",
    "warning": "rounded=1;whiteSpace=wrap;html=1;fillColor=#FDEDEC;strokeColor=#BB0000;fontColor=#7A0000;fontSize=16;fontStyle=1;",
    "data": "shape=cylinder;whiteSpace=wrap;html=1;fillColor=#F3E8FF;strokeColor=#7B3FA1;fontColor=#4B176A;fontSize=16;fontStyle=1;",
    "group": "swimlane;horizontal=0;startSize=28;rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;swimlaneFillColor=#EAF3F8;strokeColor=#8AA6BE;fontColor=#16324F;fontSize=16;fontStyle=1;",
}

EDGE_STYLE = "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;endArrow=block;endFill=1;strokeColor=#4F6B85;fontSize=14;fontColor=#223548;labelBackgroundColor=#FFFFFF;"


def label(value: str) -> str:
    # `value` is an XML attribute. draw.io parses the escaped HTML break.
    return escape(value).replace("\n", "&lt;br&gt;")


def diagram(name: str, title: str, nodes: list[Node], edges: list[Edge], width: int = 1800, height: int = 1000) -> None:
    ids = {node.key: str(index + 2) for index, node in enumerate(nodes)}
    cells = ['<mxCell id="0"/>', '<mxCell id="1" parent="0"/>']
    for node in nodes:
        cells.append(
            f'<mxCell id="{ids[node.key]}" value="{label(node.text)}" style="{STYLES[node.kind]}" vertex="1" parent="1">'
            f'<mxGeometry x="{node.x}" y="{node.y}" width="{node.w}" height="{node.h}" as="geometry"/>'
            '</mxCell>'
        )
    for index, edge in enumerate(edges, start=len(nodes) + 2):
        cells.append(
            f'<mxCell id="{index}" value="{label(edge.label)}" style="{EDGE_STYLE}" edge="1" parent="1" source="{ids[edge.source]}" target="{ids[edge.target]}">'
            '<mxGeometry relative="1" as="geometry"/>'
            '</mxCell>'
        )
    xml = (
        f'<mxfile host="app.diagrams.net" modified="2026-07-11T00:00:00.000Z" agent="IDTS" version="26.0.14" type="device">'
        f'<diagram id="{uuid4().hex}" name="{label(title)}">'
        f'<mxGraphModel dx="{width}" dy="{height}" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="{width}" pageHeight="{height}" math="0" shadow="0">'
        f'<root>{"".join(cells)}</root></mxGraphModel></diagram></mxfile>'
    )
    (OUT / f"{name}.drawio").write_text(xml, encoding="utf-8")


def chain(prefix: str, texts: list[str], x: int = 80, y: int = 120, gap: int = 240) -> tuple[list[Node], list[Edge]]:
    nodes = [Node(f"{prefix}{index}", text, x + index * gap, y) for index, text in enumerate(texts)]
    return nodes, [Edge(nodes[index].key, nodes[index + 1].key) for index in range(len(nodes) - 1)]


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    diagram(
        "01-system-context",
        "Figure 01 - IDTS System Context",
        [
            Node("tester", "Tester", 70, 130, kind="actor"), Node("dev", "Developer", 70, 270, kind="actor"), Node("pm", "Project Manager", 70, 410, kind="actor"),
            Node("idts", "Issue and Defect Tracking System\nSAP Fiori / CAP", 430, 240, 290, 100, "system"),
            Node("db", "Business data\nSQLite local / PostgreSQL shared QA", 1050, 130, 280, 80, "data"),
            Node("mail", "Email notification\nBrevo API", 1050, 300, 280, 70, "process"),
            Node("s3", "Attachment content\nAWS S3", 1050, 440, 280, 70, "process"),
        ],
        [Edge("tester", "idts", "report and retest"), Edge("dev", "idts", "review and process"), Edge("pm", "idts", "monitor and coordinate"), Edge("idts", "db", "persist"), Edge("idts", "mail", "notify"), Edge("idts", "s3", "store file content")],
        1500, 720,
    )

    diagram(
        "02-cap-fiori-architecture",
        "Figure 02 - CAP and Fiori Architecture",
        [
            Node("browser", "Browser\nSAP Fiori / SAPUI5", 90, 250, 230, 80, "actor"),
            Node("login", "Custom CAP authentication\nlogin, token, logout", 420, 110, 250, 75, "system"),
            Node("odata", "CAP OData V4 service\nservice.cds", 420, 260, 250, 75, "system"),
            Node("handler", "CAP handlers\nvalidation and workflow", 770, 260, 250, 75, "system"),
            Node("model", "CDS domain model\nschema.cds", 770, 420, 250, 75, "system"),
            Node("db", "SQLite local\nor PostgreSQL QA", 1120, 420, 250, 75, "data"),
            Node("integrations", "Brevo API and AWS S3\nemail and attachments", 1120, 200, 250, 75, "process"),
        ],
        [Edge("browser", "login", "authenticate"), Edge("browser", "odata", "protected OData"), Edge("login", "odata", "authenticated user"), Edge("odata", "handler"), Edge("handler", "model"), Edge("model", "db"), Edge("handler", "integrations", "outbox / storage")],
        1550, 720,
    )

    diagram(
        "03-use-case",
        "Figure 03 - IDTS Use Cases by Role",
        [
            Node("tester", "Tester", 60, 160, kind="actor"), Node("dev", "Developer", 60, 360, kind="actor"), Node("pm", "Project Manager", 60, 560, kind="actor"),
            Node("report", "Create, classify, assign\nand submit bug", 400, 110, 260, 75, "process"),
            Node("collab", "Comment, attach evidence\nand view history", 400, 260, 260, 75, "process"),
            Node("review", "Review assigned bug\nrequest info, reject, resolve", 760, 260, 280, 75, "process"),
            Node("monitor", "View workload, overdue bugs\nand dashboard", 760, 500, 280, 75, "process"),
            Node("notify", "Receive notification", 1120, 360, 230, 70, "process"),
        ],
        [Edge("tester", "report"), Edge("tester", "collab"), Edge("dev", "review"), Edge("dev", "collab"), Edge("pm", "monitor"), Edge("pm", "collab"), Edge("report", "notify"), Edge("review", "notify"), Edge("monitor", "notify")],
        1500, 760,
    )

    diagram(
        "04-end-to-end-defect-flow",
        "Figure 04 - End-to-End Defect Tracking Flow",
        [
            Node("detect", "Tester detects defect", 60, 260), Node("duplicate", "Check similar bugs", 300, 260), Node("create", "Create and classify\nbug report", 540, 260),
            Node("assign", "Choose Developer\nor Pending Assignment", 800, 260), Node("review", "Developer review", 1080, 260), Node("resolve", "Resolve and retest", 1320, 260), Node("closed", "Closed", 1560, 260, kind="outcome"),
            Node("info", "Need More Information\nTester updates report", 1080, 470, 250, 70, "warning"), Node("reject", "Rejected with follow-up\nCorrect and reassign", 800, 470, 250, 70, "warning"), Node("pm", "PM monitors workload,\npending and overdue queues", 540, 600, 280, 70, "actor"),
        ],
        [Edge("detect", "duplicate"), Edge("duplicate", "create", "new or authorized update"), Edge("create", "assign"), Edge("assign", "review"), Edge("review", "resolve", "valid"), Edge("resolve", "closed", "passed"), Edge("review", "info", "information missing"), Edge("info", "review", "updated"), Edge("review", "reject", "wrong classification or assignee"), Edge("reject", "assign", "corrected"), Edge("pm", "assign", "coordinate")],
        1850, 850,
    )

    diagram(
        "09-conceptual-data-model",
        "Figure 09 - Conceptual IDTS Data Model",
        [
            Node("user", "User\nrole, active", 70, 130, 190, 70, "data"), Node("profile", "Developer Profile\navailability, workload", 70, 290, 210, 70, "data"),
            Node("module", "SAP Module", 400, 70, 180, 60, "data"), Node("component", "Application Component", 400, 190, 220, 60, "data"), Node("category", "Defect Category", 400, 310, 190, 60, "data"), Node("responsibility", "Developer Responsibility", 400, 440, 220, 60, "data"),
            Node("bug", "Bug\nclassification, status, assignee,\nnext processor, due date", 820, 220, 300, 105, "system"),
            Node("comment", "Comment", 1280, 70, 170, 60, "data"), Node("attachment", "Attachment", 1280, 170, 170, 60, "data"), Node("history", "History Event / Log", 1280, 270, 190, 60, "data"), Node("notification", "Notification / Delivery", 1280, 370, 205, 60, "data"), Node("duplicate", "Duplicate Link", 1280, 470, 180, 60, "data"),
        ],
        [Edge("user", "profile", "may have"), Edge("profile", "responsibility"), Edge("module", "component", "context"), Edge("component", "category", "valid pair"), Edge("category", "responsibility"), Edge("responsibility", "bug", "eligible assignee"), Edge("user", "bug", "creates / owns"), Edge("component", "bug", "classifies"), Edge("category", "bug", "classifies"), Edge("bug", "comment"), Edge("bug", "attachment"), Edge("bug", "history"), Edge("bug", "notification"), Edge("bug", "duplicate")],
        1650, 720,
    )

    diagram(
        "13-srs-system-context",
        "Figure 13 - SRS System Context",
        [
            Node("roles", "Tester · Developer · PM", 70, 260, 230, 70, "actor"), Node("ui", "Fiori Elements / SAPUI5", 430, 260, 240, 70, "system"), Node("service", "CAP OData V4 service", 800, 260, 240, 70, "system"), Node("auth", "Custom authentication", 800, 120, 240, 60, "system"), Node("db", "Business database", 1160, 210, 210, 70, "data"), Node("audit", "History and notifications", 1160, 360, 210, 70, "data"),
        ],
        [Edge("roles", "ui"), Edge("ui", "service", "authenticated request"), Edge("auth", "service", "identity"), Edge("service", "db", "read / write"), Edge("service", "audit", "record")],
        1500, 650,
    )

    flow_specs = {
        "14-frs-main-defect-flow": ("Figure 14 - Main Defect Tracking Flow", ["Detect defect", "Check similar bugs", "Create and classify", "Assign or Pending Assignment", "Developer review", "Resolve / retest", "Close or reopen"], [("branch0", "Need More Information or Rejected\nTester/PM corrects and returns to review", 1040, 390, "warning")]),
        "17-frs-create-assignment": ("Figure 17 - Bug Creation and Assignment", ["Start bug creation", "Enter required details", "Check existing bugs", "Classify bug", "Filter Developers", "Assign or Pending Assignment", "Write history and notify"], [("branch1", "No suitable Developer\nPending Assignment", 1240, 390, "warning")]),
        "18-frs-developer-review": ("Figure 18 - Developer Review Decision", ["Open assigned bug", "Review details and evidence", "Can process?", "Move to In Progress", "Add developer note", "Mark Resolved"], [("branch2", "Missing information\nRequest More Information", 560, 400, "warning"), ("branch3", "Wrong classification or assignee\nReject with reason", 820, 400, "warning")]),
        "20-frs-resolve-retest-close-reopen": ("Figure 20 - Resolve, Retest, Close, and Reopen", ["Developer marks Resolved", "Set next action owner", "Verification needed?", "Retest", "Close bug", "Write history and notify"], [("branch4", "No verification required\nand accepted", 580, 400, "outcome"), ("branch5", "Retest failed\nReopen and return to Assigned", 1060, 400, "warning")]),
        "21-frs-pm-monitoring": ("Figure 21 - PM Monitoring and Escalation", ["Open monitoring view", "Filter workload and queues", "Review overdue / pending / rejected", "Action needed?", "Comment or request reassignment", "Write history and notify"], [("branch6", "No action needed\nContinue monitoring", 820, 400, "outcome")]),
    }
    for name, (title, texts, branches) in flow_specs.items():
        nodes = [
            Node(f"f{index}", text, 80 + (index % 4) * 290, 150 + (index // 4) * 190)
            for index, text in enumerate(texts)
        ]
        edges = [Edge(nodes[index].key, nodes[index + 1].key) for index in range(len(nodes) - 1)]
        nodes = [Node(node.key, node.text, node.x, node.y, node.w, node.h, "decision" if "?" in node.text else node.kind) for node in nodes]
        routes = {
            "14-frs-main-defect-flow": [("f4", "f4")],
            "17-frs-create-assignment": [("f4", "f4")],
            "18-frs-developer-review": [("f2", "f1"), ("f2", "f1")],
            "20-frs-resolve-retest-close-reopen": [("f2", "f4"), ("f3", "f0")],
            "21-frs-pm-monitoring": [("f3", "f0")],
        }[name]
        for index, (key, text, x, y, kind) in enumerate(branches):
            nodes.append(Node(key, text, x, y, 250, 70, kind))
            source, target = routes[index]
            edges.extend([Edge(source, key), Edge(key, target)])
        diagram(name, title, nodes, edges, 1450, 860)

    for name, title, columns, messages in [
        ("15-frs-rejected-follow-up", "Figure 15 - Rejected Follow-up Sequence", ["Developer", "Fiori Object Page", "CAP Service", "Database", "Follow-up Owner"], ["Choose Reject", "Enter rejection reason", "Validate authority", "Save Rejected, reason and history", "Review and correct", "Reassign or Pending Assignment"]),
        ("19-frs-request-more-information", "Figure 19 - Request More Information Sequence", ["Developer", "Fiori Object Page", "CAP Service", "Database", "Tester"], ["Request More Information", "Enter required reason", "Validate action", "Save status and history", "Add missing information", "Return to Assigned or In Review"]),
    ]:
        nodes = [Node(f"c{idx}", value, 70 + idx * 330, 70, 220, 55, "actor") for idx, value in enumerate(columns)]
        nodes += [Node(f"m{idx}", value, 80 + (idx % 4) * 330, 190 + idx * 90, 250, 52, "process") for idx, value in enumerate(messages)]
        edges = [Edge(f"m{idx}", f"m{idx + 1}") for idx in range(len(messages) - 1)]
        edges += [Edge("c0", "m0"), Edge("m1", "c2"), Edge("m3", "c3"), Edge("m4", "c4")]
        diagram(name, title, nodes, edges, 1800, 800)

    diagram(
        "16-frs-status-lifecycle",
        "Figure 16 - Bug Status Lifecycle",
        [
            Node("create", "Create decision", 100, 280, kind="decision"), Node("assigned", "Assigned", 360, 160, kind="process"), Node("pending", "Pending Assignment", 360, 410, kind="warning"), Node("review", "In Review", 650, 160), Node("info", "Need More Information", 650, 410, kind="warning"), Node("progress", "In Progress", 940, 160), Node("resolved", "Resolved", 1170, 160), Node("retest", "Retest Required", 1170, 410), Node("closed", "Closed", 1480, 160, kind="outcome"), Node("reopen", "Reopened", 1480, 410, kind="warning"), Node("rejected", "Rejected with follow-up", 940, 410, kind="warning"),
        ],
        [Edge("create", "assigned"), Edge("create", "pending"), Edge("pending", "assigned"), Edge("assigned", "review"), Edge("review", "info"), Edge("info", "review", "information added"), Edge("review", "progress"), Edge("review", "rejected"), Edge("rejected", "assigned", "corrected"), Edge("progress", "resolved"), Edge("resolved", "retest"), Edge("resolved", "closed", "accepted"), Edge("retest", "closed", "passed"), Edge("retest", "reopen", "failed"), Edge("reopen", "assigned")],
        1800, 760,
    )

    print(f"Generated {len(list(OUT.glob('*.drawio')))} draw.io source files in {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
