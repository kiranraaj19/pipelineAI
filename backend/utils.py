from fastapi import WebSocket
from graph import router_workflow, thread_config
from langgraph.types import interrupt, Interrupt

async def run_pipeline(websocket: WebSocket, prompt: str, thread_id: str):
    async for event in router_workflow.astream({"messages": [{"role": "user", "content": prompt}], "last_speaker": "User"}, config={"configurable": {"thread_id": thread_id}}):
        for value in event.values():
            if isinstance(value, tuple) and isinstance(value[0], Interrupt):
                value = value[0].value
                await websocket.send_json({"speaker": value["last_speaker"], "content": value['messages']})
            else:
                await websocket.send_json({"speaker": value["last_speaker"], "content": value['messages'][-1].content})
