# Ayudas al Alquiler CAM 2024 — Análisis de datos

Análisis de la lista definitiva de beneficiarios y excluidos de la convocatoria de ayudas al alquiler para jóvenes de la Comunidad de Madrid (2024).

El sitio interactivo está publicado en: **https://luisgc93.github.io/ayudas_alquiler_madrid/**

> **Fuente:** [Ayudas al alquiler de vivienda para jóvenes (CAM)](https://sede.comunidad.madrid/ayudas-becas-subvenciones/ayudas-alquiler-vivienda-jovenes)
---

## Metodología

La clasificación de origen se basa en comparar los nombres de pila de cada solicitante contra un dataset de nombres españoles (`spanish_names.csv`). Un solicitante se considera de nombre probable español cuando **todos** sus nombres de pila aparecen en el dataset. Es una heurística conservadora; los falsos negativos (nombres españoles no reconocidos) son posibles.

---

## Scripts

| Script | Descripción |
|---|---|
| `parse_pdfs.py` | Extrae los datos de los PDFs originales y genera `beneficiarios.csv` y `excluidos.csv` |
| `classify.py` | Aplica la clasificación por nacionalidad, genera `*_por_nacionalidades.csv` y reconstruye los datos del frontend (`frontend/public/*.json`) |

### Parsear los PDFs (sólo necesario si cambian los PDFs originales)

```bash
uv run python parse_pdfs.py
```

### Recalcular la clasificación (tras actualizar `spanish_names.csv`)

```bash
uv run python classify.py
```

---

## Estructura de ficheros

```
datos_originales/
  beneficiarios.pdf          # Resolución definitiva de admitidos
  excluidos.pdf              # Resolución definitiva de excluidos
  motivos_de_exclusion.pdf   # Códigos y descripción de motivos de exclusión

beneficiarios.csv                        # Datos en bruto extraídos del PDF de admitidos
excluidos.csv                            # Datos en bruto extraídos del PDF de excluidos
beneficiarios_por_nacionalidades.csv     # Admitidos con columna 'español'
excluidos_por_nacionalidades.csv         # Excluidos con columna 'español'
spanish_names.csv                        # Dataset de nombres españoles para la clasificación
exclusion_codes.md                       # Descripción de los códigos de motivos de exclusión

frontend/                  # Aplicación React (desplegada en GitHub Pages)
  public/
    data.json              # Datos agregados para los gráficos
    admitidos.json         # Tabla completa de admitidos
    excluidos.json         # Tabla completa de excluidos
```

---

## Instalación

El proyecto usa [uv](https://github.com/astral-sh/uv) para gestionar el entorno.

```bash
# Instalar uv (si no lo tienes)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Instalar dependencias
uv sync
```

---

## Dependencias

| Paquete | Versión mínima | Uso |
|---|---|---|
| `pdfplumber` | 0.11.9 | Extracción de texto del PDF |
| `pandas` | 3.0.2 | Procesamiento de datos |
