from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from backend.api import docx_router, llm_router, pptx_router, prompt_router, tm_router, preserve_terms_router, token_stats_router, export_router

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(pptx_router)
app.include_router(tm_router)
app.include_router(llm_router)
app.include_router(prompt_router)
app.include_router(preserve_terms_router)
app.include_router(token_stats_router)
app.include_router(export_router)


@app.get("/health")
def health_check():
    """Health check endpoint for Docker/Kubernetes."""
    return {"status": "ok"}
