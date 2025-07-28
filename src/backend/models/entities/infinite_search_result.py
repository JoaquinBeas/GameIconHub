from dataclasses import dataclass
from typing import Literal

@dataclass
class PriceInfo:
    """Represents the pricing details of a Steam item."""
    final: int  # Final price (in cents or smallest currency unit)
    original: int | None  # Original price before discount, if any
    discount_pct: int  # Discount percentage

    @property
    def is_free(self) -> bool:
        """Returns True if the item is free (final price is zero)."""
        return self.final == 0


@dataclass
class InfiniteSearchResult:
    """
    Represents a single row in the Steam search results.
    """
    type: Literal["app", "bundle"]  # Type of the item (individual app or bundle)
    item_id: int  # Steam App ID or Bundle ID
    url: str  # URL to the item's Steam page
    title: str  # Name/title of the item
    capsule_img: str  # URL to the capsule image
    release: str  # Release date as string
    review_class: str | None  # CSS class indicating review sentiment (e.g., 'positive')
    review_tooltip: str | None  # Tooltip text with review summary
    platforms: list[str]  # List of supported platforms (e.g., ['win', 'mac'])
    price: PriceInfo  # Pricing information
