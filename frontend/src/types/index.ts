// src/types/index.ts

export interface User {
  id: number;
  discord_id: string;
  discord_username: string;
  discord_discriminator: string;
  discord_avatar: string;
  minecraft_username?: string;
  minecraft_uuid?: string;
  role: 'admin' | 'police';
  is_active: boolean;
  discord_roles: string[];
  last_role_check: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

// Новые типы для Discord авторизации
export interface DiscordAuthResponse {
  oauth_url: string;
  state: string;
}

export interface DiscordStatusResponse {
  discord_configured: boolean;
  guild_configured: boolean;
  roles_configured: boolean;
  spworlds_configured: boolean;
  role_check_interval: number;
  redirect_uri: string;
}

export interface UserRefreshResponse {
  user: User;
  message: string;
}

export interface UserRoleCheckResponse {
  user_id: number;
  old_role: string;
  new_role: string;
  changed: boolean;
  has_access: boolean;
  minecraft_data_updated: boolean;
}

export interface UserSearchResponse {
  users: User[];
}

export interface UserStatisticsResponse {
  total_users: number;
  active_users: number;
  admin_users: number;
  police_users: number;
}

export interface RoleCheckAllResponse {
  message: string;
  triggered_by: string;
}

export interface RoleStatusResponse {
  service_running: boolean;
  check_interval_minutes: number;
  last_cache_update: string;
  guild_roles_cached: number;
}

export interface RoleSyncIssue {
  user_id: number;
  discord_username: string;
  minecraft_username?: string;
  last_role_check: string;
  issues: string[];
}

export interface RoleSyncIssuesResponse {
  total_users: number;
  users_with_issues: number;
  issues: RoleSyncIssue[];
}

export interface SecurityLogResponse {
  logs: Log[];
  total_security_events: number;
  period_days: number;
}

export interface UserCreate {
  username: string;
  password: string;
  role: 'admin' | 'police';
  is_active: boolean;
}

export interface UserUpdate {
  username?: string;
  password?: string;
  role?: 'admin' | 'police';
  is_active?: boolean;
}

export interface Passport {
  id: number;
  first_name: string;
  last_name: string;
  nickname: string;
  age: number;
  gender: 'male' | 'female';
  city: string;
  violations_count: number;
  entry_date: string;
  is_emergency: boolean;
  created_at: string;
  updated_at: string;
}

export interface PassportCreate {
  first_name: string;
  last_name: string;
  nickname: string;
  age: number;
  gender: 'male' | 'female';
  city: string;
  entry_date?: string;
}

export interface PassportUpdate {
  first_name?: string;
  last_name?: string;
  nickname?: string;
  age?: number;
  gender?: 'male' | 'female';
  city?: string;
  entry_date?: string;
}

export interface PassportEmergencyUpdate {
  is_emergency: boolean;
  reason?: string;
}

export interface PassportEmergencyResponse {
  id: number;
  nickname: string;
  is_emergency: boolean;
  message: string;
}

export interface Fine {
  id: number;
  passport_id: number;
  article: string;
  amount: number;
  description?: string;
  created_by_user_id: number;
  created_at: string;
  updated_at: string;
}

export interface FineCreate {
  passport_id: number;
  article: string;
  amount: number;
  description?: string;
}

export interface FineUpdate {
  article?: string;
  amount?: number;
  description?: string;
}

export interface Log {
  id: number;
  user_id: number;
  action: string;
  entity_type: string;
  entity_id?: number;
  details?: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

export interface ApiError {
  detail: string;
  code?: string;
  status?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
  per_page: number;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: ApiError;
  message?: string;
}

export interface AppState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Типы для скинов игроков
export interface PassportSkinResponse {
  passport_id: number;
  nickname: string;
  uuid: string;
  skin_url: string;
}

export interface PlayerSkinResponse {
  discord_id: string;
  username: string | null;
  uuid: string;
  skin_url: string;
}