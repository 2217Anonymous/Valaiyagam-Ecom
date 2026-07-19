# Platform Components

Infrastructure shared by independently deployed services.

| Folder | Responsibility |
|---|---|
| messaging | RabbitMQ/Redis Streams configuration, DLQ policy |
| observability | JSON logs, Prometheus, Grafana, Loki/Tempo |
| secrets | Vault/cloud secret references and rotation procedures |
| databases | Per-service database provisioning and backup policy |

Platform configuration contains no business logic.
