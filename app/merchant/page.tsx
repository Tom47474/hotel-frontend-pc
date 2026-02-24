"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MerchantPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (!token) router.replace("/auth");
    else if (role !== "merchant") router.replace("/admin");
  }, [router]);

  return <div className="p-6 text-xl font-semibold">商户后台</div>;
}