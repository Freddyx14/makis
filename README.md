# Nose

Exa-powered product search for e-commerce research.

## Setup

```bash
python -m venv .venv && .venv/Scripts/activate   # Windows
pip install -r requirements.txt
cp .env_example .env                              # then add your key
```

Get an API key at https://dashboard.exa.ai.

## Usage

```bash
python main.py "best wireless earbuds with strong battery life"
python main.py --compare "budget mechanical keyboards under $100"
python main.py "running shoes" --include-domains nike.com adidas.com
```

As a library:

```python
from exa_shop import ProductSearch

client = ProductSearch()
for product in client.search("noise cancelling headphones", num_results=5):
    print(product.title, product.url)
```

## Layout

- `exa_shop/client.py` — `ProductSearch`: `search()` for raw hits with highlights,
  `compare()` for structured synthesis via `outputSchema`, `fetch()` for known URLs.
- `main.py` — CLI entry point.
