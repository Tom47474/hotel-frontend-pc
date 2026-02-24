"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  getMerchantHotel,
  getHotelEditLatest,
  submitHotelEdit,
} from "@/services/hotel";
import type {
  MerchantHotelDetail,
  HotelEditLatest,
  HotelEditBody,
  ContactItem,
  ImageItem,
} from "@/types/hotel";

const STAR_OPTIONS = [1, 2, 3, 4, 5];

export default function EditHotelPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params?.id);
  const [detail, setDetail] = useState<MerchantHotelDetail | null>(null);
  const [latestEdit, setLatestEdit] = useState<HotelEditLatest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [star, setStar] = useState(3);
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);
  const [description, setDescription] = useState("");
  const [openingDate, setOpeningDate] = useState("");
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [facilities, setFacilities] = useState<number[]>([]);
  const [images, setImages] = useState<ImageItem[]>([]);

  const loadData = useCallback(() => {
    if (!id || Number.isNaN(id)) {
      setError("无效的酒店 ID");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    getMerchantHotel(id)
      .then((detailRes) => {
        const d = detailRes.data;
        setDetail(d);
        setName(d.name ?? "");
        setStar(d.star ?? 3);
        setCity(d.city ?? "");
        setAddress(d.address ?? "");
        setLatitude(d.latitude ?? 0);
        setLongitude(d.longitude ?? 0);
        setDescription(d.description ?? "");
        setOpeningDate(d.opening_date ?? "");
        setContacts(d.contacts?.length ? [...d.contacts] : [{ type: "phone", value: "", is_primary: true }]);
        setFacilities(d.facilities ?? []);
        setImages(d.images?.length ? [...d.images] : [{ url: "", type: "cover" }]);
        return getHotelEditLatest(id)
          .then((latestRes) => latestRes.data)
          .catch(() => null);
      })
      .then((le) => {
        setLatestEdit(le ?? null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "加载失败"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const setContact = (i: number, patch: Partial<ContactItem>) => {
    setContacts((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], ...patch };
      return next;
    });
  };

  const addContact = () => {
    setContacts((prev) => [...prev, { type: "phone", value: "", is_primary: false }]);
  };

  const removeContact = (i: number) => {
    if (contacts.length <= 1) return;
    setContacts((prev) => prev.filter((_, idx) => idx !== i));
  };

  const setImage = (i: number, patch: Partial<ImageItem>) => {
    setImages((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], ...patch };
      return next;
    });
  };

  const addImage = () => {
    setImages((prev) => [...prev, { url: "", type: "detail" }]);
  };

  const removeImage = (i: number) => {
    if (images.length <= 1) return;
    setImages((prev) => prev.filter((_, idx) => idx !== i));
  };

  const toggleFacility = (fid: number) => {
    setFacilities((prev) =>
      prev.includes(fid) ? prev.filter((f) => f !== fid) : [...prev, fid]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !detail) return;
    if (detail.status !== "approved") {
      setError("仅已上线的酒店可提交修改");
      return;
    }
    if (latestEdit?.edit_status === "pending") {
      setError("已有待审核修改，请等待审核结果");
      return;
    }
    setError(null);
    setSubmitting(true);

    const body: HotelEditBody = {};
    if (name.trim() !== (detail.name ?? "")) body.name = name.trim();
    if (star !== (detail.star ?? 3)) body.star = star;
    if (city.trim() !== (detail.city ?? "")) body.city = city.trim();
    if (address.trim() !== (detail.address ?? "")) body.address = address.trim();
    if (Number(latitude) !== (detail.latitude ?? 0)) body.latitude = Number(latitude);
    if (Number(longitude) !== (detail.longitude ?? 0)) body.longitude = Number(longitude);
    if (description.trim() !== (detail.description ?? "")) body.description = description.trim();
    if (openingDate.trim() !== (detail.opening_date ?? "")) body.opening_date = openingDate.trim();
    body.contacts = contacts.filter((c) => c.value.trim());
    body.facilities = facilities;
    body.images = images.filter((img) => img.url.trim());

    if (Object.keys(body).length === 0) {
      setError("未修改任何内容");
      setSubmitting(false);
      return;
    }

    try {
      await submitHotelEdit(id, body);
      router.push("/merchant/hotels");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "提交失败");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-zinc-500">
        加载中…
      </div>
    );
  }

  if (error && !detail) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
        {error}
        <div className="mt-2">
          <Link href="/merchant/hotels" className="text-sm underline">
            返回列表
          </Link>
        </div>
      </div>
    );
  }

  const canSubmit =
    detail?.status === "approved" && latestEdit?.edit_status !== "pending";
  const isPending = latestEdit?.edit_status === "pending";
  const isRejected = latestEdit?.edit_status === "rejected";

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/merchant/hotels" className="text-zinc-600 hover:underline">
          返回列表
        </Link>
        <h2 className="text-lg font-semibold text-zinc-900">编辑酒店</h2>
      </div>

      {detail?.status !== "approved" && (
        <div className="mb-4 rounded border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          仅已上线的酒店可提交修改，当前状态：{detail?.status ?? "—"}
        </div>
      )}

      {isPending && (
        <div className="mb-4 rounded border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-800">
          您有一条修改正在审核中，请等待审核结果后再提交新修改。
        </div>
      )}

      {isRejected && latestEdit && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <p className="font-medium">您的修改未通过审核</p>
          <p className="mt-1">驳回原因：{latestEdit.reject_reason ?? "—"}</p>
          {latestEdit.reviewed_at && (
            <p className="mt-1 text-zinc-600">审核时间：{latestEdit.reviewed_at}</p>
          )}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <section>
          <h3 className="mb-3 text-sm font-medium text-zinc-700">基本信息</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-zinc-600">酒店名称</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded border border-zinc-300 px-3 py-2 text-zinc-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-zinc-600">星级</label>
              <select
                value={star}
                onChange={(e) => setStar(Number(e.target.value))}
                className="w-full rounded border border-zinc-300 px-3 py-2 text-zinc-900"
              >
                {STAR_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s} 星
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-zinc-600">城市</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded border border-zinc-300 px-3 py-2 text-zinc-900"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm text-zinc-600">地址</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded border border-zinc-300 px-3 py-2 text-zinc-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-zinc-600">纬度</label>
              <input
                type="number"
                step="any"
                value={latitude || ""}
                onChange={(e) => setLatitude(Number(e.target.value) || 0)}
                className="w-full rounded border border-zinc-300 px-3 py-2 text-zinc-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-zinc-600">经度</label>
              <input
                type="number"
                step="any"
                value={longitude || ""}
                onChange={(e) => setLongitude(Number(e.target.value) || 0)}
                className="w-full rounded border border-zinc-300 px-3 py-2 text-zinc-900"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm text-zinc-600">简介</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded border border-zinc-300 px-3 py-2 text-zinc-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-zinc-600">开业日期</label>
              <input
                type="text"
                value={openingDate}
                onChange={(e) => setOpeningDate(e.target.value)}
                className="w-full rounded border border-zinc-300 px-3 py-2 text-zinc-900"
                placeholder="如：2024 或 2024-01-01"
              />
            </div>
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-medium text-zinc-700">联系方式</h3>
          <div className="space-y-2">
            {contacts.map((c, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2">
                <select
                  value={c.type}
                  onChange={(e) => setContact(i, { type: e.target.value as "phone" | "email" })}
                  className="rounded border border-zinc-300 px-2 py-1.5 text-sm"
                >
                  <option value="phone">电话</option>
                  <option value="email">邮箱</option>
                </select>
                <input
                  type="text"
                  value={c.value}
                  onChange={(e) => setContact(i, { value: e.target.value })}
                  placeholder={c.type === "phone" ? "电话" : "邮箱"}
                  className="min-w-[120px] flex-1 rounded border border-zinc-300 px-3 py-1.5 text-sm"
                />
                <label className="flex items-center gap-1 text-sm text-zinc-600">
                  <input
                    type="checkbox"
                    checked={!!c.is_primary}
                    onChange={(e) => setContact(i, { is_primary: e.target.checked })}
                  />
                  主联系方式
                </label>
                {contacts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeContact(i)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    删除
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={addContact} className="text-sm text-zinc-600 hover:underline">
              + 添加联系方式
            </button>
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-medium text-zinc-700">设施（勾选 ID）</h3>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((fid) => (
              <label
                key={fid}
                className="flex items-center gap-1 rounded border border-zinc-200 px-3 py-1.5"
              >
                <input
                  type="checkbox"
                  checked={facilities.includes(fid)}
                  onChange={() => toggleFacility(fid)}
                />
                <span className="text-sm">设施 {fid}</span>
              </label>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-medium text-zinc-700">图片</h3>
          <div className="space-y-2">
            {images.map((img, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2">
                <select
                  value={img.type}
                  onChange={(e) => setImage(i, { type: e.target.value as "cover" | "detail" })}
                  className="rounded border border-zinc-300 px-2 py-1.5 text-sm"
                >
                  <option value="cover">封面</option>
                  <option value="detail">详情</option>
                </select>
                <input
                  type="url"
                  value={img.url}
                  onChange={(e) => setImage(i, { url: e.target.value })}
                  placeholder="图片 URL"
                  className="min-w-[200px] flex-1 rounded border border-zinc-300 px-3 py-1.5 text-sm"
                />
                {images.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    删除
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={addImage} className="text-sm text-zinc-600 hover:underline">
              + 添加图片
            </button>
          </div>
        </section>

        <div className="flex gap-3 border-t border-zinc-200 pt-4">
          <button
            type="submit"
            disabled={submitting || !canSubmit}
            className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {submitting ? "提交中…" : "提交修改（待审核）"}
          </button>
          <Link
            href="/merchant/hotels"
            className="rounded border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            取消
          </Link>
        </div>
      </form>
    </div>
  );
}
