import os
import re
import logging
from typing import Optional
from PIL import Image
import pytesseract
from pdf2image import convert_from_path

logger = logging.getLogger(__name__)

# ------------------------------------------------------------------
# Absolute paths
# ------------------------------------------------------------------
BASE_DIR = r"C:\Multi-lingual-FIR-Summarizer-System\backend\tessaract_ocr"
TESSERACT_PATH = os.path.join(BASE_DIR, "tesseract.exe")
TESSDATA_DIR = os.path.join(BASE_DIR, "tessdata")
POPPLER_PATH = r"C:\Multi-lingual-FIR-Summarizer-System\backend\poppler\poppler-26.02.0\Library\bin"

OCR_LANGS = "ben+hin+eng"

# ------------------------------------------------------------------
# Constants for validation
# ------------------------------------------------------------------
INVALID_VALUES = {
    "not explicitly stated", "not available", "n/a", "na", "none",
    "null", "nan", "", "-", "--", "unknown", "not stated",
    "not mentioned", "not known",
}

NAME_STOPWORDS = {
    "attacked", "assault", "suddenly", "physically", "complainant",
    "alleged", "used", "blow", "fist", "also", "and", "the", "with",
    "was", "were", "his", "her", "their", "he", "she", "they",
    "case", "crime", "report", "police", "station", "district",
    "property", "stolen", "value", "total", "section", "act", "under",
    "or", "of", "in", "on", "at", "to", "for", "from", "by",
    "which", "that", "this", "these", "those", "such",
    "husband", "father", "mother", "wife", "son", "daughter",
    "relative", "address", "nationality", "occupation",
}


# ==================================================================
# Text cleaning helpers
# ==================================================================
def _normalize_whitespace(text: str) -> str:
    return re.sub(r'\s+', ' ', text).strip()


def _strip_ocr_noise(text: str) -> str:
    text = text.strip(" .,:;|_-\t\n\r")
    text = re.sub(r'\.{2,}', '.', text)
    text = re.sub(r'[-_=]{2,}', '-', text)
    text = re.sub(r'[:.]\s*$', '', text)
    return _normalize_whitespace(text)


def _is_valid(value: Optional[str]) -> bool:
    if not value:
        return False
    return value.strip().lower() not in INVALID_VALUES


def _looks_like_name(text: str) -> bool:
    if not text:
        return False
    text = text.strip()
    if len(text) < 3 or len(text) > 60:
        return False
    words = text.split()
    if len(words) > 6:
        return False
    for word in words:
        clean_word = re.sub(r'[^a-zA-Z]', '', word).lower()
        if clean_word and clean_word in NAME_STOPWORDS:
            return False
    if not re.search(r'[A-Za-z\u0900-\u097F\u0980-\u09FF]', text):
        return False
    return True


def _dedupe_preserve_order(items: list[str]) -> list[str]:
    seen = set()
    result = []
    for item in items:
        key = item.strip().lower()
        if key and key not in seen:
            seen.add(key)
            result.append(item.strip())
    return result


# ==================================================================
# 1. OCR Extraction
# ==================================================================
def extract_text(file_path: str) -> str:
    if not file_path or not os.path.exists(file_path):
        logger.error(f"File not found: {file_path}")
        return "[OCR Error: file not found]"

    file_ext = os.path.splitext(file_path)[1].lower()

    if file_ext == '.txt':
        for encoding in ('utf-8', 'utf-16', 'latin-1'):
            try:
                with open(file_path, 'r', encoding=encoding) as f:
                    return f.read()
            except (UnicodeDecodeError, UnicodeError):
                continue
            except OSError as e:
                logger.error(f"Failed to read TXT file: {e}")
                return f"[OCR Error: {e}]"
        return "[OCR Error: could not decode text file]"

    try:
        pytesseract.pytesseract.tesseract_cmd = TESSERACT_PATH
        os.environ['TESSDATA_PREFIX'] = BASE_DIR

        if file_ext == '.pdf':
            images = convert_from_path(file_path, poppler_path=POPPLER_PATH)
        else:
            images = [Image.open(file_path)]

        full_text = []
        for i, img in enumerate(images):
            try:
                if img.mode not in ('L', 'RGB'):
                    img = img.convert('RGB')
                config = f"--tessdata-dir {TESSDATA_DIR}"
                text = pytesseract.image_to_string(img, lang=OCR_LANGS, config=config)
                full_text.append(text.strip())
            except Exception as page_err:
                logger.warning(f"OCR failed on page {i + 1}: {page_err}")
                continue

        if not full_text:
            return "[OCR Error: no text extracted from any page]"

        return "\n".join(full_text)

    except Exception as e:
        logger.error(f"OCR error: {e}")
        return f"[OCR Error: {str(e)}]"


# ==================================================================
# 2. Field extraction helper
# ==================================================================
def _extract_field(
    text: str,
    patterns: list[str],
    max_chars: int = 120,
    stop_labels: Optional[list[str]] = None,
    validator=None,
) -> str:
    stop_pattern = ""
    if stop_labels:
        joined = "|".join(re.escape(label) for label in stop_labels)
        stop_pattern = rf"(?=\s*(?:{joined})\s*[:.\-]|\Z)"

    for pattern in patterns:
        try:
            full_pattern = pattern
            if stop_pattern and "(?=" not in pattern:
                full_pattern = pattern + stop_pattern

            match = re.search(full_pattern, text, re.IGNORECASE | re.DOTALL)
            if not match:
                continue

            value = _strip_ocr_noise(match.group(1))
            if len(value) > max_chars:
                value = value[:max_chars].rsplit(' ', 1)[0]

            if not _is_valid(value):
                continue
            if validator and not validator(value):
                continue

            return value

        except re.error as re_err:
            logger.warning(f"Invalid regex '{pattern}': {re_err}")
            continue

    return "Not explicitly stated"


# ==================================================================
# 3. Metadata Extraction
# ==================================================================
def extract_metadata(text: str) -> dict:
    metadata: dict[str, str] = {}

    all_fields = [
        "FIR Number", "Police Station", "District", "FIR Date", "FIR Time",
        "Incident Date", "Incident Time", "Legal Sections",
        "Complainant Name", "Complainant Father", "Address",
        "Accused", "Property", "Total Value (Rs)",
    ]

    if not text or text.startswith("[OCR Error"):
        for field in all_fields:
            metadata[field] = "Not explicitly stated"
        return metadata

    # --- FIR Number ---
    metadata["FIR Number"] = _extract_field(
        text,
        [
            r'FIR\s*No\.?\s*\([^)]*\)\s*[:.]?\s*([A-Za-z0-9\-/]+)',
            r'FIR\s*(?:No\.?|Number)\s*[:.]?\s*([A-Za-z0-9\-/]+)',
        ],
        max_chars=30,
    )

    # --- Police Station ---
    metadata["Police Station"] = _extract_field(
        text,
        [
            r'P\.?S\.?\s*\([^)]*\)\s*[:.]?\s*([A-Za-z\u0900-\u097F\s]+?)(?=\s*(?:Year|Date|FIR|District|\d))',
            r'Police\s*Station\s*[:.]?\s*([A-Za-z\u0900-\u097F\s]+?)(?=\s*(?:Year|Date|FIR|District|\d))',
        ],
        max_chars=60,
    )

    # --- District ---
    metadata["District"] = _extract_field(
        text,
        [
            r'District\s*(?:\([^)]*\))?\s*[:.]?\s*([^\n]{3,80})',
        ],
        max_chars=80,
    )

    # --- FIR Date & Time ---
    dt = _extract_field(
        text,
        [r'Date\s+and\s+Time\s+of\s+FIR.*?[:.]?\s*([\d/]+\s+[\d:]+\s*hrs?)'],
        max_chars=40,
    )
    if dt != "Not explicitly stated":
        parts = dt.split()
        metadata["FIR Date"] = parts[0] if parts else "Not explicitly stated"
        metadata["FIR Time"] = " ".join(parts[1:]) if len(parts) > 1 else "Not explicitly stated"
    else:
        metadata["FIR Date"] = "Not explicitly stated"
        metadata["FIR Time"] = "Not explicitly stated"

    # --- Incident Date & Time ---
    metadata["Incident Date"] = _extract_field(
        text,
        [r'Date\s+from\s*(?:\([^)]*\))?\s*[:.]?\s*([\d/]+)'],
        max_chars=15,
    )
    metadata["Incident Time"] = _extract_field(
        text,
        [r'Time\s+From\s*(?:\([^)]*\))?\s*[:.]?\s*([\d:]+\s*hrs?)'],
        max_chars=15,
    )

    # --- Legal Sections ---
    sections_raw = ""
    m = re.search(
        r'U/S\s+([\d()/,\s]+?)\s+of\s+BNS',
        text, re.IGNORECASE | re.DOTALL
    )
    if m:
        sections_raw = m.group(1)

    if not sections_raw:
        rows = re.findall(
            r'THE\s+BHARATIYA\s+NYAYA\s+SANHITA\s*\([^)]*\),?\s*\d+\s*([\d()/,\s]+?)(?=\d\s*THE|\Z)',
            text, re.IGNORECASE | re.DOTALL
        )
        if rows:
            sections_raw = ", ".join(rows)

    if sections_raw:
        # Repair OCR artifacts like "35 1(2)" -> "351(2)"
        sections_raw = re.sub(r'(\d)\s+(\d)', r'\1\2', sections_raw)
        sections_raw = re.sub(r'(\d)\s+\(', r'\1(', sections_raw)

        parts = re.split(r'\s*/\s*|\s*,\s*', sections_raw)
        parts = [_strip_ocr_noise(p) for p in parts if p.strip()]
        parts = _dedupe_preserve_order(parts)
        metadata["Legal Sections"] = ", ".join(parts)
    else:
        metadata["Legal Sections"] = "Not explicitly stated"

    # --- Complainant Name ---
    complainant = "Not explicitly stated"

    # Priority 1: structured "(a) Name (नाम):" under "Complainant / Informant"
    m = re.search(
        r'Complainant\s*/\s*Informant\s*\([^)]*\)\s*:.*?\(a\)\s*Name\s*(?:\([^)]*\))?\s*[:.]?\s*([^\n]{3,80})',
        text, re.IGNORECASE | re.DOTALL
    )
    if m:
        candidate = _strip_ocr_noise(m.group(1))
        candidate = re.sub(r'^\([a-z]\)\s*', '', candidate)
        candidate = re.sub(r'^[a-z]\)\s*', '', candidate)
        if _looks_like_name(candidate):
            complainant = candidate

    # Priority 2: any "Name (नाम):" NOT preceded by Husband/Father/Wife/Mother
    # NOTE: We use a normal match + a Python prefix check instead of a
    # lookbehind, because Python's re module rejects variable-width
    # lookbehinds (which caused the "look-behind requires fixed-width
    # pattern" crash).
    if complainant == "Not explicitly stated":
        for m in re.finditer(
            r'Name\s*\([^)]*\)\s*[:.]?\s*([^\n]{3,80})',
            text
        ):
            prefix_window = text[max(0, m.start() - 20):m.start()].lower()
            if any(kw in prefix_window for kw in
                   ("husband", "father", "wife", "mother")):
                continue

            candidate = _strip_ocr_noise(m.group(1))
            candidate = re.sub(r'^\([a-z]\)\s*', '', candidate)
            candidate = re.sub(r'^[a-z]\)\s*', '', candidate)

            if _looks_like_name(candidate):
                complainant = candidate
                break

    # Priority 3: narrative "namely X W/O Y"
    if complainant == "Not explicitly stated":
        m = re.search(
            r'namely\s+([A-Z][A-Za-z\.\s]{2,60}?)\s+W/O',
            text, re.IGNORECASE
        )
        if m and _looks_like_name(m.group(1).strip()):
            complainant = m.group(1).strip()

    metadata["Complainant Name"] = complainant

    # --- Complainant's Father / Husband (restricted to Section 6) ---
    section_6_match = re.search(
        r'6\.\s*Complainant\s*/\s*Informant.*?(?=\n\s*7\.\s*Details)',
        text, re.IGNORECASE | re.DOTALL
    )
    father_search_text = section_6_match.group(0) if section_6_match else text

    father_value = "Not explicitly stated"

    husband = _extract_field(
        father_search_text,
        [
            r"Husband'?s?\s*Name\s*(?:\([^)]*\))?\s*[:.]?\s*([^\n]{2,60})",
            r"Husband'?s?\s*Name\s*[:.]?\s*([^\n]{2,60})",
        ],
        max_chars=60,
        validator=_looks_like_name,
    )
    if husband != "Not explicitly stated":
        father_value = f"{husband} (Husband)"
    else:
        father = _extract_field(
            father_search_text,
            [
                r"Father'?s?\s*Name\s*(?:\([^)]*\))?\s*[:.]?\s*([^\n]{2,60})",
                r"Father'?s?\s*Name\s*[:.]?\s*([^\n]{2,60})",
            ],
            max_chars=60,
            validator=_looks_like_name,
        )
        if father != "Not explicitly stated":
            father_value = f"{father} (Father)"

    metadata["Complainant Father"] = father_value

    # --- Address ---
    address = "Not explicitly stated"

    m = re.search(
        r'Present\s+Address\s*[:.]?\s*(\d+[^\n]{5,200})',
        text, re.IGNORECASE
    )
    if not m:
        m = re.search(
            r'Permanent\s+Address\s*[:.]?\s*(\d+[^\n]{5,200})',
            text, re.IGNORECASE
        )
    if not m:
        m = re.search(
            r'\(b\)\s*Address\s*(?:\([^)]*\))?\s*[:.]?\s*(\d+[^\n]{5,200})',
            text, re.IGNORECASE
        )

    if m:
        candidate = m.group(1)
        candidate = re.split(r'\d\s*(?:Present|Permanent)\s+Address', candidate)[0]
        candidate = _strip_ocr_noise(candidate)
        if len(candidate) > 5:
            address = candidate

    metadata["Address"] = address

    # --- Accused (table-aware) ---
    accused_names: list[str] = []

    section = re.search(
        r'7\.\s*Details\s+of\s+known.*?(?=\n\s*8\.\s*Reasons|\Z)',
        text, re.IGNORECASE | re.DOTALL
    )
    if section:
        block = section.group(0)
        for m in re.finditer(
            r'\d+\s*([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,3}?)'
            r'(?=Father\'?s?\s*Name|Husband\'?s?\s*Name|Relative\'?s?\s*Name|Mother\'?s?\s*Name|Present\s+Address|Permanent\s+Address)',
            block
        ):
            name = _strip_ocr_noise(m.group(1))
            if _looks_like_name(name) and name not in accused_names:
                accused_names.append(name)

    if not accused_names:
        narrative = re.search(
            r'against\s+(.*?)(?=\s+to\s+the\s+effect|\s+all\s+residents)',
            text, re.IGNORECASE | re.DOTALL
        )
        if narrative:
            block = narrative.group(1)
            for piece in re.split(r'(?:\bi{1,3}\)|\biv\)|\bv\))', block):
                cleaned = _strip_ocr_noise(piece)
                cleaned = re.sub(
                    r'\s*(?:S/O|W/O|D/O|son\s+of|wife\s+of|daughter\s+of).*',
                    '', cleaned, flags=re.IGNORECASE
                )
                if _looks_like_name(cleaned):
                    accused_names.append(cleaned)

    accused = ", ".join(_dedupe_preserve_order(accused_names)) if accused_names else "Not explicitly stated"
    metadata["Accused"] = accused

    # --- Property ---
    property_types: list[str] = []
    prop_section = re.search(
        r'9\.\s*Particulars\s+of\s+properties.*?(?=\n\s*10\.|\Z)',
        text, re.IGNORECASE | re.DOTALL
    )
    if prop_section:
        for m in re.finditer(
            r'\b(Gold|Silver|Jewellery|Jewelry|Currency|Coin|Cash|Vehicle|Car|Bike|Motorcycle|Laptop|Computer|Documents|Land|House)\b',
            prop_section.group(0), re.IGNORECASE
        ):
            property_types.append(m.group(1).title())

    property_types = _dedupe_preserve_order(property_types)
    metadata["Property"] = ", ".join(property_types) if property_types else "Not explicitly stated"

    # --- Total Value ---
    value = _extract_field(
        text,
        [
            r'Total\s+value\s+of\s+property.*?[:.]?\s*(?:Rs\.?\s*)?([\d,]+)',
            r'(?:Total\s+value|Total\s+Value)\s*[:.]?\s*(?:Rs\.?\s*)?([\d,]+)',
        ],
        max_chars=20,
    )
    if value != "Not explicitly stated":
        numeric = value.replace(',', '')
        metadata["Total Value (Rs)"] = numeric if numeric.isdigit() else value
    else:
        metadata["Total Value (Rs)"] = "Not explicitly stated"

    logger.info(f"Metadata extracted: {list(metadata.keys())}")
    logger.info(f"Extracted values: {metadata}")
    return metadata