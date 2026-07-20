"use client";

export function secureFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("X-SNCT-Request", "1");
  return fetch(input, { ...init, headers });
}
