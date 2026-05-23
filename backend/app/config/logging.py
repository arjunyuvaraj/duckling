# app/config/logging_config.py

import logging
import sys

def setup_logging():
    """Configure logging for the application"""
    
    # Create logger
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)  # Changed from DEBUG to INFO
    
    # Console handler with formatting
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)  # Changed from DEBUG to INFO
    
    # Better formatter
    formatter = logging.Formatter(
        '[%(asctime)s] [%(levelname)s]  \n %(message)s',
        datefmt='%H:%M:%S'
    )
    console_handler.setFormatter(formatter)
    
    # Add handler
    logger.addHandler(console_handler)
    
    # Suppress verbose logs from third parties (set to ERROR to kill them)
    logging.getLogger("uvicorn.access").setLevel(logging.ERROR)
    logging.getLogger("httpx").setLevel(logging.ERROR)
    logging.getLogger("httpcore").setLevel(logging.ERROR)
    logging.getLogger("hpack").setLevel(logging.ERROR)
    logging.getLogger("supabase_auth").setLevel(logging.ERROR)
    
    return logger