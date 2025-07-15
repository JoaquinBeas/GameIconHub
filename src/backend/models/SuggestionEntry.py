from typing import Literal


class Suggestion:
    """
    Representa una entrada devuelta por /search/suggest.
    """
    type: Literal["app", "creator"]
    url: str
    name: str
    img: str | None
    subtitle: str  # precio, “Free”, “38 games”, …