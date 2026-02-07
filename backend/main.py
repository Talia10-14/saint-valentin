from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import uuid

app = FastAPI(title="L'Archéologie du Sentiment - Oniric API")

# Models for the Soul Connection
class Position(BaseModel):
    x: float
    y: float
    z: float

class MemoryBase(BaseModel):
    name: str
    emotionType: str
    storySnippet: str
    fullStory: str
    color: str
    scale: float

class Memory(MemoryBase):
    id: str

class Customization(BaseModel):
    memoryId: str
    shaderIntensity: float
    pulseSpeed: float
    message: Optional[str] = None

class CaptureSession(BaseModel):
    sessionId: str
    checkoutUrl: str

# Mock Database for the Alpha release
MOCK_MEMORIES = [
    {
        "id": "m1",
        "name": "Premier Rire",
        "emotionType": "Joy",
        "storySnippet": "Un fragment de temps suspendu.",
        "fullStory": "Un fragment de temps suspendu, où le monde s'est arrêté pour écouter votre harmonie.",
        "color": "#ffffff",
        "scale": 1.2
    },
    {
        "id": "m2",
        "name": "Douce Nuit",
        "emotionType": "Tenderness",
        "storySnippet": "Le calme absolu d'une nuit d'été étoilée.",
        "fullStory": "Le calme absolu d'une nuit d'été étoilée, où chaque souffle était une promesse.",
        "color": "#ffffff",
        "scale": 1.0
    }
]

@app.get("/memories", response_model=List[Memory])
async def list_memories():
    """Retrieve all floating memories currently in the nebula."""
    return MOCK_MEMORIES

@app.get("/memories/{memory_id}", response_model=Memory)
async def get_memory(memory_id: str):
    """Deep dive into a specific soul fragment."""
    memory = next((m for m in MOCK_MEMORIES if m["id"] == memory_id), None)
    if not memory:
        raise HTTPException(status_code=404, detail="Memory lost in the void")
    return memory

@app.post("/capture", response_model=CaptureSession)
async def initiate_capture(custom: Customization):
    """Trigger the ritual of capture and prepare the physical relic via Stripe."""
    # Logic to save customization in DB would go here
    session_id = str(uuid.uuid4())
    return {
        "sessionId": session_id,
        "checkoutUrl": f"https://checkout.stripe.com/pay/{session_id}"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
