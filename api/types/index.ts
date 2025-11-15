import { Request } from 'express';

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  mobile_number: string | null;
  birthday: string | null;
  password: string;
  role: string;
  email_verified_at: string | null;
  remember_token: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface UserResponse {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  mobile_number: string | null;
  birthday: string | null;
  role: string;
}

export interface RegisterRequest {
  first_name: string;
  last_name: string;
  email: string;
  mobile_number: string;
  birthday: string;
  password: string;
  password_confirmation: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface JWTPayload {
  id: number;
  email: string;
  role: string;
}

// Extend Express Request type to include user property
export interface AuthRequest extends Request {
  user?: JWTPayload;
}