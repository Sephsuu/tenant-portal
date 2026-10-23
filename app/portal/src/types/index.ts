export type TenantRole = "ADMIN" | "MEMBER";
export type AccountStatus = "ACTIVE" | "INACTIVE";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  role: TenantRole;
}

export interface CurrentUser {
  id: string;
  username: string;
  email: string;
  name: string;
  tenants: Tenant[];
}

export interface Member {
  id: string;
  name: string;
  email: string;
  role: TenantRole;
  status: AccountStatus;
}

export interface MembersPage {
  members: Member[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  error: string | null;
  data: T | null;
}
