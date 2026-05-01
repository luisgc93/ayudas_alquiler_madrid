# Ayudas al Alquiler CAM 2024 — Análisis de datos

Análisis de la lista definitiva de beneficiarios y excluidos de la convocatoria de ayudas al alquiler para jóvenes de la Comunidad de Madrid (2024), regulada por el [Real Decreto 42/2022](https://www.boe.es/buscar/act.php?id=BOE-A-2022-802).

El sitio interactivo está publicado en: **https://luisgc93.github.io/ayudas_alquiler_madrid/**

> **Fuente:** [Ayudas al alquiler de vivienda para jóvenes (CAM)](https://sede.comunidad.madrid/ayudas-becas-subvenciones/ayudas-alquiler-vivienda-jovenes)

---

## Por qué este análisis

El origen es un factor social que determina parcialmente nuestra cultura, opiniones y forma de ver el mundo. Es por tanto un factor digno de estudio a tener en cuenta en cualquier análisis social como lo puede ser el de las ayudas del estado.

Un análisis transparente protege a la ciudadanía de discursos del odio, afirmaciones infundadas u opacas, y en definitiva contribuye a una discusión política más honesta.

---

## Metodología

La clasificación de origen combina dos criterios independientes:

| Criterio | Columna | Lógica |
|---|---|---|
| **Nombre** | `nombre_español` | Todos los nombres de pila del solicitante aparecen en `spanish_names.csv` |
| **NIF/NIE** | `nif_español` | El documento tiene estructura de NIF de nacional español: `***NNNN**` (vs NIE de residente: `****NNNN*`) |

Un solicitante se clasifica como **español** (`español = True`) cuando **ambos** criterios se cumplen. La UI permite filtrar por cada criterio por separado.

Ambas son heurísticas; los falsos negativos son posibles (p. ej. nombres españoles no incluidos en el dataset, o solicitantes con NIE que han adquirido la nacionalidad).

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
  beneficiarios.pdf                        # Resolución definitiva de admitidos (convocatoria general)
  beneficiarios_preferentes.pdf            # Resolución definitiva de admitidos (sectores preferentes)
  excluidos.pdf                            # Resolución definitiva de excluidos (convocatoria general)
  excluidos_preferentes.pdf                # Resolución definitiva de excluidos (sectores preferentes)
  excluidos_preferentes_por_presupuesto.pdf# Excluidos preferentes por agotamiento de presupuesto
  motivos_de_exclusion.pdf                 # Códigos y descripción de motivos de exclusión

beneficiarios.csv                        # Datos en bruto de admitidos (general + preferentes, columna 'preferente')
excluidos.csv                            # Datos en bruto de excluidos (general + preferentes, columna 'preferente')
beneficiarios_por_nacionalidades.csv     # Admitidos con columnas 'nombre_español', 'nif_español', 'español'
excluidos_por_nacionalidades.csv         # Excluidos con columnas 'nombre_español', 'nif_español', 'español'
spanish_names.csv                        # Dataset de nombres españoles para la clasificación
exclusion_codes.md                       # Descripción de los códigos de motivos de exclusión

frontend/                  # Aplicación React (desplegada en GitHub Pages)
  public/
    data.json              # Datos agregados para los gráficos
    admitidos.json         # Tabla completa de admitidos (con campo 'preferente')
    excluidos.json         # Tabla completa de excluidos (con campo 'preferente')
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
