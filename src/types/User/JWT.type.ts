export interface MyJWT {
  id?: string;
  username?: string | null;
  email?: string;
  is_admin?: boolean;
  created_at?: Date;
  updated_at?: Date | null;
  iat?: number;
  exp?: number;
  jti?: string;
}