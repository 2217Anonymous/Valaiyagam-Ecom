# Fulfillment Module

Owns courier integration, shipment execution, and tracking.

## Responsibilities

- Courier serviceability and rate selection
- Shiprocket, Delhivery, BlueDart, and manual adapters
- Shipment creation, AWB, labels, and pickup
- Courier webhook verification and polling
- Tracking timeline, delivery exceptions, and RTO
- Manual operational overrides with audit reasons

## Owned data

`shipments`, `shipment_events`, `courier_accounts`, `pickup_requests`,
`delivery_exceptions`

## Public contracts

- `create_shipment(order_snapshot)`
- `cancel_shipment(shipment_id)`
- `get_tracking(order_reference)`
- `handle_courier_webhook(...)`

Consumes `payment.succeeded` or approved COD events. Publishes
`shipment.created`, `shipment.status_changed`, and `shipment.delivered`.
