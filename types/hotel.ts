/** 联系方式（新增/编辑共用） */
export interface ContactItem {
  type: "phone" | "email";
  value: string;
  is_primary?: boolean;
  remark?: string;
}

/** 图片项 */
export interface ImageItem {
  url: string;
  type: "cover" | "detail";
}

/** 房型（新增酒店时与 rooms 一起提交） */
export interface RoomItem {
  room_id?: number;
  name: string;
  area: number;
  bed_type: string;
  max_guest: number;
  base_price: number;
  stock: number;
  images?: ImageItem[];
  tag_ids?: number[];
}

/** 新增酒店请求体 */
export interface CreateHotelBody {
  name: string;
  hotel_type: string;
  star: number;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  description: string;
  opening_date: string;
  contacts: ContactItem[];
  facilities: number[];
  images: ImageItem[];
  rooms: RoomItem[];
}

/** 提交酒店信息修改请求体（仅传要改的字段） */
export interface HotelEditBody {
  name?: string;
  hotel_type?: string;
  star?: number;
  city?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  opening_date?: string;
  contacts?: ContactItem[];
  facilities?: number[];
  images?: ImageItem[];
  rooms?: Array<{
    room_id?: number;
    name?: string;
    area?: number;
    bed_type?: string;
    max_guest?: number;
    base_price?: number;
    stock?: number;
    images?: ImageItem[];
    tag_ids?: number[];
  }>;
}

/** 商户酒店列表项 */
export interface MerchantHotelListItem {
  hotel_id: number;
  name: string;
  status: string;
  created_at: string;
}

/** 商户酒店列表分页返回 */
export interface MerchantHotelListData {
  list: MerchantHotelListItem[];
  total?: number;
  page?: number;
  size?: number;
}

/** 商户端酒店详情（用于编辑页回填） */
export interface MerchantHotelDetail {
  hotel_id: number;
  name: string;
  hotel_type: string;
  star: number;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  description: string;
  opening_date: string;
  status: string;
  contacts: ContactItem[];
  facilities: number[];
  images: ImageItem[];
  rooms: RoomItem[];
}

/**
 * 管理员端酒店列表项（审核页）
 * status 含义：pending=审核中, approved=通过(未上线), rejected=不通过, online=已上线, offline=已下线
 * 仅审核通过可上线，仅已上线可下线，已下线可恢复
 */
export interface AdminHotelListItem {
  type?: string;
  hotel_id: number;
  hotel_edit_id?: number;
  name: string;
  merchant_id: number;
  /** 审核/上线状态: pending | approved | rejected | online | offline */
  status: string;
  /** 审核不通过时的驳回原因 */
  reject_reason?: string | null;
  created_at: string;
}

/** 管理员端酒店列表分页返回 */
export interface AdminHotelListData {
  list: AdminHotelListItem[];
  total?: number;
  page?: number;
  size?: number;
}

/** 管理员端酒店详情中的设施项（接口返回 { id, name }） */
export interface AdminFacilityItem {
  id: number;
  name: string;
}

/** 管理员端酒店详情中的房型（接口含 images、tags 数组） */
export interface AdminHotelRoomItem {
  room_id?: number;
  name: string;
  area: number;
  bed_type: string;
  max_guest: number;
  base_price: number;
  stock: number;
  images?: unknown[];
  tags?: unknown[];
}

/** 管理员端酒店详情中的图片（接口含 sort） */
export interface AdminHotelImageItem {
  url: string;
  type: string;
  sort?: number;
}

/** 管理员端酒店详情（GET /api/admin/hotel/:id，与接口返回一致） */
export interface AdminHotelDetail {
  hotel_id: number;
  name: string;
  star?: number;
  city?: string;
  address?: string;
  latitude?: string;
  longitude?: string;
  description?: string;
  opening_date?: string;
  status: string;
  reject_reason?: string | null;
  contacts?: Array<{
    type: string;
    value: string;
    is_primary?: number | boolean;
    remark?: string | null;
  }>;
  facilities?: AdminFacilityItem[];
  images?: AdminHotelImageItem[];
  rooms?: AdminHotelRoomItem[];
}

/** 该酒店最近一条修改记录 */
export interface HotelEditLatest {
  hotel_edit_id: number;
  hotel_id: number;
  hotel_type: string | null;
  edit_status: "pending" | "rejected" | "approved";
  reject_reason: string | null;
  reviewed_at: string | null;
  created_at: string;
  name: string | null;
  star: number | null;
  city: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  opening_date: string | null;
  contacts_edit: ContactItem[] | null;
  facilities_edit: number[] | null;
  images_edit: ImageItem[] | null;
  rooms_edit: Array<{
    room_id?: number;
    name?: string;
    area?: number;
    bed_type?: string;
    max_guest?: number;
    base_price?: number;
    stock?: number;
    images?: ImageItem[];
    tag_ids?: number[];
  }> | null;
}
