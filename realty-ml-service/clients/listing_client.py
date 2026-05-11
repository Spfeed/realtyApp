import requests
from models.dto import MlListing
from config.settings import LISTING_SERVICE_URL, ML_SERVICE_TOKEN

def get_listings() -> list[MlListing]:
    response = requests.get(
        f"{LISTING_SERVICE_URL}/listings/internal/ml/listings",
        headers={
            "Authorization": f"Bearer {ML_SERVICE_TOKEN}"
        },
        timeout=10
    )

    response.raise_for_status()

    return [MlListing(**item) for item in response.json()]