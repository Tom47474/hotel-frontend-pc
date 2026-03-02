/**
 * 商户端 Token（模拟，上线前请替换为真实 token 或从登录态读取）
 */


/** 每次请求时调用，保证拿到最新的 token（登录后跳转无需刷新） */
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

const FALLBACK_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJ0ZXN0X21lcmNoYW50Iiwicm9sZSI6Im1lcmNoYW50IiwiaWF0IjoxNzcyMjUxMjA1LCJleHAiOjE3NzI4NTYwMDV9.gp00jPDDs5i9vEAlFLK7dZgBVqfCL5-Pi15O6q3Y_zA";

/** @deprecated 请用 getToken()；保留仅为兼容旧引用，请求内已改为按次读取 */
export const MERCHANT_TOKEN = typeof window !== "undefined" ? (getToken() || FALLBACK_TOKEN) : FALLBACK_TOKEN;