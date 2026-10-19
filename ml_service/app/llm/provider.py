"""LLM provider abstraction — supports multiple backends via configuration."""
from __future__ import annotations

import json
import logging
from abc import ABC, abstractmethod
from typing import Any, TypeVar

import httpx
from pydantic import BaseModel

from app.config import get_settings

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)


class LLMProvider(ABC):
    """Abstract base for LLM backends."""

    @abstractmethod
    def generate(self, prompt: str, system_prompt: str = "") -> str:
        """Generate free-form text."""

    @abstractmethod
    def structured_generate(self, prompt: str, schema: type[T], system_prompt: str = "") -> T | None:
        """Generate and parse output into a Pydantic model."""


class OpenAICompatibleProvider(LLMProvider):
    """Works with OpenAI, OpenRouter, Groq, and any OpenAI-compatible API."""

    PROVIDER_URLS = {
        "openai": "https://api.openai.com/v1/chat/completions",
        "openrouter": "https://openrouter.ai/api/v1/chat/completions",
        "groq": "https://api.groq.com/openai/v1/chat/completions",
        "grok": "https://api.x.ai/v1/chat/completions",
        "xai": "https://api.x.ai/v1/chat/completions",
    }

    def __init__(self, provider: str, api_key: str, model: str):
        self.api_key = api_key
        self.model = model
        self.base_url = self.PROVIDER_URLS.get(provider, self.PROVIDER_URLS["openai"])

    def _call(self, messages: list[dict[str, str]], temperature: float = 0.1) -> str:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": 2048,
        }
        with httpx.Client(timeout=60.0) as client:
            resp = client.post(self.base_url, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"]

    def generate(self, prompt: str, system_prompt: str = "") -> str:
        messages: list[dict[str, str]] = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        return self._call(messages)

    def structured_generate(self, prompt: str, schema: type[T], system_prompt: str = "") -> T | None:
        schema_json = json.dumps(schema.model_json_schema(), indent=2)
        full_prompt = (
            f"{prompt}\n\n"
            f"Respond ONLY with valid JSON matching this schema:\n{schema_json}\n"
            f"Do not include any text outside the JSON object."
        )
        for attempt in range(2):
            try:
                raw = self.generate(full_prompt, system_prompt)
                # Extract JSON from potential markdown code blocks
                cleaned = raw.strip()
                if cleaned.startswith("```"):
                    lines = cleaned.split("\n")
                    cleaned = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
                parsed = json.loads(cleaned)
                return schema.model_validate(parsed)
            except Exception as e:
                logger.warning("LLM structured_generate attempt %d failed: %s", attempt + 1, e)
        return None


class GeminiProvider(LLMProvider):
    """Google Gemini via REST API."""

    BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"

    def __init__(self, api_key: str, model: str = "gemini-2.0-flash"):
        self.api_key = api_key
        self.model = model

    def _call(self, prompt: str, system_prompt: str = "") -> str:
        url = f"{self.BASE_URL}/{self.model}:generateContent?key={self.api_key}"
        contents: list[dict] = []
        if system_prompt:
            contents.append({"role": "user", "parts": [{"text": system_prompt}]})
            contents.append({"role": "model", "parts": [{"text": "Understood. I will follow these instructions."}]})
        contents.append({"role": "user", "parts": [{"text": prompt}]})

        payload = {
            "contents": contents,
            "generationConfig": {"temperature": 0.1, "maxOutputTokens": 2048},
        }
        with httpx.Client(timeout=60.0) as client:
            resp = client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]

    def generate(self, prompt: str, system_prompt: str = "") -> str:
        return self._call(prompt, system_prompt)

    def structured_generate(self, prompt: str, schema: type[T], system_prompt: str = "") -> T | None:
        schema_json = json.dumps(schema.model_json_schema(), indent=2)
        full_prompt = (
            f"{prompt}\n\n"
            f"Respond ONLY with valid JSON matching this schema:\n{schema_json}\n"
            f"Do not include any text outside the JSON object."
        )
        for attempt in range(2):
            try:
                raw = self._call(full_prompt, system_prompt)
                cleaned = raw.strip()
                if cleaned.startswith("```"):
                    lines = cleaned.split("\n")
                    cleaned = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
                parsed = json.loads(cleaned)
                return schema.model_validate(parsed)
            except Exception as e:
                logger.warning("Gemini structured_generate attempt %d failed: %s", attempt + 1, e)
        return None


class NoLLMProvider(LLMProvider):
    """Fallback when no API key is configured. Raises clear errors."""

    def generate(self, prompt: str, system_prompt: str = "") -> str:
        raise RuntimeError(
            "LLM is not configured. Set LLM_API_KEY in your environment. "
            "Deterministic features will still work without an LLM."
        )

    def structured_generate(self, prompt: str, schema: type[T], system_prompt: str = "") -> T | None:
        raise RuntimeError(
            "LLM is not configured. Set LLM_API_KEY in your environment. "
            "Deterministic features will still work without an LLM."
        )


def get_llm_provider() -> LLMProvider:
    """Factory: returns the appropriate LLM provider based on configuration."""
    settings = get_settings()

    if not settings.LLM_API_KEY:
        logger.warning("No LLM_API_KEY configured — LLM features will be unavailable")
        return NoLLMProvider()

    provider = settings.LLM_PROVIDER.lower()
    if provider == "gemini":
        return GeminiProvider(api_key=settings.LLM_API_KEY, model=settings.LLM_MODEL)

    # OpenAI-compatible: openai, openrouter, groq
    return OpenAICompatibleProvider(
        provider=provider,
        api_key=settings.LLM_API_KEY,
        model=settings.LLM_MODEL,
    )
