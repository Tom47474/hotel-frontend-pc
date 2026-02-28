"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMerchantHotels } from "@/services/hotel";
import type { MerchantHotelListItem } from "@/types/hotel";
import { HOTEL_STATUS_LABEL, HOTEL_EDIT_LABEL } from "@/constants/status";
import { getHotelEditLatest } from "@/services/hotel";

export default function MerchantHotelsPage() {
  const [list, setList] = useState<MerchantHotelListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editLabels, setEditLabels] = useState<Record<number, "pending" | "rejected" | null>>({});

  useEffect(() => {
    let cancelled = false;
    // setLoading(true);
    // setError(null);
    getMerchantHotels({ page: 1, size: 50 })
      .then((res) => {
        if (cancelled) return;
        const items = res.data.list ?? [];
        setList(items);
        return items;
      })
      .then((hotels) => {
        if (cancelled || !hotels?.length) return;
        const labels: Record<number, "pending" | "rejected" | null> = {};
        const promises = hotels.map((h) =>
          getHotelEditLatest(h.hotel_id)
            .then((r) => {
              if (r.data?.edit_status === "pending" || r.data?.edit_status === "rejected") {
                labels[h.hotel_id] = r.data.edit_status;
              }
            })
            .catch(() => {})
        );
        return Promise.all(promises).then(() => labels);
      })
      .then((labels) => {
        if (cancelled) return;
        if (labels) setEditLabels(labels);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "加载失败");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-zinc-500">
        加载中…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 px-4 py-3">
        <h2 className="text-lg font-semibold text-zinc-900">我的酒店</h2>
      </div>
      <div className="divide-y divide-zinc-100">
        {list.length === 0 ? (
          <div className="px-4 py-8 text-center text-zinc-500">
            暂无酒店，{" "}
            <Link href="/merchant/hotels/new" className="text-zinc-900 underline">
              去新增
            </Link>
          </div>
        ) : (
          list.map((item) => (
            <div
              key={item.hotel_id}
              className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50"
            >
              <div className="flex items-center gap-3">
                <span className="font-medium text-zinc-900">{item.name}</span>
                <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
                  {HOTEL_STATUS_LABEL[item.status] ?? item.status}
                </span>
                {editLabels[item.hotel_id] === "pending" && (
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                    {HOTEL_EDIT_LABEL}（待审核）
                  </span>
                )}
                {editLabels[item.hotel_id] === "rejected" && (
                  <span className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-800">
                    {HOTEL_EDIT_LABEL}（已驳回）
                  </span>
                )}
              </div>
              <Link
                href={`/merchant/hotels/${item.hotel_id}/edit`}
                className="text-sm text-zinc-600 hover:underline"
              >
                编辑
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
