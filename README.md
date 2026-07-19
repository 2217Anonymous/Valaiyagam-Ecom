# Valaiyagam E-commerce Admin

Full-stack administration starter with a Next.js/Tailwind/Redux frontend and a
layered FastAPI/MySQL backend.

## Included

- JWT login with Argon2 password hashing
- Admin, manager, and viewer roles seeded automatically
- User create, read, update, delete, activation, and role assignment
- Role create, read, update, and delete
- FastAPI layers: API routes, models, schemas, repositories, services, constants,
  core configuration, and utilities
- MySQL, API, and frontend containers on a dedicated Docker bridge network
- Persistent MySQL Docker volume and health checks
- Alembic database migrations and a complete MySQL schema script

## Start with Docker

1. Copy `.env.example` to `.env` and change all passwords and `SECRET_KEY`.
2. Run:

   ```bash
   docker compose up --build
   ```

3. Open:
   - Admin UI: http://localhost:3000
   - API docs: http://localhost:8000/docs
   - API health: http://localhost:8000/health

The development default login is `admin@example.com` / `ChangeMe123!`. Change
these values before deploying. Seed values only apply when the database is
initially empty.

## Backend structure

```text
backend/app/
├── api/             # Dependencies and HTTP routes
├── constants/       # Role and application constants
├── core/            # Settings, database, security, initialization
├── models/          # SQLAlchemy database models
├── repositories/    # Database access
├── schemas/         # Pydantic request/response models
├── services/        # Business rules
├── utils/           # Shared errors and helpers
└── main.py          # FastAPI application
```

Database files:

- `backend/alembic/` contains versioned migrations.
- `mysql/init/002_schema.sql` contains the complete initial MySQL schema.
- The backend container runs `alembic upgrade head` before starting FastAPI.

Create a migration after changing SQLAlchemy models:

```bash
cd backend
alembic revision --autogenerate -m "describe change"
alembic upgrade head
```

## Local development

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Backend (with MySQL available and environment variables configured):

```bash
cd backend
python -m venv .venv
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

## Client materials

| File | Purpose |
|---|---|
| `docs/ECOM_ARCHITECTURE_AND_TIMELINE.md` | Full architecture, integrations, and 16-week timeline |
| `docs/SECURITY_ARCHITECTURE.md` | Current security controls + improvement roadmap |
| `docs/SSO_LOGGING_MICROSERVICES_ARCHITECTURE.md` | SSO + password, logging, microservice split plan |
| `docs/MODULAR_MONOLITH_STRUCTURE.md` | Current-to-target domain folder migration plan |
| `docs/Valaiyagam_Client_Presentation.pptx` | Client PPT (UI standards, payment, courier, tracking) |
| `docs/PROJECT_TRACKING.xlsx` | Story tracker with IDs, dates, branches, and workflow |
| `docs/generate_client_materials.py` | Regenerates the PPT and Excel files |
