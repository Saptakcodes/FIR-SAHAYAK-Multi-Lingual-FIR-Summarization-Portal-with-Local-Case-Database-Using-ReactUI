import os

# Disable external calls to Hugging Face Hub during runtime
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
os.environ["TRANSFORMERS_OFFLINE"] = "1"

# Force offline mode to prevent any external calls
os.environ["HF_HUB_OFFLINE"] = "1"