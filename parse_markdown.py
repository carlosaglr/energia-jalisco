#!/usr/bin/env python3
"""
Fase 1 — Parser de marco_federal_energetico.md y sintesis_ejecutiva_jalisco.md.

Produce los JSON definidos en la Sección 4 del ARCHITECTURE.md:
  src/data/
    debilidades.json          (1A, 80)
    condicionamientos.json    (1B, 34)
    reformas.json             (§2, 101)
    proyectos-3a.json         (3A, 84)
    proyectos-3b.json         (3B, 50)
    proyectos-3c.json         (3C, 15)
    habilitaciones.json       (3D, 58)
    conflictos.json           (4A, 40)
    vacios.json               (4B, 62)
    huecos.json               (§5, agrupado)
    proximos-pasos.json       (§6, 30)
    ordenamientos.json        (metadata de los 20 bloques)
    ordenamiento-meta.json    (mapa tag -> display formatting)
    cross-references.json     (grafo precalculado)
    bloques/<slug>.json       (20 archivos, contenido completo de cada bloque)

Defaults aplicados (documentados):
  1. Archivo del marco federal normalizado en disco previamente.
  2. tramo_ruta_critica: int 1-7 si la reforma aparece listada en alguna cadena
     de §2 "Ruta crítica de reformas"; null si la reforma es independiente
     (no figura en ninguna cadena). Campo adicional es_independiente: bool
     para facilitar la visualización "reformas independientes" debajo de los
     7 tramos en la página /sintesis/reformas.
  3. reformas_requeridas: lista plana de R-NN extraída. Las dependencias
     "(depende de R-NN)" van a campo reformas_dependencias.
  4. habilitaciones: estado enum + proyectos_vinculados lista + estado_glosa
     con el texto libre original.
  5. R-101: override documentado. La fuente no menciona ordenamiento explícito
     ("No aplica a nivel estatal sin reforma federal previa"), pero el
     ordenamiento que habría que reformar es la CPEUM. Ficha llevará banner
     visual indicando su carácter no-controlable desde Jalisco.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

# -----------------------------------------------------------------------------
# Paths
# -----------------------------------------------------------------------------

BASE = Path(__file__).resolve().parent.parent
MARCO = BASE / "marco_federal_energetico.md"
SINTESIS = BASE / "sintesis_ejecutiva_jalisco.md"
DATA = BASE / "src" / "data"
BLOQUES = DATA / "bloques"
DATA.mkdir(parents=True, exist_ok=True)
BLOQUES.mkdir(parents=True, exist_ok=True)

# -----------------------------------------------------------------------------
# Metadata de ordenamientos (tag, slug, ambito, nombre display)
# Derivada directamente de los títulos H2 del marco_federal_energetico.md.
# -----------------------------------------------------------------------------

ORDENAMIENTO_META = {
    "CPEUM": {
        "tag": "CPEUM", "slug": "cpeum", "ambito": "federal",
        "nombre_completo": "Constitución Política de los Estados Unidos Mexicanos",
        "nombre_display": {
            "prefix_italic": "",
            "core_bold_italic": "Constitución",
            "suffix_italic_small": " Política de los Estados Unidos Mexicanos",
        },
    },
    "LBio": {
        "tag": "LBio", "slug": "lbio", "ambito": "federal",
        "nombre_completo": "Ley de Biocombustibles",
        "nombre_display": {
            "prefix_italic": "Ley de ",
            "core_bold_italic": "Biocombustibles",
            "suffix_italic_small": "",
        },
    },
    "LCNE": {
        "tag": "LCNE", "slug": "lcne", "ambito": "federal",
        "nombre_completo": "Ley de la Comisión Nacional de Energía",
        "nombre_display": {
            "prefix_italic": "Ley de la ",
            "core_bold_italic": "Comisión Nacional de Energía",
            "suffix_italic_small": "",
        },
    },
    "LEPECFE": {
        "tag": "LEPECFE", "slug": "lepecfe", "ambito": "federal",
        "nombre_completo": "Ley de la Empresa Pública del Estado, Comisión Federal de Electricidad",
        "nombre_display": {
            "prefix_italic": "Ley de la Empresa Pública del Estado, ",
            "core_bold_italic": "Comisión Federal de Electricidad",
            "suffix_italic_small": "",
        },
    },
    "LGCC": {
        "tag": "LGCC", "slug": "lgcc", "ambito": "federal",
        "nombre_completo": "Ley General de Cambio Climático",
        "nombre_display": {
            "prefix_italic": "Ley General de ",
            "core_bold_italic": "Cambio Climático",
            "suffix_italic_small": "",
        },
    },
    "LGeo": {
        "tag": "LGeo", "slug": "lgeo", "ambito": "federal",
        "nombre_completo": "Ley de Geotermia",
        "nombre_display": {
            "prefix_italic": "Ley de ",
            "core_bold_italic": "Geotermia",
            "suffix_italic_small": "",
        },
    },
    "LPTE": {
        "tag": "LPTE", "slug": "lpte", "ambito": "federal",
        "nombre_completo": "Ley de Planeación y Transición Energética",
        "nombre_display": {
            "prefix_italic": "Ley de ",
            "core_bold_italic": "Planeación y Transición Energética",
            "suffix_italic_small": "",
        },
    },
    "LSE": {
        "tag": "LSE", "slug": "lse", "ambito": "federal",
        "nombre_completo": "Ley del Sector Eléctrico",
        "nombre_display": {
            "prefix_italic": "Ley del ",
            "core_bold_italic": "Sector Eléctrico",
            "suffix_italic_small": "",
        },
    },
    "LSH": {
        "tag": "LSH", "slug": "lsh", "ambito": "federal",
        "nombre_completo": "Ley del Sector Hidrocarburos",
        "nombre_display": {
            "prefix_italic": "Ley del ",
            "core_bold_italic": "Sector Hidrocarburos",
            "suffix_italic_small": "",
        },
    },
    "CPEJ": {
        "tag": "CPEJ", "slug": "cpej", "ambito": "estatal",
        "nombre_completo": "Constitución Política del Estado de Jalisco",
        "nombre_display": {
            "prefix_italic": "",
            "core_bold_italic": "Constitución",
            "suffix_italic_small": " Política del Estado de Jalisco",
        },
    },
    "LACCEJ": {
        "tag": "LACCEJ", "slug": "laccej", "ambito": "estatal",
        "nombre_completo": "Ley para la Acción ante el Cambio Climático del Estado de Jalisco",
        "nombre_display": {
            "prefix_italic": "Ley para la Acción ante el ",
            "core_bold_italic": "Cambio Climático",
            "suffix_italic_small": " del Estado de Jalisco",
        },
    },
    "LOAEEJ": {
        "tag": "LOAEEJ", "slug": "loaeej", "ambito": "estatal",
        "nombre_completo": "Ley Orgánica de la Agencia de Energía del Estado de Jalisco",
        "nombre_display": {
            "prefix_italic": "Ley Orgánica de la ",
            "core_bold_italic": "Agencia de Energía",
            "suffix_italic_small": " del Estado de Jalisco",
        },
    },
    "LAEJ": {
        "tag": "LAEJ", "slug": "laej", "ambito": "estatal",
        "nombre_completo": "Ley Agroalimentaria del Estado de Jalisco",
        "nombre_display": {
            "prefix_italic": "Ley ",
            "core_bold_italic": "Agroalimentaria",
            "suffix_italic_small": " del Estado de Jalisco",
        },
    },
    "LPIPSEJM": {
        "tag": "LPIPSEJM", "slug": "lpipsejm", "ambito": "estatal",
        "nombre_completo": "Ley de Proyectos de Inversión y de Prestación de Servicios del Estado de Jalisco y sus Municipios",
        "nombre_display": {
            "prefix_italic": "Ley de ",
            "core_bold_italic": "Proyectos de Inversión y de Prestación de Servicios",
            "suffix_italic_small": " del Estado de Jalisco y sus Municipios",
        },
    },
    "LGAPM": {
        "tag": "LGAPM", "slug": "lgapm", "ambito": "estatal",
        "nombre_completo": "Ley del Gobierno y la Administración Pública Municipal del Estado de Jalisco",
        "nombre_display": {
            "prefix_italic": "Ley del ",
            "core_bold_italic": "Gobierno y la Administración Pública Municipal",
            "suffix_italic_small": " del Estado de Jalisco",
        },
    },
    "LPAEJ": {
        "tag": "LPAEJ", "slug": "lpaej", "ambito": "estatal",
        "nombre_completo": "Ley del Procedimiento Administrativo del Estado de Jalisco",
        "nombre_display": {
            "prefix_italic": "Ley del ",
            "core_bold_italic": "Procedimiento Administrativo",
            "suffix_italic_small": " del Estado de Jalisco",
        },
    },
    "LEEEPA-Jal": {
        "tag": "LEEEPA-Jal", "slug": "leeepa-jal", "ambito": "estatal",
        "nombre_completo": "Ley Estatal del Equilibrio Ecológico y la Protección al Ambiente",
        "nombre_display": {
            "prefix_italic": "Ley Estatal del ",
            "core_bold_italic": "Equilibrio Ecológico y la Protección al Ambiente",
            "suffix_italic_small": "",
        },
    },
    "REEEPA": {
        "tag": "REEEPA", "slug": "reeepa", "ambito": "estatal",
        "nombre_completo": ("Reglamento de la Ley Estatal del Equilibrio Ecológico y la Protección al Ambiente "
                            "en Materia de Impacto Ambiental, Explotación de Bancos de Material Geológico, "
                            "Yacimientos Pétreos y de Prevención y Control de la Contaminación a la Atmósfera "
                            "Generada por Fuentes Fijas en el Estado de Jalisco"),
        "nombre_display": {
            "prefix_italic": "Reglamento de la ",
            "core_bold_italic": "LEEEPA",
            "suffix_italic_small": " en Materia de Impacto Ambiental, Bancos de Material, Yacimientos Pétreos y Fuentes Fijas",
        },
    },
    "LJAEJ": {
        "tag": "LJAEJ", "slug": "ljaej", "ambito": "estatal",
        "nombre_completo": "Ley de Justicia Administrativa del Estado de Jalisco",
        "nombre_display": {
            "prefix_italic": "Ley de ",
            "core_bold_italic": "Justicia Administrativa",
            "suffix_italic_small": " del Estado de Jalisco",
        },
    },
    "LMR-Jal": {
        "tag": "LMR-Jal", "slug": "lmr-jal", "ambito": "estatal",
        "nombre_completo": "Ley de Mejora Regulatoria para el Estado de Jalisco y sus Municipios",
        "nombre_display": {
            "prefix_italic": "Ley de ",
            "core_bold_italic": "Mejora Regulatoria",
            "suffix_italic_small": " para el Estado de Jalisco y sus Municipios",
        },
    },
}

# Mapeo de tags tal como aparecen en las tablas (pueden tener variantes) al tag canónico.
TAG_ALIASES = {
    "LEEEPA Jalisco": "LEEEPA-Jal",
    "LEEEPA-Jal": "LEEEPA-Jal",
    "REEEPA-IA-BMG-FF": "REEEPA",
    "REEEPA": "REEEPA",
    "LMR-Jal": "LMR-Jal",
}

# -----------------------------------------------------------------------------
# Utilidades
# -----------------------------------------------------------------------------

def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def strip_md_emphasis(s: str) -> str:
    """Elimina **bold** y *italic* y _underscores_ sin tocar el texto interno."""
    s = re.sub(r"\*\*(.+?)\*\*", r"\1", s)
    s = re.sub(r"(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)", r"\1", s)
    return s.strip()


def extract_r_codes(text: str) -> list[str]:
    """Extrae todos los códigos R-NN del texto (únicos, preservando orden)."""
    codes = re.findall(r"R-\d{1,3}", text or "")
    seen: list[str] = []
    for c in codes:
        if c not in seen:
            seen.append(c)
    return seen


def extract_item_refs(text: str) -> dict[str, list[str]]:
    """Extrae referencias cruzadas tipo 1A.N, 1B.N, 3A.N, 3B.N, 3C.N, 3D.N, 4A.N, 4B.N."""
    refs: dict[str, list[str]] = {}
    for m in re.finditer(r"(1A|1B|3A|3B|3C|3D|4A|4B)\.(\d{1,3})", text or ""):
        bucket = m.group(1)
        ref = f"{bucket}.{m.group(2)}"
        refs.setdefault(bucket, [])
        if ref not in refs[bucket]:
            refs[bucket].append(ref)
    return refs


def parse_md_table(table_text: str) -> list[dict[str, str]]:
    """Parsea una tabla Markdown. Devuelve lista de dicts por fila."""
    lines = [l for l in table_text.strip().split("\n") if l.strip().startswith("|")]
    if len(lines) < 2:
        return []
    header = [c.strip() for c in lines[0].strip().strip("|").split("|")]
    # lines[1] es la separadora |---|---|
    rows = []
    for line in lines[2:]:
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if len(cells) != len(header):
            # Puede haber pipes dentro del contenido; se considera malformación
            continue
        rows.append(dict(zip(header, cells)))
    return rows


def extract_table_after(text: str, header_regex: str) -> str:
    """Devuelve el bloque de tabla que sigue al header matcheado."""
    m = re.search(header_regex, text, flags=re.MULTILINE)
    if not m:
        return ""
    start = m.end()
    # El bloque de tabla termina en la primera línea no-tabla tras un grupo de líneas tabla.
    lines = text[start:].split("\n")
    table_lines: list[str] = []
    in_table = False
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("|"):
            in_table = True
            table_lines.append(line)
        elif in_table:
            break
    return "\n".join(table_lines)


def normalize_tag(raw: str) -> str:
    raw = raw.strip()
    return TAG_ALIASES.get(raw, raw)


# -----------------------------------------------------------------------------
# Parsers por sección de la síntesis
# -----------------------------------------------------------------------------

def parse_sintesis(text: str) -> dict:
    result: dict = {}

    # -- 1A -----------------------------------------------------------------
    table = extract_table_after(text, r"^### 1A\.")
    rows = parse_md_table(table)
    debilidades = []
    for r in rows:
        n = int(r["#"])
        debilidades.append({
            "id": f"1A.{n}",
            "n": n,
            "ord": normalize_tag(r["Ordenamiento estatal"]),
            "art": r["Artículo"],
            "tipo": r["Tipo"],
            "prioridad": r["Prioridad"],
            "texto": r["Debilidad"],
            "reformas": [],      # Se llenará tras parsear §2.
            "proyectos": [],     # Se llenará tras parsear §3B (proyectos con reforma ligada).
        })
    result["debilidades"] = debilidades

    # -- 1B -----------------------------------------------------------------
    table = extract_table_after(text, r"^### 1B\.")
    rows = parse_md_table(table)
    condicionamientos = []
    for r in rows:
        n = int(r["#"])
        condicionamientos.append({
            "id": f"1B.{n}",
            "n": n,
            "ord_federal": normalize_tag(r["Ordenamiento federal"]),
            "art": r["Artículo"],
            "tipo": r["Tipo"],
            "urgencia": r["Urgencia"],
            "texto": r["Implicación"],
        })
    result["condicionamientos"] = condicionamientos

    # -- §2 reformas --------------------------------------------------------
    # Patrón: ### R-NN — Título\n- **Reforma:** ...\n- **Ordenamiento a modificar:** ...\n...
    reformas_section = re.search(
        r"^## 2\. Reformas Estructurales\s*\n(.+?)(?=^## 3\. )",
        text, flags=re.MULTILINE | re.DOTALL,
    )
    if not reformas_section:
        raise RuntimeError("No se encontró la sección 2. Reformas Estructurales")

    reformas_text = reformas_section.group(1)

    # Ruta crítica: extraer antes de procesar cada reforma.
    tramos_map = parse_ruta_critica(reformas_text)

    reforma_blocks = re.findall(
        r"^### (R-\d{1,3}) — ([^\n]+)\n(.+?)(?=^### R-\d{1,3} — |\Z|^### Ruta crítica)",
        reformas_text, flags=re.MULTILINE | re.DOTALL,
    )
    reformas = []
    for codigo, titulo, body in reforma_blocks:
        reforma = parse_reforma_block(codigo, titulo, body, tramos_map)
        reformas.append(reforma)
    result["reformas"] = reformas

    # -- 3A -----------------------------------------------------------------
    table = extract_table_after(text, r"^### 3A\.")
    rows = parse_md_table(table)
    proyectos_3a = []
    for r in rows:
        n = int(r["#"])
        proyectos_3a.append({
            "id": f"3A.{n}",
            "seccion": "3A",
            "n": n,
            "titulo": r["Proyecto"],
            "ord_estatal": normalize_tag(r["Ordenamiento estatal"]),
            "art_estatal": r["Artículo"],
            "habilitacion_federal": r["Habilitación federal"],
            "condicion": r["Condición operativa"],
            "prioridad": None,          # 3A no tiene columna de prioridad en la fuente.
            "reformas_requeridas": [],  # 3A es "viables hoy sin reforma" por definición.
        })
    result["proyectos_3a"] = proyectos_3a

    # -- 3B -----------------------------------------------------------------
    table = extract_table_after(text, r"^### 3B\.")
    rows = parse_md_table(table)
    proyectos_3b = []
    for r in rows:
        n = int(r["#"])
        raw_reforma = r["Reforma estatal requerida"]
        all_refs = extract_r_codes(raw_reforma)
        dep_match = re.search(r"\(depende de ([^)]+)\)", raw_reforma)
        dependencias = extract_r_codes(dep_match.group(1)) if dep_match else []
        requeridas = [c for c in all_refs if c not in dependencias]
        proyectos_3b.append({
            "id": f"3B.{n}",
            "seccion": "3B",
            "n": n,
            "titulo": r["Proyecto"],
            "ord_estatal": normalize_tag(r["Ordenamiento"]),
            "art_estatal": None,
            "habilitacion_federal": r["Habilitación federal"],
            "condicion": None,
            "prioridad": r["Prioridad"],
            "reformas_requeridas": requeridas,
            "reformas_dependencias": dependencias,
            "raw_reforma_text": raw_reforma,
        })
    result["proyectos_3b"] = proyectos_3b

    # -- 3C -----------------------------------------------------------------
    table = extract_table_after(text, r"^### 3C\.")
    rows = parse_md_table(table)
    proyectos_3c = []
    for r in rows:
        n = int(r["#"])
        proyectos_3c.append({
            "id": f"3C.{n}",
            "seccion": "3C",
            "n": n,
            "titulo": r["Proyecto"],
            "reforma_federal_requerida": r["Reforma federal requerida"],
            "impacto": r["Impacto para Jalisco"],
            "prioridad": r["Prioridad"],
        })
    result["proyectos_3c"] = proyectos_3c

    # -- 3D habilitaciones --------------------------------------------------
    table = extract_table_after(text, r"^### 3D\.")
    rows = parse_md_table(table)
    habilitaciones = []
    for r in rows:
        n = int(r["#"])
        estado_raw = r["Estado"]
        # Formato: "Estado — texto libre con referencias". También "Estado (glosa) — ..."
        # Extraer enum en prefijo.
        estado_enum = None
        for candidate in ("Ociosa diferida", "Parcialmente explotada", "Explotada", "Ociosa"):
            if estado_raw.startswith(candidate):
                estado_enum = candidate
                break
        if estado_enum is None:
            # Fallback: primer token hasta "—" o fin.
            estado_enum = estado_raw.split("—", 1)[0].strip().split("(")[0].strip()
        proyectos_vinculados = []
        for bucket_refs in extract_item_refs(estado_raw).values():
            proyectos_vinculados.extend(bucket_refs)
        habilitaciones.append({
            "id": f"3D.{n}",
            "n": n,
            "titulo": r["Habilitación"],
            "ord_federal": normalize_tag(r["Ordenamiento federal"]),
            "art": r["Artículo"],
            "condicion": r["Condición de ejercicio"],
            "estado": estado_enum,
            "estado_glosa": estado_raw,
            "proyectos_vinculados": proyectos_vinculados,
        })
    result["habilitaciones"] = habilitaciones

    # -- 4A conflictos ------------------------------------------------------
    table = extract_table_after(text, r"^### 4A\.")
    rows = parse_md_table(table)
    conflictos = []
    for r in rows:
        n = int(r["#"])
        conflictos.append({
            "id": f"4A.{n}",
            "n": n,
            "titulo": r["Conflicto"],
            "polo_estatal": r["Polo estatal"],
            "polo_federal": r["Polo federal en tensión"],
            "riesgo": r["Riesgo jurídico"],
            "reformas_vinculadas": [],  # Se llenará tras cruce con §2.
        })
    result["conflictos"] = conflictos

    # -- 4B vacíos ----------------------------------------------------------
    table = extract_table_after(text, r"^### 4B\.")
    rows = parse_md_table(table)
    vacios = []
    for r in rows:
        n = int(r["#"])
        vacios.append({
            "id": f"4B.{n}",
            "n": n,
            "titulo": r["Vacío / Ambigüedad"],
            "polo_federal": normalize_tag(r["Polo federal involucrado"]),
            "art": r["Artículo(s)"],
            "riesgo": r["Riesgo / Implicación para Jalisco"],
        })
    result["vacios"] = vacios

    # -- 4C narrativas ------------------------------------------------------
    m = re.search(
        r"^### 4C\. Análisis de Máximo Riesgo\s*\n(.+?)(?=^## 5\. )",
        text, flags=re.MULTILINE | re.DOTALL,
    )
    riesgos = []
    if m:
        narrativas = m.group(1).strip()
        case_blocks = re.split(r"\*\*Caso (\d+) — ([^*]+)\.\*\*", narrativas)
        # split devuelve [prefijo, num1, titulo1, body1, num2, titulo2, body2, ...]
        i = 1
        while i < len(case_blocks):
            num = int(case_blocks[i])
            titulo = case_blocks[i + 1].strip()
            body = case_blocks[i + 2].strip() if i + 2 < len(case_blocks) else ""
            riesgos.append({
                "id": f"4C.{num}",
                "n": num,
                "titulo": titulo,
                "texto": body,
                "reformas_vinculadas": extract_r_codes(body),
                "conflictos_vinculados": [r for r in extract_item_refs(body).get("4A", [])],
                "vacios_vinculados": [r for r in extract_item_refs(body).get("4B", [])],
            })
            i += 3
    result["riesgos"] = riesgos

    # -- §5 huecos ----------------------------------------------------------
    m = re.search(
        r"^## 5\. Huecos Documentales\s*\n(.+?)(?=^## 6\. )",
        text, flags=re.MULTILINE | re.DOTALL,
    )
    huecos = {"grupos": []}
    if m:
        section_text = m.group(1)
        subs = re.findall(
            r"^### (5\.\d)\. ([^\n]+)\n(.+?)(?=^### 5\.\d\. |\Z)",
            section_text, flags=re.MULTILINE | re.DOTALL,
        )
        for codigo, titulo, body in subs:
            items = []
            # Cada item es un bullet iniciado por "- " en el body.
            for bullet in re.finditer(r"^- (.+?)(?=^- |\Z)", body, flags=re.MULTILINE | re.DOTALL):
                item_text = bullet.group(1).strip()
                items.append(item_text)
            huecos["grupos"].append({
                "codigo": codigo,
                "titulo": titulo.strip(),
                "items": items,
            })
    result["huecos"] = huecos

    # -- §6 próximos pasos --------------------------------------------------
    table = extract_table_after(text, r"^## 6\. Próximos Pasos")
    rows = parse_md_table(table)
    proximos = []
    for r in rows:
        n = int(r["#"])
        requiere_raw = r["Requiere reforma"]
        proximos.append({
            "id": f"6.{n}",
            "n": n,
            "accion": r["Acción"],
            "responsable": r["Responsable sugerido"],
            "requiere_reforma_raw": requiere_raw,
            "requiere_reforma_bool": requiere_raw.strip().lower().startswith("sí") or requiere_raw.strip().lower().startswith("si"),
            "reformas_referenciadas": extract_r_codes(requiere_raw + " " + r["Acción"]),
            "plazo": r["Plazo sugerido"],
        })
    result["proximos_pasos"] = proximos

    return result


def parse_ruta_critica(reformas_text: str) -> dict[str, int]:
    """Parsea la subsección 'Ruta crítica de reformas' y devuelve {R-NN: tramo}."""
    m = re.search(r"### Ruta crítica.*?\Z", reformas_text, flags=re.DOTALL)
    if not m:
        return {}
    text = m.group(0)
    tramos_map: dict[str, int] = {}
    for tramo_match in re.finditer(
        r"\*\*Tramo (\d+) —[^*]*\*\*\s*\n?(.+?)(?=\*\*Tramo \d+ —|\Z)",
        text, flags=re.DOTALL,
    ):
        tramo = int(tramo_match.group(1))
        body = tramo_match.group(2)
        for code in extract_r_codes(body):
            # La primera asignación gana (una reforma no debería estar en dos tramos).
            if code not in tramos_map:
                tramos_map[code] = tramo
    return tramos_map


def parse_reforma_block(codigo: str, titulo: str, body: str, tramos_map: dict[str, int]) -> dict:
    """Parsea el cuerpo bulleted de una reforma R-NN."""
    def field(pattern: str) -> str | None:
        m = re.search(pattern, body)
        return m.group(1).strip() if m else None

    reforma_field = field(r"\*\*Reforma:\*\*\s*([^\n]+)")
    ord_modificar = field(r"\*\*Ordenamiento a modificar:\*\*\s*([^\n]+)")
    fundamento = field(r"\*\*Fundamento:\*\*\s*([^\n]+)")
    hab_federal = field(r"\*\*Habilitación federal:\*\*\s*([^\n]+)")

    # Los campos Nivel / Prioridad / Dependencias pueden venir en una sola línea
    # o distribuidos en varias. Extraigo cada uno por separado sobre el body completo.
    nivel = None
    prioridad = None
    dependencias: list[str] = []

    # Nivel: desde "**Nivel:**" hasta el siguiente marcador "**Prioridad:**" o fin de línea.
    nivel_m = re.search(r"\*\*Nivel:\*\*\s*(.+?)(?=\s*\*\*Prioridad:\*\*|\n)", body, flags=re.DOTALL)
    if nivel_m:
        nivel = nivel_m.group(1).strip().rstrip(".").rstrip()

    # Prioridad: desde "**Prioridad:**" hasta "**Dependencias:**" o fin de línea.
    prio_m = re.search(r"\*\*Prioridad:\*\*\s*(.+?)(?=\s*\*\*Dependencias:\*\*|\n)", body, flags=re.DOTALL)
    if prio_m:
        prioridad = prio_m.group(1).strip().rstrip(".").rstrip()

    # Dependencias: desde "**Dependencias:**" hasta fin de línea.
    dep_m = re.search(r"\*\*Dependencias:\*\*\s*(.+?)(?=\n|$)", body)
    if dep_m:
        dep_text = dep_m.group(1).strip().rstrip(".")
        if dep_text.lower() == "ninguna":
            dependencias = []
        else:
            dependencias = extract_r_codes(dep_text)

    # Debilidades origen: referencias 1A.N dentro del fundamento.
    deb_origen = extract_item_refs(fundamento or "").get("1A", [])
    conflictos_origen = extract_item_refs(fundamento or "").get("4A", [])

    tramo = tramos_map.get(codigo)

    # Extraer ordenamiento canónico del campo "Ordenamiento a modificar" tomando el primer tag reconocido.
    ord_tag = None
    if ord_modificar:
        for tag in ORDENAMIENTO_META.keys():
            # Búsqueda como palabra completa.
            if re.search(rf"\b{re.escape(tag)}\b", ord_modificar):
                ord_tag = tag
                break

    # Override: R-101 es una reforma federal (no controlable desde Jalisco).
    # El texto fuente dice "No aplica a nivel estatal sin reforma federal previa"
    # y no menciona ningún ordenamiento explícito, pero el ordenamiento que habría
    # que reformar es la CPEUM. Se asigna por override documentado; la ficha lleva
    # un banner visual que aclara su carácter no-controlable (Tramo 7).
    if codigo == "R-101":
        ord_tag = "CPEUM"

    return {
        "id": codigo,
        "n": int(codigo.split("-")[1]),
        "titulo": titulo.strip(),
        "reforma": reforma_field,
        "ordenamiento": ord_tag,
        "ordenamiento_raw": ord_modificar,
        "articulo_modificar": ord_modificar,
        "fundamento": fundamento,
        "fundamento_federal": hab_federal,
        "habilitacion_federal": hab_federal,
        "nivel": nivel,
        "prioridad": prioridad,
        "dependencias": dependencias,
        "tramo_ruta_critica": tramo,            # int 1-7 o None
        "es_independiente": tramo is None,      # True si no figura en ninguna cadena de la ruta crítica
        "debilidades_origen": deb_origen,
        "conflictos_origen": conflictos_origen,
        "proyectos_habilitados": [],  # Se llenará tras procesar 3B.
        "texto_completo": body.strip(),
    }


# -----------------------------------------------------------------------------
# Parser del marco federal (20 bloques)
# -----------------------------------------------------------------------------

def parse_marco_federal(text: str) -> list[dict]:
    """Divide en 20 bloques y extrae las 6 secciones de cada uno."""
    # Split en H2.
    parts = re.split(r"^## (?=[^#])", text, flags=re.MULTILINE)[1:]
    bloques = []
    for raw in parts:
        lines = raw.split("\n", 1)
        header = lines[0].strip()
        body = lines[1] if len(lines) > 1 else ""

        # Extraer tag: el segundo campo separado por " — ".
        parts_header = header.split(" — ")
        nombre = parts_header[0].strip() if parts_header else header
        tag_raw = parts_header[1].strip() if len(parts_header) > 1 else None
        # Limpiar el tag (puede contener "[INFERENCIA: ...]" como en REEEPA).
        if tag_raw:
            tag_raw = re.sub(r"\s*\[.*?\]\s*", "", tag_raw).strip()
        tag = normalize_tag(tag_raw) if tag_raw else None

        # Extraer fechas (resto del header).
        resto = " — ".join(parts_header[2:]) if len(parts_header) > 2 else ""

        # Cortar el body en las 6 secciones.
        section_splits = re.split(r"^### (\d)\. ([^\n]+)\n", body, flags=re.MULTILINE)
        # Formato: [prefix, num1, title1, body1, num2, title2, body2, ...]
        secciones: dict[str, dict[str, str]] = {}
        i = 1
        while i < len(section_splits):
            num = section_splits[i]
            stitle = section_splits[i + 1].strip()
            sbody = section_splits[i + 2] if i + 2 < len(section_splits) else ""
            secciones[num] = {"titulo": stitle, "contenido": sbody.strip()}
            i += 3

        meta = ORDENAMIENTO_META.get(tag, {})
        bloques.append({
            "tag": tag,
            "slug": meta.get("slug", tag.lower() if tag else "unknown"),
            "ambito": meta.get("ambito", "desconocido"),
            "nombre_completo": nombre,
            "header_raw": header,
            "vigencia_raw": resto,
            "secciones": secciones,
        })
    return bloques


# -----------------------------------------------------------------------------
# Post-procesamiento: cross-references y enriquecimiento
# -----------------------------------------------------------------------------

def build_cross_references(sintesis: dict) -> dict:
    xref: dict[str, dict] = {}

    # Reformas -> llenar proyectos_habilitados con proyectos 3B que la referencian.
    for proyecto in sintesis["proyectos_3b"]:
        for code in proyecto["reformas_requeridas"]:
            # Localizar la reforma y anexar el proyecto.
            for reforma in sintesis["reformas"]:
                if reforma["id"] == code:
                    reforma["proyectos_habilitados"].append(proyecto["id"])
                    break

    # Debilidades -> reformas que las originan.
    for reforma in sintesis["reformas"]:
        for deb_id in reforma["debilidades_origen"]:
            for deb in sintesis["debilidades"]:
                if deb["id"] == deb_id and reforma["id"] not in deb["reformas"]:
                    deb["reformas"].append(reforma["id"])

    # Conflictos -> reformas que los resuelven (filas de §2 cuyo fundamento referencia 4A.N).
    for reforma in sintesis["reformas"]:
        for conf_id in reforma["conflictos_origen"]:
            for conf in sintesis["conflictos"]:
                if conf["id"] == conf_id and reforma["id"] not in conf["reformas_vinculadas"]:
                    conf["reformas_vinculadas"].append(reforma["id"])

    # Construir el grafo unificado cross-references.json.
    for reforma in sintesis["reformas"]:
        xref[reforma["id"]] = {
            "tipo": "reforma",
            "titulo_corto": reforma["titulo"],
            "url": f"/sintesis/reformas/{reforma['id']}",
            "debilidades": list(reforma["debilidades_origen"]),
            "proyectos": list(reforma["proyectos_habilitados"]),
            "conflictos": list(reforma["conflictos_origen"]),
        }
    for deb in sintesis["debilidades"]:
        xref[deb["id"]] = {
            "tipo": "debilidad",
            "titulo_corto": deb["texto"][:120],
            "url": f"/sintesis/mapa/debilidades#{deb['id']}",
            "reformas": list(deb["reformas"]),
            "proyectos": list(deb["proyectos"]),
        }
    for cond in sintesis["condicionamientos"]:
        xref[cond["id"]] = {
            "tipo": "condicionamiento",
            "titulo_corto": cond["texto"][:120],
            "url": f"/sintesis/mapa/condicionamientos#{cond['id']}",
        }
    for p in sintesis["proyectos_3a"]:
        xref[p["id"]] = {
            "tipo": "proyecto_3a",
            "titulo_corto": p["titulo"][:120],
            "url": f"/sintesis/proyectos/viables-hoy#{p['id']}",
        }
    for p in sintesis["proyectos_3b"]:
        xref[p["id"]] = {
            "tipo": "proyecto_3b",
            "titulo_corto": p["titulo"][:120],
            "url": f"/sintesis/proyectos/reforma-estatal#{p['id']}",
            "reformas": list(p["reformas_requeridas"]),
        }
    for p in sintesis["proyectos_3c"]:
        xref[p["id"]] = {
            "tipo": "proyecto_3c",
            "titulo_corto": p["titulo"][:120],
            "url": f"/sintesis/proyectos/reforma-federal#{p['id']}",
        }
    for h in sintesis["habilitaciones"]:
        xref[h["id"]] = {
            "tipo": "habilitacion",
            "titulo_corto": h["titulo"][:120],
            "url": f"/sintesis/proyectos/habilitaciones#{h['id']}",
            "proyectos": list(h["proyectos_vinculados"]),
        }
    for c in sintesis["conflictos"]:
        xref[c["id"]] = {
            "tipo": "conflicto",
            "titulo_corto": c["titulo"][:120],
            "url": f"/sintesis/conflictos#{c['id']}",
            "reformas": list(c["reformas_vinculadas"]),
        }
    for v in sintesis["vacios"]:
        xref[v["id"]] = {
            "tipo": "vacio",
            "titulo_corto": v["titulo"][:120],
            "url": f"/sintesis/vacios#{v['id']}",
        }
    return xref


# -----------------------------------------------------------------------------
# Escritura de JSON
# -----------------------------------------------------------------------------

def write_json(path: Path, data) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


# -----------------------------------------------------------------------------
# Main
# -----------------------------------------------------------------------------

EXPECTED_COUNTS = {
    "debilidades": 80,
    "condicionamientos": 34,
    "reformas": 101,
    "proyectos_3a": 84,
    "proyectos_3b": 50,
    "proyectos_3c": 15,
    "habilitaciones": 58,
    "conflictos": 40,
    "vacios": 62,
    "riesgos": 2,
    "proximos_pasos": 30,
    "bloques": 20,
}


def main() -> None:
    print("=" * 72)
    print("Fase 1 — Parser Observatorio del Sistema de Energía de Jalisco")
    print("=" * 72)
    print(f"Marco federal:  {MARCO}")
    print(f"Síntesis:       {SINTESIS}")
    print(f"Salida:         {DATA}")
    print()

    sintesis_text = read_text(SINTESIS)
    marco_text = read_text(MARCO)

    print("Parseando sintesis_ejecutiva_jalisco.md…")
    s = parse_sintesis(sintesis_text)
    print("Parseando marco_federal_energetico.md…")
    bloques = parse_marco_federal(marco_text)
    print()

    # Cross-references / enriquecimiento.
    print("Construyendo cross-references…")
    xref = build_cross_references(s)
    print()

    # Escritura.
    write_json(DATA / "debilidades.json",          s["debilidades"])
    write_json(DATA / "condicionamientos.json",    s["condicionamientos"])
    write_json(DATA / "reformas.json",             s["reformas"])
    write_json(DATA / "proyectos-3a.json",         s["proyectos_3a"])
    write_json(DATA / "proyectos-3b.json",         s["proyectos_3b"])
    write_json(DATA / "proyectos-3c.json",         s["proyectos_3c"])
    write_json(DATA / "habilitaciones.json",       s["habilitaciones"])
    write_json(DATA / "conflictos.json",           s["conflictos"])
    write_json(DATA / "vacios.json",               s["vacios"])
    write_json(DATA / "riesgos.json",              s["riesgos"])
    write_json(DATA / "huecos.json",               s["huecos"])
    write_json(DATA / "proximos-pasos.json",       s["proximos_pasos"])

    ordenamientos_list = [
        {
            "tag": b["tag"],
            "slug": b["slug"],
            "ambito": b["ambito"],
            "nombre_completo": b["nombre_completo"],
            "header_raw": b["header_raw"],
            "vigencia_raw": b["vigencia_raw"],
        }
        for b in bloques
    ]
    write_json(DATA / "ordenamientos.json", ordenamientos_list)
    write_json(DATA / "ordenamiento-meta.json", ORDENAMIENTO_META)
    write_json(DATA / "cross-references.json", xref)

    for b in bloques:
        if b["slug"]:
            write_json(BLOQUES / f"{b['slug']}.json", b)

    # Reporte de parsing.
    print("=" * 72)
    print("REPORTE DE PARSING — conteos esperados vs obtenidos")
    print("=" * 72)
    actual = {
        "debilidades":      len(s["debilidades"]),
        "condicionamientos": len(s["condicionamientos"]),
        "reformas":         len(s["reformas"]),
        "proyectos_3a":     len(s["proyectos_3a"]),
        "proyectos_3b":     len(s["proyectos_3b"]),
        "proyectos_3c":     len(s["proyectos_3c"]),
        "habilitaciones":   len(s["habilitaciones"]),
        "conflictos":       len(s["conflictos"]),
        "vacios":           len(s["vacios"]),
        "riesgos":          len(s["riesgos"]),
        "proximos_pasos":   len(s["proximos_pasos"]),
        "bloques":          len(bloques),
    }
    all_ok = True
    for k, exp in EXPECTED_COUNTS.items():
        got = actual[k]
        status = "OK " if got == exp else "FAIL"
        if got != exp:
            all_ok = False
        print(f"  [{status}] {k:22s} esperado={exp:4d}  obtenido={got:4d}")
    print()

    # Métricas adicionales útiles.
    reformas_con_tramo = sum(1 for r in s["reformas"] if r["tramo_ruta_critica"] is not None)
    reformas_independientes = sum(1 for r in s["reformas"] if r["es_independiente"])
    reformas_con_debilidades = sum(1 for r in s["reformas"] if r["debilidades_origen"])
    reformas_con_proyectos = sum(1 for r in s["reformas"] if r["proyectos_habilitados"])
    tramos_distribucion: dict[int, int] = {}
    for r in s["reformas"]:
        t = r["tramo_ruta_critica"]
        if t is not None:
            tramos_distribucion[t] = tramos_distribucion.get(t, 0) + 1

    print(f"  Reformas en ruta crítica (T1–T7): {reformas_con_tramo}/101")
    print(f"  Reformas independientes:          {reformas_independientes}/101")
    print(f"  Reformas con debilidades_origen:  {reformas_con_debilidades}/101")
    print(f"  Reformas con proyectos_habilit.:  {reformas_con_proyectos}/101")
    print(f"  Distribución por tramo:           {dict(sorted(tramos_distribucion.items()))}")

    # Validación de integridad referencial.
    print()
    print("VALIDACIÓN DE INTEGRIDAD REFERENCIAL")
    print("-" * 72)
    reforma_ids = {r["id"] for r in s["reformas"]}
    orphan_reforma_refs = []
    for p in s["proyectos_3b"]:
        for code in p["reformas_requeridas"] + p.get("reformas_dependencias", []):
            if code not in reforma_ids:
                orphan_reforma_refs.append((p["id"], code))
    print(f"  Proyectos 3B con referencia a reforma inexistente: {len(orphan_reforma_refs)}")
    if orphan_reforma_refs[:5]:
        for p_id, code in orphan_reforma_refs[:5]:
            print(f"    - {p_id} -> {code}")

    debilidad_ids = {d["id"] for d in s["debilidades"]}
    orphan_deb_refs = []
    for r in s["reformas"]:
        for d_id in r["debilidades_origen"]:
            if d_id not in debilidad_ids:
                orphan_deb_refs.append((r["id"], d_id))
    print(f"  Reformas con debilidad_origen inexistente: {len(orphan_deb_refs)}")
    if orphan_deb_refs[:5]:
        for r_id, d_id in orphan_deb_refs[:5]:
            print(f"    - {r_id} -> {d_id}")

    print()
    if all_ok:
        print("RESULTADO: todos los conteos coinciden con ARCHITECTURE.md Sección 0.")
    else:
        print("RESULTADO: hay discrepancias. Revisar los conteos marcados [FAIL].")

    print()
    print(f"Archivos escritos en {DATA}")
    archivos = sorted(list(DATA.glob("*.json")) + list(BLOQUES.glob("*.json")))
    for f in archivos:
        print(f"  {f.relative_to(BASE)}  ({f.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
