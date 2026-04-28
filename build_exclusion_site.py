"""
Generates exclusion_site.html — a self-contained interactive page with:
  - Plotly grouped bar chart (rates per group, hover shows count + %)
  - Clicking a bar highlights the matching row in the codes reference table
  - Exclusion codes reference table sourced from exclusion_codes.md
"""

import json
import re
from pathlib import Path

import pandas as pd


CSV_PATH          = Path("ayudas_alquiler_cam_2024_excluidos.csv")
CSV_ADMITIDOS_PATH = Path("ayudas_alquiler_cam_2024.csv")
CODES_PATH        = Path("exclusion_codes.md")
OUT_PATH          = Path("exclusion_site.html")
JSON_PATH         = Path("frontend/public/data.json")


# ── Exclusion codes ────────────────────────────────────────────────────────────

def parse_codes(md_path: Path) -> list[dict]:
    """Parse exclusion_codes.md into [{code, description}]."""
    text = md_path.read_text(encoding="utf-8")
    codes = []
    # Match lines starting with a code like "1.1.", "2.1.", "3.", "10.", etc.
    pattern = re.compile(r"^(\d+(?:\.\d+)?)\.\s+(.+)", re.MULTILINE)
    # Collect all match positions so we can grab multi-line descriptions
    matches = list(pattern.finditer(text))
    for i, m in enumerate(matches):
        code = m.group(1)
        start = m.start(2)
        end   = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        description = text[start:end].strip().replace("\n", " ")
        # Collapse runs of whitespace
        description = re.sub(r"\s{2,}", " ", description)
        codes.append({"code": code, "description": description})
    return codes


# ── Chart data ─────────────────────────────────────────────────────────────────

def _sort_key(code: str) -> tuple:
    return tuple(int(p) for p in code.split("."))


def build_chart_data(csv_path: Path) -> dict:
    df = pd.read_csv(csv_path)
    group_sizes = df["español"].value_counts()  # True / False

    exploded = (
        df[["español", "motivos"]]
        .dropna(subset=["motivos"])
        .assign(motivo=lambda d: d["motivos"].str.split(r"\s*\|\s*"))
        .explode("motivo")
        .assign(motivo=lambda d: d["motivo"].str.strip())
    )

    counts = (
        exploded.groupby(["motivo", "español"])
        .size()
        .reset_index(name="count")
    )
    counts["rate"] = counts.apply(
        lambda r: round(r["count"] / group_sizes[r["español"]] * 100, 1), axis=1
    )

    pivot_count = counts.pivot(index="motivo", columns="español", values="count").fillna(0)
    pivot_rate  = counts.pivot(index="motivo", columns="español", values="rate").fillna(0)

    motivos = sorted(pivot_rate.index.tolist(), key=_sort_key)

    def series(col_bool, label):
        return {
            "label":  label,
            "codes":  motivos,
            "rates":  [pivot_rate.loc[m, col_bool]  if m in pivot_rate.index  else 0 for m in motivos],
            "counts": [int(pivot_count.loc[m, col_bool]) if m in pivot_count.index else 0 for m in motivos],
            "total":  int(group_sizes[col_bool]),
        }

    return {
        "español":    series(True,  "Español"),
        "extranjero": series(False, "Extranjero"),
    }


# ── Pie data ───────────────────────────────────────────────────────────────────

def build_pie_data(csv_path: Path) -> list:
    df = pd.read_csv(csv_path)
    counts  = df["español"].value_counts()
    amounts = df.groupby("español")["ayuda_num"].sum()

    def entry(label, bool_key):
        return {"name": label, "count": int(counts[bool_key]), "amount": round(float(amounts[bool_key]), 2)}

    return [entry("Español", True), entry("Extranjero", False)]


# ── HTML ───────────────────────────────────────────────────────────────────────

HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Motivos de exclusión — Programa Jóvenes CAM 2024</title>
<script src="https://cdn.plot.ly/plotly-2.32.0.min.js"></script>
<style>
  *, *::before, *::after {{ box-sizing: border-box; }}
  body {{
    font-family: system-ui, sans-serif;
    margin: 0; padding: 24px;
    background: #f5f5f5; color: #222;
  }}
  h1 {{ font-size: 1.3rem; margin-bottom: 4px; }}
  .subtitle {{ color: #555; font-size: .9rem; margin-bottom: 24px; }}
  #chart {{ background:#fff; border-radius:8px; padding:16px;
            box-shadow:0 1px 4px rgba(0,0,0,.1); margin-bottom:32px; }}
  #codes-section {{ background:#fff; border-radius:8px; padding:20px;
                    box-shadow:0 1px 4px rgba(0,0,0,.1); }}
  #codes-section h2 {{ font-size:1rem; margin-top:0; margin-bottom:12px; }}
  table {{ width:100%; border-collapse:collapse; font-size:.88rem; }}
  th {{ text-align:left; padding:8px 10px; border-bottom:2px solid #ddd;
        background:#fafafa; font-weight:600; }}
  td {{ padding:7px 10px; border-bottom:1px solid #eee; vertical-align:top; }}
  td.code-cell {{ font-weight:700; white-space:nowrap; width:60px; }}
  tr.highlight {{ background:#fff9c4; }}
  tr {{ transition: background .2s; }}
</style>
</head>
<body>

<h1>Motivos de exclusión — Programa Jóvenes CAM 2024</h1>
<p class="subtitle">
  % de solicitantes de cada grupo excluidos por cada motivo.
  Un solicitante puede tener varios motivos.<br>
  Español: <strong id="n-es"></strong> solicitantes ·
  Extranjero: <strong id="n-ex"></strong> solicitantes.
  <br><small>Haz clic en una barra para resaltar el motivo en la tabla.</small>
</p>

<div id="chart"></div>

<div id="codes-section">
  <h2>Clave de motivos de exclusión</h2>
  <table id="codes-table">
    <thead><tr><th>Código</th><th>Descripción</th></tr></thead>
    <tbody id="codes-body"></tbody>
  </table>
</div>

<script>
const DATA  = __DATA__;
const CODES = __CODES__;

// ── Populate totals ────────────────────────────────────────────────────────
document.getElementById("n-es").textContent =
  DATA.español.total.toLocaleString("es-ES");
document.getElementById("n-ex").textContent =
  DATA.extranjero.total.toLocaleString("es-ES");

// ── Build codes table ──────────────────────────────────────────────────────
const tbody = document.getElementById("codes-body");
CODES.forEach(c => {{
  const tr = document.createElement("tr");
  tr.id = "code-" + c.code.replace(".", "\\\\.");
  tr.dataset.code = c.code;
  tr.innerHTML = `<td class="code-cell">${{c.code}}</td><td>${{c.description}}</td>`;
  tbody.appendChild(tr);
}});

// ── Plotly chart ───────────────────────────────────────────────────────────
const codes  = DATA.español.codes;
const hover  = (series) => codes.map((c, i) =>
  `<b>Motivo ${{c}}</b><br>${{series.label}}: ${{series.rates[i]}}% (${{series.counts[i].toLocaleString("es-ES")}} solicitantes)`
);

const traces = [
  {{
    name: "Español",
    x: codes,
    y: DATA.español.rates,
    type: "bar",
    marker: {{ color: "#3b82f6" }},
    hovertemplate: hover(DATA.español),
    hoverinfo: "text",
  }},
  {{
    name: "Extranjero",
    x: codes,
    y: DATA.extranjero.rates,
    type: "bar",
    marker: {{ color: "#f97316" }},
    hovertemplate: hover(DATA.extranjero),
    hoverinfo: "text",
  }},
];

const layout = {{
  barmode: "group",
  bargap: 0.2,
  bargroupgap: 0.05,
  yaxis: {{ title: "% del grupo", ticksuffix: "%" }},
  xaxis: {{ title: "Motivo de exclusión" }},
  legend: {{ orientation: "h", y: -0.18 }},
  margin: {{ t: 20, b: 80 }},
  plot_bgcolor: "#fff",
  paper_bgcolor: "#fff",
}};

Plotly.newPlot("chart", traces, layout, {{ responsive: true }});

// ── Click: highlight row in table ──────────────────────────────────────────
document.getElementById("chart").on("plotly_click", (data) => {{
  const code = data.points[0].x;
  document.querySelectorAll("#codes-table tr").forEach(r => r.classList.remove("highlight"));
  const row = document.querySelector(`[data-code="${{code}}"]`);
  if (row) {{
    row.classList.add("highlight");
    row.scrollIntoView({{ behavior: "smooth", block: "center" }});
  }}
}});
</script>
</body>
</html>
"""


def build_html(chart_data: dict, codes: list[dict]) -> str:
    return (
        HTML_TEMPLATE
        .replace("__DATA__",  json.dumps(chart_data, ensure_ascii=False))
        .replace("__CODES__", json.dumps(codes,       ensure_ascii=False))
        .replace("{{", "{")
        .replace("}}", "}")
    )


# ── Main ───────────────────────────────────────────────────────────────────────

def main() -> None:
    print("Parsing exclusion codes…")
    codes = parse_codes(CODES_PATH)
    print(f"  {len(codes)} codes loaded")

    print("Building chart data…")
    chart_data = build_chart_data(CSV_PATH)

    print("Building pie data…")
    pie_data = build_pie_data(CSV_ADMITIDOS_PATH)

    print("Writing JSON for React app…")
    payload = {"chart": chart_data, "codes": codes, "pie": pie_data}
    JSON_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Done → {JSON_PATH}")

    print("Writing legacy HTML…")
    html = build_html(chart_data, codes)
    OUT_PATH.write_text(html, encoding="utf-8")
    print(f"Done → {OUT_PATH}")


if __name__ == "__main__":
    main()
