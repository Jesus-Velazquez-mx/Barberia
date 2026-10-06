from fastapi import APIRouter

tailor_router = APIRouter(prefix="/tailor")

# TODO - Define endpoints

@tailor_router.get("/")
async def tailor():
    return { "message": "Hello for tailor router"}