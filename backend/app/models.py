from pydantic import BaseModel
from typing import Optional, List

class SummarizeRequest(BaseModel):
    text: str
    translate_to: Optional[str] = "none"

class SummarizeResponse(BaseModel):
    original_text: str
    narrative: Optional[str] = None
    summary: str
    translated_summary: Optional[str] = None
    target_language: Optional[str] = None

class SearchResponse(BaseModel):
    fir_number: str
    police_station: str
    complainant: str
    accused: str
    date: str
    summary: str

class FIRRecord(BaseModel):
    id: int
    fir_number: str
    police_station: str
    complainant: str
    accused: str
    date: str
    summary: str

class FilterRequest(BaseModel):
    fir_number: Optional[str] = None
    complainant: Optional[str] = None
    accused: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    date_field: str = "incident_date"