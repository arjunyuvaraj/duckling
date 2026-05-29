import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config.logging import setup_logging
from app.api.routes import account, auth, classes, problems

setup_logging()

app = FastAPI()

_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(account.router, prefix="/account", tags=["account"])
app.include_router(problems.router, prefix="/problems", tags=["problems"])
app.include_router(classes.router, prefix="/classes", tags=["classes"])


@app.get("/health")
def health():
    return {"status": "ok"}
