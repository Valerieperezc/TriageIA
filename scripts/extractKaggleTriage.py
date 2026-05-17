"""Extrae columnas relevantes del dataset de Yale (Kaggle: maalona/hospital-triage-and-patient-history-data).

Lee `data/raw/5v_cleandf.rdata`, normaliza unidades, filtra filas inválidas y
exporta un CSV listo para alimentar `scripts/seedDataset.mjs`. Implementación
vectorizada con pandas: procesa las 560k filas en pocos segundos.

Uso:
    python scripts/extractKaggleTriage.py --inspect
    python scripts/extractKaggleTriage.py --out data/yale_triage.csv --limit 10000 --seed 42
"""

import argparse
import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import pyreadr  # type: ignore[import-untyped]

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_RDATA = ROOT / "data" / "raw" / "5v_cleandf.rdata"
DEFAULT_OUT = ROOT / "data" / "yale_triage.csv"

CANDIDATE_COLUMNS = {
    "age": ["age"],
    "gender": ["gender", "sex"],
    "esi": ["esi"],
    "hr": ["triage_vital_hr", "vitals_hr", "hr"],
    "rr": ["triage_vital_rr", "vitals_rr", "rr"],
    "temp_f": ["triage_vital_temp", "vitals_temp", "temp"],
    "spo2": ["triage_vital_o2", "vitals_o2", "o2sat", "spo2"],
    "sbp": ["triage_vital_sbp", "vitals_sbp", "sbp"],
    "dbp": ["triage_vital_dbp", "vitals_dbp", "dbp"],
    "pain": ["triage_vital_pain", "pain", "painscore"],
}

CC_REPLACEMENTS = [
    ("shortnessofbreath", "shortness of breath"),
    ("chestpain", "chest pain"),
    ("abdominalpain", "abdominal pain"),
    ("backpain", "back pain"),
    ("sorethroat", "sore throat"),
    ("urinarytractinfection", "urinary tract infection"),
    ("rapidheartrate", "rapid heart rate"),
    ("respiratorydistress", "respiratory distress"),
    ("alteredmentalstatus", "altered mental status"),
    ("highbloodpressure", "high blood pressure"),
    ("rectalbleeding", "rectal bleeding"),
    ("rectalpain", "rectal pain"),
    ("vaginalbleeding", "vaginal bleeding"),
    ("vaginaldischarge", "vaginal discharge"),
    ("vaginalpain", "vaginal pain"),
    ("flankpain", "flank pain"),
    ("hippain", "hip pain"),
    ("kneepain", "knee pain"),
    ("kneeinjury", "knee injury"),
    ("anklepain", "ankle pain"),
    ("ankleinjury", "ankle injury"),
    ("wristpain", "wrist pain"),
    ("wristinjury", "wrist injury"),
    ("toepain", "toe pain"),
    ("toeinjury", "toe injury"),
    ("oralswelling", "oral swelling"),
    ("rapidheartrate", "rapid heart rate"),
    ("ribpain", "rib pain"),
    ("ribinjury", "rib injury"),
    ("shoulderpain", "shoulder pain"),
    ("shoulderinjury", "shoulder injury"),
]


def humanize_cc(col: str) -> str:
    raw = col[3:] if col.lower().startswith("cc_") else col
    raw = raw.replace("-", " ").replace("_", " ").lower()
    for src, dst in CC_REPLACEMENTS:
        raw = raw.replace(src, dst)
    s = " ".join(raw.split())
    return s[:1].upper() + s[1:] if s else ""


def pick_columns(df_columns) -> dict[str, str | None]:
    cols_lower = {c.lower(): c for c in df_columns}
    return {
        logical: next(
            (cols_lower[c] for c in candidates if c in cols_lower), None
        )
        for logical, candidates in CANDIDATE_COLUMNS.items()
    }


def normalize_gender(series: pd.Series) -> pd.Series:
    if series is None:
        return pd.Series([], dtype=str)
    s = series.astype(str).str.strip().str.lower()
    out = pd.Series([""] * len(s), index=s.index, dtype=str)
    out[s.isin(["m", "male", "hombre"])] = "Male"
    out[s.isin(["f", "female", "mujer"])] = "Female"
    return out


def temperature_in_celsius(series: pd.Series) -> pd.Series:
    """Devuelve °C; °F asume valores en [80, 110]; °C en [30, 45]; otros NaN."""
    f = pd.to_numeric(series, errors="coerce")
    is_f = (f >= 80) & (f <= 110)
    is_c = (f >= 30) & (f <= 45)
    c = pd.Series(np.nan, index=f.index, dtype="float64")
    c[is_f] = (f[is_f] - 32.0) * 5.0 / 9.0
    c[is_c] = f[is_c]
    return c.round(1)


def inspect(rdata_path: Path) -> None:
    print(f"Leyendo {rdata_path} ...", file=sys.stderr)
    result = pyreadr.read_r(str(rdata_path))
    for name, df in result.items():
        print(f"\n=== Objeto: {name} ===")
        print(f"Filas: {len(df):,} | Columnas: {df.shape[1]:,}")
        print("\nColumnas relevantes detectadas:")
        for logical, hit in pick_columns(df.columns).items():
            print(f"  - {logical:14s} -> {hit}")
        cc = [c for c in df.columns if c.lower().startswith("cc_")]
        print(f"\nColumnas cc_*: {len(cc)} (ej.: {cc[:8]})")


def extract(args: argparse.Namespace) -> None:
    rdata_path = Path(args.rdata)
    out_path = Path(args.out)
    print(f"Leyendo {rdata_path} ...", file=sys.stderr)
    result = pyreadr.read_r(str(rdata_path))
    if not result:
        raise SystemExit("El archivo no contiene objetos R legibles.")
    name, df = next(iter(result.items()))
    print(f"Objeto: {name} | filas={len(df):,}", file=sys.stderr)

    mapping = pick_columns(df.columns)
    cc_cols = [c for c in df.columns if c.lower().startswith("cc_")]
    print(
        f"Mapping: {mapping} | cc_*: {len(cc_cols)}",
        file=sys.stderr,
    )

    required = ["age", "hr", "temp_f"]
    missing = [k for k in required if mapping.get(k) is None]
    if missing:
        raise SystemExit(
            f"Faltan columnas obligatorias en el dataset: {missing}."
        )

    age = pd.to_numeric(df[mapping["age"]], errors="coerce")
    hr = pd.to_numeric(df[mapping["hr"]], errors="coerce")
    temp_c = temperature_in_celsius(df[mapping["temp_f"]])
    spo2 = (
        pd.to_numeric(df[mapping["spo2"]], errors="coerce")
        if mapping.get("spo2")
        else pd.Series(np.nan, index=df.index)
    )
    rr = (
        pd.to_numeric(df[mapping["rr"]], errors="coerce")
        if mapping.get("rr")
        else pd.Series(np.nan, index=df.index)
    )
    sbp = (
        pd.to_numeric(df[mapping["sbp"]], errors="coerce")
        if mapping.get("sbp")
        else pd.Series(np.nan, index=df.index)
    )
    dbp = (
        pd.to_numeric(df[mapping["dbp"]], errors="coerce")
        if mapping.get("dbp")
        else pd.Series(np.nan, index=df.index)
    )
    esi = (
        pd.to_numeric(df[mapping["esi"]], errors="coerce")
        if mapping.get("esi")
        else pd.Series(np.nan, index=df.index)
    )
    pain = (
        pd.to_numeric(df[mapping["pain"]], errors="coerce")
        if mapping.get("pain")
        else pd.Series(np.nan, index=df.index)
    )
    gender = (
        normalize_gender(df[mapping["gender"]])
        if mapping.get("gender")
        else pd.Series([""] * len(df), index=df.index, dtype=str)
    )

    cc_matrix = df[cc_cols].apply(pd.to_numeric, errors="coerce").fillna(0)
    cc_mask = cc_matrix >= 0.5
    cc_count = cc_mask.sum(axis=1)
    cc_first = cc_mask.idxmax(axis=1).where(cc_count > 0, "")

    valid = (
        age.between(0, 130)
        & age.notna()
        & hr.between(25, 250)
        & hr.notna()
        & temp_c.between(30, 45)
        & temp_c.notna()
        & (cc_count > 0)
    )
    print(
        f"Filas válidas: {int(valid.sum()):,} de {len(df):,}",
        file=sys.stderr,
    )

    keep = df.index[valid]
    if len(keep) == 0:
        raise SystemExit("Sin filas válidas tras filtros.")

    rng = np.random.default_rng(args.seed)
    n = min(args.limit, len(keep))
    sampled = rng.choice(keep.values, size=n, replace=False)
    sampled.sort()

    symptoms = cc_first.loc[sampled].apply(humanize_cc)

    spo2_int = spo2.where(spo2.between(50, 100)).round().astype("Int64")
    pain_int = pain.where(pain.between(0, 10)).round().astype("Int64")
    rr_int = rr.where(rr.between(5, 60)).round().astype("Int64")
    sbp_int = sbp.where(sbp.between(40, 250)).round().astype("Int64")
    dbp_int = dbp.where(dbp.between(20, 200)).round().astype("Int64")
    esi_int = esi.where(esi.between(1, 5)).round().astype("Int64")

    out_df = pd.DataFrame(
        {
            "Age": age.loc[sampled].round().astype("Int64"),
            "Gender": gender.loc[sampled],
            "Symptom": symptoms.values,
            "Body Temperature (Celsius)": temp_c.loc[sampled],
            "Heart Rate (bpm)": hr.loc[sampled].round().astype("Int64"),
            "Oxygen Saturation (%)": spo2_int.loc[sampled],
            "Pain (0-10)": pain_int.loc[sampled],
            "Respiratory Rate": rr_int.loc[sampled],
            "Systolic BP": sbp_int.loc[sampled],
            "Diastolic BP": dbp_int.loc[sampled],
            "ESI": esi_int.loc[sampled],
        }
    )

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_df.to_csv(out_path, index=False)

    summary = {
        "out": str(out_path),
        "rows_written": int(len(out_df)),
        "valid_total": int(valid.sum()),
        "limit": args.limit,
        "seed": args.seed,
    }
    print(json.dumps(summary, indent=2), file=sys.stderr)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--rdata", default=str(DEFAULT_RDATA))
    parser.add_argument("--out", default=str(DEFAULT_OUT))
    parser.add_argument("--limit", type=int, default=10000)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--inspect", action="store_true")
    args = parser.parse_args()
    if args.inspect:
        inspect(Path(args.rdata))
        return
    extract(args)


if __name__ == "__main__":
    main()
