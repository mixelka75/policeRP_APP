from fastapi import APIRouter

from app.api.v1 import auth, users, passports, fines, logs, roles

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(passports.router, prefix="/passports", tags=["passports"])
api_router.include_router(fines.router, prefix="/fines", tags=["fines"])
api_router.include_router(logs.router, prefix="/logs", tags=["logs"])
api_router.include_router(roles.router, prefix="/roles", tags=["role-management"])