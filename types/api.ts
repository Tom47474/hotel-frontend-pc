/** 统一 API 返回结构 */
export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}
