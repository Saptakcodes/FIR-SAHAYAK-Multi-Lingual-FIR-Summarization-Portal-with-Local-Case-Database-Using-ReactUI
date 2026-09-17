from app.services.ocr import extract_text

# Replace with your PDF file
result = extract_text("FIR18.pdf")
print("=== FULL EXTRACTED TEXT ===")
print(result)
print("=" * 50)
print(f"Total characters extracted: {len(result)}")
print(f"Number of lines: {len(result.splitlines())}")
print(f"Number of words (approx): {len(result.split())}")