"""
Parse both PDFs into raw CSVs (no nationality classification).

Outputs:
  beneficiarios.csv  — admitted applicants
  excluidos.csv      — excluded applicants

Run classify.py afterwards to add the 'español' column.
"""

import logging
import re
from pathlib import Path

import pandas as pd
import pdfplumber


BENEFICIARIOS_PDF                        = Path("datos_originales/beneficiarios.pdf")
BENEFICIARIOS_PREFERENTES_PDF            = Path("datos_originales/beneficiarios_preferentes.pdf")
EXCLUIDOS_PDF                            = Path("datos_originales/excluidos.pdf")
EXCLUIDOS_PREFERENTES_PDF                = Path("datos_originales/excluidos_preferentes.pdf")
EXCLUIDOS_PREFERENTES_PRESUPUESTO_PDF    = Path("datos_originales/excluidos_preferentes_por_presupuesto.pdf")
BENEFICIARIOS_CSV                        = Path("beneficiarios.csv")
EXCLUIDOS_CSV                            = Path("excluidos.csv")


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)


# ── Beneficiarios ──────────────────────────────────────────────────────────────

BENEFICIARIOS_ROW_RE = re.compile(
    r"^(?P<orden>\d+)\s+"
    r"(?P<expediente>10-PJS1-[\d.]+/2024)\s+"
    r"(?P<nombre>.*?)\s+"
    r"(?P<nif>\*+[\d]+\*+)\s+"
    r"(?P<baremo>\d+,\d+)\s+"
    r"(?P<ayuda>[\d.]+,\d{2})\s*€?$"
)


def clean_amount(value: str) -> float:
    return float(value.replace(".", "").replace(",", "."))


def parse_beneficiarios(pdf_path: Path) -> pd.DataFrame:
    rows: list[dict] = []
    failed = 0

    logger.info("Abriendo %s", pdf_path)
    with pdfplumber.open(pdf_path) as pdf:
        logger.info("Total páginas: %d", len(pdf.pages))
        for page_num, page in enumerate(pdf.pages, start=1):
            for line in (page.extract_text() or "").splitlines():
                clean = line.strip()
                if not clean:
                    continue
                m = BENEFICIARIOS_ROW_RE.match(clean)
                if not m:
                    failed += 1
                    continue
                g = m.groupdict()
                rows.append({
                    "orden":      g["orden"],
                    "expediente": g["expediente"],
                    "nombre":     g["nombre"].strip(),
                    "nif_nie":    g["nif"],
                    "baremo":     g["baremo"],
                    "ayuda":      g["ayuda"],
                })
            logger.info("Página %d → %d filas acumuladas", page_num, len(rows))

    logger.info("Beneficiarios: %d filas válidas, %d líneas sin match", len(rows), failed)
    df = pd.DataFrame(rows)
    df["ayuda_num"] = df["ayuda"].apply(clean_amount)
    return df


# ── Beneficiarios Preferentes ─────────────────────────────────────────────────

# Same columns as beneficiarios but nombre/nif are nullable (some rows omit them)
PREFERENTES_ROW_RE = re.compile(
    r"^(?P<orden>\d+)\s+"
    r"(?P<expediente>10-PJS1-[\d.]+/2024)\s+"
    r"(?:(?P<nombre>.*?)\s+(?P<nif>\*+[\d]+\*+)\s+)?"
    r"(?P<baremo>\d+,\d+)\s+"
    r"(?P<ayuda>[\d.]+,\d{2})\s*€?$"
)


def parse_beneficiarios_preferentes(pdf_path: Path) -> pd.DataFrame:
    rows: list[dict] = []
    failed = 0

    logger.info("Abriendo %s", pdf_path)
    with pdfplumber.open(pdf_path) as pdf:
        logger.info("Total páginas: %d", len(pdf.pages))
        for page_num, page in enumerate(pdf.pages, start=1):
            for line in (page.extract_text() or "").splitlines():
                clean = line.strip()
                if not clean:
                    continue
                m = PREFERENTES_ROW_RE.match(clean)
                if not m:
                    failed += 1
                    continue
                g = m.groupdict()
                rows.append({
                    "orden":      g["orden"],
                    "expediente": g["expediente"],
                    "nombre":     g["nombre"].strip() if g["nombre"] else None,
                    "nif_nie":    g["nif"],
                    "baremo":     g["baremo"],
                    "ayuda":      g["ayuda"],
                })
            logger.info("Página %d → %d filas acumuladas", page_num, len(rows))

    logger.info("Preferentes: %d filas válidas, %d líneas sin match", len(rows), failed)
    df = pd.DataFrame(rows)
    df["ayuda_num"] = df["ayuda"].apply(clean_amount)
    return df


# ── Excluidos ──────────────────────────────────────────────────────────────────

EXCLUIDOS_ROW_RE = re.compile(
    r"^(?P<expediente>10-PJS1-[\d.]+/2024)\s+"
    r"(?P<nombre>.*?)\s+"
    r"(?P<dni>\*+\d+\*+)"
    r"(?P<motivos>.*)$"
)

HEADER_WORDS = {
    "EXPEDIENTE", "NOMBRE", "DNI/NIE", "MOTIVOS", "EXCLUSIÓN",
    "Ayudas", "Alquiler", "Comunidad", "Madrid", "PROGRAMA",
    "JÓVENES", "EXCLUIDO", "DEFINITIVO",
}


def _is_header(line: str) -> bool:
    return any(w in line for w in HEADER_WORDS)


def parse_excluidos(pdf_path: Path) -> pd.DataFrame:
    rows: list[dict] = []
    failed = 0

    logger.info("Abriendo %s", pdf_path)
    with pdfplumber.open(pdf_path) as pdf:
        logger.info("Total páginas: %d", len(pdf.pages))
        for page_num, page in enumerate(pdf.pages, start=1):
            for line in (page.extract_text() or "").splitlines():
                clean = line.strip()
                if not clean or _is_header(clean):
                    continue
                m = EXCLUIDOS_ROW_RE.match(clean)
                if not m:
                    failed += 1
                    continue
                g = m.groupdict()
                rows.append({
                    "expediente": g["expediente"],
                    "nombre":     g["nombre"].strip(),
                    "dni_nie":    g["dni"],
                    "motivos":    g["motivos"].strip(),
                })
            logger.info("Página %d → %d filas acumuladas", page_num, len(rows))

    logger.info("Excluidos: %d filas válidas, %d líneas sin match", len(rows), failed)
    return pd.DataFrame(rows)


# ── Excluidos por presupuesto (preferentes) ────────────────────────────────────

# Format: expediente [nombre dni] motivo baremo
# Some rows omit nombre/dni when data is missing.
EXCLUIDOS_PRESUPUESTO_ROW_RE = re.compile(
    r"^(?P<expediente>10-PJS1-[\d.]+/2024)\s+"
    r"(?:(?P<nombre>.*?)\s+(?P<dni>\*+\d+\*+))?"  # no space required between dni and motivos
    r"(?P<motivos>\d+(?:\.\d+)?(?:\s*\|\s*\d+(?:\.\d+)?)*)\s+"
    r"(?P<baremo>[\d,]+)$"
)


def parse_excluidos_por_presupuesto(pdf_path: Path) -> pd.DataFrame:
    rows: list[dict] = []
    failed = 0

    logger.info("Abriendo %s", pdf_path)
    with pdfplumber.open(pdf_path) as pdf:
        logger.info("Total páginas: %d", len(pdf.pages))
        for page_num, page in enumerate(pdf.pages, start=1):
            for line in (page.extract_text() or "").splitlines():
                clean = line.strip()
                if not clean or _is_header(clean):
                    continue
                m = EXCLUIDOS_PRESUPUESTO_ROW_RE.match(clean)
                if not m:
                    failed += 1
                    continue
                g = m.groupdict()
                rows.append({
                    "expediente": g["expediente"],
                    "nombre":     g["nombre"].strip() if g["nombre"] else None,
                    "dni_nie":    g["dni"],
                    "motivos":    g["motivos"].strip(),
                })
            logger.info("Página %d → %d filas acumuladas", page_num, len(rows))

    logger.info("Excluidos por presupuesto: %d filas válidas, %d líneas sin match", len(rows), failed)
    return pd.DataFrame(rows)


# ── Main ───────────────────────────────────────────────────────────────────────

def main() -> None:
    df_ben = parse_beneficiarios(BENEFICIARIOS_PDF)
    df_ben["preferente"] = False

    df_pref = parse_beneficiarios_preferentes(BENEFICIARIOS_PREFERENTES_PDF)
    df_pref["preferente"] = True

    df_all = pd.concat([df_ben, df_pref], ignore_index=True)
    logger.info("Guardando %s (%d filas)", BENEFICIARIOS_CSV, len(df_all))
    df_all.to_csv(BENEFICIARIOS_CSV, index=False, encoding="utf-8-sig")

    df_exc = parse_excluidos(EXCLUIDOS_PDF)
    df_exc["preferente"] = False

    df_exc_pref = parse_excluidos(EXCLUIDOS_PREFERENTES_PDF)
    df_exc_pref["preferente"] = True

    df_exc_pref_presupuesto = parse_excluidos_por_presupuesto(EXCLUIDOS_PREFERENTES_PRESUPUESTO_PDF)
    df_exc_pref_presupuesto["preferente"] = True

    df_exc_all = pd.concat([df_exc, df_exc_pref, df_exc_pref_presupuesto], ignore_index=True)
    logger.info("Guardando %s (%d filas)", EXCLUIDOS_CSV, len(df_exc_all))
    df_exc_all.to_csv(EXCLUIDOS_CSV, index=False, encoding="utf-8-sig")

    logger.info("DONE ✅  Ejecuta classify.py para añadir la columna 'español'.")


if __name__ == "__main__":
    main()
