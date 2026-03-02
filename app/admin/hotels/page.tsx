"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getAdminHotelsList,
  auditHotelApprove,
  auditHotelReject,
  setHotelOnline,
  setHotelOffline,
} from "@/services/admin";
import type { AdminHotelListItem } from "@/types/hotel";

/** 审核状态：审核中 / 通过 / 不通过 */
const AUDIT_STATUS_MAP: Record<string, string> = {
  pending: "审核中",
  approved: "通过",
  rejected: "不通过",
};

/** 上线状态：未上线 / 已上线 / 已下线（仅当审核通过后才有意义） */
const ONLINE_STATUS_MAP: Record<string, string> = {
  approved: "未上线",
  online: "已上线",
  offline: "已下线",
};

function getAuditStatus(status: string): "pending" | "approved" | "rejected" {
  if (status === "pending" || status === "approved" || status === "rejected") return status;
  if (status === "online" || status === "offline") return "approved"; // 已上线/已下线 表示审核已通过
  return "pending";
}

function getOnlineStatus(status: string): "approved" | "online" | "offline" {
  if (status === "online" || status === "offline") return status;
  return "approved"; // 审核通过但未上线
}

/** 格式化时间为 YYYY-MM-DD HH:mm */
function formatDateTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const h = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${day} ${h}:${min}`;
  } catch {
    return dateStr;
  }
}

export default function AdminHotelsPage() {
  const router = useRouter();
  const [list, setList] = useState<AdminHotelListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const size = 10;
  /** 不通过弹窗：当前要填写驳回原因的酒店 */
  const [rejectTarget, setRejectTarget] = useState<{ hotelId: number; hotelName: string } | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState("");
  /** 当前正在操作的酒店 ID（防重复点击、显示处理中） */
  const [actioningId, setActioningId] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (!token) router.replace("/auth");
    else if (role !== "admin") router.replace("/merchant");
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getAdminHotelsList({ page, size })
      .then((res) => {
        if (cancelled) return;
        const items = res.data?.list ?? [];
        setList(items);
        setTotal(res.data?.total ?? items.length);
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
  }, [page]);

  /** 审核通过 */
  async function handleApprove(hotelId: number) {
    if (actioningId != null) return;
    setActioningId(hotelId);
    setError(null);
    try {
      await auditHotelApprove(hotelId);
      setList((prev) =>
        prev.map((item) =>
          item.hotel_id === hotelId ? { ...item, status: "approved" } : item
        )
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "审核通过失败");
    } finally {
      setActioningId(null);
    }
  }

  /** 打开不通过弹窗，让用户输入原因 */
  function openRejectModal(hotelId: number, hotelName: string) {
    setRejectTarget({ hotelId, hotelName });
    setRejectReasonInput("");
  }

  /** 确认审核不通过并提交原因 */
  async function handleRejectConfirm() {
    if (!rejectTarget) return;
    const reason = rejectReasonInput.trim() || "未填写原因";
    const hotelId = rejectTarget.hotelId;
    setActioningId(hotelId);
    setError(null);
    try {
      await auditHotelReject(hotelId, reason);
      setList((prev) =>
        prev.map((item) =>
          item.hotel_id === hotelId
            ? { ...item, status: "rejected", reject_reason: reason }
            : item
        )
      );
      setRejectTarget(null);
      setRejectReasonInput("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "审核不通过操作失败");
    } finally {
      setActioningId(null);
    }
  }

  /** 上线 */
  async function handleOnline(hotelId: number) {
    if (actioningId != null) return;
    setActioningId(hotelId);
    setError(null);
    try {
      await setHotelOnline(hotelId);
      setList((prev) =>
        prev.map((item) =>
          item.hotel_id === hotelId ? { ...item, status: "online" } : item
        )
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "上线失败");
    } finally {
      setActioningId(null);
    }
  }

  /** 下线 */
  async function handleOffline(hotelId: number) {
    if (actioningId != null) return;
    setActioningId(hotelId);
    setError(null);
    try {
      await setHotelOffline(hotelId);
      setList((prev) =>
        prev.map((item) =>
          item.hotel_id === hotelId ? { ...item, status: "offline" } : item
        )
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "下线失败");
    } finally {
      setActioningId(null);
    }
  }

  /** 恢复（已下线酒店再次上线） */
  async function handleRestore(hotelId: number) {
    if (actioningId != null) return;
    setActioningId(hotelId);
    setError(null);
    try {
      await setHotelOnline(hotelId);
      setList((prev) =>
        prev.map((item) =>
          item.hotel_id === hotelId ? { ...item, status: "online" } : item
        )
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "恢复失败");
    } finally {
      setActioningId(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / size));

  return (
    <div className="min-h-screen bg-zinc-50 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-zinc-900">酒店审核</h1>
          <Link href="/admin" className="text-sm text-zinc-600 hover:text-zinc-900">
            返回管理员后台
          </Link>
        </div>

        {loading && (
          <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-zinc-500">
            加载中…
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
              <table className="w-full text-left">
                <thead className="border-b border-zinc-200 bg-zinc-50">
                  <tr>
                    <th className="px-4 py-3 text-sm font-medium text-zinc-700">酒店ID</th>
                    <th className="px-4 py-3 text-sm font-medium text-zinc-700">名称</th>
                    <th className="px-4 py-3 text-sm font-medium text-zinc-700">商户ID</th>
                    <th className="px-4 py-3 text-sm font-medium text-zinc-700">审核状态</th>
                    <th className="px-4 py-3 text-sm font-medium text-zinc-700">上线状态</th>
                    <th className="px-4 py-3 text-sm font-medium text-zinc-700">创建时间</th>
                    <th className="px-4 py-3 text-sm font-medium text-zinc-700">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {list.map((item, index) => {
                    const auditStatus = getAuditStatus(item.status);
                    const onlineStatus = getOnlineStatus(item.status);
                    const isRejected = auditStatus === "rejected";
                    const isPending = auditStatus === "pending";
                    const isApprovedNotOnline = auditStatus === "approved" && onlineStatus === "approved";
                    const isOnline = onlineStatus === "online";
                    const isOffline = onlineStatus === "offline";
                    const isActioning = actioningId === item.hotel_id;
                    const rowKey = `hotel-${item.hotel_id}-${item.hotel_edit_id ?? index}-${index}`;

                    return (
                      <tr key={rowKey} className="hover:bg-zinc-50">
                        <td className="px-4 py-3 text-zinc-900">{item.hotel_id}</td>
                        <td className="px-4 py-3 font-medium text-zinc-900">{item.name}</td>
                        <td className="px-4 py-3 text-zinc-600">{item.merchant_id}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-0.5">
                            <span
                              className={`inline-flex w-fit rounded px-2 py-0.5 text-xs font-medium ${
                                isPending
                                  ? "bg-amber-100 text-amber-800"
                                  : isRejected
                                    ? "bg-red-100 text-red-800"
                                    : "bg-green-100 text-green-800"
                              }`}
                            >
                              {AUDIT_STATUS_MAP[auditStatus] ?? auditStatus}
                            </span>
                            {isRejected && item.reject_reason && (
                              <span className="text-xs text-red-600" title={item.reject_reason}>
                                原因：{item.reject_reason}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded px-2 py-0.5 text-xs ${
                              isOnline
                                ? "bg-emerald-100 text-emerald-800"
                                : isOffline
                                  ? "bg-zinc-200 text-zinc-700"
                                  : "bg-zinc-100 text-zinc-600"
                            }`}
                          >
                            {ONLINE_STATUS_MAP[onlineStatus] ?? "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-500">{formatDateTime(item.created_at)}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            {isPending && (
                              <>
                                <button
                                  type="button"
                                  disabled={isActioning}
                                  onClick={() => handleApprove(item.hotel_id)}
                                  className="rounded bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700 disabled:opacity-60"
                                >
                                  {isActioning ? "处理中…" : "通过"}
                                </button>
                                <button
                                  type="button"
                                  disabled={isActioning}
                                  onClick={() => openRejectModal(item.hotel_id, item.name)}
                                  className="rounded bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700 disabled:opacity-60"
                                >
                                  不通过
                                </button>
                              </>
                            )}
                            {isApprovedNotOnline && (
                              <button
                                type="button"
                                disabled={isActioning}
                                onClick={() => handleOnline(item.hotel_id)}
                                className="rounded bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-700 disabled:opacity-60"
                              >
                                {isActioning ? "处理中…" : "上线"}
                              </button>
                            )}
                            {isOnline && (
                              <button
                                type="button"
                                disabled={isActioning}
                                onClick={() => handleOffline(item.hotel_id)}
                                className="rounded bg-amber-600 px-3 py-1.5 text-sm text-white hover:bg-amber-700 disabled:opacity-60"
                              >
                                {isActioning ? "处理中…" : "下线"}
                              </button>
                            )}
                            {isOffline && (
                              <button
                                type="button"
                                disabled={isActioning}
                                onClick={() => handleRestore(item.hotel_id)}
                                className="rounded bg-sky-600 px-3 py-1.5 text-sm text-white hover:bg-sky-700 disabled:opacity-60"
                              >
                                {isActioning ? "处理中…" : "恢复"}
                              </button>
                            )}
                            {isRejected && (
                              <span className="text-xs text-zinc-400">—</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm text-zinc-600">
              <span>共 {total} 条</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded border border-zinc-200 px-3 py-1 disabled:opacity-50"
                >
                  上一页
                </button>
                <span>第 {page} / {totalPages} 页</span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded border border-zinc-200 px-3 py-1 disabled:opacity-50"
                >
                  下一页
                </button>
              </div>
            </div>
          </>
        )}

        {/* 审核不通过 - 填写原因弹窗 */}
        {rejectTarget && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() => setRejectTarget(null)}
          >
            <div
              className="w-full max-w-md rounded-xl bg-white p-5 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-zinc-900">审核不通过</h3>
              <p className="mt-1 text-sm text-zinc-500">
                酒店「{rejectTarget.hotelName}」请填写驳回原因（将展示给商户）
              </p>
              <textarea
                className="mt-3 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-200"
                rows={3}
                placeholder="请输入驳回原因，如：信息不完整，请补充后重新提交"
                value={rejectReasonInput}
                onChange={(e) => setRejectReasonInput(e.target.value)}
              />
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectTarget(null)}
                  className="rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                >
                  取消
                </button>
                <button
                  type="button"
                  disabled={actioningId != null}
                  onClick={() => handleRejectConfirm()}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {actioningId != null ? "提交中…" : "确定不通过"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
