from pydantic import BaseModel

class ContactRequest(BaseModel):
    email: str
    text: str