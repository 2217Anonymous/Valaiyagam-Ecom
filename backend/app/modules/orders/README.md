# Orders Module

Owns the customer purchasing transaction.

## Responsibilities

- Guest and authenticated carts
- Customer addresses used during checkout
- Checkout pricing and shipping selection
- Order creation, line items, totals, tax, discounts
- Order state machine and cancellation rules
- Inventory reservation coordination

## Owned data

`carts`, `cart_items`, `customer_addresses`, `orders`, `order_items`,
`order_status_history`

## Public contracts

- `create_cart(...)`
- `checkout(...)`
- `place_order(...)`
- `mark_paid(order_id, payment_reference)`
- `cancel_order(...)`

Consumes availability through Catalog's public interface. Publishes
`order.placed`, `order.cancelled`, and `order.ready_for_fulfillment`.
