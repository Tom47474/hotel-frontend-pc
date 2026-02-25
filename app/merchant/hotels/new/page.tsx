"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createHotel, getHotelFacilities } from "@/services/hotel";
import type { CreateHotelBody, ContactItem, ImageItem, RoomItem } from "@/types/hotel";

const HOTEL_TYPES = [
  { value: "domestic", label: "国内" },
  { value: "overseas", label: "海外" },
  { value: "hourly", label: "钟点房" },
  { value: "guesthouse", label: "民宿" }
];

const STAR_OPTIONS = [1, 2, 3, 4, 5];

const defaultContact: ContactItem = {
  type: "phone",
  value: "",
  is_primary: true,
};

const defaultImage: ImageItem = { url: "", type: "cover" };

const defaultRoom: RoomItem = {
  name: "",
  area: 0,
  bed_type: "",
  max_guest: 1,
  base_price: 0,
  stock: 0,
  images: [{ url: "", type: "cover" }],
  tag_ids: [],
};

export default function NewHotelPage() {
  const router = useRouter();
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
  const [contacts, setContacts] = useState<ContactItem[]>([{ ...defaultContact }]);
  const [facilities, setFacilities] = useState<number[]>([]);
  const [facilityOptions, setFacilityOptions] = useState<{ id: number, name: string }[]>([]);
  const [images, setImages] = useState<ImageItem[]>([
    { url: "", type: "cover" },
    { url: "", type: "detail" },
  ]);
  const [rooms, setRooms] = useState<RoomItem[]>([{ ...defaultRoom }]);


  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        const res = await getHotelFacilities();
        setFacilityOptions(res.data);
      } catch (error) {
        console.error("Failed to fetch facilities:", error);
      }
    }

    fetchFacilities();
  }, []);

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

  const setRoom = (i: number, patch: Partial<RoomItem>) => {
    setRooms((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], ...patch };
      return next;
    });
  };

  const addRoom = () => {
    setRooms((prev) => [...prev, { ...defaultRoom }]);
  };

  const removeRoom = (i: number) => {
    if (rooms.length <= 1) return;
    setRooms((prev) => prev.filter((_, idx) => idx !== i));
  };

  const toggleFacility = (id: number) => {
    setFacilities((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const payload: CreateHotelBody = {
      name: name.trim(),
      hotel_type: hotelType,
      star,
      city: city.trim(),
      address: address.trim(),
      latitude: Number(latitude) || 0,
      longitude: Number(longitude) || 0,
      description: description.trim(),
      opening_date: openingDate.trim(),
      contacts: contacts.filter((c) => c.value.trim()),
      facilities,
      images: images.filter((img) => img.url.trim()),
      rooms: rooms.map((r) => ({
        name: r.name,
        area: Number(r.area) || 0,
        bed_type: r.bed_type,
        max_guest: Number(r.max_guest) || 1,
        base_price: Number(r.base_price) || 0,
        stock: Number(r.stock) || 0,
        images: r.images?.filter((i) => i?.url) ?? [],
        tag_ids: r.tag_ids ?? [],
      })),
    };

    if (!payload.name || !payload.address || !payload.contacts.length) {
      setError("请填写酒店名称、地址和至少一条联系方式");
      setSubmitting(false);
      return;
    }

    if (!payload.rooms.length || !payload.rooms[0].name) {
      setError("请至少添加一个房型并填写房型名称");
      setSubmitting(false);
      return;
    }

    try {
      const res = await createHotel(payload);
      router.push(`/merchant/hotels`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "提交失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/merchant/hotels" className="text-zinc-600 hover:underline">
          返回列表
        </Link>
        <h2 className="text-lg font-semibold text-zinc-900">新增酒店</h2>
      </div>

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
              <label className="mb-1 block text-sm text-zinc-600">酒店名称 *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded border border-zinc-300 px-3 py-2 text-zinc-900"
                required
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
              <label className="mb-1 block text-sm text-zinc-600">城市 *</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded border border-zinc-300 px-3 py-2 text-zinc-900"
                placeholder="如：中国·厦门"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm text-zinc-600">地址 *</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded border border-zinc-300 px-3 py-2 text-zinc-900"
              />
            </div>
           
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm text-zinc-600">酒店简介</label>
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
                  className="flex-1 min-w-[120px] rounded border border-zinc-300 px-3 py-1.5 text-sm"
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
              <label 
                key={item.id}
                className="flex items-center gap-1 rounded border border-zinc-200 px-3 py-1.5">
                  <input
                    type="checkbox"
                    checked={facilities.includes(item.id)}
                    onChange={() => toggleFacility(item.id)}></input>
                  <span className="text-sm">{item.name}</span>
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
                  className="flex-1 min-w-[200px] rounded border border-zinc-300 px-3 py-1.5 text-sm"
                />
                {images.length > 1 && (
                  <button type="button" onClick={() => removeImage(i)} className="text-sm text-red-600 hover:underline">
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

        <section>
          <h3 className="mb-3 text-sm font-medium text-zinc-700">房型（至少一个）</h3>
          <div className="space-y-4">
            {rooms.map((room, i) => (
              <div key={i} className="rounded border border-zinc-200 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-medium text-zinc-700">房型 {i + 1}</span>
                  {rooms.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRoom(i)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      删除房型
                    </button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    value={room.name}
                    onChange={(e) => setRoom(i, { name: e.target.value })}
                    placeholder="房型名称 *"
                    className="rounded border border-zinc-300 px-3 py-1.5 text-sm"
                  />
                  <input
                    type="number"
                    value={room.area || ""}
                    onChange={(e) => setRoom(i, { area: Number(e.target.value) || 0 })}
                    placeholder="面积（㎡）"
                    className="rounded border border-zinc-300 px-3 py-1.5 text-sm"
                  />
                  <input
                    type="text"
                    value={room.bed_type}
                    onChange={(e) => setRoom(i, { bed_type: e.target.value })}
                    placeholder="床型"
                    className="rounded border border-zinc-300 px-3 py-1.5 text-sm"
                  />
                  <input
                    type="number"
                    value={room.max_guest || ""}
                    onChange={(e) => setRoom(i, { max_guest: Number(e.target.value) || 1 })}
                    placeholder="最多入住人数"
                    className="rounded border border-zinc-300 px-3 py-1.5 text-sm"
                  />
                  <input
                    type="number"
                    value={room.base_price || ""}
                    onChange={(e) => setRoom(i, { base_price: Number(e.target.value) || 0 })}
                    placeholder="基础价格"
                    className="rounded border border-zinc-300 px-3 py-1.5 text-sm"
                  />
                  <input
                    type="number"
                    value={room.stock || ""}
                    onChange={(e) => setRoom(i, { stock: Number(e.target.value) || 0 })}
                    placeholder="库存"
                    className="rounded border border-zinc-300 px-3 py-1.5 text-sm"
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
            disabled={submitting}
            className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {submitting ? "提交中…" : "保存"}
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
