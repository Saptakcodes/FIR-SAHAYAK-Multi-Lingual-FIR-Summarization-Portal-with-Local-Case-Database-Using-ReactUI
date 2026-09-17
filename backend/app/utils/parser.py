import re
from datetime import datetime, timedelta
import calendar
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

# ------------------------------------------------------------------
# Month mapping
# ------------------------------------------------------------------
MONTH_MAP = {
    'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6, 'jul': 7,
    'aug': 8, 'sep': 9, 'sept': 9, 'oct': 10, 'nov': 11, 'dec': 12,
    'january': 1, 'february': 2, 'march': 3, 'april': 4, 'may': 5, 'june': 6,
    'july': 7, 'august': 8, 'september': 9, 'october': 10, 'november': 11,
    'december': 12,
}

# ------------------------------------------------------------------
# Crime keyword map
# The map is unordered here — the detection function sorts it by
# canonical length (longest first) so specific phrases beat broad ones.
# ------------------------------------------------------------------
CRIME_KEYWORD_MAP: Dict[str, list[str]] = {
    "robbery":           ["robbery", "rob", "309", "392", "390", "397"],
    "theft":             ["theft", "steal", "stolen", "303", "379", "380"],
    "dacoity":           ["dacoity", "dacoit", "310", "391", "395", "396"],
    "burglary":          ["burglary", "house-break", "305", "457", "458"],
    "murder":            ["murder", "103", "302"],
    "attempt to murder": ["attempt to murder", "109", "307"],
    "rape":              ["rape", "64", "65", "376"],
    "assault":           ["assault", "131", "351", "323", "325", "326"],
    "harassment":        ["harassment", "harass", "stalking", "eve-teasing",
                          "78", "354", "354a", "509", "498a"],
    "molestation":       ["molestation", "molest", "354", "354a"],
    "cheating":          ["cheating", "fraud", "deceiv", "318", "420", "417"],
    "kidnapping":        ["kidnap", "abduct", "137", "363", "365", "366"],
    "extortion":         ["extortion", "extort", "308", "384", "385"],
    "domestic violence": ["domestic violence", "domestic", "dowry",
                          "85", "86", "498a"],
    "cyber crime":       ["cyber", "online fraud", "phishing", "66", "66c", "67"],
    "criminal breach":   ["criminal breach", "breach of trust", "316", "406", "408"],
    "rioting":           ["riot", "191", "147", "148", "149"],
    "hurt":              ["hurt", "injury", "injured", "115", "323", "324"],
    "arms act":          ["arms", "weapon", "pistol", "gun", "25", "27"],
    "narcotics":         ["narcotic", "ndps", "drug", "ganja", "heroin"],
    "missing person":    ["missing person", "missing", "abscond", "traced"],
    "violence":          ["violence", "violent", "brutal"],
}


def _clean_month_token(token: str) -> str:
    """Strip trailing dots/commas from a month token (e.g. 'Sept.' → 'sept')."""
    return re.sub(r'[.,]+$', '', token).strip().lower()


def parse_date_string(date_str: str, default_year: int = 2025) -> Optional[datetime]:
    """Parse a date string like '1 Jan 2025', '15 Jun', 'June 2025', '2025'."""
    if not date_str:
        return None
    date_str = date_str.strip()
    if not date_str:
        return None

    day = None
    month = None
    year = None
    month_match = None

    day_match = re.search(r'\b(\d{1,2})(?:st|nd|rd|th)?\b', date_str, re.IGNORECASE)
    if day_match:
        day = int(day_match.group(1))

    month_match = re.search(r'\b([a-zA-Z]{3,9})\b', date_str)
    if month_match:
        month_token = _clean_month_token(month_match.group(1))
        month = MONTH_MAP.get(month_token)

    year_match = re.search(r'\b(\d{4})\b', date_str)
    if year_match:
        year = int(year_match.group(1))

    if month is not None:
        if year is None:
            year = default_year
        if day is not None:
            try:
                return datetime(year, month, day)
            except ValueError:
                return datetime(year, month, 1)
        return datetime(year, month, 1)

    if month_match and month is None:
        try:
            import dateparser
            parsed = dateparser.parse(
                date_str,
                settings={'PREFER_DATES_FROM': 'past', 'DATE_ORDER': 'DMY'}
            )
            if parsed:
                return parsed
        except Exception as e:
            logger.warning(f"dateparser failed on '{date_str}': {e}")
        return None

    if year is not None:
        return datetime(year, 1, 1)

    try:
        import dateparser
        return dateparser.parse(
            date_str,
            settings={'PREFER_DATES_FROM': 'past', 'DATE_ORDER': 'DMY'}
        )
    except Exception:
        return None


# ==================================================================
# Crime detection — FIXED
# ==================================================================
def _detect_crime_terms(text_lower: str) -> list[str]:
    """
    Return a deduplicated list of searchable terms for ALL matching crime
    categories. Sorting by canonical length (longest first) ensures that
    'attempt to murder' beats 'murder' and 'domestic violence' beats
    'violence'. After a category matches, its matched keyword is removed
    from the working text so broader categories can't re-match it.
    """
    remaining = text_lower
    detected: list[str] = []
    matched_categories: list[str] = []

    # Sort categories so longer (more specific) canonicals are checked first.
    ordered = sorted(
        CRIME_KEYWORD_MAP.items(),
        key=lambda kv: -len(kv[0]),
    )

    for canonical, terms in ordered:
        matched_kw = None

        # 1. Try the full canonical phrase (e.g. "domestic violence")
        if re.search(rf'\b{re.escape(canonical)}\b', remaining):
            matched_kw = canonical
        else:
            # 2. Fall back to individual keywords (words only, not digits)
            for term in terms:
                if term.isdigit():
                    continue
                if re.search(rf'\b{re.escape(term)}\b', remaining):
                    matched_kw = term
                    break

        if matched_kw:
            detected.extend(terms)
            matched_categories.append(canonical)
            # Remove the matched keyword so it doesn't retrigger elsewhere
            remaining = re.sub(
                rf'\b{re.escape(matched_kw)}\b',
                ' ',
                remaining,
            )

    # Deduplicate preserving order
    seen = set()
    unique: list[str] = []
    for t in detected:
        if t not in seen:
            seen.add(t)
            unique.append(t)

    if matched_categories:
        logger.info(f"Crime categories matched: {matched_categories}")

    return unique


def parse_natural_query(text: str) -> Dict[str, Any]:
    """Extract filters from a natural language query."""
    text_lower = text.lower()
    filters: Dict[str, Any] = {}
    default_year = 2025

    # ---------------- FIR Number ----------------
    num_match = re.search(r'fir\s*(?:no\.?|number)?\s*[#:]?\s*([\w\-/]+)', text_lower)
    if num_match:
        candidate = num_match.group(1).strip()
        if re.search(r'\d', candidate):
            filters['fir_number'] = candidate

    # ---------------- Complainant / Accused / Name ----------------
    comp_match = re.search(
        r'complainant\s+([\w\s]+?)(?:\s+and|\s+from|\s+between|$)', text_lower
    )
    if comp_match:
        filters['complainant'] = comp_match.group(1).strip()

    acc_match = re.search(
        r'accused\s+([\w\s]+?)(?:\s+and|\s+from|\s+between|$)', text_lower
    )
    if acc_match:
        filters['accused'] = acc_match.group(1).strip()

    name_match = re.search(
        r'name\s+([\w\s]+?)(?:\s+and|\s+from|\s+between|$)', text_lower
    )
    if name_match and 'complainant' not in filters and 'accused' not in filters:
        filters['complainant'] = name_match.group(1).strip()

    # ================================================================
    # Date Extraction
    # ================================================================
    start_date: Optional[str] = None
    end_date: Optional[str] = None

    # ---------- 1. Explicit range ----------
    range_match = re.search(
        r'\b(?:between|from)\s+(.+?)\s+(?:and|to)\s+(.+?)(?:\s*$)',
        text_lower
    )
    if range_match:
        part1 = range_match.group(1).strip()
        part2 = range_match.group(2).strip()

        parsed1 = parse_date_string(part1, default_year)
        parsed2 = parse_date_string(part2, default_year)

        if parsed1 and not parsed2 and re.search(r'\b\d{4}\b', part1):
            parsed2 = parse_date_string(f"{part2} {parsed1.year}", default_year)
        elif parsed2 and not parsed1 and re.search(r'\b\d{4}\b', part2):
            parsed1 = parse_date_string(f"{part1} {parsed2.year}", default_year)

        if parsed1 and parsed2:
            start_date = parsed1.strftime('%Y-%m-%d')
            end_date = parsed2.strftime('%Y-%m-%d')
            if start_date > end_date:
                start_date, end_date = end_date, start_date
        elif parsed1:
            start_date = parsed1.strftime('%Y-%m-%d')
        elif parsed2:
            end_date = parsed2.strftime('%Y-%m-%d')

    # ---------- 2. Month (+ optional year) ----------
    if not (start_date and end_date):
        for mon in MONTH_MAP.keys():
            if re.search(rf'\b{mon}\b', text_lower):
                year_match = re.search(r'\b(\d{4})\b', text_lower)
                found_year = int(year_match.group(1)) if year_match else default_year
                month_num = MONTH_MAP[mon]
                first_day = datetime(found_year, month_num, 1).strftime('%Y-%m-%d')
                last_day_num = calendar.monthrange(found_year, month_num)[1]
                last_day = datetime(found_year, month_num, last_day_num).strftime('%Y-%m-%d')
                start_date = first_day
                end_date = last_day
                break

    # ---------- 3. Bare year ----------
    if not (start_date and end_date):
        year_only = re.search(r'\b(\d{4})\b', text_lower)
        if year_only:
            yr = int(year_only.group(1))
            start_date = datetime(yr, 1, 1).strftime('%Y-%m-%d')
            end_date = datetime(yr, 12, 31).strftime('%Y-%m-%d')

    # ---------- 4. Relative dates ----------
    if not (start_date and end_date):
        if 'last week' in text_lower or 'past week' in text_lower:
            end = datetime.now()
            start = end - timedelta(weeks=1)
            start_date = start.strftime('%Y-%m-%d')
            end_date = end.strftime('%Y-%m-%d')
        elif 'last month' in text_lower or 'past month' in text_lower:
            end = datetime.now()
            start = end - timedelta(days=30)
            start_date = start.strftime('%Y-%m-%d')
            end_date = end.strftime('%Y-%m-%d')
        elif 'today' in text_lower:
            today = datetime.now().strftime('%Y-%m-%d')
            start_date = today
            end_date = today
        elif 'yesterday' in text_lower:
            yest = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
            start_date = yest
            end_date = yest

    if start_date:
        filters['start_date'] = start_date
    if end_date:
        filters['end_date'] = end_date

    # ================================================================
    # Crime detection (FIXED)
    # ================================================================
    detected_terms = _detect_crime_terms(text_lower)
    if detected_terms:
        filters['crime_search'] = detected_terms
        logger.info(f"Crime search terms: {detected_terms}")

    # ================================================================
    # Date field logic
    # ================================================================
    if 'incident date' in text_lower or 'incident_date' in text_lower:
        filters['date_field'] = 'incident_date'
    elif 'fir date' in text_lower or 'fir_date' in text_lower or 'registered' in text_lower:
        filters['date_field'] = 'fir_date'
    else:
        if start_date and end_date:
            filters['date_field'] = 'fir_date'
        else:
            filters['date_field'] = 'incident_date'

    logger.info(f"Parsed filters: {filters}")
    return filters