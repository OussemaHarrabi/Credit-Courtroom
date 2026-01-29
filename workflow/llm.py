import os
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

def get_llm(temperature: float = 0.2):
    return ChatGroq(
        groq_api_key=os.getenv("GROQ_API_KEY"), # type: ignore
        model=os.getenv("GROQ_MODEL", "llama-3.1-8b-instant"),
        temperature=temperature,
    )

def build_chain(system_prompt: str, human_prompt: str, temperature: float = 0.2):
    llm = get_llm(temperature=temperature)
    prompt = ChatPromptTemplate.from_messages([("system", system_prompt), ("human", human_prompt)])
    return prompt | llm | StrOutputParser()
