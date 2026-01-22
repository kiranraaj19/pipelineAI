import uuid
from fastapi import FastAPI, WebSocket
from utils import run_pipeline

app = FastAPI()

@app.get("/")
async def get():
    return "hello"

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    thread_id = str(uuid.uuid4())
    while True:
        try:
            prompt = await websocket.receive_text()
            await run_pipeline(websocket, prompt,thread_id)

        except Exception as e:
            print(f"Error: {e}")
            break
    await websocket.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
