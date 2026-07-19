"""Create a parallel microservices architecture from the current app."""

from pathlib import Path
import shutil

BACKEND = Path(__file__).resolve().parent
SOURCE_APP = BACKEND / "app"
TARGET = BACKEND / "Microservices"

SERVICES = {
    "api-gateway": {
        "purpose": "Single public entry point, routing, JWT verification, rate limiting, and correlation IDs.",
        "owns": "No business data; route and security policy configuration only.",
        "events": "None. It forwards HTTP requests and propagates trace context.",
        "extract": "New platform component; it is not copied from a business module.",
    },
    "identity-service": {
        "purpose": "Users, password authentication, OIDC SSO, sessions, refresh tokens, and account linking.",
        "owns": "users, user_credentials, sso_identities, sessions, refresh_tokens, login_attempts",
        "events": "Publishes identity.user_created, identity.user_disabled, identity.session_revoked.",
        "extract": "Copy implementation from app/modules/identity; consume IAM through an API/client.",
    },
    "iam-service": {
        "purpose": "Roles, permissions, user assignments, and authorization policy decisions.",
        "owns": "roles, permissions, role_permissions, user_roles",
        "events": "Publishes iam.roles_changed and iam.permissions_changed.",
        "extract": "Copy implementation from app/modules/iam; expose role and permission contracts.",
    },
    "catalog-service": {
        "purpose": "Categories, products, variants, media, pricing, inventory, and stock reservations.",
        "owns": "categories, products, product_variants, product_media, inventory_items, stock_movements",
        "events": "Publishes catalog.product_published, inventory.stock_changed, inventory.stock_low.",
        "extract": "Implement from app/modules/catalog when catalog development starts.",
    },
    "order-service": {
        "purpose": "Cart, checkout, customer addresses, orders, totals, discounts, and order lifecycle.",
        "owns": "carts, cart_items, customer_addresses, orders, order_items, order_status_history",
        "events": "Publishes order.placed, order.cancelled, order.ready_for_fulfillment.",
        "extract": "Implement from app/modules/orders; use Catalog and Payment contracts only.",
    },
    "payment-service": {
        "purpose": "Payment gateways, signed webhooks, capture, reconciliation, COD, and refunds.",
        "owns": "payments, payment_events, refunds, webhook_receipts, reconciliation_runs",
        "events": "Consumes order.placed; publishes payment.succeeded, payment.failed, payment.refunded.",
        "extract": "Implement from app/modules/payments before handling production money.",
    },
    "fulfillment-service": {
        "purpose": "Courier adapters, serviceability, shipments, AWB, labels, pickup, and tracking.",
        "owns": "shipments, shipment_events, courier_accounts, pickup_requests, delivery_exceptions",
        "events": "Consumes payment.succeeded; publishes shipment.created, shipment.status_changed, shipment.delivered.",
        "extract": "Implement from app/modules/fulfillment; one service contains all courier adapters.",
    },
    "notification-service": {
        "purpose": "Email, SMS, WhatsApp templates, preferences, delivery, and retry.",
        "owns": "notification_templates, notification_preferences, notification_deliveries",
        "events": "Consumes identity, order, payment, and shipment events.",
        "extract": "Implement from app/modules/notifications as an asynchronous worker/API.",
    },
    "reporting-service": {
        "purpose": "Read-optimized dashboards, KPIs, exports, and scheduled reports.",
        "owns": "Reporting projections, export jobs, and materialized read models only.",
        "events": "Consumes business events from all source domains.",
        "extract": "Implement from app/modules/reporting without writing operational domain tables.",
    },
    "settings-service": {
        "purpose": "Store profile, tax rules, shipping zones, COD policy, and feature flags.",
        "owns": "store_settings, tax_rules, shipping_zones, feature_flags",
        "events": "Publishes settings.changed and feature_flag.changed.",
        "extract": "Implement from app/modules/settings; secrets remain in a secrets manager.",
    },
}

LAYERS = (
    "app/api",
    "app/application/commands",
    "app/application/queries",
    "app/domain/entities",
    "app/domain/events",
    "app/domain/services",
    "app/infrastructure/database",
    "app/infrastructure/repositories",
    "app/infrastructure/clients",
    "app/infrastructure/messaging",
    "tests/unit",
    "tests/integration",
    "alembic/versions",
)


def write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def service_readme(name: str, metadata: dict[str, str]) -> str:
    return f"""# {name}

## Purpose

{metadata["purpose"]}

## Data ownership

{metadata["owns"]}

## Events

{metadata["events"]}

## Extraction source

{metadata["extract"]}

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
"""


ROOT_README = """# Valaiyagam Microservices Architecture

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
"""


CONTRACTS_README = """# Service Contracts

All cross-service integration is versioned here before implementation.

## API contracts

Store OpenAPI fragments or generated client specifications in `api/<service>/v1`.

## Event contracts

Store JSON Schema or Avro definitions in `events/<domain>/v1`.

Every event envelope includes:

- `event_id`
- `event_type`
- `event_version`
- `occurred_at`
- `producer`
- `correlation_id`
- `causation_id`
- `payload`

Consumers must be idempotent by `event_id`. Never share ORM models as contracts.
"""


PLATFORM_README = """# Platform Components

Infrastructure shared by independently deployed services.

| Folder | Responsibility |
|---|---|
| messaging | RabbitMQ/Redis Streams configuration, DLQ policy |
| observability | JSON logs, Prometheus, Grafana, Loki/Tempo |
| secrets | Vault/cloud secret references and rotation procedures |
| databases | Per-service database provisioning and backup policy |

Platform configuration contains no business logic.
"""


def main() -> None:
    if TARGET.exists():
        raise SystemExit(f"Target already exists: {TARGET}")

    reference = TARGET / "monolith-reference" / "app"
    shutil.copytree(
        SOURCE_APP,
        reference,
        ignore=shutil.ignore_patterns("__pycache__", "*.pyc", ".pytest_cache"),
    )

    write(TARGET / "README.md", ROOT_README)
    write(TARGET / "contracts" / "README.md", CONTRACTS_README)
    write(TARGET / "platform" / "README.md", PLATFORM_README)
    write(
        TARGET / "monolith-reference" / "README.md",
        "# Monolith Reference\n\n"
        "Snapshot of `backend/app` when this microservice architecture was "
        "created. It is reference code, not a second running application.\n",
    )

    for name, metadata in SERVICES.items():
        service_root = TARGET / "services" / name
        write(service_root / "README.md", service_readme(name, metadata))
        write(
            service_root / ".env.example",
            "APP_ENV=development\n"
            f"SERVICE_NAME={name}\n"
            "DATABASE_URL=mysql+pymysql://user:password@database/service_db\n"
            "MESSAGE_BROKER_URL=amqp://guest:guest@rabbitmq:5672/\n"
            "LOG_LEVEL=INFO\n",
        )
        for layer in LAYERS:
            write(service_root / layer / ".gitkeep", "")

    for path in (
        "contracts/api",
        "contracts/events",
        "libraries/python",
        "platform/messaging",
        "platform/observability",
        "platform/secrets",
        "platform/databases",
        "deploy/local",
        "deploy/staging",
        "deploy/production",
    ):
        write(TARGET / path / ".gitkeep", "")

    print(f"Created microservices architecture at {TARGET}")


if __name__ == "__main__":
    main()
