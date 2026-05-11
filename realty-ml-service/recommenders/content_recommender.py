from __future__ import annotations

import numpy as np
import pandas as pd

from scipy.sparse import csr_matrix, hstack
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import OneHotEncoder, StandardScaler
import re


def _build_items_matrix(listings_df: pd.DataFrame):
    if listings_df.empty:
        return np.array([], dtype=int), csr_matrix((0, 0), dtype=np.float32)

    listings = listings_df.copy()

    listings = listings[listings["status"] == "ACTIVE"].copy()

    if listings.empty:
        return np.array([], dtype=int), csr_matrix((0, 0), dtype=np.float32)

    listings = listings.sort_values("id")

    item_ids = listings["id"].astype(int).to_numpy()

    listings["floor"] = listings["floor"].fillna(0)
    listings["districtId"] = listings["districtId"].fillna(-1)

    X_num = listings[
        [
            "price",
            "area",
            "depositAmount",
            "floor",
        ]
    ].astype(float).to_numpy()

    X_num_s = StandardScaler().fit_transform(X_num)

    X_bin = listings[
        [
            "hasElevator",
            "utilitiesIncluded",
        ]
    ].astype(float).to_numpy()

    X_cat = listings[
        [
            "cityId",
            "districtId",
        ]
    ].astype(int).to_numpy()

    cat_enc = OneHotEncoder(handle_unknown="ignore", sparse_output=True)
    X_cat_oh = cat_enc.fit_transform(X_cat)

    listings["title"] = listings["title"].fillna("")
    listings["description"] = listings["description"].fillna("")

    if "livingRules" not in listings.columns:
        listings["livingRules"] = [[] for _ in range(len(listings))]

    rules_text = listings["livingRules"].apply(
        lambda rules: " ".join(rules) if isinstance(rules, list) else ""
    )

    texts = (
            listings["title"].astype(str)
            + " "
            + listings["description"].astype(str)
            + " "
            + rules_text.astype(str)
    ).apply(normalize_listing_text)

    tfidf = TfidfVectorizer(
        max_features=5000,
        min_df=1,
        ngram_range=(1, 2),
        lowercase=True,
        stop_words=[
            "и", "в", "во", "на", "с", "со", "к", "ко", "по",
            "для", "от", "до", "за", "из", "у", "о", "об",
            "это", "как", "что", "рядом", "есть",
        ],
    )

    X_txt = tfidf.fit_transform(texts)

    X = hstack(
        [
            csr_matrix(X_num_s),
            csr_matrix(X_bin),
            X_cat_oh,
            X_txt,
        ]
    ).tocsr().astype(np.float32)

    return item_ids, X, listings


def _build_user_profile_vector(
        events_df: pd.DataFrame,
        user_id: int,
        item_ids: np.ndarray,
        X: csr_matrix,
):
    if events_df.empty:
        return None, set()

    user_events = events_df[events_df["userId"] == user_id]

    if user_events.empty:
        return None, set()

    weights_by_item = (
        user_events
        .groupby("listingId")["eventWeight"]
        .sum()
        .to_dict()
    )

    seen = set(int(item_id) for item_id in weights_by_item.keys())

    idx_map = {int(item_id): idx for idx, item_id in enumerate(item_ids)}

    row_idx = []
    weights = []

    for item_id, weight in weights_by_item.items():
        idx = idx_map.get(int(item_id))

        if idx is None:
            continue

        row_idx.append(idx)
        weights.append(float(weight))

    if not row_idx:
        return None, seen

    V = X[row_idx]
    W = np.array(weights, dtype=np.float32)

    user_vector = (W.reshape(1, -1) @ V).astype(np.float32)
    user_vector = user_vector / (float(W.sum()) + 1e-9)

    return user_vector, seen


def recommend_content(
        events_df: pd.DataFrame,
        listings_df: pd.DataFrame,
        user_id: int,
        k: int = 10,
) -> list[int]:
    item_ids, X, active_listings = _build_items_matrix(listings_df)

    if len(item_ids) == 0:
        return []

    user_vector, seen = _build_user_profile_vector(
        events_df=events_df,
        user_id=user_id,
        item_ids=item_ids,
        X=X,
    )

    if user_vector is None:
        cold_start = active_listings[active_listings["ownerId"] != user_id].sort_values(
            by=["depositAmount", "utilitiesIncluded", "price"],
            ascending=[True, False, True],
        )

        return cold_start["id"].astype(int).head(k).tolist()

    sims = cosine_similarity(user_vector, X).ravel()
    order = np.argsort(-sims)

    result = []

    owner_by_id = active_listings.set_index("id")["ownerId"].to_dict()

    for idx in order:
        item_id = int(item_ids[idx])

        if item_id in seen:
            continue

        if int(owner_by_id.get(item_id, -1)) == user_id:
            continue

        result.append(item_id)

        if len(result) >= k:
            break

    return result


def score_content(
        events_df: pd.DataFrame,
        listings_df: pd.DataFrame,
        user_id: int,
) -> dict[int, float]:
    item_ids, X, _ = _build_items_matrix(listings_df)

    if len(item_ids) == 0:
        return {}

    user_vector, seen = _build_user_profile_vector(
        events_df=events_df,
        user_id=user_id,
        item_ids=item_ids,
        X=X,
    )

    if user_vector is None:
        return {}

    sims = cosine_similarity(user_vector, X).ravel()

    owner_by_id = listings_df.set_index("id")["ownerId"].to_dict()

    return {
        int(item_id): float(score)
        for item_id, score in zip(item_ids, sims)
        if int(item_id) not in seen
           and int(owner_by_id.get(int(item_id), -1)) != user_id
    }


def debug_content(
        events_df: pd.DataFrame,
        listings_df: pd.DataFrame,
        user_id: int,
        k: int = 10,
):
    item_ids, X, active_listings = _build_items_matrix(listings_df)

    if len(item_ids) == 0:
        return {
            "userId": user_id,
            "seenListingIds": [],
            "recommendations": [],
        }

    user_vector, seen = _build_user_profile_vector(
        events_df=events_df,
        user_id=user_id,
        item_ids=item_ids,
        X=X,
    )

    if user_vector is None:
        return {
            "userId": user_id,
            "seenListingIds": [],
            "reason": "cold_start",
            "recommendations": recommend_content(events_df, listings_df, user_id, k),
        }

    scores = score_content(events_df, listings_df, user_id)

    active_by_id = active_listings.set_index("id").to_dict(orient="index")

    recommendations = []

    for listing_id, score in sorted(scores.items(), key=lambda item: item[1], reverse=True):
        listing = active_by_id.get(listing_id)

        if listing is None:
            continue

        recommendations.append({
            "listingId": int(listing_id),
            "score": float(score),
            "title": listing.get("title"),
            "cityId": int(listing.get("cityId")),
            "districtId": int(listing.get("districtId")) if pd.notna(listing.get("districtId")) else None,
            "price": float(listing.get("price")),
            "area": float(listing.get("area")),
            "floor": (
                int(listing.get("floor"))
                if pd.notna(listing.get("floor")) and int(listing.get("floor")) > 0
                else None
            ),
            "hasElevator": bool(listing.get("hasElevator")),
            "utilitiesIncluded": bool(listing.get("utilitiesIncluded")),
            "depositAmount": float(listing.get("depositAmount")),
        })

        if len(recommendations) >= k:
            break

    user_events = events_df[events_df["userId"] == user_id].copy()

    return {
        "userId": user_id,
        "seenListingIds": sorted([int(item_id) for item_id in seen]),
        "userEvents": user_events.to_dict(orient="records"),
        "recommendations": recommendations,
    }


def normalize_listing_text(text: str) -> str:
    text = str(text).lower()

    replacements = {
        r"\b1\s*к\b": " однокомнатная ",
        r"\b1-комнатн\w*\b": " однокомнатная ",
        r"\bоднушк\w*\b": " однокомнатная ",

        r"\b2\s*к\b": " двухкомнатная ",
        r"\b2-комнатн\w*\b": " двухкомнатная ",
        r"\bдвушк\w*\b": " двухкомнатная ",

        r"\b3\s*к\b": " трехкомнатная ",
        r"\b3-комнатн\w*\b": " трехкомнатная ",
        r"\bтрешк\w*\b": " трехкомнатная ",

        r"\bстуд\w*\b": " студия ",
        r"\bметро\b": " метро ",
        r"\bмебел\w*\b": " мебель ",
        r"\bремонт\w*\b": " ремонт ",
    }

    for pattern, replacement in replacements.items():
        text = re.sub(pattern, replacement, text)

    text = re.sub(r"[^а-яa-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()

    return text