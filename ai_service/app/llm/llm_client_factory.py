from app.llm.claude_client import ClaudeClient
from app.llm.llm_client import LLMClient
from app.llm.llm_exception import ProviderNotSupportedError
from app.llm.ollama_client import OllamaClient
from app.schemas.api import LLMProvider


def get_llm_client(provider: LLMProvider) -> LLMClient:
    if provider == LLMProvider.ANTHROPIC:
        return ClaudeClient()
    elif provider == LLMProvider.OLLAMA:
        return OllamaClient()
    else:
        raise ProviderNotSupportedError(provider)
