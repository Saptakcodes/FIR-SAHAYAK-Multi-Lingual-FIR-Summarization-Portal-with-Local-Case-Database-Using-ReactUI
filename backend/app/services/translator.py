import logging
import time
from deep_translator import GoogleTranslator
from googletrans import Translator as GoogletransTranslator

logger = logging.getLogger(__name__)

def translate_text(text, target, chunk_size=3000, max_retries=3):
    """
    Translate long text using googletrans (primary) with fallback to deep_translator.
    """
    if not text or len(text) < 10:
        return text

    # Split into chunks
    chunks = []
    current_chunk = ""
    for sentence in text.split('. '):
        if len(current_chunk) + len(sentence) + 2 > chunk_size and current_chunk:
            chunks.append(current_chunk.strip())
            current_chunk = sentence + ". "
        else:
            current_chunk += sentence + ". "
    if current_chunk:
        chunks.append(current_chunk.strip())

    logger.info(f"Translating {len(chunks)} chunk(s) to {target} (chunk size: {chunk_size})")

    translated_parts = []
    for i, chunk in enumerate(chunks):
        translated = None

        # 1. Try googletrans first (more reliable for Bengali)
        for attempt in range(max_retries):
            try:
                gt = GoogletransTranslator()
                translated = gt.translate(chunk, dest=target).text
                if translated and len(translated) > 10:
                    logger.info(f"Chunk {i+1} translated via googletrans")
                    break
                else:
                    logger.warning(f"googletrans returned empty/short: {translated}")
                    time.sleep(1)
            except Exception as e:
                logger.error(f"googletrans error (attempt {attempt+1}): {e}")
                time.sleep(1)

        # 2. If googletrans failed, try deep_translator
        if not translated or len(translated) < 10:
            for attempt in range(max_retries):
                try:
                    translator = GoogleTranslator(source='auto', target=target)
                    translated = translator.translate(chunk)
                    if translated and not translated.startswith(('Error', 'Error 500', 'That’s an error')):
                        logger.info(f"Chunk {i+1} translated via deep_translator")
                        break
                    else:
                        logger.warning(f"deep_translator returned error: {translated[:100] if translated else 'None'}")
                        time.sleep(1)
                except Exception as e:
                    logger.error(f"deep_translator error: {e}")
                    time.sleep(1)

        # 3. If both fail, keep original
        if translated and len(translated) > 10 and not translated.startswith(('Error', 'Error 500')):
            translated_parts.append(translated)
        else:
            logger.warning(f"Chunk {i+1} translation failed – keeping original.")
            translated_parts.append(chunk)

    result = " ".join(translated_parts)
    if result and result.startswith(('Error', 'Error 500')):
        return None
    return result