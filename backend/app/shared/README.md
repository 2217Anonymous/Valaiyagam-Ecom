# Shared Infrastructure

`shared` contains reusable technical capabilities only. Domain business rules
must stay in `app.modules`.

## Planned packages

```text
shared/
├── config/       Environment and secrets configuration
├── database/     Engine, sessions, base model, transactions
├── security/     Hashing, JWT primitives, OIDC helpers
├── logging/      JSON logging, correlation IDs, redaction
├── events/       Event envelope, outbox, event bus adapters
├── observability/ Metrics and distributed tracing
└── errors/       Generic application error types
```

## Current code to migrate

- `app/core/config.py` → `shared/config`
- `app/core/database.py` → `shared/database`
- Password/JWT primitives in `app/core/security.py` → `shared/security`
- `app/utils/exceptions.py` → `shared/errors`

## Rule

If a helper mentions a business concept such as Order, Payment, Shipment, Role,
or Product, it is not shared; it belongs to that domain.
