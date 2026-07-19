from sqlalchemy.orm import Session

from app.constants.roles import ADMIN_ROLE, DEFAULT_ROLES
from app.core.config import settings
from app.core.security import hash_password
from app.models.user import Role, User
from app.repositories.role_repository import RoleRepository
from app.repositories.user_repository import UserRepository


def seed_database(db: Session) -> None:
    role_repository = RoleRepository(db)
    for name, description in DEFAULT_ROLES:
        if not role_repository.get_by_name(name):
            role_repository.create(name, description)

    user_repository = UserRepository(db)
    if not user_repository.get_by_email(str(settings.initial_admin_email).lower()):
        admin_role = role_repository.get_by_name(ADMIN_ROLE)
        user_repository.create(
            email=str(settings.initial_admin_email).lower(),
            full_name=settings.initial_admin_name,
            hashed_password=hash_password(settings.initial_admin_password),
            roles=[admin_role] if admin_role else [],
        )
