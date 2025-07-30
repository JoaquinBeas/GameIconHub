from dataclasses import dataclass
from typing import Optional, Literal

@dataclass
class Suggestion:
    """
    Represents a suggestion entry returned by the /search/suggest Steam endpoint.

    Fields:
    - type: Indicates whether the suggestion is a game/app or a creator.
    - url: Link to the app or creator's Steam page.
    - name: Display name of the app or creator.
    - img: Optional image URL for the suggestion (e.g. icon or thumbnail).
    - subtitle: Additional info, such as genre or creator name.
    """
    type: Literal["app", "creator"]
    url: str
    name: str
    img: Optional[str]
    subtitle: str
