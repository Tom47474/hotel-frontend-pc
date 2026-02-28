/**
 * 商户端 Token（模拟，上线前请替换为真实 token 或从登录态读取）
 */


function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}


export const MERCHANT_TOKEN = getToken() || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJ0ZXN0X21lcmNoYW50Iiwicm9sZSI6Im1lcmNoYW50IiwiaWF0IjoxNzcyMjUxMjA1LCJleHAiOjE3NzI4NTYwMDV9.gp00jPDDs5i9vEAlFLK7dZgBVqfCL5-Pi15O6q3Y_zA";