# Datasets para TriageIA

Hay dos fuentes de datos disponibles para sembrar la base de datos:

| Dataset | Tamaño | Tipo | Cobertura CTAS |
|---------|--------|------|----------------|
| **Sintético** (`synthetic_*`) | 2 000 filas | Generado | Distribución artificial, cubre I–V por construcción. |
| **Yale** (`yale_*`) | 10 000 filas (de 374 830 válidas) | **Real** (Kaggle) | Distribución realista de urgencias (mayoría IV–V). |

## Archivos

| Archivo | Origen | Propósito |
|---------|--------|-----------|
| `synthetic_patients.csv` | generador local | 2 000 pacientes sintéticos. |
| `synthetic_patients.mapping.json` | — | Mapeo para `seedDataset.mjs`. |
| `synthetic_seed.sql` | — | INSERT listo para Supabase. |
| `yale_triage.csv` | dataset Yale (Kaggle) | 10 000 pacientes reales de-identificados extraídos. |
| `yale_triage.mapping.json` | — | Mapeo para `seedDataset.mjs`. |
| `yale_seed.sql` | — | INSERT listo para Supabase con datos reales. |
| `example.dataset.mapping.json` | — | Plantilla genérica para otros CSV. |
| `sample_synthetic_test.csv` | — | CSV mínimo de humo. |
| `raw/` | — | Datasets descargados (en `.gitignore`). |

## Flujo "Yale" (datos reales)

Origen: [`maalona/hospital-triage-and-patient-history-data`](https://www.kaggle.com/datasets/maalona/hospital-triage-and-patient-history-data),
re-publicación del dataset del paper *"Predicting hospital admission at emergency
department triage using machine learning"* (Hong et al., Yale, 2018). 560 486
visitas reales de un servicio de urgencias, de-identificadas (HIPAA).

### Requisitos

1. Cuenta Kaggle + **API token** generado en `Settings → API → Create New Token`.
   Pegar `KAGGLE_USERNAME` y `KAGGLE_KEY` en `.env` (ver `.env.example`).
2. Aceptar los términos del dataset una vez en Kaggle (clic manual obligatorio).
3. Python 3.10+ con `pyreadr` (`pip install pyreadr`).

### Reproducir desde cero

```powershell
# 1) Descargar (~95 MB) – se necesita kaggle CLI: pip install kaggle
$env:Path = "C:\Users\Soporte\AppData\Roaming\Python\Python313\Scripts;$env:Path"
kaggle datasets download -d maalona/hospital-triage-and-patient-history-data -p data\raw --unzip

# 2) Extraer las columnas relevantes a CSV (~2 min, lee .RData)
npm run data:yale-extract

# 3) Generar SQL con triage CTAS calculado por la app
npm run data:yale-sql
```

### Columnas extraídas

Del original (972 columnas) sólo se conservan las útiles para TriageIA:

- `Age`, `Gender`, `ESI` (referencia, 1–5).
- `Symptom` (chief complaint humanizado a partir de las 200 columnas `cc_*`).
- `Body Temperature (Celsius)` — el dataset trae °F, se convierte automáticamente.
- `Heart Rate (bpm)`, `Oxygen Saturation (%)`, `Respiratory Rate`,
  `Systolic BP`, `Diastolic BP`.

Pain (EVA 0–10) **no está** en este dataset; la columna queda vacía y el seed la
deja en `NULL`.

### Distribución CTAS del seed actual (10 000 filas, seed=42)

| Nivel | Pacientes | % |
|-------|-----------|----|
| I     | 49        | 0,5 % |
| II    | 234       | 2,3 % |
| III   | 237       | 2,4 % |
| IV    | 1 405     | 14,0 % |
| V     | 8 075     | 80,7 % |

Este perfil refleja un servicio real: la mayoría de pacientes llega con vitales
casi normales en triage. Si quieres más casos críticos para probar UI/alarmas,
mezcla el seed sintético (`synthetic_seed.sql`) con éste.

## Flujo "Sintético"

Útil para tests automáticos, demos rápidas y QA visual: distribución
artificialmente equilibrada para cubrir todos los flujos UI sin descargar nada.

```bash
npm run data:generate    # regenera CSV con seed=42
npm run data:seed-sql    # CSV → SQL
```

Ver detalles arriba en la sección de archivos.

## Cargar en Supabase

1. Ejecuta `docs/supabase-schema.sql` en el proyecto (una sola vez).
2. **SQL Editor → New query** y pega el contenido de `data/yale_seed.sql` o
   `data/synthetic_seed.sql`.
3. **Run**. Las filas quedan en `public.patients` con triage CTAS calculado por
   `src/utils/triage.js`.

### Inserción desde Node (alternativa)

Requiere `SUPABASE_SERVICE_ROLE_KEY` en `.env`. **Nunca** usar esa clave en el
frontend.

```bash
node scripts/seedDataset.mjs \
  --csv data/yale_triage.csv \
  --mapping data/yale_triage.mapping.json \
  --insert-supabase --batch 100
```

## Privacidad y licencias

- El dataset Yale es **de-identificado** (HIPAA). Aún así, no commitees `data/raw/`
  ni el CSV/SQL derivado si tu repo es público: están ignorados por `.gitignore`
  (`data/raw/`, `*.rdata`, `*.RData`). El SQL/CSV procesados sí se commitean si
  los necesitas, pero revisa la licencia del dataset en Kaggle antes.
- El dataset sintético es enteramente generado localmente y no tiene
  restricciones.
