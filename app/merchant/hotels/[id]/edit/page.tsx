"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  getMerchantHotel,
  getHotelEditLatest,
  submitHotelEdit,
  getHotelFacilities,
  getRoomLabels,
  uploadHotelImages,
  
} from "@/services/hotel";
import type {
  MerchantHotelDetail,
  HotelEditLatest,
  HotelEditBody,
  ContactItem,
  ImageItem,
  RoomItem,
} from "@/types/hotel";
import { ImageUploader } from "@/components/common/ImageUploder";

const STAR_OPTIONS = [1, 2, 3, 4, 5];
const HOTEL_TYPES = [
  { value: "domestic", label: "国内" },
  { value: "overseas", label: "海外" },
  { value: "hourly", label: "钟点房" },
  { value: "guesthouse", label: "民宿" }
];

const defaultRoom: RoomItem = {
  name: "",
  area: 0,
  bed_type: "",
  max_guest: 0,
  base_price: 0,
  stock: 0,
  images: [{ url: "", type: "cover" }],
  tag_ids: [],
};

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
  const [hotelType, setHotelType] = useState("domestic");
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
  const [facilityOptions, setFacilityOptions] = useState<{ id: number; name: string }[]>([]);
  const [roomLabelOptions, setRoomLabelOptions] = useState<{ id: number; name: string }[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [rooms, setRooms] = useState<RoomItem[]>([{ ...defaultRoom }]);
  const [roomImageFiles, setRoomImageFiles] = useState<File[][]>([[]]);

  // 加载设施和房型标签
  useEffect(() => {
    getHotelFacilities().then((res) => setFacilityOptions(res.data)).catch(console.error);
    getRoomLabels().then((data) => setRoomLabelOptions(data)).catch(console.error);
  }, []);

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
        setHotelType(d.hotel_type ?? "");
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
        if (d.rooms?.length) {
          setRooms(d.rooms);
          setRoomImageFiles(d.rooms.map(() => []))
        }
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


  const setRoom = (i: number, patch: Partial<RoomItem>) => {
    setRooms((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], ...patch };
      return next;
    });
  };

  const addRoom = () => {
    setRooms((prev) => [...prev, { ...defaultRoom }]);
    setRoomImageFiles((prev) => [...prev, []]);
  };

  const removeRoom = (i: number) => {
    if (rooms.length <= 1) return;
    setRooms((prev) => prev.filter((_, idx) => idx !== i));
    setRoomImageFiles((prev) => prev.filter((_, idx) => idx !== i));
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
    if (hotelType !== (detail.hotel_type ?? "domestic")) body.hotel_type = hotelType;
    body.contacts = contacts.filter((c) => c.value.trim());
    body.facilities = facilities;
    if (newImageFiles.length > 0) {
      const urls = await uploadHotelImages(newImageFiles);
      const newItems = urls.map((url) => ({ url, type: "detail" as const }));
      const merged = [...images.filter((img) => img.url.trim()), ...newItems];
      if (merged.length > 0) merged[0].type = "cover";
      body.images = merged;
    } else {
      body.images = images.filter((img) => img.url.trim());
    }
    body.rooms = await Promise.all(
      rooms.map(async (r, i) => {
        let roomImages: ImageItem[] = r.images?.filter((img) => img.url.trim()) ?? [];
        if (roomImageFiles[i]?.length > 0) {
          const urls = await uploadHotelImages(roomImageFiles[i]);
          const newRoomImages = urls.map((url, idx) => ({
            url,
            type: idx === 0 ? "cover" : "detail" as "cover" | "detail",
          }));
          roomImages = [...roomImages, ...newRoomImages];
          if (roomImages.length > 0) roomImages[0].type = "cover";
        }
        return {
          room_id: r.room_id,
          name: r.name,
          area: Number(r.area) || 0,
          bed_type: r.bed_type,
          max_guest: Number(r.max_guest) || 1,
          base_price: Number(r.base_price) || 0,
          stock: Number(r.stock) || 0,
          images: roomImages,
          tag_ids: r.tag_ids ?? [],
        };
      })
    );

    if (Object.keys(body).length === 0) {
      setError("未修改任何内容");
      setSubmitting(false);
      return;
    }

    // console.log('body--->', body);
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
              <label className="mb-1 block text-sm text-zinc-600">类型</label>
              <select
                value={hotelType}
                onChange={(e) => setHotelType(e.target.value)}
                className="w-full rounded border border-zinc-300 px-3 py-2 text-zinc-900"
              >
                {HOTEL_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
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
          <h3 className="mb-3 text-sm font-medium text-zinc-700">设施（勾选）</h3>
          <div className="flex flex-wrap gap-2">
            {facilityOptions.map((item) => (
              <label key={item.id} className="flex items-center gap-1 rounded border border-zinc-200 px-3 py-1.5">
                <input
                  type="checkbox"
                  checked={facilities.includes(item.id) ?? false}
                  onChange={() => toggleFacility(item.id)}
                />
                <span>{item.name}</span>
              </label>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-medium text-zinc-700">图片</h3>
          <ImageUploader
            defaultImages={images}
            onChange={(files, existingUrls) => {
              setNewImageFiles(files);
              setImages(existingUrls.map((url, idx) => ({
                url,
                type: idx === 0 ? "cover" : "detail",
              })));
            }}
          />
        </section>

        <section>
          <h3 className="mb-3 text-sm font-medium text-zinc-700">房型</h3>
          <div className="space-y-4">
            {rooms.map((room, i) => (
              <div key={i} className="rounded border border-zinc-200 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-medium text-zinc-700">房型 {i + 1}</span>
                  {rooms.length > 1 && (
                    <button type="button" onClick={() => removeRoom(i)} className="text-sm text-red-600 hover:underline">
                      删除房型
                    </button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input type="text" value={room.name} onChange={(e) => setRoom(i, { name: e.target.value })} placeholder="房型名称 *" className="rounded border border-zinc-300 px-3 py-1.5 text-sm" />
                  <input type="number" min="1" value={room.area || ""} onChange={(e) => setRoom(i, { area: Number(e.target.value) || 0 })} placeholder="面积（㎡）" className="rounded border border-zinc-300 px-3 py-1.5 text-sm" />
                  <input type="text" value={room.bed_type} onChange={(e) => setRoom(i, { bed_type: e.target.value })} placeholder="床型" className="rounded border border-zinc-300 px-3 py-1.5 text-sm" />
                  <input type="number" min="1" value={room.max_guest || ""} onChange={(e) => setRoom(i, { max_guest: Number(e.target.value) || 0 })} placeholder="最多入住人数" className="rounded border border-zinc-300 px-3 py-1.5 text-sm" />
                  <input type="number" min="1" value={room.base_price || ""} onChange={(e) => setRoom(i, { base_price: Number(e.target.value) || 0 })} placeholder="基础价格" className="rounded border border-zinc-300 px-3 py-1.5 text-sm" />
                  <input type="number" min="1" value={room.stock || ""} onChange={(e) => setRoom(i, { stock: Number(e.target.value) || 0 })} placeholder="库存" className="rounded border border-zinc-300 px-3 py-1.5 text-sm" />
                </div>
                <div className="mt-3">
                  <p className="mb-1 text-xs text-zinc-500">房型标签</p>
                  <div className="flex flex-wrap gap-2">
                    {roomLabelOptions.map((item) => (
                      <label key={item.id} className="flex items-center gap-1 rounded border border-zinc-200 px-3 py-1.5">
                        <input
                          type="checkbox"
                          checked={room.tag_ids?.includes(item.id) ?? false}
                          onChange={() => {
                            const current = room.tag_ids ?? [];
                            const next = current.includes(item.id)
                              ? current.filter((id) => id !== item.id)
                              : [...current, item.id];
                            setRoom(i, { tag_ids: next });
                          }}
                        />
                        <span className="text-sm">{item.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="mt-3">
                  <p className="mb-1 text-xs text-zinc-500">房型图片（第一张为主图，其余为细节图）</p>
                  <ImageUploader
                    defaultImages={room.images}
                    onChange={(files, existingUrls) => {
                      setRoomImageFiles((prev) => {
                        const next = [...prev];
                        next[i] = files;
                        return next;
                      });
                      setRoom(i, {
                        images: existingUrls.map((url, idx) => ({
                          url,
                          type: idx === 0 ? "cover" : "detail" as "cover" | "detail",
                        })),
                      });
                    }}
                  />
                </div>
              </div>
            ))}
            <button type="button" onClick={addRoom} className="text-sm text-zinc-600 hover:underline">
              + 添加房型
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
