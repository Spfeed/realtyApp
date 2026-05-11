import requests
from models.dto import UserListingEvent
from config.settings import RECOMMENDATION_SERVICE_URL, ML_SERVICE_TOKEN

def get_events() -> list[UserListingEvent]:
    response = requests.get(
        f"{RECOMMENDATION_SERVICE_URL}/recommendations/internal/ml/events",
        headers={
            "Authorization": f"Bearer {ML_SERVICE_TOKEN}"
        },
        timeout=10
    )

    response.raise_for_status()

    return [UserListingEvent(**item) for item in response.json()]