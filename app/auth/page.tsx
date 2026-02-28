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
    // 这里改成项目真实路由
    if (role === "admin") router.replace("/admin");
    else router.replace("/merchant/hotels");
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
      //  注册接口：/api/auth/register
      await postApi("/api/auth/register", {
        username: regUsername,
        password: regPassword,
        role: regRole, // "admin" | "merchant"
      });

      //  注册成功：切回登录，让用户登录
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
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-100 to-indigo-100">
      {/* 左上角品牌 */}
      <div className="absolute left-6 top-6 flex items-center gap-2">
        <div className="h-9 w-9 rounded-xl bg-white/70 backdrop-blur border shadow-sm flex items-center justify-center">
          <span className="text-lg">🏨</span>
        </div>
        <div>
          <div className="text-base font-semibold text-slate-800">
            易宿酒店预定平台
          </div>
          <div className="text-xs text-slate-500">Merchant & Admin Portal</div>
        </div>
      </div>

      {/* 中间卡片容器 */}
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl border border-white/60 bg-white/60 backdrop-blur-xl p-7 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.25)]">
          {/* Tab */}
          <div className="flex gap-2 rounded-2xl bg-white/70 p-1 border border-white/60">
            <button
              type="button"
              className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium transition ${
                tab === "login"
                  ? "bg-white shadow-sm text-slate-900"
                  : "text-slate-600 hover:bg-white/50"
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
              className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium transition ${
                tab === "register"
                  ? "bg-white shadow-sm text-slate-900"
                  : "text-slate-600 hover:bg-white/50"
              }`}
              onClick={() => {
                setTab("register");
                setError(null);
              }}
            >
              注册
            </button>
          </div>

          {/* 标题与说明 */}
          <div className="mt-6">
            <h1 className="text-2xl font-semibold text-slate-900">
              {tab === "login" ? "欢迎回来" : "创建新账号"}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {tab === "login"
                ? "无需选择角色，系统会自动识别账号身份。"
                : "请选择角色后注册（商户 / 管理员）。"}
            </p>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50/80 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* 下面保持原来的 login/register 表单结构，只是把 input/button 的 class 换掉 */}
          {tab === "login" ? (
            <form className="mt-6 space-y-4" onSubmit={onLoginSubmit}>
              <div>
                <label className="text-sm text-slate-700">用户名</label>
                <input
                  className="mt-1 w-full rounded-2xl border border-white/60 bg-white/70 px-3 py-2.5 text-slate-900 outline-none ring-0 transition focus:bg-white focus:border-sky-200 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.25)]"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="请输入用户名"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-slate-700">密码</label>
                <input
                  className="mt-1 w-full rounded-2xl border border-white/60 bg-white/70 px-3 py-2.5 text-slate-900 outline-none transition focus:bg-white focus:border-sky-200 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.25)]"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="请输入密码"
                  type="password"
                  required
                />
              </div>

              <button
                className="w-full rounded-2xl bg-sky-600 px-3 py-2.5 font-medium text-white shadow-sm transition hover:bg-sky-700 active:scale-[0.99] disabled:opacity-60"
                disabled={loading}
                type="submit"
              >
                {loading ? "登录中..." : "登录"}
              </button>
            </form>
          ) : (
            <form className="mt-6 space-y-4" onSubmit={onRegisterSubmit}>
              <div>
                <label className="text-sm text-slate-700">选择角色</label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className={`rounded-2xl border px-3 py-2.5 text-sm font-medium transition ${
                      regRole === "merchant"
                        ? "bg-white text-slate-900 border-sky-200 shadow-sm"
                        : "bg-white/60 text-slate-600 border-white/60 hover:bg-white/80"
                    }`}
                    onClick={() => setRegRole("merchant")}
                  >
                    商户
                  </button>
                  <button
                    type="button"
                    className={`rounded-2xl border px-3 py-2.5 text-sm font-medium transition ${
                      regRole === "admin"
                        ? "bg-white text-slate-900 border-sky-200 shadow-sm"
                        : "bg-white/60 text-slate-600 border-white/60 hover:bg-white/80"
                    }`}
                    onClick={() => setRegRole("admin")}
                  >
                    管理员
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm text-slate-700">用户名</label>
                <input
                  className="mt-1 w-full rounded-2xl border border-white/60 bg-white/70 px-3 py-2.5 text-slate-900 outline-none transition focus:bg-white focus:border-sky-200 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.25)]"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="请输入用户名"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-slate-700">密码</label>
                <input
                  className="mt-1 w-full rounded-2xl border border-white/60 bg-white/70 px-3 py-2.5 text-slate-900 outline-none transition focus:bg-white focus:border-sky-200 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.25)]"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="至少 6 位"
                  type="password"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="text-sm text-slate-700">确认密码</label>
                <input
                  className="mt-1 w-full rounded-2xl border border-white/60 bg-white/70 px-3 py-2.5 text-slate-900 outline-none transition focus:bg-white focus:border-sky-200 focus:shadow-[0_0_0_4px_rgba(56,189,248,0.25)]"
                  value={regConfirm}
                  onChange={(e) => setRegConfirm(e.target.value)}
                  placeholder="再输入一次"
                  type="password"
                  required
                  minLength={6}
                />
              </div>

              <button
                className="w-full rounded-2xl bg-sky-600 px-3 py-2.5 font-medium text-white shadow-sm transition hover:bg-sky-700 active:scale-[0.99] disabled:opacity-60"
                disabled={loading}
                type="submit"
              >
                {loading ? "注册中..." : "注册"}
              </button>
            </form>
          )}

          {/* 底部小字 */}
          <div className="mt-6 text-center text-xs text-slate-500">
            登录即表示你同意平台服务条款与隐私政策
          </div>
        </div>
      </div>
    </div>
  );
}