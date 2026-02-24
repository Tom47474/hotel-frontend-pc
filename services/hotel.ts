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
export function getMerchantHotels(params?: { page?: number; size?: number }) {
  const search = new URLSearchParams();
  if (params?.page != null) search.set("page", String(params.page));
  if (params?.size != null) search.set("size", String(params.size));
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
