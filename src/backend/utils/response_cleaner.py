# response_cleaner.py

from io import BytesIO
import json
from tkinter import Image
from typing import List, Literal
from bs4 import BeautifulSoup
# from backend.models.SearchResult import PriceInfo, SearchResult
# from backend.models.SearchEntry import SearchEntry
# from backend.models.SuggestionEntry import Suggestion
# from backend.steam_service import SteamService
from backend.models.SearchResult import PriceInfo, SearchResult
from backend.models.SearchEntry import SearchEntry
from backend.models.SuggestionEntry import Suggestion
from backend.steam_service import SteamService


class ResponseCleaner:
    
    def clean_suggestions(self, response: str) -> List[Suggestion]:
        """Parsea el fragmento HTML y devuelve una lista de Suggestion."""
        soup = BeautifulSoup(response, "html.parser")
        results: list[Suggestion] = []

        for a in soup.select("a.match"):
            kind = "app" if "match_app" in a.get("class", []) else "creator"
            name_tag = a.select_one(".match_name")
            img_tag = a.select_one(".match_img img")
            subtitle_tag = a.select_one(".match_subtitle")
            results.append(
            Suggestion(
                type=kind,
                url=a.get("href", ""),
                name=name_tag.get_text(strip=True) if name_tag else "",
                img=img_tag.get("src") if img_tag else None,
                subtitle=subtitle_tag.get_text(strip=True) if subtitle_tag else ""
            )
        )

        return results
    
    def clean_paginated_search(self, response_str) -> List[SearchEntry]:
        response = json.loads(response_str)
        html = response.get("results_html", "")

        # Ahora sí, parsea el HTML
        soup = BeautifulSoup(html, "html.parser")
        rows = soup.select("a.search_result_row")
        print("rows", rows)  # Esto ya no debería ser []
        entries: list[SearchEntry] = []

        for row in rows:
            classes = row.get("class", [])
            kind: Literal["app", "bundle"] = "bundle" if "bundle" in classes else "app"

            # Basic fields
            entry: SearchEntry = {
                "type": kind,
                "url": row.get("href", ""),
                "name": (row.select_one(".title") or "").get_text(strip=True),
                "img": (row.select_one(".search_capsule img") or {}).get("src", ""),
                "price": (row.select_one(".discount_final_price") or
                        row.select_one(".includes_games_results") or
                        row.select_one(".discount_final_price.free") or ""),
                "release": (row.select_one(".search_released") or ""),
                "review_class": (row.select_one(".search_review_summary") or {}).get("class", [""])[-1],
                "review_text": (row.select_one(".search_review_summary") or {}).get("data-tooltip-html", ""),
                "platforms": [p["class"][1] for p in row.select(".platform_img") if len(p["class"]) > 1],
                "extra": {},
            }

            # IDs
            if kind == "app":
                entry["id"] = row.get("data-ds-appid")  # string
            else:  # bundle
                entry["id"] = row.get("data-ds-bundleid")
                entry["extra"]["bundle_items"] = row.get("data-ds-bundle-data")

            entries.append(entry)

        return entries
    
    def clean_infinite_search(self, response) -> List[SearchResult]:
        """Devuelve los resultados visibles de la página de búsqueda."""
        soup = BeautifulSoup(response, "html.parser")
        results: list[SearchResult] = []

        for a in soup.select("a.search_result_row"):
            # tipo y ID
            if a.has_attr("data-ds-appid"):
                r_type: Literal["app", "bundle"] = "app"
                item_id = int(a["data-ds-appid"])
            elif a.has_attr("data-ds-bundleid"):
                r_type = "bundle"
                item_id = int(a["data-ds-bundleid"])
            else:  # fallback
                r_type = "app"
                item_id = 0

            # título, imagen, fecha
            title = (a.select_one(".title") or "").get_text(strip=True)
            img = (a.select_one(".search_capsule img") or {}).get("src", "")
            release = (a.select_one(".search_released") or "").get_text(strip=True)

            # reviews
            rev_span = a.select_one(".search_review_summary")
            review_class = rev_span["class"][-1] if rev_span else None  # mixed / positive…
            review_tooltip = rev_span.get("data-tooltip-html") if rev_span else None

            # plataformas
            platforms = [span["class"][1]  # 'win', 'mac', ...
                         for span in a.select(".platform_img")]

            # precio
            price_info = self._parse_price(
                a.select_one(".search_price_discount_combined")
            )

            results.append(
                SearchResult(
                    type=r_type,
                    item_id=item_id,
                    url=a.get("href", ""),
                    title=title,
                    capsule_img=img,
                    release=release,
                    review_class=review_class,
                    review_tooltip=review_tooltip,
                    platforms=platforms,
                    price=price_info,
                )
            )
        return results

    def extract_icon_url(self, response):
        soup = BeautifulSoup(response, "html.parser")

        div = soup.select_one("div.apphub_AppIcon > img[src]")
        return div["src"] if div else None
    
    def transform_into_icon(self, response: bytes, size: tuple[int, int] = (64, 64)) -> None:

        with Image.open(BytesIO(response)) as img:
            # Convert to RGBA in case it's not (for .ico support)
            img = img.convert("RGBA")
            img = img.resize(size, Image.LANCZOS)
            return img

    def _parse_price(self, col_price) -> PriceInfo:
        """
        Extrae precio final, original y descuento de la columna .search_price_discount_combined
        """
        final_str = col_price.get("data-price-final", "0")
        try:
            final = int(final_str)
        except ValueError:
            final = 0

        # % de descuento (si existe un div .discount_pct o .bundle_base_discount)
        pct_div = col_price.select_one(".discount_pct, .bundle_base_discount")
        discount_pct = int(pct_div.get_text(strip=True).lstrip("-%")) if pct_div else 0

        # precio original si hay rebaja
        orig_div = col_price.select_one(".discount_original_price")
        try:
            original = int(col_price["data-price-final"]) if orig_div else None
        except (KeyError, ValueError):
            original = None

        return SearchResult.PriceInfo(final=final, original=original, discount_pct=discount_pct)