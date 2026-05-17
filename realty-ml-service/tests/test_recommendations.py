import pandas as pd

from recommenders.hybrid_recommender import recommend_hybrid


def listings_df():
    return pd.DataFrame([
        {
            "id": 1,
            "title": "Студия рядом с метро",
            "description": "Светлая квартира с ремонтом",
            "ownerId": 10,
            "cityId": 1,
            "districtId": 1,
            "price": 30000,
            "area": 30,
            "floor": 3,
            "hasElevator": True,
            "utilitiesIncluded": True,
            "depositAmount": 10000,
            "status": "ACTIVE",
            "livingRules": ["Можно с животными"],
            "createdAt": "2026-01-01T00:00:00Z",
        },
        {
            "id": 2,
            "title": "Однокомнатная квартира",
            "description": "Хороший ремонт, мебель",
            "ownerId": 11,
            "cityId": 1,
            "districtId": 1,
            "price": 35000,
            "area": 35,
            "floor": 5,
            "hasElevator": True,
            "utilitiesIncluded": False,
            "depositAmount": 15000,
            "status": "ACTIVE",
            "livingRules": [],
            "createdAt": "2026-01-02T00:00:00Z",
        },
        {
            "id": 3,
            "title": "Двухкомнатная квартира",
            "description": "Просторная квартира",
            "ownerId": 12,
            "cityId": 1,
            "districtId": 2,
            "price": 50000,
            "area": 55,
            "floor": 7,
            "hasElevator": True,
            "utilitiesIncluded": True,
            "depositAmount": 20000,
            "status": "ACTIVE",
            "livingRules": [],
            "createdAt": "2026-01-03T00:00:00Z",
        },
        {
            "id": 4,
            "title": "Скрытое объявление",
            "description": "Не должно попасть в рекомендации",
            "ownerId": 13,
            "cityId": 1,
            "districtId": 2,
            "price": 60000,
            "area": 60,
            "floor": 9,
            "hasElevator": False,
            "utilitiesIncluded": False,
            "depositAmount": 30000,
            "status": "ON_MODERATION",
            "livingRules": [],
            "createdAt": "2026-01-04T00:00:00Z",
        },
    ])


def test_hybrid_should_return_recommendations():
    events = pd.DataFrame([
        {
            "userId": 1,
            "listingId": 1,
            "eventType": "VIEW",
            "eventWeight": 1.0,
        }
    ])

    result = recommend_hybrid(
        events_df=events,
        listings_df=listings_df(),
        user_id=1,
        k=2,
    )

    assert len(result) > 0
    assert all(isinstance(item_id, int) for item_id in result)


def test_hybrid_should_not_recommend_seen_listings():
    events = pd.DataFrame([
        {
            "userId": 1,
            "listingId": 1,
            "eventType": "VIEW",
            "eventWeight": 1.0,
        }
    ])

    result = recommend_hybrid(
        events_df=events,
        listings_df=listings_df(),
        user_id=1,
        k=3,
    )

    assert 1 not in result


def test_hybrid_should_work_with_empty_user_history():
    events = pd.DataFrame(columns=[
        "userId",
        "listingId",
        "eventType",
        "eventWeight",
    ])

    result = recommend_hybrid(
        events_df=events,
        listings_df=listings_df(),
        user_id=1,
        k=2,
    )

    assert len(result) <= 2
    assert 4 not in result