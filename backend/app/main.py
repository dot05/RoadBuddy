from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import traceback

from app.routers import trips, fuel, users, community, journal, transport

app = FastAPI(
    title="RoadBuddy AI",
    description="India's Ultimate Road Trip Companion — API Backend",
    version="1.0.0",
)

# Allow frontend/mobile apps to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global error handler — shows real error instead of "Internal Server Error"
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={
            "detail": str(exc),
            "traceback": traceback.format_exc()
        }
    )

# Register all route groups
app.include_router(users.router,     prefix="/api/users",     tags=["Users & Auth"])
app.include_router(trips.router,     prefix="/api/trips",     tags=["AI Trip Planner"])
app.include_router(fuel.router,      prefix="/api/fuel",      tags=["Fuel & Toll"])
app.include_router(community.router, prefix="/api/community", tags=["Community Routes"])
app.include_router(journal.router,   prefix="/api/journal",   tags=["Trip Journal"])
app.include_router(transport.router, prefix="/api/transport", tags=["Transport"])


@app.get("/", tags=["Health"])
def root():
    return {"message": "RoadBuddy AI backend is running 🚗", "docs": "/docs"}


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok"}