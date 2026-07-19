# catalog-service

## Purpose

Categories, products, variants, media, pricing, inventory, and stock reservations.

## Data ownership

categories, products, product_variants, product_media, inventory_items, stock_movements

## Events

Publishes catalog.product_published, inventory.stock_changed, inventory.stock_low.

## Extraction source

Implement from app/modules/catalog when catalog development starts.

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
