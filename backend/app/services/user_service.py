from app.constants.roles import VIEWER_ROLE
from app.core.security import hash_password
from app.models.user import User
from app.repositories.role_repository import RoleRepository
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate, UserUpdate
from app.utils.exceptions import ConflictError, NotFoundError


class UserService:
    def __init__(
        self,
        user_repository: UserRepository,
        role_repository: RoleRepository,
    ):
        self.users = user_repository
        self.roles = role_repository

    def list_users(self, skip: int = 0, limit: int = 100) -> list[User]:
        return self.users.list(skip, limit)

    def get_user(self, user_id: int) -> User:
        user = self.users.get(user_id)
        if not user:
            raise NotFoundError("User not found")
        return user

    def create_user(self, payload: UserCreate) -> User:
        email = payload.email.lower()
        if self.users.get_by_email(email):
            raise ConflictError("A user with this email already exists")

        roles = self.roles.get_many(payload.role_ids)
        if payload.role_ids and len(roles) != len(set(payload.role_ids)):
            raise NotFoundError("One or more selected roles do not exist")
        if not roles:
            viewer_role = self.roles.get_by_name(VIEWER_ROLE)
            roles = [viewer_role] if viewer_role else []

        return self.users.create(
            email=email,
            full_name=payload.full_name.strip(),
            hashed_password=hash_password(payload.password),
            roles=roles,
        )

    def update_user(self, user_id: int, payload: UserUpdate) -> User:
        user = self.get_user(user_id)
        changes = payload.model_dump(exclude_unset=True)

        if "role_ids" in changes:
            role_ids = changes.pop("role_ids") or []
            roles = self.roles.get_many(role_ids)
            if len(roles) != len(set(role_ids)):
                raise NotFoundError("One or more selected roles do not exist")
            user.roles = roles
        if password := changes.pop("password", None):
            user.hashed_password = hash_password(password)
        for field, value in changes.items():
            setattr(user, field, value)
        return self.users.save(user)

    def delete_user(self, user_id: int, current_user_id: int) -> None:
        if user_id == current_user_id:
            raise ConflictError("You cannot delete your own account")
        self.users.delete(self.get_user(user_id))
