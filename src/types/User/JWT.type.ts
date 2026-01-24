export interface MyJWT {
  id: string;
  username: string;
  email: string;
  is_admin?: boolean | number;
  created_at?: Date;
  updated_at?: Date | null;
  iat?: number;
  exp?: number;
  jti?: string;
}
