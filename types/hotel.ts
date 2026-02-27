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

/** 该酒店最近一条修改记录 */
export interface HotelEditLatest {
  hotel_edit_id: number;
  hotel_id: number;
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
}
