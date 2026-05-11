import os
from dotenv import load_dotenv

load_dotenv()

RECOMMENDATION_SERVICE_URL = os.getenv(
    "RECOMMENDATION_SERVICE_URL",
    "http://localhost:8088"
)

LISTING_SERVICE_URL = os.getenv(
    "LISTING_SERVICE_URL",
    "http://localhost:8083"
)

ML_SERVICE_TOKEN = os.getenv("ML_SERVICE_TOKEN", "")

EUREKA_SERVER_URL = os.getenv(
    "EUREKA_SERVER_URL",
    "http://localhost:8761/eureka/"
)

ML_SERVICE_HOST = os.getenv("ML_SERVICE_HOST", "localhost")
ML_SERVICE_PORT = int(os.getenv("ML_SERVICE_PORT", "8090"))

DEBUG_ENDPOINTS_ENABLED = os.getenv(
    "DEBUG_ENDPOINTS_ENABLED",
    "false"
).lower() == "true"