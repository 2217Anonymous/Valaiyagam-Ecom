# Service Contracts

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
