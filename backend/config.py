"""
Central configuration for the Linguist backend

All environment values are here so we dont hardcode in any files
"""

import os
from dataclasses import dataclass

@dataclass
class settings:
    # Environment ("local", "dev", "prod", etc)
    env: str = os.getenv("LINGUIST_ENV", "local")

    # Debug mode flag (Use later when wiring Flask/gunicorn)
    debug: bool = os.getenv("DEBUG", "true").lower == "true"

    # AWS placeholders
    aws_region: str = os.getenv("AWS_REGION", "us-east-1")

    # For Bedrock when its implemented
    bedrock_model_id: str= os.getenv("BEDROCK_MODEL_ID", "meta.llama3-1-70b-instruct-v1:0")

    # Rate limiting defaults
    max_requests_per_minute: int = int(os.getenv("MAX_REQUESTS_PER_MINUTE", "10"))
    max_requests_per_hour: int = int(os.getenv("MAX_REQUESTS_PER_HOUR", "100"))

# Single global settings object for import
settings = Settings()