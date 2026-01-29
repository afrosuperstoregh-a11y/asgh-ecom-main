// TypeScript interfaces for admin API responses

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
  emailVerified: boolean;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user?: AdminUser;
  token?: string;
  redirectTo?: string;
}

export interface AuthMeResponse {
  success: boolean;
  user: AdminUser;
}

export interface DashboardStats {
  totalOrders: number;
  totalUsers: number;
  totalProducts: number;
  totalRevenue: number;
}

export interface RecentOrder {
  order_number: string;
  total_amount: number;
  status: string;
  created_at: string;
  email: string;
}

export interface DashboardResponse {
  success: boolean;
  message: string;
  data: {
    user: AdminUser;
    stats: DashboardStats;
    recentOrders: RecentOrder[];
    lastLogin: string;
  };
}

export interface AdminPermissions {
  canManageProducts: boolean;
  canManageOrders: boolean;
  canManageUsers: boolean;
  canManageSettings: boolean;
  canViewAnalytics: boolean;
}

export interface AdminPanelResponse {
  success: boolean;
  message: string;
  data: {
    user: AdminUser;
    availableRoutes: string[];
    permissions: AdminPermissions;
  };
}
