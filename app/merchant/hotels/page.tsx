"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getMerchantHotels } from "@/services/hotel";
import type { MerchantHotelListItem, MerchantHotelListData } from "@/types/hotel";
import { HOTEL_STATUS_LABEL, HOTEL_EDIT_LABEL } from "@/constants/status";
import { getHotelEditLatest } from "@/services/hotel";

const STATUSES = [
  { value: "", label: "全部" },
  { value: "pending", label: "待审核" },
  { value: "approved", label: "已上线" },
  { value: "offline", label: "已下线" },
  { value: "rejected", label: "已驳回" },
];

export default function MerchantHotelsPage() {
  const [allList, setAllList] = useState<MerchantHotelListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editLabels, setEditLabels] = useState<Record<number, "pending" | "rejected" | null>>({});

  // 本地分页和搜索参数
  const [page, setPage] = useState(1);
  const [size] = useState(10);
  const [keyword, setKeyword] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // 首次拉取所有酒店（为了在前端做全部过滤）。如果数据量非常大，请调整策略。
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    // 请求较大页大小以拉取所有条目（后端支持 size 参数）
    getMerchantHotels({ page: 1, size: 1000 })
      .then((res) => {
        if (cancelled) return;
        const items = res.data.list ?? [];
        setAllList(items);
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

  // 仅在前端做过滤（keyword + status）
  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return allList.filter((h) => {
      const matchKeyword = kw ? h.name.toLowerCase().includes(kw) : true;
      const matchStatus = selectedStatus ? h.status === selectedStatus : true;
      return matchKeyword && matchStatus;
    });
  }, [allList, keyword, selectedStatus]);

  // 当前页显示的数据
  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / size));
  const displayList = filtered.slice((page - 1) * size, page * size);

  // 重置到第一页以便用户看到最新筛选结果
  useEffect(() => {
    setPage(1);
  }, [keyword, selectedStatus]);

  const handleSearch = (value: string) => {
    setKeyword(value);
  };

  const handleStatusFilter = (status: string) => {
    setSelectedStatus(status);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pageCount) return;
    setPage(newPage);
  };

  return (
    <div className="rounded-lg border border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 px-4 py-3">
        <h2 className="text-lg font-semibold text-zinc-900">我的酒店</h2>
      </div>

      {/* 搜索和筛选区域 */}
      <div className="border-b border-zinc-200 px-4 py-4">
        <div className="grid gap-4 md:grid-cols-2">
          {/* 搜索框 */}
          <input
            type="text"
            placeholder="搜索酒店名称..."
            value={keyword}
            onChange={(e) => handleSearch(e.target.value)}
            className="rounded border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-400 focus:outline-none"
          />
          {/* 状态筛选 */}
          <div className="flex gap-2 flex-wrap items-center">
            <span className="text-sm text-zinc-600">状态：</span>
            {STATUSES.map((status) => (
              <button
                key={status.value}
                onClick={() => handleStatusFilter(status.value)}
                className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
                  selectedStatus === status.value
                    ? "bg-zinc-900 text-white"
                    : "border border-zinc-300 text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      {loading ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-zinc-500">
          加载中…
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      ) : (
        <>
          <div className="divide-y divide-zinc-100">
            {total === 0 ? (
              <div className="px-4 py-8 text-center text-zinc-500">
                {keyword || selectedStatus ? (
                  "没有找到匹配的酒店"
                ) : (
                  <>
                    暂无酒店，{" "}
                    <Link href="/merchant/hotels/new" className="text-zinc-900 underline">
                      去新增
                    </Link>
                  </>
                )}
              </div>
            ) : (
              displayList.map((item) => (
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

          {/* 分页区域 */}
          {total > 0 && (
            <div className="border-t border-zinc-200 px-4 py-3 flex items-center justify-between">
              <div className="text-sm text-zinc-600">
                共 {total} 条 • 第 {page} / {pageCount} 页
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="rounded border border-zinc-300 px-3 py-1 text-sm text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  上一页
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: pageCount }).map((_, i) => {
                    const p = i + 1;
                    const isShowPage =
                      p === 1 ||
                      p === pageCount ||
                      (p >= page - 1 && p <= page + 1);
                    if (!isShowPage && i > 0 && i < pageCount - 1) {
                      if (i === 1 || (i > 1 && i < pageCount - 2)) {
                        return null;
                      }
                      return <span key={`ellipsis-${i}`}>...</span>;
                    }
                    if (!isShowPage) return null;
                    return (
                      <button
                        key={p}
                        onClick={() => handlePageChange(p)}
                        className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                          page === p
                            ? "bg-zinc-900 text-white"
                            : "border border-zinc-300 text-zinc-700 hover:bg-zinc-50"
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === pageCount}
                  className="rounded border border-zinc-300 px-3 py-1 text-sm text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
