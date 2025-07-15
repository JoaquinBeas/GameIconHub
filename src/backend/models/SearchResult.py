from typing import Literal


class PriceInfo:
    final: int           # precio final en cent (0 → Free / Próximamente)
    original: int | None # precio tachado; None si no hay rebaja
    discount_pct: int    # porcentaje negativo, 0 si no hay rebaja / bundle

    @property
    def is_free(self) -> bool:
        return self.final == 0


class SearchResult:
    """
    Representa una fila del listado de búsqueda de Steam.
    """
    type: Literal["app", "bundle"]       # bundle, app, soundtrack, etc.
    item_id: int                         # appid o bundleid
    url: str
    title: str
    capsule_img: str                     # 120 px
    release: str                         # texto tal cual (“8 Jul, 2021”, “2025”, …)
    review_class: str | None             # mixed, positive, overwhelmingly_positive…
    review_tooltip: str | None           # texto del tooltip
    platforms: list[str]                 # ['win','mac','linux','vr_supported', …]
    price: PriceInfo
