from __future__ import annotations

import pandas as pd
from collections import defaultdict

from recommenders.content_recommender import recommend_content
from recommenders.user_user_recommender import recommend_user_user
from datetime import datetime, timezone


def recommend_hybrid(
    events_df: pd.DataFrame,
    listings_df: pd.DataFrame,
    user_id: int,
    k: int = 10,
    alpha: float = 0.6,
    knn_k: int = 30,
) -> list[int]:
    pool_size = max(k * 3, 30)

    content_rec = recommend_content(
        events_df=events_df,
        listings_df=listings_df,
        user_id=user_id,
        k=pool_size,
    )

    collab_rec = recommend_user_user(
        events_df=events_df,
        listings_df=listings_df,
        user_id=user_id,
        k=pool_size,
        knn_k=knn_k,
    )

    if events_df.empty:
        seen = set()
    else:
        seen = set(
            events_df[events_df["userId"] == user_id]["listingId"]
            .astype(int)
            .tolist()
        )

    hidden = set(
        events_df[
            (events_df["userId"] == user_id)
            & (events_df["eventType"] == "HIDE")
            ]["listingId"]
        .astype(int)
        .tolist()
    ) if not events_df.empty else set()

    allowed_listing_ids = get_allowed_listing_ids(listings_df=listings_df, user_id=user_id, events_df=events_df)

    user_events = (
        events_df[events_df["userId"] == user_id]
        if not events_df.empty
        else pd.DataFrame()
    )

    if user_events.empty:
        return _cold_start_recommendations(
            events_df=events_df,
            listings_df=listings_df,
            user_id=user_id,
            k=k,
        )

    scores = defaultdict(float)

    for rank, listing_id in enumerate(content_rec, start=1):
        if listing_id in seen:
            continue

        if listing_id not in allowed_listing_ids:
            continue

        if listing_id in hidden:
            continue

        scores[int(listing_id)] += alpha * (1.0 / rank)

    for rank, listing_id in enumerate(collab_rec, start=1):
        if listing_id in seen:
            continue

        if listing_id not in allowed_listing_ids:
            continue

        if listing_id in hidden:
            continue

        scores[int(listing_id)] += (1.0 - alpha) * (1.0 / rank)

    scores = apply_popularity_freshness_boost(
        scores,
        events_df,
        listings_df,
    )

    ranked = sorted(scores.items(), key=lambda item: item[1], reverse=True)
    ranked = apply_diversity_penalty(ranked, listings_df)

    return [listing_id for listing_id, _ in ranked[:k]]


def score_hybrid(
    events_df: pd.DataFrame,
    listings_df: pd.DataFrame,
    user_id: int,
    k: int = 10,
    alpha: float = 0.6,
    knn_k: int = 30,
) -> dict[int, float]:
    pool_size = max(k * 3, 30)

    content_rec = recommend_content(events_df, listings_df, user_id, pool_size)
    collab_rec = recommend_user_user(events_df, listings_df, user_id, pool_size, knn_k)

    seen = set(
        events_df[events_df["userId"] == user_id]["listingId"]
        .astype(int)
        .tolist()
    ) if not events_df.empty else set()

    hidden = set(
        events_df[
            (events_df["userId"] == user_id)
            & (events_df["eventType"] == "HIDE")
        ]["listingId"]
        .astype(int)
        .tolist()
    ) if not events_df.empty else set()

    allowed_listing_ids = get_allowed_listing_ids(listings_df=listings_df, user_id=user_id, events_df=events_df)

    scores = defaultdict(float)

    for rank, listing_id in enumerate(content_rec, start=1):
        if (
            listing_id not in seen
            and listing_id not in hidden
            and listing_id in allowed_listing_ids
        ):
            scores[int(listing_id)] += alpha * (1.0 / rank)

    for rank, listing_id in enumerate(collab_rec, start=1):
        if (
            listing_id not in seen
            and listing_id not in hidden
            and listing_id in allowed_listing_ids
        ):
            scores[int(listing_id)] += (1.0 - alpha) * (1.0 / rank)

    scores = apply_popularity_freshness_boost(
        scores,
        events_df,
        listings_df,
    )

    return dict(scores)

def apply_diversity_penalty(
    ranked_items: list[tuple[int, float]],
    listings_df: pd.DataFrame,
    penalty: float = 0.15,
) -> list[tuple[int, float]]:
    if not ranked_items or listings_df.empty:
        return ranked_items

    listing_meta = listings_df.set_index("id").to_dict(orient="index")

    selected = []
    used_districts = set()

    for listing_id, score in ranked_items:
        listing = listing_meta.get(listing_id)

        if not listing:
            selected.append((listing_id, score))
            continue

        district_id = listing.get("districtId")

        adjusted_score = score

        if district_id is not None and district_id in used_districts:
            adjusted_score = score * (1.0 - penalty)

        selected.append((listing_id, adjusted_score))

        if district_id is not None:
            used_districts.add(district_id)

    return sorted(selected, key=lambda item: item[1], reverse=True)


def debug_hybrid(
    events_df: pd.DataFrame,
    listings_df: pd.DataFrame,
    user_id: int,
    k: int = 10,
    alpha: float = 0.6,
    knn_k: int = 30,
):
    pool_size = max(k * 3, 30)

    content_rec = recommend_content(events_df, listings_df, user_id, pool_size)
    collab_rec = recommend_user_user(events_df, listings_df, user_id, pool_size, knn_k)

    scores = score_hybrid(events_df, listings_df, user_id, k, alpha, knn_k)

    active_by_id = (
        listings_df[listings_df["status"] == "ACTIVE"]
        .set_index("id")
        .to_dict(orient="index")
    )

    recommendations = []

    ranked = sorted(scores.items(), key=lambda item: item[1], reverse=True)
    ranked = apply_diversity_penalty(ranked, listings_df)

    for listing_id, score in ranked:
        listing = active_by_id.get(listing_id)

        item = {
            "listingId": int(listing_id),
            "hybridScore": float(score),
            "title": listing.get("title") if listing else None,
            "fromContent": int(listing_id) in content_rec,
            "fromUserUser": int(listing_id) in collab_rec,
            "contentRank": content_rec.index(int(listing_id)) + 1 if int(listing_id) in content_rec else None,
            "userUserRank": collab_rec.index(int(listing_id)) + 1 if int(listing_id) in collab_rec else None,
        }

        item["reason"] = build_recommendation_reason(item)

        recommendations.append(item)


        if len(recommendations) >= k:
            break

    return {
        "userId": user_id,
        "alpha": alpha,
        "contentRecommendations": content_rec[:k],
        "userUserRecommendations": collab_rec[:k],
        "recommendations": recommendations,
    }

def _cold_start_recommendations(
    events_df: pd.DataFrame,
    listings_df: pd.DataFrame,
    user_id: int,
    k: int,
) -> list[int]:
    active = listings_df[
        (listings_df["status"] == "ACTIVE")
        & (listings_df["ownerId"] != user_id)
    ].copy()

    if active.empty:
        return []

    if events_df.empty:
        return active.sample(n=min(k, len(active)))["id"].astype(int).tolist()

    popularity = (
        events_df
        .groupby("listingId")["eventWeight"]
        .sum()
        .reset_index()
        .rename(columns={"eventWeight": "popularity"})
    )

    active = active.merge(
        popularity,
        left_on="id",
        right_on="listingId",
        how="left",
    )

    active["popularity"] = active["popularity"].fillna(0)

    active = active.sort_values(
        by=["popularity", "createdAt" if "createdAt" in active.columns else "id"],
        ascending=[False, False],
    )

    if active["popularity"].sum() == 0:
        return active.sample(n=min(k, len(active)))["id"].astype(int).tolist()

    return active["id"].astype(int).head(k).tolist()

def build_recommendation_reason(item: dict) -> str:
    from_content = item.get("fromContent")
    from_user_user = item.get("fromUserUser")

    if from_content and from_user_user:
        return "Похоже на ваши интересы и популярно среди похожих пользователей"

    if from_content:
        return "Похоже на объявления, которыми вы интересовались"

    if from_user_user:
        return "Популярно среди пользователей со схожими интересами"

    return "Может вам подойти"


def get_allowed_listing_ids(
    listings_df: pd.DataFrame,
    user_id: int,
    events_df: pd.DataFrame | None = None,
) -> set[int]:
    if listings_df.empty:
        return set()

    allowed = listings_df[
        (listings_df["status"] == "ACTIVE")
        & (listings_df["ownerId"] != user_id)
    ].copy()

    if events_df is not None and not events_df.empty:
        preferred_city_ids = get_preferred_city_ids(
            events_df=events_df,
            listings_df=listings_df,
            user_id=user_id,
        )

        if preferred_city_ids:
            allowed = allowed[
                allowed["cityId"].astype(int).isin(preferred_city_ids)
            ]

    return set(allowed["id"].astype(int).tolist())

def calculate_popularity_scores(
    events_df: pd.DataFrame,
) -> dict[int, float]:
    if events_df.empty:
        return {}

    popularity = (
        events_df
        .groupby("listingId")["eventWeight"]
        .sum()
        .to_dict()
    )

    max_popularity = max(popularity.values(), default=1)

    return {
        int(listing_id): score / max_popularity
        for listing_id, score in popularity.items()
    }

def calculate_freshness_score(
    created_at: str | None,
    max_age_days: int = 30,
) -> float:
    if not created_at:
        return 0.0

    try:
        created = datetime.fromisoformat(
            str(created_at).replace("Z", "+00:00")
        )

        if created.tzinfo is None:
            created = created.replace(tzinfo=timezone.utc)

        now = datetime.now(timezone.utc)

        age_days = (now - created).days

        freshness = max(0.0, 1.0 - (age_days / max_age_days))

        return freshness

    except Exception:
        return 0.0

def apply_popularity_freshness_boost(
    scores: dict[int, float],
    events_df: pd.DataFrame,
    listings_df: pd.DataFrame,
    popularity_weight: float = 0.08,
    freshness_weight: float = 0.05,
) -> dict[int, float]:
    if not scores:
        return scores

    boosted = dict(scores)

    popularity_scores = calculate_popularity_scores(events_df)

    listing_meta = (
        listings_df.set_index("id").to_dict(orient="index")
        if not listings_df.empty
        else {}
    )

    for listing_id in list(boosted.keys()):
        popularity_boost = popularity_scores.get(listing_id, 0.0) * popularity_weight

        listing = listing_meta.get(listing_id)
        freshness_boost = 0.0

        if listing:
            freshness_boost = calculate_freshness_score(
                listing.get("createdAt")
            ) * freshness_weight

        boosted[listing_id] += popularity_boost + freshness_boost

    return boosted

def get_preferred_city_ids(
    events_df: pd.DataFrame,
    listings_df: pd.DataFrame,
    user_id: int,
    max_cities: int = 2,
) -> set[int]:
    if events_df.empty or listings_df.empty:
        return set()

    user_listing_ids = (
        events_df[events_df["userId"] == user_id]["listingId"]
        .astype(int)
        .tolist()
    )

    if not user_listing_ids:
        return set()

    user_listings = listings_df[
        listings_df["id"].astype(int).isin(user_listing_ids)
    ]

    if user_listings.empty or "cityId" not in user_listings.columns:
        return set()

    return set(
        user_listings["cityId"]
        .dropna()
        .astype(int)
        .value_counts()
        .head(max_cities)
        .index
        .tolist()
    )