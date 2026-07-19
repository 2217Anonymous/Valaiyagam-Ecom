# Valaiyagam Microservices Architecture

This directory is a parallel architecture workspace. The production application
continues to run from `backend/app`. Nothing here is wired into the current
Docker Compose stack yet.

## Contents

```text
Microservices/
├── monolith-reference/app/     Snapshot copy of the current working app
├── services/
│   ├── api-gateway/
│   ├── identity-service/
│   ├── iam-service/
│   ├── catalog-service/
│   ├── order-service/
│   ├── payment-service/
│   ├── fulfillment-service/
│   ├── notification-service/
│   ├── reporting-service/
│   └── settings-service/
├── contracts/
│   ├── api/                    OpenAPI and synchronous contracts
│   └── events/                 Versioned event schemas
├── libraries/python/           Technical SDK only; no domain models
├── platform/
│   ├── messaging/
│   ├── observability/
│   ├── secrets/
│   └── databases/
└── deploy/
    ├── local/
    ├── staging/
    └── production/
```

## Recommended runtime count

Ten folders are present for clear ownership. Deploy only services that are
needed. The practical first production target is seven business/runtime
services plus the gateway:

1. API Gateway
2. Identity (IAM may initially remain inside Identity)
3. Catalog
4. Orders
5. Payments
6. Fulfillment
7. Notifications
8. Reporting (can begin as a worker/read model)

Settings may remain in the gateway/admin platform initially. IAM can be deployed
separately only when organization/permission scale justifies it.

## Extraction order

1. Identity + IAM boundaries
2. Payment
3. Fulfillment
4. Notification worker
5. Catalog and Orders when independent scaling is needed
6. Reporting and Settings

Do not perform a big-bang migration. Extract one service, add contracts, migrate
data ownership, run dual-read/verification where necessary, then remove the
module from the monolith.

## Communication

- Public/client calls: HTTPS through API Gateway
- Immediate service queries: versioned REST (minimal)
- State changes across domains: events through RabbitMQ/Redis Streams initially
- Money and fulfillment events: transactional outbox + idempotent consumers
- Correlation: `trace_id`, `correlation_id`, and `causation_id` on every event

## Database policy

Each extracted service owns its database/schema and Alembic history. No service
may query another service's tables. The `monolith-reference` keeps the current
shared-database implementation only as a migration reference.

## Shared library policy

Shared libraries may contain logging, tracing, event-envelope, error, and HTTP
client utilities. They must not contain User, Product, Order, Payment, or
Shipment domain models.
