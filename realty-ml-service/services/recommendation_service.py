import pandas as pd

from clients.recommendation_client import get_events
from clients.listing_client import get_listings
from recommenders.content_recommender import recommend_content, score_content, debug_content
from recommenders.user_user_recommender import recommend_user_user, score_user_user, debug_user_user
from recommenders.hybrid_recommender import recommend_hybrid, score_hybrid, debug_hybrid

from datetime import datetime, timezone
import math

def apply_time_decay(
    events_df: pd.DataFrame,
    decay_rate: float = 0.015,
) -> pd.DataFrame:
    if events_df.empty:
        return events_df

    events = events_df.copy()

    def decay_row(row):
        created_at = row.get("createdAt")

        if not created_at:
            return row["eventWeight"]

        try:
            event_time = datetime.fromisoformat(
                str(created_at).replace("Z", "+00:00")
            )

            if event_time.tzinfo is None:
                event_time = event_time.replace(tzinfo=timezone.utc)

            now = datetime.now(timezone.utc)

            age_days = max((now - event_time).days, 0)
            decay = math.exp(-decay_rate * age_days)

            return float(row["eventWeight"]) * decay

        except Exception:
            return row["eventWeight"]

    events["eventWeight"] = events.apply(decay_row, axis=1)

    return events

def load_data():
    events = get_events()
    listings = get_listings()

    events_df = pd.DataFrame([event.model_dump() for event in events])
    listings_df = pd.DataFrame([listing.model_dump() for listing in listings])

    events_df = apply_time_decay(events_df)

    return events_df, listings_df

def get_content_recommendations(user_id: int, limit: int = 10):
    events_df, listings_df = load_data()

    listing_ids = recommend_content(
        events_df=events_df,
        listings_df=listings_df,
        user_id=user_id,
        k=limit,
    )

    scores = score_content(
        events_df=events_df,
        listings_df=listings_df,
        user_id=user_id,
    )

    return [
        {
            "listingId": listing_id,
            "score": scores.get(listing_id, 0.0),
        }
        for listing_id in listing_ids
    ]

def get_content_debug(user_id: int, limit: int = 10):
    events_df, listings_df = load_data()

    return debug_content(
        events_df=events_df,
        listings_df=listings_df,
        user_id=user_id,
        k=limit,
    )

def get_user_user_recommendations(user_id: int, limit: int = 10):
    events_df, listings_df = load_data()

    listing_ids = recommend_user_user(
        events_df=events_df,
        listings_df=listings_df,
        user_id=user_id,
        k=limit,
    )

    scores = score_user_user(
        events_df=events_df,
        listings_df=listings_df,
        user_id=user_id,
    )

    return [
        {
            "listingId": listing_id,
            "score": scores.get(listing_id, 0.0),
        }
        for listing_id in listing_ids
    ]


def get_user_user_debug(user_id: int, limit: int = 10):
    events_df, listings_df = load_data()

    return debug_user_user(
        events_df=events_df,
        listings_df=listings_df,
        user_id=user_id,
        k=limit,
    )

def get_hybrid_recommendations(user_id: int, limit: int = 10, alpha: float = 0.6):
    events_df, listings_df = load_data()

    listing_ids = recommend_hybrid(
        events_df=events_df,
        listings_df=listings_df,
        user_id=user_id,
        k=limit,
        alpha=alpha,
    )

    scores = score_hybrid(
        events_df=events_df,
        listings_df=listings_df,
        user_id=user_id,
        k=limit,
        alpha=alpha,
    )

    return [
        {
            "listingId": listing_id,
            "score": scores.get(listing_id, 0.0),
        }
        for listing_id in listing_ids
    ]


def get_hybrid_debug(user_id: int, limit: int = 10, alpha: float = 0.6):
    events_df, listings_df = load_data()

    return debug_hybrid(
        events_df=events_df,
        listings_df=listings_df,
        user_id=user_id,
        k=limit,
        alpha=alpha,
    )