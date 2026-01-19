from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api import (
    export_router,
    llm_router,
    pptx_router,
    pptx_translate_router,
    preserve_terms_router,
    prompt_router,
    tm_router,
    token_stats_router,
)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(pptx_router)
app.include_router(pptx_translate_router)
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


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend.main:app", host="0.0.0.0", port=5001, reload=True)
