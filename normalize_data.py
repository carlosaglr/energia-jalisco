#!/usr/bin/env python3
"""
normalize_data.py — Post-processor para JSON generados por parse_markdown.py

Aplica dos fixes:

1. Normaliza el campo `tipo` en src/data/debilidades.json a las 9 categorías
   canónicas definidas en el widget aprobado:
     - Vacío
     - Omisión
     - Desactualización
     - Omisión de implementación
     - Vacío estructural
     - Conflicto / Restricción
     - Restricción excesiva
     - Conflicto potencial
     - Vacío / Omisión combinado

2. Agrega el campo `nombre` (objeto {prefix, core, suffix}) en
   src/data/ordenamiento-meta.json, derivándolo de `nombre_display`.
   Esto cumple la spec del ARCHITECTURE.md y elimina la necesidad
   del fallback defensivo del Explorer.

El script es IDEMPOTENTE: correrlo N veces produce el mismo resultado.
Uso:
    python3 normalize_data.py
"""

import json
import sys
from pathlib import Path


# Ruta de los JSON, relativa al directorio de ejecución.
DATA = Path("src/data")


# ---------------------------------------------------------------------------
# Fix 1 — Normalización de tipos
# ---------------------------------------------------------------------------

# Mapeo de valores raw (los 16 que salen del parser) a los 9 canónicos.
# Decisiones aprobadas por el usuario en el chat de Fase 3.
TIPO_CANONICAL_MAP = {
    # Directos (ya canónicos, el mapa los pasa tal cual).
    "Vacío": "Vacío",
    "Omisión": "Omisión",
    "Desactualización": "Desactualización",
    "Omisión de implementación": "Omisión de implementación",
    "Vacío estructural": "Vacío estructural",
    "Conflicto / Restricción": "Conflicto / Restricción",
    "Restricción excesiva": "Restricción excesiva",
    "Conflicto potencial": "Conflicto potencial",
    "Vacío / Omisión combinado": "Vacío / Omisión combinado",

    # Variantes que hay que colapsar.
    "Vacío / Omisión": "Vacío / Omisión combinado",
    "Omisión / Desactualización": "Omisión",
    "Vacío / Omisión de implementación": "Omisión de implementación",
    "Vacío / Desactualización": "Desactualización",
    "Desactualización / Conflicto": "Conflicto potencial",
    "Desactualización / Vacío": "Desactualización",
    "Omisión estructural": "Vacío estructural",
    "Vacío estructural (fragmentación)": "Vacío estructural",
    "Omisión / saneamiento": "Omisión",
}

CANONICAL_TIPOS = sorted(set(TIPO_CANONICAL_MAP.values()))


def normalize_debilidades(path: Path) -> None:
    if not path.exists():
        print(f"  ✗ {path} no existe; saltando.")
        return

    data = json.loads(path.read_text(encoding="utf-8"))
    changes: dict[str, int] = {}
    unknowns: list[tuple[str, str]] = []

    for item in data:
        raw = item.get("tipo", "")
        if raw in TIPO_CANONICAL_MAP:
            new = TIPO_CANONICAL_MAP[raw]
            if new != raw:
                changes[raw] = changes.get(raw, 0) + 1
            item["tipo"] = new
        else:
            unknowns.append((item.get("id", "?"), raw))

    path.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    print(f"  ✓ {path.name}: {len(data)} items procesados")
    if changes:
        total = sum(changes.values())
        print(f"    {total} items renombrados:")
        for raw, n in sorted(changes.items(), key=lambda x: -x[1]):
            print(f"      {n}× \"{raw}\" → \"{TIPO_CANONICAL_MAP[raw]}\"")
    else:
        print("    (ningún cambio necesario — ya estaba normalizado)")

    if unknowns:
        print(f"  ⚠ {len(unknowns)} items con tipo NO mapeado (revisar):")
        for id_, raw in unknowns:
            print(f"      {id_}: \"{raw}\"")


# ---------------------------------------------------------------------------
# Fix 2 — Agregar campo `nombre` a ordenamiento-meta
# ---------------------------------------------------------------------------

def add_nombre_field(path: Path) -> None:
    if not path.exists():
        print(f"  ✗ {path} no existe; saltando.")
        return

    data = json.loads(path.read_text(encoding="utf-8"))
    added = 0
    skipped_exists = 0
    skipped_no_display = 0

    for tag, entry in data.items():
        if "nombre" in entry and isinstance(entry["nombre"], dict):
            skipped_exists += 1
            continue

        nd = entry.get("nombre_display")
        if not isinstance(nd, dict):
            skipped_no_display += 1
            print(f"    ⚠ {tag}: sin nombre_display válido, no se puede derivar")
            continue

        entry["nombre"] = {
            "prefix": nd.get("prefix_italic", "") or "",
            "core": nd.get("core_bold_italic", "") or "",
            "suffix": nd.get("suffix_italic_small", "") or "",
        }
        added += 1

    path.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    print(f"  ✓ {path.name}: {len(data)} entradas procesadas")
    if added:
        print(f"    {added} entradas con campo 'nombre' agregado")
    if skipped_exists:
        print(f"    {skipped_exists} entradas ya tenían 'nombre' (sin cambios)")
    if skipped_no_display:
        print(f"    {skipped_no_display} entradas sin nombre_display (no se derivaron)")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> int:
    if not DATA.exists():
        print(f"ERROR: no existe {DATA} relativo al directorio actual.")
        print("Corré el script desde la raíz del repo (energia-jalisco/).")
        return 1

    print("================================================")
    print(" Normalizando JSON generados por parse_markdown  ")
    print("================================================")
    print()

    print("Fix 1 — Normalización de tipos en debilidades.json")
    normalize_debilidades(DATA / "debilidades.json")
    print()

    print("Fix 2 — Agregar campo 'nombre' en ordenamiento-meta.json")
    add_nombre_field(DATA / "ordenamiento-meta.json")
    print()

    print("------------------------------------------------")
    print("Listo. Recargá la pestaña del navegador para ver")
    print("los cambios reflejados en el Explorer.")
    print("------------------------------------------------")
    return 0


if __name__ == "__main__":
    sys.exit(main())
