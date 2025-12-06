"""
Temporary compatibility layer between supabase-py and httpx>=0.24.

supabase/gotrue ainda passa o argumento `proxy=` ao instanciar httpx.Client,
mas as versões recentes do httpx removem esse parâmetro público
(`proxies` deve ser usado). Para evitar crash durante o bootstrap da API,
fazemos monkey patch adicionando esse argumento opcional novamente.
"""

from __future__ import annotations

import inspect
from typing import Any, Callable

import httpx


def _wrap_client_init(original_init: Callable[..., Any]):
    def patched_init(self, *args, proxy=None, **kwargs):
        if proxy is not None and "proxies" not in kwargs:
            kwargs["proxies"] = proxy
        return original_init(self, *args, **kwargs)

    return patched_init


def _ensure_proxy_kwarg():
    client_sig = inspect.signature(httpx.Client.__init__)
    if "proxy" not in client_sig.parameters:
        httpx.Client.__init__ = _wrap_client_init(httpx.Client.__init__)

    async_client_sig = inspect.signature(httpx.AsyncClient.__init__)
    if "proxy" not in async_client_sig.parameters:
        httpx.AsyncClient.__init__ = _wrap_client_init(httpx.AsyncClient.__init__)


_ensure_proxy_kwarg()

