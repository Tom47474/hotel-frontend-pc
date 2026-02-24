"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (!token) router.replace("/auth");
    else if (role !== "admin") router.replace("/merchant");
  }, [router]);

  return <div className="p-6 text-xl font-semibold">管理员后台</div>;
}