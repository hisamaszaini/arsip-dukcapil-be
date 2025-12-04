export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

export interface User {
  userId: number;
  email: string;
  role: string;
}

export interface JwtPayload2 {
  sub: number;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface JwtPayload {
  userId: number;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}
