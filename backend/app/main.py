from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
import app.models  # Ensure models are registered on Base.metadata before create_all
from app.routers import tasks


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Run Base.metadata.create_all(bind=engine) on startup for automatic dev schema creation
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Do-It API",
    lifespan=lifespan,
)

# CORS configuration
origins = [settings.FRONTEND_URL]
if "http://localhost:5173" not in origins:
    origins.append("http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(tasks.router)


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "app": "Do-It"}
