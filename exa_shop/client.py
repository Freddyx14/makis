"""Exa-backed product search for e-commerce research.

Wraps the /search endpoint with the defaults that suit catalog discovery:
type="auto" for balanced relevance and speed, and highlights for
token-efficient excerpts that can be handed straight to an LLM.
"""

import os
from dataclasses import dataclass, field
from typing import Optional, Sequence

from dotenv import load_dotenv
from exa_py import Exa

DEFAULT_SEARCH_TYPE = "auto"
DEFAULT_NUM_RESULTS = 10


class MissingAPIKeyError(RuntimeError):
    """Raised when no Exa API key is available."""


@dataclass
class ProductResult:
    """A single search hit, flattened to the fields a caller usually wants."""

    title: str
    url: str
    highlights: list[str] = field(default_factory=list)
    published_date: Optional[str] = None
    author: Optional[str] = None

    @classmethod
    def from_exa(cls, result) -> "ProductResult":
        return cls(
            title=getattr(result, "title", None) or "(untitled)",
            url=result.url,
            highlights=list(getattr(result, "highlights", None) or []),
            published_date=getattr(result, "published_date", None),
            author=getattr(result, "author", None),
        )


class ProductSearch:
    """Thin client around exa-py for product and merchant research."""

    def __init__(self, api_key: Optional[str] = None, *, load_env: bool = True):
        if load_env:
            load_dotenv()
        key = api_key or os.environ.get("EXA_API_KEY")
        if not key:
            raise MissingAPIKeyError(
                "EXA_API_KEY is not set. Copy .env_example to .env and add your key "
                "from https://dashboard.exa.ai"
            )
        self._exa = Exa(api_key=key)

    def search(
        self,
        query: str,
        *,
        num_results: int = DEFAULT_NUM_RESULTS,
        search_type: str = DEFAULT_SEARCH_TYPE,
        include_domains: Optional[Sequence[str]] = None,
        exclude_domains: Optional[Sequence[str]] = None,
    ) -> list[ProductResult]:
        """Find products or merchant pages matching a natural-language query."""
        kwargs = {
            "type": search_type,
            "num_results": num_results,
            "contents": {"highlights": True},
        }
        if include_domains:
            kwargs["include_domains"] = list(include_domains)
        if exclude_domains:
            kwargs["exclude_domains"] = list(exclude_domains)

        response = self._exa.search(query, **kwargs)
        return [ProductResult.from_exa(r) for r in response.results]

    def compare(
        self,
        query: str,
        *,
        num_results: int = DEFAULT_NUM_RESULTS,
        search_type: str = "deep",
    ):
        """Ask Exa to synthesize a structured product comparison.

        Returns the raw response so callers can read both ``output.content``
        (the structured payload) and ``output.grounding`` (field-level citations).
        """
        return self._exa.search(
            query,
            type=search_type,
            num_results=num_results,
            system_prompt=(
                "Prefer official product and merchant pages over aggregator spam. "
                "Collapse duplicate listings of the same product and keep every "
                "claim grounded in a cited source."
            ),
            output_schema={
                "type": "object",
                "description": "Comparison of products matching the query",
                "required": ["products"],
                "properties": {
                    "products": {
                        "type": "array",
                        "description": "Products found, best match first",
                        "items": {
                            "type": "object",
                            "required": ["name"],
                            "properties": {
                                "name": {"type": "string", "description": "Product name"},
                                "brand": {"type": "string", "description": "Manufacturer or brand"},
                                "price": {"type": "string", "description": "Price with currency, as listed"},
                                "key_features": {"type": "string", "description": "Notable features in one sentence"},
                            },
                        },
                    }
                },
            },
            contents={"highlights": True},
        )

    def fetch(self, urls: Sequence[str]) -> list[ProductResult]:
        """Pull highlights for URLs you already have (e.g. from a catalog)."""
        response = self._exa.get_contents(list(urls), highlights=True)
        return [ProductResult.from_exa(r) for r in response.results]


def search_products(query: str, **kwargs) -> list[ProductResult]:
    """One-shot convenience wrapper for scripts and notebooks."""
    return ProductSearch().search(query, **kwargs)
