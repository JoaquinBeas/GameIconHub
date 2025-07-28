# response_cleaner.py

from io import BytesIO
import json
import re
from PIL import Image
from typing import List, Literal
from bs4 import BeautifulSoup
from backend.models.InfiniteSearchResult import PriceInfo, InfiniteSearchResult
from backend.models.PaginatedSearchResult import PaginatedSearchResult
from backend.models.SuggestionResult import Suggestion

class ResponseCleaner:
    
    def clean_suggestions(self, response: str) -> List[Suggestion]:
        """Parses the HTML snippet returned by Steam's suggestion API and returns a list of Suggestion objects."""
        soup = BeautifulSoup(response, "html.parser")
        results: list[Suggestion] = []

        for a in soup.select("a.match"):
            # Determine if it's a game/app or a creator
            kind = "app" if "match_app" in a.get("class", []) else "creator"
            name_tag = a.select_one(".match_name")
            img_tag = a.select_one(".match_img img")
            subtitle_tag = a.select_one(".match_subtitle")

            # Build the Suggestion object
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

    def clean_paginated_search(self, response_str) -> List[PaginatedSearchResult]:
        """Parses a paginated JSON search response and extracts structured PaginatedSearchResult objects."""
        response = json.loads(response_str)
        html = response.get("results_html", "")

        # Parse the HTML within the JSON response
        soup = BeautifulSoup(html, "html.parser")
        rows = soup.select("a.search_result_row")
        entries: list[PaginatedSearchResult] = []

        for row in rows:
            classes = row.get("class", [])
            kind: Literal["app", "bundle"] = "bundle" if "bundle" in classes else "app"

            # Extract core fields from HTML structure
            entry: PaginatedSearchResult = {
                "type": kind,
                "url": row.get("href", ""),
                "name": (row.select_one(".title") or "").get_text(strip=True),
                "img": (row.select_one(".search_capsule img") or {}).get("src", ""),
                "price": (
                    (row.select_one(".discount_final_price") or
                     row.select_one(".includes_games_results") or
                     row.select_one(".discount_final_price.free") or None)
                    and (row.select_one(".discount_final_price") or
                         row.select_one(".includes_games_results") or
                         row.select_one(".discount_final_price.free")).get_text(strip=True)
                ) or "",
                "release": (
                    (row.select_one(".search_released") or None)
                    and row.select_one(".search_released").get_text(strip=True)
                ) or "",
                "review_class": (row.select_one(".search_review_summary") or {}).get("class", [""])[-1],
                "review_text": (row.select_one(".search_review_summary") or {}).get("data-tooltip-html", ""),
                "platforms": [p["class"][1] for p in row.select(".platform_img") if len(p["class"]) > 1],
                "extra": {},
            }

            # Set app or bundle ID
            if kind == "app":
                entry["id"] = row.get("data-ds-appid")
            else:
                entry["id"] = row.get("data-ds-bundleid")
                entry["extra"]["bundle_items"] = row.get("data-ds-bundle-data")

            entries.append(entry)

        return entries

    def clean_infinite_search(self, response) -> List[InfiniteSearchResult]:
        """Parses the raw HTML of an infinite search result and returns a list of structured InfiniteSearchResult objects."""
        soup = BeautifulSoup(response, "html.parser")
        results: list[InfiniteSearchResult] = []

        for a in soup.select("a.search_result_row"):
            # Identify type and extract ID
            if a.has_attr("data-ds-appid"):
                r_type: Literal["app", "bundle"] = "app"
                item_id = int(a["data-ds-appid"])
            elif a.has_attr("data-ds-bundleid"):
                r_type = "bundle"
                item_id = int(a["data-ds-bundleid"])
            else:
                r_type = "app"
                item_id = 0

            # Extract basic fields
            title = (a.select_one(".title") or "").get_text(strip=True)
            img = (a.select_one(".search_capsule img") or {}).get("src", "")
            release = (a.select_one(".search_released") or "").get_text(strip=True)

            # Extract review info
            rev_span = a.select_one(".search_review_summary")
            review_class = rev_span["class"][-1] if rev_span else None
            review_tooltip = rev_span.get("data-tooltip-html") if rev_span else None

            # Extract platform icons (e.g., win, mac, linux)
            platforms = [span["class"][1] for span in a.select(".platform_img")]

            # Extract price information
            price_info = self._parse_price(
                a.select_one(".search_price_discount_combined")
            )

            # Compose and append result
            results.append(
                InfiniteSearchResult(
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
        """Extracts the icon URL from a raw HTML response (typically from SteamDB)."""
        soup = BeautifulSoup(response, "html.parser")
        
        for tr in soup.find_all("tr"):
            tds = tr.find_all("td")
            # Look for row where the first column is "clienticon"
            if len(tds) >= 2 and tds[0].get_text(strip=True).lower() == "clienticon":
                a_tag = tds[1].find("a", href=True)
                if a_tag:
                    return a_tag["href"]
        
        return None

    def transform_into_icon(self, response: bytes, size: tuple[int, int] = (64, 64)):
        """Converts raw image bytes into a resized PNG icon in memory."""
        with Image.open(BytesIO(response)) as img:
            img = img.convert("RGBA")  # Ensure transparent background
            img = img.resize(size, Image.LANCZOS)  # High-quality resize
            output = BytesIO()
            img.save(output, format="PNG")
            output.seek(0)  # Reset stream position
            return output

    def _parse_price(self, col_price) -> PriceInfo:
        """
        Parses a search result price block (.search_price_discount_combined)
        and extracts final price, original price (if discounted), and discount percent.
        """
        final_str = col_price.get("data-price-final", "0")
        try:
            final = int(final_str)
        except ValueError:
            final = 0

        # Try to find discount percentage from discount-related elements
        pct_div = col_price.select_one(".discount_pct, .bundle_base_discount")
        if pct_div:
            pct_text = pct_div.get_text(strip=True)
            match = re.search(r'\d+', pct_text)
            discount_pct = int(match.group()) if match else 0
        else:
            discount_pct = 0

        # Get original price only if there’s a discount
        orig_div = col_price.select_one(".discount_original_price")
        try:
            original = int(col_price["data-price-final"]) if orig_div else None
        except (KeyError, ValueError):
            original = None

        return PriceInfo(final=final, original=original, discount_pct=discount_pct)