import type { ApiResponse } from "@/types/api";
import { getApiBase } from "@/utils/api";
import { getToken } from "@/constants/auth";

const FALLBACK_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJ0ZXN0X21lcmNoYW50Iiwicm9sZSI6Im1lcmNoYW50IiwiaWF0IjoxNzcyMjUxMjA1LCJleHAiOjE3NzI4NTYwMDV9.gp00jPDDs5i9vEAlFLK7dZgBVqfCL5-Pi15O6q3Y_zA";

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
  const token = getToken() || FALLBACK_TOKEN;

  const headers: Record<string, string> = {
    ...(formData ? {} : { "Content-Type": "application/json" }),
    Authorization: `Bearer ${token}`,
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
