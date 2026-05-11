import os

RECOMMENDATION_SERVICE_URL = os.getenv(
    "RECOMMENDATION_SERVICE_URL",
    "http://localhost:8088"
)

LISTING_SERVICE_URL = os.getenv(
    "LISTING_SERVICE_URL",
    "http://localhost:8083"
)

ML_SERVICE_TOKEN = os.getenv("ML_SERVICE_TOKEN", "")