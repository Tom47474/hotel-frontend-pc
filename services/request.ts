import type { ApiResponse } from "@/types/api";
import { getApiBase } from "@/utils/api";
import { MERCHANT_TOKEN } from "@/constants/auth";

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

async function request<T>(
  path: string,
  options: {
    method?: Method;
    body?: unknown;
    headers?: Record<string, string>;
    formData?: FormData;
  } = {}
): Promise<ApiResponse<T>> {
  const { method = "GET", body, headers: extra = {}, formData } = options;
  const base = getApiBase();
  const url = path.startsWith("http") ? path : `${base}${path.startsWith("/") ? path : `/${path}`}`;

  const headers: Record<string, string> = {
    ...(formData ? {} : { "Content-Type": "application/json" }),
    Authorization: `Bearer ${MERCHANT_TOKEN}`,
    ...extra,
  };

  const config: RequestInit = {
    method,
    headers,
    body: formData ?? (body !== undefined && method !== 'GET' ? JSON.stringify(body) : undefined),
  };

  const res = await fetch(url, config);
  const json = (await res.json().catch(() => ({}))) as ApiResponse<T>;

  if (!res.ok) {
    throw new Error(json.message || `HTTP ${res.status}`);
  }
  return json;
}

export { request };
