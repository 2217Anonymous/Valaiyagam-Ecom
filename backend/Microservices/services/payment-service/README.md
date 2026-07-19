# payment-service

## Purpose

Payment gateways, signed webhooks, capture, reconciliation, COD, and refunds.

## Data ownership

payments, payment_events, refunds, webhook_receipts, reconciliation_runs

## Events

Consumes order.placed; publishes payment.succeeded, payment.failed, payment.refunded.

## Extraction source

Implement from app/modules/payments before handling production money.

## Internal architecture

```text
app/
├── api/                       HTTP routes and transport schemas
├── application/
│   ├── commands/              State-changing use cases
│   └── queries/               Read use cases
├── domain/
│   ├── entities/              Business entities and value objects
│   ├── events/                Domain event definitions
│   └── services/              Pure domain policies
└── infrastructure/
    ├── database/              SQLAlchemy mappings and sessions
    ├── repositories/          Persistence implementations
    ├── clients/               Other service/provider clients
    └── messaging/             Event publishers and consumers
```

## Rules

1. Domain cannot import FastAPI, SQLAlchemy, HTTP clients, or message brokers.
2. Application depends on domain interfaces.
3. Infrastructure implements domain/application ports.
4. API invokes application use cases; it contains no business logic.
5. This service has its own migration history and database/schema.
6. Other services integrate through versioned API or event contracts.

This folder is an architecture scaffold. Move or implement code only when the
service is extracted from the running modular monolith.
