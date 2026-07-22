# Catalog Module

Owns everything required to describe and sell products.

## Responsibilities

- Categories and collections
- Products, variants, attributes, pricing, and SKUs
- Product media and publish status
- Inventory balances and stock movements
- Low-stock rules and availability queries

## Owned data

`categories`, `products`, `product_variants`, `product_media`,
`inventory_items`, `stock_movements`

## Public contracts

- Product administration commands
- Public catalog queries
- `check_availability(variant_id, quantity)`
- `reserve_stock(...)` and `release_stock(...)`

Publishes `product.published`, `stock.low`, and `stock.changed` events.

## Implementation status

- Categories CRUD (flat + nested via `parent_id`, `is_active`, slug, sort order): done
- Products + media create/edit (VL-011): done
- Product attributes + variants with SKU/price/stock overrides (VL-012): done
- Inventory alerts: planned
