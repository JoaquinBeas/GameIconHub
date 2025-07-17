from dataclasses import dataclass
from typing import Optional, Literal

@dataclass
class Suggestion:
    """
    Representa una entrada devuelta por /search/suggest.
    """
    type: Literal["app", "creator"]
    url: str
    name: str
    img: Optional[str]
    subtitle: str