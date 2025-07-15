from typing import Any, Literal, TypedDict


class SearchEntry(TypedDict, total=False):
    id: str                    # appid / bundleid
    type: Literal["app", "bundle"]
    name: str
    url: str
    img: str
    price: str                 # "Free", "19,99€", "Includes 2 games", …
    release: str               # "27 Apr, 2017" or "" (bundles often empty)
    review_class: str          # "positive", "mixed", "negative"…
    review_text: str           # full tooltip html (already decoded)
    platforms: list[str]       # ["win", "mac", "linux", "music", "vr_required"]
    extra: dict[str, Any] 