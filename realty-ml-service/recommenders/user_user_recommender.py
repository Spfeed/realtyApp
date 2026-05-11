from __future__ import annotations

import numpy as np
import pandas as pd

from scipy.sparse import csr_matrix


def _build_interaction_matrix(
    events_df: pd.DataFrame,
    listings_df: pd.DataFrame,
):
    if events_df.empty or listings_df.empty:
        return np.array([], dtype=int), np.array([], dtype=int), csr_matrix((0, 0))

    active_listing_ids = (
        listings_df[listings_df["status"] == "ACTIVE"]["id"]
        .astype(int)
        .sort_values()
        .to_numpy()
    )

    if len(active_listing_ids) == 0:
        return np.array([], dtype=int), np.array([], dtype=int), csr_matrix((0, 0))

    events = events_df[
        events_df["listingId"].astype(int).isin(set(active_listing_ids.tolist()))
    ].copy()

    if events.empty:
        return np.array([], dtype=int), active_listing_ids, csr_matrix((0, len(active_listing_ids)))

    user_ids = events["userId"].astype(int).drop_duplicates().sort_values().to_numpy()
    listing_ids = active_listing_ids

    user_index = {user_id: idx for idx, user_id in enumerate(user_ids)}
    listing_index = {listing_id: idx for idx, listing_id in enumerate(listing_ids)}

    grouped_events = (
        events
        .groupby(["userId", "listingId"])["eventWeight"]
        .sum()
        .reset_index()
    )

    rows = []
    cols = []
    data = []

    for _, event in grouped_events.iterrows():
        user_id = int(event["userId"])
        listing_id = int(event["listingId"])
        weight = float(event["eventWeight"])

        if user_id in user_index and listing_id in listing_index:
            rows.append(user_index[user_id])
            cols.append(listing_index[listing_id])
            data.append(weight)

    R = csr_matrix(
        (data, (rows, cols)),
        shape=(len(user_ids), len(listing_ids)),
        dtype=np.float32,
    )

    return user_ids, listing_ids, R


def _cosine_sim_row_to_all(R: csr_matrix, user_idx: int) -> np.ndarray:
    user_vector = R.getrow(user_idx)

    if user_vector.nnz == 0:
        return np.zeros(R.shape[0], dtype=np.float32)

    dots = (R @ user_vector.T).toarray().ravel()

    user_norms = np.sqrt(R.multiply(R).sum(axis=1)).A1 + 1e-9
    current_user_norm = user_norms[user_idx]

    similarities = dots / (user_norms * current_user_norm)
    similarities[user_idx] = -1.0

    return similarities.astype(np.float32)


def recommend_user_user(
    events_df: pd.DataFrame,
    listings_df: pd.DataFrame,
    user_id: int,
    k: int = 10,
    knn_k: int = 30,
) -> list[int]:
    user_ids, listing_ids, R = _build_interaction_matrix(
        events_df=events_df,
        listings_df=listings_df,
    )

    if R.shape[0] == 0 or R.shape[1] == 0:
        return []

    if user_id not in set(user_ids.tolist()):
        return []

    user_idx = int(np.where(user_ids == user_id)[0][0])

    user_vector = R.getrow(user_idx)

    if user_vector.nnz == 0:
        return []

    similarities = _cosine_sim_row_to_all(R, user_idx)

    nearest_indices = np.argsort(-similarities)[:knn_k]
    nearest_similarities = similarities[nearest_indices]

    scores = np.asarray(R[nearest_indices].T @ nearest_similarities).ravel()

    seen_listing_indices = set(user_vector.indices.tolist())

    if seen_listing_indices:
        scores[list(seen_listing_indices)] = -np.inf

    order = np.argsort(-scores)

    result = []

    owner_by_id = listings_df.set_index("id")["ownerId"].to_dict()

    for listing_idx in order:
        if not np.isfinite(scores[listing_idx]):
            continue

        if scores[listing_idx] <= 0:
            continue

        listing_id = int(listing_ids[listing_idx])

        if int(owner_by_id.get(listing_id, -1)) == user_id:
            continue

        result.append(listing_id)

        if len(result) >= k:
            break

    return result


def score_user_user(
    events_df: pd.DataFrame,
    listings_df: pd.DataFrame,
    user_id: int,
    knn_k: int = 30,
) -> dict[int, float]:
    user_ids, listing_ids, R = _build_interaction_matrix(
        events_df=events_df,
        listings_df=listings_df,
    )

    if R.shape[0] == 0 or R.shape[1] == 0:
        return {}

    if user_id not in set(user_ids.tolist()):
        return {}

    user_idx = int(np.where(user_ids == user_id)[0][0])

    user_vector = R.getrow(user_idx)

    if user_vector.nnz == 0:
        return {}

    similarities = _cosine_sim_row_to_all(R, user_idx)

    nearest_indices = np.argsort(-similarities)[:knn_k]
    nearest_similarities = similarities[nearest_indices]

    scores = np.asarray(R[nearest_indices].T @ nearest_similarities).ravel()

    seen_listing_indices = set(user_vector.indices.tolist())

    result = {}

    owner_by_id = listings_df.set_index("id")["ownerId"].to_dict()

    for listing_idx, score in enumerate(scores):
        if listing_idx in seen_listing_indices:
            continue

        if not np.isfinite(score) or score <= 0:
            continue

        listing_id = int(listing_ids[listing_idx])

        if int(owner_by_id.get(listing_id, -1)) == user_id:
            continue

        result[listing_id] = float(score)

    return result


def debug_user_user(
    events_df: pd.DataFrame,
    listings_df: pd.DataFrame,
    user_id: int,
    k: int = 10,
    knn_k: int = 30,
):
    user_ids, listing_ids, R = _build_interaction_matrix(
        events_df=events_df,
        listings_df=listings_df,
    )

    if R.shape[0] == 0 or R.shape[1] == 0:
        return {
            "userId": user_id,
            "reason": "empty_matrix",
            "similarUsers": [],
            "recommendations": [],
        }

    if user_id not in set(user_ids.tolist()):
        return {
            "userId": user_id,
            "reason": "user_not_found",
            "similarUsers": [],
            "recommendations": [],
        }

    user_idx = int(np.where(user_ids == user_id)[0][0])
    user_vector = R.getrow(user_idx)

    if user_vector.nnz == 0:
        return {
            "userId": user_id,
            "reason": "user_has_no_events",
            "similarUsers": [],
            "recommendations": [],
        }

    similarities = _cosine_sim_row_to_all(R, user_idx)

    nearest_indices = np.argsort(-similarities)[:knn_k]

    similar_users = []

    for idx in nearest_indices:
        similarity = float(similarities[idx])

        if similarity <= 0:
            continue

        similar_users.append({
            "userId": int(user_ids[idx]),
            "similarity": similarity,
        })

    scores = score_user_user(
        events_df=events_df,
        listings_df=listings_df,
        user_id=user_id,
        knn_k=knn_k,
    )

    active_by_id = (
        listings_df[listings_df["status"] == "ACTIVE"]
        .set_index("id")
        .to_dict(orient="index")
    )

    recommendations = []

    for listing_id, score in sorted(scores.items(), key=lambda item: item[1], reverse=True):
        listing = active_by_id.get(listing_id)

        recommendations.append({
            "listingId": int(listing_id),
            "score": float(score),
            "title": listing.get("title") if listing else None,
        })

        if len(recommendations) >= k:
            break

    return {
        "userId": user_id,
        "similarUsers": similar_users,
        "recommendations": recommendations,
    }