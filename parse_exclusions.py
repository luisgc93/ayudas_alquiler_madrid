import logging
import re
from pathlib import Path

import pandas as pd
import pdfplumber


PDF_PATH = Path("jovenes_excluidos_publicar.pdf")
CSV_PATH = Path("ayudas_alquiler_cam_2024_excluidos.csv")


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)


# EXPEDIENTE  NOMBRE  DNI/NIE  MOTIVOS
# DNI/NIE is masked: ***XXXX** or ****XXXX* (asterisks+digits+asterisks)
# MOTIVOS start immediately after the DNI/NIE (no separating space)
ROW_RE = re.compile(
    r"^(?P<expediente>10-PJS1-[\d.]+/2024)\s+"
    r"(?P<nombre>.*?)\s+"
    r"(?P<dni>\*+\d+\*+)"
    r"(?P<motivos>.*)$"
)

HEADER_WORDS = {"EXPEDIENTE", "NOMBRE", "DNI/NIE", "MOTIVOS", "EXCLUSIÓN",
                "Ayudas", "Alquiler", "Comunidad", "Madrid", "PROGRAMA",
                "JÓVENES", "EXCLUIDO", "DEFINITIVO"}


def is_header_line(line: str) -> bool:
    return any(word in line for word in HEADER_WORDS)


def extract_rows(pdf_path: Path) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    total_lines = 0
    matched_lines = 0
    failed_lines = 0

    logger.info("Abriendo PDF: %s", pdf_path)

    with pdfplumber.open(pdf_path) as pdf:
        logger.info("Total páginas: %d", len(pdf.pages))

        for page_num, page in enumerate(pdf.pages, start=1):
            text = page.extract_text() or ""
            lines = text.splitlines()

            logger.info("Procesando página %d (%d líneas)", page_num, len(lines))

            for line in lines:
                total_lines += 1
                clean_line = line.strip()

                if not clean_line or is_header_line(clean_line):
                    continue

                match = ROW_RE.match(clean_line)

                if not match:
                    failed_lines += 1
                    if failed_lines <= 10:
                        logger.debug("No match línea: %s", clean_line)
                    continue

                matched_lines += 1
                row = match.groupdict()
                rows.append(
                    {
                        "expediente": row["expediente"],
                        "nombre": row["nombre"].strip(),
                        "dni_nie": row["dni"],
                        "motivos": row["motivos"].strip(),
                    }
                )

            logger.info(
                "Página %d procesada → acumulado filas válidas: %d",
                page_num,
                len(rows),
            )

    logger.info("Resumen parsing:")
    logger.info(" - Líneas totales:  %d", total_lines)
    logger.info(" - Líneas válidas:  %d", matched_lines)
    logger.info(" - Líneas fallidas: %d", failed_lines)

    return rows


def load_spanish_names(csv_path: Path) -> set[str]:
    df = pd.read_csv(csv_path)
    return set(df["name"].str.strip().str.lower())


def is_likely_spanish_name(full_name: str, spanish_names: set[str]) -> bool:
    """
    Strict rule: ALL first names must be in the Spanish names dataset.
    """
    try:
        _, first_names_part = full_name.split(",", maxsplit=1)
    except ValueError:
        return False

    first_names = [
        name.strip().lower()
        for name in first_names_part.split()
        if name.strip()
    ]

    if not first_names:
        return False

    return all(name in spanish_names for name in first_names)


def main() -> None:
    logger.info("Inicio extracción exclusiones")

    rows = extract_rows(PDF_PATH)

    logger.info("Construyendo DataFrame (%d filas)", len(rows))
    df = pd.DataFrame(rows)

    if df.empty:
        logger.warning("El DataFrame está vacío. Algo ha fallado.")
        return

    logger.info("Cargando nombres españoles")
    spanish_names = load_spanish_names(Path("spanish_names.csv"))
    df["español"] = df["nombre"].apply(lambda n: is_likely_spanish_name(n, spanish_names))
    logger.info("Columna 'español' añadida (True: %d)", df["español"].sum())

    logger.info("Guardando CSV en: %s", CSV_PATH)
    df.to_csv(CSV_PATH, index=False, encoding="utf-8-sig")

    logger.info("DONE ✅ Filas exportadas: %d", len(df))


if __name__ == "__main__":
    main()
