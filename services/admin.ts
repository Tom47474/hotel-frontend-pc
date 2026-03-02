import { request } from "@/services/request";
import type { AdminHotelListData, AdminHotelDetail } from "@/types/hotel";

/** 管理员-酒店列表（审核页） */
export function getAdminHotelsList(params?: { page?: number; size?: number }) {
  const search = new URLSearchParams();
  if (params?.page != null) search.set("page", String(params.page));
  if (params?.size != null) search.set("size", String(params.size));
  const qs = search.toString();
  return request<AdminHotelListData>(`/api/admin/hotels/list${qs ? `?${qs}` : ""}`);
}

/** 管理员-酒店详情（GET /api/admin/hotel/:id） */
export function getAdminHotelDetail(hotelId: number) {
  return request<AdminHotelDetail>(`/api/admin/hotel/${hotelId}`);
}

/** 审核通过：静态模拟，仅前端更新状态 */
export function auditHotelApprove(_hotelId: number) {
  return Promise.resolve({} as unknown);
}

/** 审核不通过：静态模拟，仅前端更新状态 */
export function auditHotelReject(_hotelId: number, _reject_reason: string) {
  return Promise.resolve({} as unknown);
}

/** 上线：静态模拟，仅前端更新状态 */
export function setHotelOnline(_hotelId: number) {
  return Promise.resolve({} as unknown);
}

/** 下线：静态模拟，仅前端更新状态 */
export function setHotelOffline(_hotelId: number) {
  return Promise.resolve({} as unknown);
}
