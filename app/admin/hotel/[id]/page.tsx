"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  getAdminHotelDetail,
  auditHotelApprove,
  auditHotelReject,
  setHotelOnline,
  setHotelOffline,
} from "@/services/admin";
import type { AdminHotelDetail } from "@/types/hotel";

const AUDIT_STATUS_MAP: Record<string, string> = {
  pending: "审核中",
  approved: "通过",
  rejected: "不通过",
};

const ONLINE_STATUS_MAP: Record<string, string> = {
  approved: "未上线",
  online: "已上线",
  offline: "已下线",
};

function getAuditStatus(status: string): "pending" | "approved" | "rejected" {
  if (status === "pending" || status === "approved" || status === "rejected") return status;
  if (status === "online" || status === "offline") return "approved";
  return "pending";
}

function getOnlineStatus(status: string): "approved" | "online" | "offline" {
  if (status === "online" || status === "offline") return status;
  return "approved";
}

export default function AdminHotelDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string | undefined;
  const hotelId = id ? Number(id) : NaN;

  const [detail, setDetail] = useState<AdminHotelDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioning, setActioning] = useState(false);
  const [rejectReasonInput, setRejectReasonInput] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (!token) router.replace("/auth");
    else if (role !== "admin") router.replace("/merchant");
  }, [router]);

  useEffect(() => {
    if (!id || Number.isNaN(hotelId)) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getAdminHotelDetail(hotelId)
      .then((res) => {
        if (cancelled) return;
        setDetail(res.data ?? null);
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
  }, [id, hotelId]);

  const auditStatus = detail ? getAuditStatus(detail.status) : "pending";
  const onlineStatus = detail ? getOnlineStatus(detail.status) : "approved";
  const isPending = auditStatus === "pending";
  const isRejected = auditStatus === "rejected";
  const isApprovedNotOnline = auditStatus === "approved" && onlineStatus === "approved";
  const isOnline = onlineStatus === "online";
  const isOffline = onlineStatus === "offline";

  async function handleApprove() {
    if (actioning || !detail) return;
    setActioning(true);
    setError(null);
    try {
      await auditHotelApprove(detail.hotel_id);
      setDetail((d) => (d ? { ...d, status: "approved" } : null));
    } catch (e) {
      setError(e instanceof Error ? e.message : "操作失败");
    } finally {
      setActioning(false);
    }
  }

  function openRejectModal() {
    setShowRejectModal(true);
    setRejectReasonInput("");
  }

  async function handleRejectConfirm() {
    if (!detail) return;
    const reason = rejectReasonInput.trim() || "未填写原因";
    setActioning(true);
    setError(null);
    try {
      await auditHotelReject(detail.hotel_id, reason);
      setDetail((d) => (d ? { ...d, status: "rejected", reject_reason: reason } : null));
      setShowRejectModal(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "操作失败");
    } finally {
      setActioning(false);
    }
  }

  async function handleOnline() {
    if (actioning || !detail) return;
    setActioning(true);
    setError(null);
    try {
      await setHotelOnline(detail.hotel_id);
      setDetail((d) => (d ? { ...d, status: "online" } : null));
    } catch (e) {
      setError(e instanceof Error ? e.message : "操作失败");
    } finally {
      setActioning(false);
    }
  }

  async function handleOffline() {
    if (actioning || !detail) return;
    setActioning(true);
    setError(null);
    try {
      await setHotelOffline(detail.hotel_id);
      setDetail((d) => (d ? { ...d, status: "offline" } : null));
    } catch (e) {
      setError(e instanceof Error ? e.message : "操作失败");
    } finally {
      setActioning(false);
    }
  }

  async function handleRestore() {
    if (actioning || !detail) return;
    setActioning(true);
    setError(null);
    try {
      await setHotelOnline(detail.hotel_id);
      setDetail((d) => (d ? { ...d, status: "online" } : null));
    } catch (e) {
      setError(e instanceof Error ? e.message : "操作失败");
    } finally {
      setActioning(false);
    }
  }

  if (!id || Number.isNaN(hotelId)) {
    return (
      <div className="min-h-screen bg-zinc-50 p-6">
        <div className="mx-auto max-w-3xl">
          <p className="text-zinc-600">无效的酒店 ID</p>
          <Link href="/admin" className="mt-2 inline-block text-sm text-zinc-600 hover:underline">
            返回列表
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/admin" className="text-sm text-zinc-600 hover:text-zinc-900">
            ← 返回审核列表
          </Link>
        </div>

        {loading && (
          <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-zinc-500">
            加载中…
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {!loading && detail && (
          <div className="rounded-lg border border-zinc-200 bg-white overflow-hidden">
            <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-3">
              <h1 className="text-xl font-semibold text-zinc-900">{detail.name}</h1>
              <div className="mt-2 flex flex-wrap gap-2">
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium ${
                    isPending ? "bg-amber-100 text-amber-800" : isRejected ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                  }`}
                >
                  审核：{AUDIT_STATUS_MAP[auditStatus] ?? detail.status}
                </span>
                <span
                  className={`rounded px-2 py-0.5 text-xs ${
                    isOnline ? "bg-emerald-100 text-emerald-800" : isOffline ? "bg-zinc-200 text-zinc-700" : "bg-zinc-100 text-zinc-600"
                  }`}
                >
                  上线：{ONLINE_STATUS_MAP[onlineStatus] ?? "—"}
                </span>
              </div>
              {isRejected && detail.reject_reason && (
                <p className="mt-2 text-sm text-red-600">驳回原因：{detail.reject_reason}</p>
              )}
            </div>

            <div className="px-4 py-4 space-y-4 text-sm">
              <div className="space-y-1">
                {detail.city != null && <p><span className="text-zinc-500">城市：</span>{detail.city}</p>}
                {detail.address != null && <p><span className="text-zinc-500">地址：</span>{detail.address}</p>}
                {detail.star != null && <p><span className="text-zinc-500">星级：</span>{detail.star} 星</p>}
                {detail.opening_date != null && <p><span className="text-zinc-500">开业日期：</span>{detail.opening_date}</p>}
                {detail.description != null && <p><span className="text-zinc-500">描述：</span>{detail.description}</p>}
              </div>

              {detail.images != null && detail.images.length > 0 && (
                <div>
                  <p className="mb-2 text-zinc-500">图片</p>
                  <div className="flex flex-wrap gap-2">
                    {detail.images.map((img, i) => (
                      <a
                        key={i}
                        href={img.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block h-24 w-32 overflow-hidden rounded border border-zinc-200 bg-zinc-100"
                      >
                        <img src={img.url} alt="" className="h-full w-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {detail.contacts != null && detail.contacts.length > 0 && (
                <div>
                  <p className="mb-1 text-zinc-500">联系方式</p>
                  <ul className="space-y-0.5">
                    {detail.contacts.map((c, i) => (
                      <li key={i}>
                        {c.type === "phone" ? "电话" : "邮箱"}：{c.value}
                        {c.is_primary ? "（主）" : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {detail.facilities != null && detail.facilities.length > 0 && (
                <div>
                  <p className="mb-1 text-zinc-500">设施</p>
                  <p className="text-zinc-800">{detail.facilities.map((f) => f.name).join("、")}</p>
                </div>
              )}

              {detail.rooms != null && detail.rooms.length > 0 && (
                <div>
                  <p className="mb-2 text-zinc-500">房型</p>
                  <ul className="space-y-2 rounded border border-zinc-100 bg-zinc-50/50 p-3">
                    {detail.rooms.map((r, i) => (
                      <li key={r.room_id ?? i} className="text-zinc-800">
                        <span className="font-medium">{r.name}</span>
                        <span className="ml-2 text-zinc-500">
                          {r.area}㎡ · {r.bed_type} · 最多{r.max_guest}人 · ¥{r.base_price}/晚 · 库存{r.stock}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="border-t border-zinc-200 px-4 py-4 flex flex-wrap gap-2">
              {isPending && (
                <>
                  <button
                    type="button"
                    disabled={actioning}
                    onClick={handleApprove}
                    className="rounded bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-60"
                  >
                    {actioning ? "处理中…" : "通过"}
                  </button>
                  <button
                    type="button"
                    disabled={actioning}
                    onClick={openRejectModal}
                    className="rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    不通过
                  </button>
                </>
              )}
              {isApprovedNotOnline && (
                <button
                  type="button"
                  disabled={actioning}
                  onClick={handleOnline}
                  className="rounded bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {actioning ? "处理中…" : "上线"}
                </button>
              )}
              {isOnline && (
                <button
                  type="button"
                  disabled={actioning}
                  onClick={handleOffline}
                  className="rounded bg-amber-600 px-4 py-2 text-sm text-white hover:bg-amber-700 disabled:opacity-60"
                >
                  {actioning ? "处理中…" : "下线"}
                </button>
              )}
              {isOffline && (
                <button
                  type="button"
                  disabled={actioning}
                  onClick={handleRestore}
                  className="rounded bg-sky-600 px-4 py-2 text-sm text-white hover:bg-sky-700 disabled:opacity-60"
                >
                  {actioning ? "处理中…" : "恢复"}
                </button>
              )}
            </div>
          </div>
        )}

        {!loading && !detail && !error && (
          <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-zinc-500">
            未找到该酒店
          </div>
        )}
      </div>

      {showRejectModal && detail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setShowRejectModal(false)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-zinc-900">审核不通过</h3>
            <p className="mt-1 text-sm text-zinc-500">酒店「{detail.name}」请填写驳回原因</p>
            <textarea
              className="mt-3 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              rows={3}
              placeholder="请输入驳回原因"
              value={rejectReasonInput}
              onChange={(e) => setRejectReasonInput(e.target.value)}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
              >
                取消
              </button>
              <button
                type="button"
                disabled={actioning}
                onClick={handleRejectConfirm}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-60"
              >
                {actioning ? "提交中…" : "确定不通过"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
