import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "易宿 - 欢迎登陆！",
  description: "商户与管理员登录注册",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}