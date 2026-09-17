import os
import shutil
import logging

logger = logging.getLogger(__name__)

def cleanup_temp(path):
    """Delete temporary file or directory"""
    try:
        if os.path.isfile(path):
            os.remove(path)
            logger.info(f"Removed file: {path}")
        elif os.path.isdir(path):
            shutil.rmtree(path, ignore_errors=True)
            logger.info(f"Removed directory: {path}")
    except Exception as e:
        logger.warning(f"Cleanup error for {path}: {e}")