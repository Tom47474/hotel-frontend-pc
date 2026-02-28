const protocol = typeof window !== "undefined" ? window.location.protocol : "http:";
const host =
  typeof window !== "undefined"
    ? window.location.host
    : `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "localhost"}:${process.env.NEXT_PUBLIC_API_BASE_URL_PORT ?? "4090"}`;

/**
 * 获取 API 根地址（浏览器端用当前站点协议+API 端口，避免跨域时再配代理）
 * 若后端与前端同域，可改为相对路径 /api 或通过环境变量配置
 */
export function getApiBase(): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const port = process.env.NEXT_PUBLIC_API_BASE_URL_PORT;
  if (baseUrl && port) {
    return `${protocol}//${baseUrl}:${port}`;
  }
  if (typeof window !== "undefined") {
    return `${window.location.origin}`;
  }
  return "http://localhost:4090";
}
