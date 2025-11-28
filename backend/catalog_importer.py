import os
import json
from typing import Dict, List, Any

import pandas as pd

# Normalizes a catalog DataFrame into a list of canonical dicts
# mapping should be a dict of canonical_field -> column_name
# canonical fields we expect: csa_mm2, conductor, cores, armour, rated_current_air,
# r_ohm_per_km, x_ohm_per_km, od_mm, weight_kg_per_km, vendor, part_no

CANONICAL_KEYS = [
    "csa_mm2",
    "conductor",
    "cores",
    "armour",
    "rated_current_air",
    "r_ohm_per_km",
    "x_ohm_per_km",
    "od_mm",
    "weight_kg_per_km",
    "vendor",
    "part_no",
]

BASE_DIR = os.path.dirname(__file__)
CATALOG_DIR = os.path.join(BASE_DIR, "data", "catalogs")
os.makedirs(CATALOG_DIR, exist_ok=True)


def get_catalog_path(token: str) -> str:
    return os.path.join(CATALOG_DIR, f"catalog_{token}.json")


def get_catalog_excel_path(token: str) -> str:
    return os.path.join(CATALOG_DIR, f"catalog_{token}.xlsx")


def _to_float(val: Any) -> float:
    try:
        if pd.isna(val):
            return 0.0
        if isinstance(val, str):
            # strip units and commas
            v = val.replace("mm2", "").replace("mm", "").replace(",", "").strip()
            return float(v) if v != "" else 0.0
        return float(val)
    except Exception:
        return 0.0


def normalize_catalog(df: pd.DataFrame, mapping: Dict[str, str]) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    for _, row in df.fillna("\n").iterrows():
        entry: Dict[str, Any] = {}
        for key in CANONICAL_KEYS:
            col = mapping.get(key)
            val = None
            if col and col in df.columns:
                val = row[col]
            # map and coerce
            if key == "csa_mm2":
                entry["csa_mm2"] = _to_float(val)
            elif key in ("r_ohm_per_km", "x_ohm_per_km", "rated_current_air", "od_mm", "weight_kg_per_km"):
                entry[key] = _to_float(val)
            elif key == "cores":
                try:
                    entry["cores"] = int(val) if val != "" else 0
                except Exception:
                    entry["cores"] = 0
            else:
                entry[key] = str(val).strip() if val is not None else ""
        out.append(entry)
    return out


def read_excel_headers_sample(path: str) -> Dict[str, Any]:
    df = pd.read_excel(path, engine="openpyxl")
    headers = [str(c) for c in df.columns.tolist()]
    sample = df.head(10).fillna("").to_dict(orient="records")
    return {"headers": headers, "sample": sample}


def load_catalog(token: str) -> List[Dict[str, Any]]:
    path = get_catalog_path(token)
    if not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)
