import os
import urllib.request

# List of Indian language codes (as per Tesseract)
indian_langs = [
    'asm', 'ben', 'guj', 'hin', 'kan', 'mal', 'mni',
    'ori', 'pan', 'san', 'sat', 'tam', 'tel', 'urd'
]

# Path to your tessdata folder
tessdata_dir = r"C:\Multi-lingual-FIR-Summarizer-System\backend\tessaract_ocr\tessdata"

# Create the directory if it doesn't exist
os.makedirs(tessdata_dir, exist_ok=True)

base_url = "https://github.com/tesseract-ocr/tessdata/raw/main/"

for lang in indian_langs:
    url = base_url + lang + ".traineddata"
    dest = os.path.join(tessdata_dir, lang + ".traineddata")
    print(f"Downloading {lang}...")
    try:
        urllib.request.urlretrieve(url, dest)
        print(f"✅ {lang} downloaded.")
    except Exception as e:
        print(f"❌ Failed to download {lang}: {e}")

# Also download English (if not already present)
eng_url = "https://github.com/tesseract-ocr/tessdata/raw/main/eng.traineddata"
eng_dest = os.path.join(tessdata_dir, "eng.traineddata")
if not os.path.exists(eng_dest):
    print("Downloading English...")
    urllib.request.urlretrieve(eng_url, eng_dest)

print("All done!")