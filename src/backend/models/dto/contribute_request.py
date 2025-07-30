from pydantic import BaseModel


class ContributeRequest(BaseModel):
    email: str
    game: str
    iconUrl: str