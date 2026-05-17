from fastapi import FastAPI, HTTPException
import py_eureka_client.eureka_client as eureka_client

from config.settings import (
    EUREKA_SERVER_URL,
    ML_SERVICE_HOST,
    ML_SERVICE_PORT,
    DEBUG_ENDPOINTS_ENABLED,
)

from services.recommendation_service import (
    load_data,
    get_content_recommendations,
    get_content_debug,
    get_user_user_recommendations,
    get_user_user_debug,
    get_hybrid_recommendations,
    get_hybrid_debug,
)

app = FastAPI(title="Realty ML Recommendation Service")


@app.on_event("startup")
async def startup_event():
    await eureka_client.init_async(
        eureka_server=EUREKA_SERVER_URL,
        app_name="ml-service",
        instance_port=ML_SERVICE_PORT,
        instance_host=ML_SERVICE_HOST,
    )


@app.on_event("shutdown")
async def shutdown_event():
    await eureka_client.stop_async()


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/recommendations/hybrid/{user_id}")
def get_hybrid(user_id: int, limit: int = 10, alpha: float = 0.6):
    return get_hybrid_recommendations(user_id=user_id, limit=limit, alpha=alpha)

@app.get("/recommendations/content/{user_id}")
def get_content(user_id: int, limit: int = 10):
    return get_content_recommendations(user_id=user_id, limit=limit)


@app.get("/recommendations/user-user/{user_id}")
def get_user_user(user_id: int, limit: int = 10):
    return get_user_user_recommendations(user_id=user_id, limit=limit)

@app.get("/recommendations/content/{user_id}/debug")
def get_content_debug_endpoint(user_id: int, limit: int = 10):
    if not DEBUG_ENDPOINTS_ENABLED:
        raise HTTPException(status_code=404, detail="Not found")

    return get_content_debug(user_id=user_id, limit=limit)

@app.get("/recommendations/user-user/{user_id}/debug")
def get_user_user_debug_endpoint(user_id: int, limit: int = 10):
    if not DEBUG_ENDPOINTS_ENABLED:
        raise HTTPException(status_code=404, detail="Not found")

    return get_user_user_debug(user_id=user_id, limit=limit)

@app.get("/debug/data")
def debug_data():
    if not DEBUG_ENDPOINTS_ENABLED:
        raise HTTPException(status_code=404, detail="Not found")

    events_df, listings_df = load_data()

    return {
        "events_count": len(events_df),
        "listings_count": len(listings_df),
        "events_columns": list(events_df.columns),
        "listings_columns": list(listings_df.columns),
        "events_preview": events_df.head(5).to_dict(orient="records"),
        "listings_preview": listings_df.head(5).to_dict(orient="records"),
    }

@app.get("/recommendations/hybrid/{user_id}/debug")
def get_hybrid_debug_endpoint(user_id: int, limit: int = 10, alpha: float = 0.6):
    if not DEBUG_ENDPOINTS_ENABLED:
        raise HTTPException(status_code=404, detail="Not found")

    return get_hybrid_debug(user_id=user_id, limit=limit, alpha=alpha)