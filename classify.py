"""
Apply nationality classification to beneficiarios.csv and excluidos.csv,
then rebuild all frontend data (frontend/public/*.json).

Run this script whenever spanish_names.csv is updated — no need to re-parse
the PDFs.
"""

import json
import logging
import math
import re
from pathlib import Path

import pandas as pd


SPANISH_NAMES_CSV               = Path("spanish_names.csv")
BENEFICIARIOS_CSV               = Path("beneficiarios.csv")
EXCLUIDOS_CSV                   = Path("excluidos.csv")
BENEFICIARIOS_OUT               = Path("beneficiarios_por_nacionalidades.csv")
EXCLUIDOS_OUT                   = Path("excluidos_por_nacionalidades.csv")
CODES_PATH                      = Path("exclusion_codes.md")
JSON_PATH           = Path("frontend/public/data.json")
JSON_ADMITIDOS_PATH = Path("frontend/public/admitidos.json")
JSON_EXCLUIDOS_PATH = Path("frontend/public/excluidos.json")

BUCKETS       = [0, 500, 1000, 2000, 3000, 4000, 5400.01]
BUCKET_LABELS = ["0–500", "500–1k", "1k–2k", "2k–3k", "3k–4k", "4k–5.4k"]


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)


# ── Nationality classification ─────────────────────────────────────────────────

def load_spanish_names(csv_path: Path) -> set[str]:
    df = pd.read_csv(csv_path)
    return set(df["name"].str.strip().str.lower())


def is_likely_spanish_name(full_name: str, spanish_names: set[str]) -> bool:
    """All first names must be in the Spanish names dataset."""
    if not isinstance(full_name, str):
        return False
    try:
        _, first_names_part = full_name.split(",", maxsplit=1)
    except ValueError:
        return False

    first_names = [n.strip().lower() for n in first_names_part.split() if n.strip()]
    if not first_names:
        return False

    return all(n in spanish_names for n in first_names)


_NIF_PATTERN = re.compile(r"^\*{3}\d{4}\*{2}$")


def is_spanish_nif(nif_nie: str) -> bool:
    """Return True if nif_nie matches the masked Spanish national (NIF) structure: ***NNNN**"""
    if not isinstance(nif_nie, str):
        return False
    return bool(_NIF_PATTERN.match(nif_nie.strip()))


def classify(csv_in: Path, csv_out: Path, spanish_names: set[str]) -> None:
    df = pd.read_csv(csv_in)
    id_col = "nif_nie" if "nif_nie" in df.columns else "dni_nie"
    df["nombre_español"] = df["nombre"].apply(
        lambda n: is_likely_spanish_name(n, spanish_names)
    )
    df["nif_español"] = df[id_col].apply(is_spanish_nif)
    df["español"] = df["nombre_español"] & df["nif_español"]
    spanish_count = int(df["español"].sum())
    logger.info(
        "%s → %d filas (español: %d, extranjero: %d)",
        csv_out, len(df), spanish_count, len(df) - spanish_count,
    )
    df.to_csv(csv_out, index=False, encoding="utf-8-sig")


# ── Exclusion codes ────────────────────────────────────────────────────────────

def parse_codes(md_path: Path) -> list[dict]:
    text = md_path.read_text(encoding="utf-8")
    pattern = re.compile(r"^(\d+(?:\.\d+)?)\.\s+(.+)", re.MULTILINE)
    matches = list(pattern.finditer(text))
    codes = []
    for i, m in enumerate(matches):
        code = m.group(1)
        start = m.start(2)
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        description = re.sub(r"\s{2,}", " ", text[start:end].strip().replace("\n", " "))
        codes.append({"code": code, "description": description})
    return codes


# ── Frontend data builders ─────────────────────────────────────────────────────

def _sort_key(code: str) -> tuple:
    return tuple(int(p) for p in code.split("."))


def build_chart_data(df: pd.DataFrame, col: str = "español") -> dict:
    group_sizes = df[col].value_counts()

    exploded = (
        df[[col, "motivos"]]
        .dropna(subset=["motivos"])
        .assign(motivo=lambda d: d["motivos"].str.split(r"\s*\|\s*"))
        .explode("motivo")
        .assign(motivo=lambda d: d["motivo"].str.strip())
        .loc[lambda d: d["motivo"] != ""]  # drop empty strings from leading/trailing pipes
    )
    counts = (
        exploded.groupby(["motivo", col])
        .size()
        .reset_index(name="count")
    )
    counts["rate"] = counts.apply(
        lambda r: round(r["count"] / group_sizes[r[col]] * 100, 1), axis=1
    )

    pivot_count = counts.pivot(index="motivo", columns=col, values="count").fillna(0)
    pivot_rate  = counts.pivot(index="motivo", columns=col, values="rate").fillna(0)
    motivos = sorted(pivot_rate.index.tolist(), key=_sort_key)

    def series(col_bool, label):
        return {
            "label":  label,
            "codes":  motivos,
            "rates":  [pivot_rate.loc[m, col_bool]  if m in pivot_rate.index  else 0 for m in motivos],
            "counts": [int(pivot_count.loc[m, col_bool]) if m in pivot_count.index else 0 for m in motivos],
            "total":  int(group_sizes.get(col_bool, 0)),
        }

    return {"español": series(True, "Español"), "extranjero": series(False, "Extranjero")}


def build_pie_data(df: pd.DataFrame, col: str = "español") -> list:
    counts  = df[col].value_counts()
    amounts = df.groupby(col)["ayuda_num"].sum()

    def entry(label, key):
        return {"name": label, "count": int(counts.get(key, 0)), "amount": round(float(amounts.get(key, 0.0)), 2)}

    return [entry("Español", True), entry("Extranjero", False)]


def build_count_pie_data(df: pd.DataFrame, col: str = "español") -> list:
    counts = df[col].value_counts()
    return [
        {"name": "Español",    "count": int(counts.get(True,  0))},
        {"name": "Extranjero", "count": int(counts.get(False, 0))},
    ]


def build_stats_data(df: pd.DataFrame, col: str = "español") -> dict:
    def stats(series):
        if series.empty:
            return {"min": 0, "max": 0, "avg": 0, "count": 0}
        return {
            "min":   round(float(series.min()), 2),
            "max":   round(float(series.max()), 2),
            "avg":   round(float(series.mean()), 2),
            "count": int(series.count()),
        }

    return {
        "total":      stats(df["ayuda_num"]),
        "español":    stats(df.loc[df[col] == True,  "ayuda_num"]),
        "extranjero": stats(df.loc[df[col] == False, "ayuda_num"]),
    }


def build_funnel_data(adm: pd.DataFrame, exc: pd.DataFrame, col: str = "español") -> dict:
    def entry(adm_mask=None, exc_mask=None):
        n_adm = len(adm) if adm_mask is None else int(adm[adm_mask].shape[0])
        n_exc = len(exc) if exc_mask is None else int(exc[exc_mask].shape[0])
        return {"admitted": n_adm, "excluded": n_exc, "total": n_adm + n_exc}

    return {
        "total":      entry(),
        "español":    entry(adm[col] == True,  exc[col] == True),
        "extranjero": entry(adm[col] == False, exc[col] == False),
    }


def build_distribution_data(df: pd.DataFrame, col: str = "español") -> dict:
    def group_stats(series):
        counts = []
        for i in range(len(BUCKETS) - 1):
            lo, hi = BUCKETS[i], BUCKETS[i + 1]
            counts.append(int(((series >= lo) & (series < hi)).sum()))
        median = round(float(series.median()), 2) if not series.empty else 0
        mean   = round(float(series.mean()),   2) if not series.empty else 0
        return {"counts": counts, "median": median, "mean": mean}

    return {
        "buckets":    BUCKET_LABELS,
        "total":      group_stats(df["ayuda_num"]),
        "español":    group_stats(df.loc[df[col] == True,  "ayuda_num"]),
        "extranjero": group_stats(df.loc[df[col] == False, "ayuda_num"]),
    }


def _nan_to_none(records: list[dict]) -> list[dict]:
    return [
        {k: (None if isinstance(v, float) and math.isnan(v) else v) for k, v in row.items()}
        for row in records
    ]


def build_frontend_json() -> None:
    logger.info("Construyendo datos del frontend…")

    df_ben  = pd.read_csv(BENEFICIARIOS_OUT)
    df_exc  = pd.read_csv(EXCLUIDOS_OUT)

    adm_records = _nan_to_none(df_ben.to_dict(orient="records"))
    exc_records = _nan_to_none(df_exc.to_dict(orient="records"))
    JSON_ADMITIDOS_PATH.write_text(json.dumps(adm_records, ensure_ascii=False), encoding="utf-8")
    JSON_EXCLUIDOS_PATH.write_text(json.dumps(exc_records, ensure_ascii=False), encoding="utf-8")
    logger.info("  %s, %s", JSON_ADMITIDOS_PATH, JSON_EXCLUIDOS_PATH)

    def build_for_col(col: str) -> dict:
        df_pref     = df_ben[df_ben["preferente"] == True]
        df_gen      = df_ben[df_ben["preferente"] == False]
        df_exc_pref = df_exc[df_exc["preferente"] == True]
        df_exc_gen  = df_exc[df_exc["preferente"] == False]

        def group_data(df_adm, df_ex):
            return {
                "pie":          build_pie_data(df_adm, col),
                "stats":        build_stats_data(df_adm, col),
                "distribution": build_distribution_data(df_adm, col),
                "funnel":       build_funnel_data(df_adm, df_ex, col),
            }

        return {
            "chart":         build_chart_data(df_exc, col),
            "excluidos_pie": {
                "all":        build_count_pie_data(df_exc, col),
                "preferente": build_count_pie_data(df_exc_pref, col),
                "general":    build_count_pie_data(df_exc_gen, col),
            },
            "all":        group_data(df_ben,  df_exc),
            "preferente": group_data(df_pref, df_exc_pref),
            "general":    group_data(df_gen,  df_exc_gen),
        }

    codes = parse_codes(CODES_PATH)
    payload = {
        "codes": codes,
        "both":  build_for_col("español"),
        "name":  build_for_col("nombre_español"),
        "nif":   build_for_col("nif_español"),
    }
    JSON_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    logger.info("  %s", JSON_PATH)


# ── Main ───────────────────────────────────────────────────────────────────────

def main() -> None:
    logger.info("Cargando nombres españoles desde %s", SPANISH_NAMES_CSV)
    spanish_names = load_spanish_names(SPANISH_NAMES_CSV)
    logger.info("  %d nombres cargados", len(spanish_names))

    classify(BENEFICIARIOS_CSV, BENEFICIARIOS_OUT, spanish_names)
    classify(EXCLUIDOS_CSV, EXCLUIDOS_OUT, spanish_names)

    build_frontend_json()

    logger.info("DONE ✅")


if __name__ == "__main__":
    main()
