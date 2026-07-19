from fastapi import APIRouter, Response, status

from app.api.dependencies import AdminUser, CurrentUser, DbSession
from app.models.user import Role
from app.repositories.role_repository import RoleRepository
from app.schemas.role import RoleCreate, RoleResponse, RoleUpdate
from app.services.role_service import RoleService

router = APIRouter(prefix="/roles", tags=["Roles"])


def get_service(db: DbSession) -> RoleService:
    return RoleService(RoleRepository(db))


@router.get("", response_model=list[RoleResponse])
def list_roles(db: DbSession, _: CurrentUser) -> list[Role]:
    return get_service(db).list_roles()


@router.post("", response_model=RoleResponse, status_code=status.HTTP_201_CREATED)
def create_role(payload: RoleCreate, db: DbSession, _: AdminUser) -> Role:
    return get_service(db).create_role(payload)


@router.patch("/{role_id}", response_model=RoleResponse)
def update_role(
    role_id: int, payload: RoleUpdate, db: DbSession, _: AdminUser
) -> Role:
    return get_service(db).update_role(role_id, payload)


@router.delete("/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_role(role_id: int, db: DbSession, _: AdminUser) -> Response:
    get_service(db).delete_role(role_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
