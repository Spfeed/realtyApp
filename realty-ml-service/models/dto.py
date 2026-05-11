from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class UserListingEvent(BaseModel):
    userId: int
    listingId: int
    eventType: str
    eventWeight: float
    createdAt: datetime


class MlListing(BaseModel):
    id: int
    title: str = ""
    description: str = ""
    ownerId: int
    cityId: int
    districtId: Optional[int] = None
    price: float
    area: float
    floor: Optional[int] = None
    hasElevator: bool
    utilitiesIncluded: bool
    depositAmount: float
    status: str
    livingRules: list[str] = []