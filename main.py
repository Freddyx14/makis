"""CLI for Exa-powered product search.

    python main.py "best wireless earbuds with strong battery life"
    python main.py --compare "budget mechanical keyboards under $100"
"""

import argparse
import sys
import textwrap

from exa_shop import MissingAPIKeyError, ProductSearch


def print_results(results) -> None:
    if not results:
        print("No results. Try simplifying the query or dropping domain filters.")
        return
    for i, r in enumerate(results, 1):
        print(f"\n{i}. {r.title}")
        print(f"   {r.url}")
        for highlight in r.highlights[:2]:
            wrapped = textwrap.fill(highlight.strip(), width=88,
                                    initial_indent="   > ", subsequent_indent="     ")
            print(wrapped)


def print_comparison(response) -> None:
    products = (response.output.content or {}).get("products", [])
    for i, p in enumerate(products, 1):
        print(f"\n{i}. {p.get('name', '(unnamed)')}")
        for label, key in (("Brand", "brand"), ("Price", "price"), ("Features", "key_features")):
            if p.get(key):
                print(f"   {label}: {p[key]}")
    sources = {c["url"] for g in (response.output.grounding or []) for c in g.get("citations", [])}
    if sources:
        print("\nSources:")
        for url in sorted(sources):
            print(f"  - {url}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Search products with Exa.")
    parser.add_argument("query", help="What you're looking for, in plain language")
    parser.add_argument("-n", "--num-results", type=int, default=10)
    parser.add_argument("--compare", action="store_true",
                        help="Synthesize a structured comparison instead of listing raw hits")
    parser.add_argument("--include-domains", nargs="*", metavar="DOMAIN")
    parser.add_argument("--exclude-domains", nargs="*", metavar="DOMAIN")
    args = parser.parse_args()

    try:
        client = ProductSearch()
    except MissingAPIKeyError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1

    if args.compare:
        print_comparison(client.compare(args.query, num_results=args.num_results))
    else:
        print_results(client.search(
            args.query,
            num_results=args.num_results,
            include_domains=args.include_domains,
            exclude_domains=args.exclude_domains,
        ))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
