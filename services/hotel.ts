import { request } from "@/services/request";
import type {
  CreateHotelBody,
  HotelEditBody,
  MerchantHotelDetail,
  MerchantHotelListData,
  HotelEditLatest,
} from "@/types/hotel";

/** 新增酒店 */
export function createHotel(body: CreateHotelBody) {
  return request<{ hotel_id: number }>("/api/merchant/hotel", {
    method: "POST",
    body,
  });
}

/** 获取当前商户的酒店详情（用于编辑页回填） */
export function getMerchantHotel(id: number) {
  return request<MerchantHotelDetail>(`/api/merchant/hotel/${id}`);
}

/** 商户酒店列表 */
export function getMerchantHotels(params?: {
  page?: number;
  size?: number;
  keyword?: string;
  status?: string;
}) {
  const search = new URLSearchParams();
  if (params?.page != null) search.set("page", String(params.page));
  if (params?.size != null) search.set("size", String(params.size));
  if (params?.keyword) search.set("keyword", params.keyword);
  if (params?.status) search.set("status", params.status);
  const qs = search.toString();
  return request<MerchantHotelListData>(`/api/merchant/hotels${qs ? `?${qs}` : ""}`);
}

/** 提交酒店信息修改（待管理员审核） */
export function submitHotelEdit(id: number, body: HotelEditBody) {
  return request<{ hotel_edit_id: number }>(`/api/merchant/hotel/${id}/edit`, {
    method: "POST",
    body,
  });
}

/** 该酒店最近一条修改记录 */
export function getHotelEditLatest(id: number) {
  return request<HotelEditLatest>(`/api/merchant/hotel/${id}/edit/latest`);
}

/** 获取酒店便利设施 */
export function getHotelFacilities() {
  return request<{ id: number; name: string }[]>("/api/facilities", {
    method: "GET",
  });
}

/** 上传图片 */
export async function uploadHotelImages(files: File[]): Promise<string[]> {
  const form = new FormData();
  files.forEach((file) => form.append("files", file));

  const res = await request<{ urls: string[] }>("/api/merchant/hotel/images/upload", {
    method: "POST",
    formData: form,
  });

  return res.data.urls;
}

/** 根据地址获取经纬度 */
export async function getGeoFromAddress(city: string, address: string): Promise<{ lng: number; lat: number }> {
  const res = await request<{ lng: number; lat: number }>(
    `/api/getGeoLocation?city=${encodeURIComponent(city)}&address=${encodeURIComponent(address)}`
  );
  return res.data;
}

/** 获取房型的标签（海景、城景） */
export async function getRoomLabels(): Promise<{ id: number; name: string }[]> {
  const res = await request<{ id: number; name: string }[]>("/api/roomLabels");
  return res.data;
}