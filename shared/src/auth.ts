import { z } from 'zod';
import { RoleEnum } from './roles.js';

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

export const RegisterRequestSchema = z.object({
  email: z.string().email('Invalid official email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Full name required'),
  badgeNumber: z.string().min(3, 'Official badge/service ID required'),
  department: z.string().min(2, 'Department/Unit required'),
  jurisdiction: z.string().min(2, 'Jurisdiction required'),
  role: RoleEnum,
});

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const UpdateProfileRequestSchema = z.object({
  name: z.string().min(2, 'Full name required').optional(),
  department: z.string().min(2, 'Department required').optional(),
  jurisdiction: z.string().min(2, 'Jurisdiction required').optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, 'New password must be at least 8 characters').optional(),
});

export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequestSchema>;

export const MockLoginRequestSchema = z.object({
  role: RoleEnum.optional(),
  email: z.string().email().optional(),
});

export type MockLoginRequest = z.infer<typeof MockLoginRequestSchema>;

