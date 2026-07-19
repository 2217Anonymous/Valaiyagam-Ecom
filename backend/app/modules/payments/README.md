# Payments Module

Owns money movement and payment provider integrations.

## Responsibilities

- Razorpay/Stripe payment intent or order creation
- COD payment state
- Signed webhook validation and idempotency
- Capture, failure, settlement, and reconciliation
- Partial and full refunds
- Payment audit trail

## Owned data

`payments`, `payment_events`, `refunds`, `webhook_receipts`,
`reconciliation_runs`

## Public contracts

- `create_payment(order_reference, amount)`
- `handle_webhook(provider, payload, signature)`
- `refund(payment_id, amount, actor)`
- `get_payment_status(order_reference)`

Consumes `order.placed`. Publishes `payment.succeeded`, `payment.failed`, and
`payment.refunded`. Other modules must not call gateway SDKs directly.
