export const API_BASE = "http://140.143.171.145:4090";

type ApiResp<T> = {
  code: number;
  message: string;
  data: T;
};

export async function postApi<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = (await res.json().catch(() => null)) as ApiResp<T> | null;

  if (!res.ok) throw new Error(json?.message || `网络错误：${res.status}`);
  if (!json) throw new Error("返回不是 JSON");
  if (json.code !== 200) throw new Error(json.message || "请求失败");

  return json.data;
}