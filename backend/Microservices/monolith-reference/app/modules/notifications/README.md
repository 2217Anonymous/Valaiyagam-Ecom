# Notifications Module

Owns outbound customer and staff communication.

## Responsibilities

- Email, SMS, and WhatsApp provider adapters
- Message templates and localization
- Event-driven delivery
- Retry, failure, and delivery status
- Customer communication preferences

## Owned data

`notification_templates`, `notification_preferences`,
`notification_deliveries`

## Public contracts

- `send(template, recipient, context)`
- `process_domain_event(event)`
- `get_delivery_status(id)`

Consumes order, payment, and shipment events. It does not own or change those
domains' business states.
