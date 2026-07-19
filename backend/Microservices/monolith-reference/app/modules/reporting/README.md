# Reporting Module

Owns read-optimized dashboards and exports.

## Responsibilities

- Sales, payment, inventory, and fulfillment KPIs
- Admin dashboard projections
- CSV/XLSX exports
- Scheduled client reports

## Owned data

Reporting projections and export jobs only. Source domains remain the system of
record for operational data.

## Rules

- Reporting consumes events or public read contracts.
- It must never update Orders, Payments, Catalog, or Fulfillment tables.
- Expensive analytics queries must not run against transaction paths.
