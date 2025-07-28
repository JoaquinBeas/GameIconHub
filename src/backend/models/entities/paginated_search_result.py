from typing import Any, Literal, TypedDict

class PaginatedSearchResult(TypedDict, total=False):
    """
    Represents a single search result entry returned by a paginated Steam search.

    This is a looser (optional) structure compared to dataclasses and is commonly
    used for dynamic or partially known dictionaries (e.g. JSON-like responses).
    `total=False` means all fields are optional.
    """
    id: str  # Steam App ID or Bundle ID (as string)
    type: Literal["app", "bundle"]  # Type of result: individual app or bundle
    name: str  # Title/name of the game or bundle
    url: str  # Link to the item's Steam page
    img: str  # URL to the capsule image
    price: str  # Final price displayed as text (e.g., "$9.99" or "Free")
    release: str  # Release date string
    review_class: str  # CSS class representing review sentiment
    review_text: str  # Tooltip or label with review summary
    platforms: list[str]  # Platform tags like ['win', 'mac', 'linux']
    extra: dict[str, Any]  # Optional additional metadata, like bundle contents
