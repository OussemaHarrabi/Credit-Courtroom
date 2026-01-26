from typing import List
from workflow.debate_state import DebateMessage

def create_msg(speaker: str, content: str, stage: str, validated: bool = False) -> DebateMessage:
    return {"speaker": speaker, "content": content, "validated": validated, "stage": stage}

def history(messages: List[DebateMessage]) -> str:
    return "\n".join(f"[{m['stage'].upper()}] {m['speaker'].upper()}: {m['content']}" for m in messages)
