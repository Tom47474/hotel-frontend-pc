"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { postApi } from "@/lib/api";

type Role = "merchant" | "admin";

type LoginData = {
  token: string;
  user_id: number;
  username: string;
  role: Role;
};

export default function AuthPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "register">("login");

  // 登录表单
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // 注册表单（要选角色）
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [regRole, setRegRole] = useState<Role>("merchant");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function gotoByRole(role: Role) {
    // 这里改成你们项目真实路由
    if (role === "admin") router.replace("/admin");
    else router.replace("/merchant");
  }

  async function onLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await postApi<LoginData>("/api/auth/login", {
        username: loginUsername,
        password: loginPassword,
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("username", data.username);

      gotoByRole(data.role);
    } catch (err: any) {
      setError(err?.message || "登录失败");
    } finally {
      setLoading(false);
    }
  }

  async function onRegisterSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (regPassword !== regConfirm) {
      setError("两次密码不一致");
      return;
    }

    setLoading(true);
    try {
      // ✅ 注册接口：/api/auth/register
      await postApi("/api/auth/register", {
        username: regUsername,
        password: regPassword,
        role: regRole, // "admin" | "merchant"
      });

      // ✅ 注册成功：切回登录，让用户登录（更通用）
      setTab("login");
      setLoginUsername(regUsername);
      setLoginPassword("");
    } catch (err: any) {
      setError(err?.message || "注册失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border p-6 shadow-sm">
        {/* Tab */}
        <div className="flex gap-2 rounded-xl border p-1">
          <button
            type="button"
            className={`flex-1 rounded-lg px-3 py-2 text-sm ${
              tab === "login" ? "border bg-white shadow-sm" : "opacity-70"
            }`}
            onClick={() => {
              setTab("login");
              setError(null);
            }}
          >
            登录
          </button>
          <button
            type="button"
            className={`flex-1 rounded-lg px-3 py-2 text-sm ${
              tab === "register" ? "border bg-white shadow-sm" : "opacity-70"
            }`}
            onClick={() => {
              setTab("register");
              setError(null);
            }}
          >
            注册
          </button>
        </div>

        <h1 className="mt-5 text-2xl font-semibold">
          {tab === "login" ? "登录" : "注册"}
        </h1>
        <p className="mt-1 text-sm opacity-70">
          {tab === "login"
            ? "登录无需选择角色，系统会自动识别。"
            : "注册必须选择角色（商户/管理员）。"}
        </p>

        {error && (
          <div className="mt-4 rounded-xl border px-3 py-2 text-sm">
            {error}
          </div>
        )}

        {tab === "login" ? (
          <form className="mt-6 space-y-4" onSubmit={onLoginSubmit}>
            <div>
              <label className="text-sm">用户名</label>
              <input
                className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="请输入用户名"
                required
              />
            </div>

            <div>
              <label className="text-sm">密码</label>
              <input
                className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="请输入密码"
                type="password"
                required
              />
            </div>

            <button
              className="w-full rounded-xl border px-3 py-2 font-medium disabled:opacity-50"
              disabled={loading}
              type="submit"
            >
              {loading ? "登录中..." : "登录"}
            </button>
          </form>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={onRegisterSubmit}>
            <div>
              <label className="text-sm">选择角色</label>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  className={`flex-1 rounded-xl border px-3 py-2 text-sm ${
                    regRole === "merchant" ? "bg-white shadow-sm" : "opacity-70"
                  }`}
                  onClick={() => setRegRole("merchant")}
                >
                  商户
                </button>
                <button
                  type="button"
                  className={`flex-1 rounded-xl border px-3 py-2 text-sm ${
                    regRole === "admin" ? "bg-white shadow-sm" : "opacity-70"
                  }`}
                  onClick={() => setRegRole("admin")}
                >
                  管理员
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm">用户名</label>
              <input
                className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                placeholder="请输入用户名"
                required
              />
            </div>

            <div>
              <label className="text-sm">密码</label>
              <input
                className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="至少 6 位"
                type="password"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="text-sm">确认密码</label>
              <input
                className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring"
                value={regConfirm}
                onChange={(e) => setRegConfirm(e.target.value)}
                placeholder="再输入一次"
                type="password"
                required
                minLength={6}
              />
            </div>

            <button
              className="w-full rounded-xl border px-3 py-2 font-medium disabled:opacity-50"
              disabled={loading}
              type="submit"
            >
              {loading ? "注册中..." : "注册"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}