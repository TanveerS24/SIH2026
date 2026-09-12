import { z } from 'zod';
import { RoleEnum } from './roles';

export const LoginRequestSchema = z.object({
  email: z.string().email('Invalid official email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const MFARequestSchema = z.object({
  sessionToken: z.string().min(1, 'MFA session token required'),
  totpCode: z.string().length(6, 'TOTP code must be exactly 6 digits'),
});

export type MFARequest = z.infer<typeof MFARequestSchema>;

export const RefreshTokenRequestSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token required'),
});

export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequestSchema>;

export const UserPayloadSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  badgeNumber: z.string(),
  department: z.string(),
  jurisdiction: z.string(),
  role: RoleEnum,
});

export type UserPayload = z.infer<typeof UserPayloadSchema>;

export const AuthSuccessResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
  user: UserPayloadSchema,
});

export type AuthSuccessResponse = z.infer<typeof AuthSuccessResponseSchema>;

export const MFAPendingResponseSchema = z.object({
  mfaRequired: z.literal(true),
  sessionToken: z.string(),
  message: z.string(),
  email: z.string(),
  role: RoleEnum,
});

export type MFAPendingResponse = z.infer<typeof MFAPendingResponseSchema>;
