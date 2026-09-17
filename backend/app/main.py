import os
import re
import shutil
import aiofiles
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
from pathlib import Path

from .services.summarizer import Summarizer
from .services.ocr import extract_text, extract_metadata
from .services.translator import translate_text
from .services.search import init_db, save_fir_record, search_by_fir_number, search_by_name, filter_firs
from .utils.file_cleanup import cleanup_temp
from .models import SummarizeResponse, SearchResponse, FilterRequest
from .utils.parser import parse_natural_query  # new parser
import logging
from typing import Optional

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="FIR Summarizer API", version="1.0.0")

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:8501","http://localhost:8081"],  # add React ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

summarizer = None
DB_PATH = Path("fir_metadata.db")

def extract_narrative(ocr_text):
    patterns = [
        r'First\s+Information\s+contents\s*[:.]?\s*(.*?)(?=\s*Action\s+taken|\s*13\.|\s*14\.|$)',
        r'FIR\s+Contents\s*[:.]?\s*(.*?)(?=\s*Action\s+taken|\s*13\.|\s*14\.|$)',
        r'12\.\s*FIR\s+Contents\s*[:.]?\s*(.*?)(?=\s*Action\s+taken|\s*13\.|\s*14\.|$)',
        r'12\.\s*First\s+Information\s+contents\s*[:.]?\s*(.*?)(?=\s*Action\s+taken|\s*13\.|\s*14\.|$)',
        r'Contents\s*[:.]?\s*(.*?)(?=\s*Action\s+taken|\s*13\.|\s*14\.|$)',
        r'Complaint\s*[:.]?\s*(.*?)(?=\s*Action\s+taken|\s*13\.|\s*14\.|$)',
        r'Alleged\s*[:.]?\s*(.*?)(?=\s*Action\s+taken|\s*13\.|\s*14\.|$)',
        r'Narrative\s*[:.]?\s*(.*?)(?=\s*Action\s+taken|\s*13\.|\s*14\.|$)',
    ]
    for pat in patterns:
        match = re.search(pat, ocr_text, re.IGNORECASE | re.DOTALL)
        if match:
            return match.group(1).strip()
    return ocr_text[:1500]

@app.on_event("startup")
async def load_model():
    global summarizer
    model_path = os.getenv("MODEL_PATH", "./models/qwen-fir-summarizer-final")
    logger.info(f"Loading model from {model_path}...")
    summarizer = Summarizer(model_path)
    logger.info("✅ Summarizer loaded successfully.")
    init_db()

@app.get("/")
async def root():
    return {"message": "FIR Summarizer API is running"}

@app.get("/health")
async def health():
    # Count records
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("SELECT COUNT(*) FROM firs")
        count = c.fetchone()[0]
        conn.close()
    except:
        count = 0
    return {
        "status": "ok" if summarizer is not None else "loading",
        "model_loaded": summarizer is not None,
        "records": count
    }

@app.post("/summarize")
async def summarize_fir(
    file: UploadFile = File(...),
    translate_to: str = Form("none")
):
    if summarizer is None:
        raise HTTPException(status_code=503, detail="Model not loaded yet")
    temp_path = f"./tmp/{file.filename}"
    os.makedirs("./tmp", exist_ok=True)
    async with aiofiles.open(temp_path, "wb") as f:
        content = await file.read()
        await f.write(content)
    try:
        logger.info(f"Extracting text from {file.filename}...")
        ocr_text = extract_text(temp_path)
        if not ocr_text or len(ocr_text) < 10:
            raise HTTPException(status_code=400, detail="Could not extract text from file")
        narrative = extract_narrative(ocr_text)
        if not narrative or len(narrative) < 10:
            narrative = ocr_text[:1500]
            logger.warning("Narrative extraction failed – using raw OCR text.")
        logger.info("Generating summary...")
        summary = summarizer.generate(narrative)
        translated_summary = None
        lang_map = {
            "bn": "bn", "ben": "bn",
            "hi": "hi",
            "te": "te",
            "ta": "ta",
            "or": "or",
            "mr": "mr",
            "gu": "gu",
            "kn": "kn",
            "ml": "ml",
            "pa": "pa",
            "ur": "ur",   
            "sa": "sa", 
        }
        if translate_to in lang_map:
            target_lang = lang_map[translate_to]
            logger.info(f"Translating summary to {target_lang}...")
            try:
                translated_summary = translate_text(summary, target=target_lang)
                if translated_summary:
                    logger.info(f"Translation result (first 100 chars): {translated_summary[:100]}...")
                else:
                    logger.warning("Translation returned None")
            except Exception as e:
                logger.error(f"Translation error: {e}")
                translated_summary = None
        try:
            metadata = extract_metadata(ocr_text)
            save_fir_record(
                fir_number=metadata.get("FIR Number", "Not available"),
                police_station=metadata.get("Police Station", "Not available"),
                district=metadata.get("District", "Not available"),
                fir_date=metadata.get("FIR Date", "Not available"),
                fir_time=metadata.get("FIR Time", "Not available"),
                incident_date=metadata.get("Incident Date", "Not available"),
                incident_time=metadata.get("Incident Time", "Not available"),
                legal_sections=metadata.get("Legal Sections", "Not available"),
                complainant=metadata.get("Complainant Name", "Not available"),
                complainant_father=metadata.get("Complainant Father", "Not available"),
                address=metadata.get("Address", "Not available"),
                accused=metadata.get("Accused", "Not available"),
                property=metadata.get("Property", "Not available"),
                total_value=metadata.get("Total Value (Rs)", "Not available"),
                summary=summary,
                ocr_text=ocr_text
            )
            logger.info("✅ FIR record saved to database.")
        except Exception as e:
            logger.error(f"Failed to save to DB: {e}")
        return {
            "original_text": ocr_text,
            "narrative": narrative,
            "summary": summary,
            "translated_summary": translated_summary,
            "target_language": translate_to if translate_to != "none" else None,
            "metadata": metadata,
            "translation_status": "ok" if translated_summary else ("skipped" if translate_to == "none" else "failed"),
            "translation_note": None,
        }
    except Exception as e:
        logger.error(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cleanup_temp(temp_path)

@app.get("/fir/{fir_number}")
async def get_fir_by_number(fir_number: str):
    results = search_by_fir_number(fir_number)
    if not results:
        raise HTTPException(status_code=404, detail="FIR not found")
    columns = ["id", "fir_number", "police_station", "district", "fir_date", "fir_time",
               "incident_date", "incident_time", "legal_sections", "complainant",
               "complainant_father", "address", "accused", "property", "total_value",
               "summary", "ocr_text", "created_at"]
    firs = [dict(zip(columns, row)) for row in results]
    return {"firs": firs}

@app.post("/search")
async def search_firs(name: str):
    results = search_by_name(name)
    columns = ["id", "fir_number", "police_station", "district", "fir_date", "fir_time",
               "incident_date", "incident_time", "legal_sections", "complainant",
               "complainant_father", "address", "accused", "property", "total_value",
               "summary", "ocr_text", "created_at"]
    firs = [dict(zip(columns, row)) for row in results]
    return {"results": firs}

@app.post("/filter")
async def advanced_filter(filters: FilterRequest):
    filters_dict = filters.dict()
    logger.info(f"Received filters: {filters_dict}")
    results = filter_firs(filters_dict)
    return {"results": results}

# --- NEW ENDPOINTS FOR REACT FRONTEND ---

@app.get("/records")
async def get_records(limit: int = 25, offset: int = 0):
    """Paginated list of all FIR records."""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT * FROM firs LIMIT ? OFFSET ?", (limit, offset))
    rows = c.fetchall()
    c.execute("SELECT COUNT(*) FROM firs")
    total = c.fetchone()[0]
    conn.close()
    columns = ["id", "fir_number", "police_station", "district", "fir_date", "fir_time",
               "incident_date", "incident_time", "legal_sections", "complainant",
               "complainant_father", "address", "accused", "property", "total_value",
               "summary", "ocr_text", "created_at"]
    records = [dict(zip(columns, row)) for row in rows]
    return {"results": records, "count": len(records), "total": total}

@app.get("/ask")
async def ask_assistant(q: str):
    """Natural language query that returns matching FIR records."""
    filters = parse_natural_query(q)
    logger.info(f"Parsed filters from query '{q}': {filters}")
    results = filter_firs(filters)
    logger.info(f"Returning {len(results)} records")
    return {"results": results, "count": len(results)}