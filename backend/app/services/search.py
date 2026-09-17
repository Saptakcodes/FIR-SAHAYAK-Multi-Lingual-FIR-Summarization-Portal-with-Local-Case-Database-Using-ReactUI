import sqlite3
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, Any, List
import logging
import re

logger = logging.getLogger(__name__)

DB_PATH = Path("fir_metadata.db")


# -------------------------------------------------------------
# 1. Database init & record insertion
# -------------------------------------------------------------
def init_db():
    """Initialize SQLite database with the FIR schema."""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS firs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fir_number TEXT,
        police_station TEXT,
        district TEXT,
        fir_date TEXT,
        fir_time TEXT,
        incident_date TEXT,
        incident_time TEXT,
        legal_sections TEXT,
        complainant TEXT,
        complainant_father TEXT,
        address TEXT,
        accused TEXT,
        property TEXT,
        total_value TEXT,
        summary TEXT,
        ocr_text TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')
    conn.commit()
    conn.close()


def save_fir_record(fir_number, police_station, district, fir_date, fir_time,
                    incident_date, incident_time, legal_sections,
                    complainant, complainant_father, address,
                    accused, property, total_value, summary, ocr_text):
    """Insert a new FIR record into the database."""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''INSERT INTO firs (
        fir_number, police_station, district, fir_date, fir_time,
        incident_date, incident_time, legal_sections,
        complainant, complainant_father, address,
        accused, property, total_value, summary, ocr_text
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
        (fir_number, police_station, district, fir_date, fir_time,
         incident_date, incident_time, legal_sections,
         complainant, complainant_father, address,
         accused, property, total_value, summary, ocr_text))
    conn.commit()
    conn.close()


# -------------------------------------------------------------
# 2. Legacy search functions
# -------------------------------------------------------------
def search_by_fir_number(fir_number):
    """Retrieve FIR records by FIR number (partial match)."""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT * FROM firs WHERE fir_number LIKE ?", (f'%{fir_number}%',))
    results = c.fetchall()
    conn.close()
    return results


def search_by_name(name):
    """Search FIRs by complainant, accused, or summary (partial match)."""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        SELECT * FROM firs 
        WHERE complainant LIKE ? 
           OR accused LIKE ? 
           OR summary LIKE ?
    """, (f'%{name}%', f'%{name}%', f'%{name}%'))
    results = c.fetchall()
    conn.close()
    return results


# -------------------------------------------------------------
# 3. Date normalisation
# -------------------------------------------------------------
def normalise_date(date_str: Optional[str]):
    """
    Convert a date string to a Python date object.
    Supports DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY, and month names.
    Returns None if parsing fails.
    """
    if not date_str:
        return None
    date_str = str(date_str).strip()
    if date_str.lower() in ('not explicitly stated', 'nan', 'null', '', 'not available'):
        return None

    # Try dateparser first (handles "15 Mar 2025", "15 March 2025", etc.)
    try:
        import dateparser
        parsed = dateparser.parse(
            date_str,
            settings={'PREFER_DATES_FROM': 'past', 'DATE_ORDER': 'DMY'}
        )
        if parsed:
            return parsed.date()
    except Exception:
        pass

    # Fallback: explicit formats
    for fmt in ('%d/%m/%Y', '%Y-%m-%d', '%d-%m-%Y', '%m/%d/%Y', '%d.%m.%Y'):
        try:
            parsed = datetime.strptime(date_str, fmt).date()
            logger.debug(f"Parsed '{date_str}' as {parsed}")
            return parsed
        except ValueError:
            continue

    logger.warning(f"Could not parse date: '{date_str}'")
    return None


# -------------------------------------------------------------
# 4. Advanced filter with crime keyword support
# -------------------------------------------------------------
def advanced_search(filters: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Perform an advanced search with multiple optional filters.
    Crime keyword matching is done in Python for precision:
      - Word/section terms → matched as whole tokens
      - Section numbers → checked ONLY in legal_sections
    """
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    query = "SELECT * FROM firs WHERE 1=1"
    params: list = []

    # --- Text filters (SQL LIKE) ---
    text_fields = ['fir_number', 'police_station', 'district',
                   'complainant', 'complainant_father', 'accused',
                   'legal_sections', 'summary']
    for field in text_fields:
        val = filters.get(field)
        if val:
            query += f" AND {field} LIKE ?"
            params.append(f"%{val}%")

    # NOTE: crime_search is intentionally NOT applied in SQL.
    #       We filter it in Python below for word-boundary precision.

    c.execute(query, params)
    rows = c.fetchall()
    conn.close()

    columns = ["id", "fir_number", "police_station", "district", "fir_date", "fir_time",
               "incident_date", "incident_time", "legal_sections", "complainant",
               "complainant_father", "address", "accused", "property", "total_value",
               "summary", "ocr_text", "created_at"]
    records = [dict(zip(columns, row)) for row in rows]

    # ================================================================
    # Crime keyword filter (Python, token-aware)
    # ================================================================
    crime_terms = filters.get('crime_search')
    if crime_terms:
        text_terms = [t.lower() for t in crime_terms if not t.isdigit()]
        section_terms = [t.lower() for t in crime_terms if t.isdigit()]

        def _record_matches_crime(rec: Dict[str, Any]) -> bool:
            # 1. Word-based match against summary / ocr_text / legal_sections
            haystack = " ".join([
                str(rec.get('summary') or ''),
                str(rec.get('ocr_text') or ''),
                str(rec.get('legal_sections') or ''),
            ]).lower()

            for term in text_terms:
                if re.search(rf'\b{re.escape(term)}\b', haystack):
                    return True

            # 2. Section-number match — ONLY in legal_sections, as a whole token
            if section_terms:
                sec_field = str(rec.get('legal_sections') or '').lower()
                # Extract tokens like "117", "351", "498a", "126" (allow trailing letter)
                tokens = re.findall(r'\d+[a-z]?', sec_field)
                for term in section_terms:
                    if term in tokens:
                        return True

            return False

        before = len(records)
        records = [r for r in records if _record_matches_crime(r)]
        logger.info(
            f"Crime filter: kept {len(records)} of {before} records "
            f"(text_terms={text_terms}, section_terms={section_terms})"
        )

    # ================================================================
    # Date filter
    # ================================================================
    date_field = filters.get('date_field', 'incident_date')
    if date_field not in ('incident_date', 'fir_date'):
        date_field = 'incident_date'

    start_date_str = filters.get('start_date')
    end_date_str = filters.get('end_date')
    start_date = normalise_date(start_date_str) if start_date_str else None
    end_date = normalise_date(end_date_str) if end_date_str else None

    if start_date is None and end_date is None:
        return records

    filtered = []
    for rec in records:
        rec_date = normalise_date(rec.get(date_field))
        if rec_date is None:
            if start_date or end_date:
                logger.warning(
                    f"Record {rec.get('id')} unparseable date "
                    f"'{rec.get(date_field)}' – excluded (filter active)."
                )
                continue
            filtered.append(rec)
            continue
        include = True
        if start_date and rec_date < start_date:
            include = False
        if end_date and rec_date > end_date:
            include = False
        if include:
            filtered.append(rec)

    logger.info(f"Date filter: start={start_date}, end={end_date}, kept {len(filtered)} of {len(records)}")
    return filtered


# -------------------------------------------------------------
# 5. Backward‑compatible wrapper for the old filter_firs
# -------------------------------------------------------------
def filter_firs(filters: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Backward‑compatible wrapper for advanced_search (used by /filter)."""
    return advanced_search(filters)