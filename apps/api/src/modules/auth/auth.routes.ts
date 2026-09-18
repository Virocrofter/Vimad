/* apps/api/src/modules/auth/auth.routes.ts */
import { Router } from 'express';
import { extendZodWithOpenApi, OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { validateBody } from '../../common/validate.js';
import { ErrorResponseSchema } from '../../common/openapi-schemas.js';
import {
  register,
  login,
  refreshAccessToken,
  requestPasswordReset,
  confirmPasswordReset,
  changePassword,
  registerSchema,
  loginSchema,
  passwordResetRequestSchema,
  passwordResetConfirmSchema,
  changePasswordSchema,
} from './auth.service.js';
import { authMiddleware } from '../auth/auth.middleware.js';

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

const RegisterInputSchema = registerSchema.openapi('RegisterInput');
const LoginInputSchema = loginSchema.openapi('LoginInput');
const RefreshInputSchema = z.object({ refreshToken: z.string().min(1) }).openapi('RefreshInput');

const PasswordResetRequestSchema = passwordResetRequestSchema.openapi('PasswordResetRequest');
const PasswordResetConfirmSchema = passwordResetConfirmSchema.openapi('PasswordResetConfirm');
const ChangePasswordSchema = changePasswordSchema.openapi('ChangePassword');

const AuthResponseSchema = z
  .object({
    data: z.object({
      token: z.string(),
      refreshToken: z.string(),
      user: z.object({
        id: z.string(),
        email: z.string(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        role: z.string(),
        tenantId: z.string().optional(),
      }),
      tenant: z
        .object({
          id: z.string(),
          name: z.string(),
          slug: z.string(),
        })
        .optional(),
    }),
  })
  .openapi('AuthResponse');

const RefreshResponseSchema = z
  .object({
    data: AuthResponseSchema.shape.data.omit({ tenant: true }),
  })
  .openapi('RefreshResponse');

const MessageResponseSchema = z.object({ message: z.string() }).openapi('MessageResponse');

export const authRouter = Router();

/* ─── Register ─── */
registry.registerPath({
  method: 'post',
  path: '/register',
  tags: ['Auth'],
  description: 'Register a new tenant and owner',
  request: {
    body: {
      description: 'Registration payload',
      content: { 'application/json': { schema: RegisterInputSchema } },
    },
  },
  responses: {
    201: {
      description: 'Tenant and owner registered',
      content: { 'application/json': { schema: AuthResponseSchema } },
    },
    400: {
      description: 'Validation error',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    409: {
      description: 'Tenant slug already exists',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

authRouter.post('/register', validateBody(registerSchema), async (req, res, next) => {
  try {
    const result = await register(req.validatedBody as Parameters<typeof register>[0]);
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
});

/* ─── Login ─── */
registry.registerPath({
  method: 'post',
  path: '/login',
  tags: ['Auth'],
  description: 'Authenticate an existing user',
  request: {
    body: {
      description: 'Login credentials',
      content: { 'application/json': { schema: LoginInputSchema } },
    },
  },
  responses: {
    200: {
      description: 'Authenticated',
      content: { 'application/json': { schema: AuthResponseSchema } },
    },
    401: {
      description: 'Invalid credentials',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

authRouter.post('/login', validateBody(loginSchema), async (req, res, next) => {
  try {
    const result = await login(req.validatedBody as Parameters<typeof login>[0]);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

/* ─── Refresh ─── */
registry.registerPath({
  method: 'post',
  path: '/refresh',
  tags: ['Auth'],
  description: 'Rotate a refresh token for a new access token + refresh token pair',
  request: {
    body: {
      description: 'Refresh token payload',
      content: { 'application/json': { schema: RefreshInputSchema } },
    },
  },
  responses: {
    200: {
      description: 'New token pair',
      content: { 'application/json': { schema: RefreshResponseSchema } },
    },
    401: {
      description: 'Invalid or expired refresh token',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

authRouter.post('/refresh', validateBody(RefreshInputSchema), async (req, res, next) => {
  try {
    const result = await refreshAccessToken(
      (req.validatedBody as z.infer<typeof RefreshInputSchema>).refreshToken
    );
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

/* ─── Password Reset Request ─── */
registry.registerPath({
  method: 'post',
  path: '/forgot-password',
  tags: ['Auth'],
  description: 'Request a password reset email',
  request: {
    body: {
      description: 'Password reset request',
      content: { 'application/json': { schema: PasswordResetRequestSchema } },
    },
  },
  responses: {
    200: {
      description: 'Reset email sent (or silently ignored if not found)',
      content: { 'application/json': { schema: MessageResponseSchema } },
    },
    400: {
      description: 'Validation error',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

authRouter.post(
  '/forgot-password',
  validateBody(passwordResetRequestSchema),
  async (req, res, next) => {
    try {
      const result = await requestPasswordReset(
        (req.validatedBody as { email: string; tenantSlug: string }).email,
        (req.validatedBody as { email: string; tenantSlug: string }).tenantSlug
      );
      res.json({
        message: result.sent
          ? 'Password reset email sent'
          : 'If the email exists, a reset link has been sent',
      });
    } catch (err) {
      next(err);
    }
  }
);

/* ─── Password Reset Confirm ─── */
registry.registerPath({
  method: 'post',
  path: '/reset-password',
  tags: ['Auth'],
  description: 'Confirm password reset with token',
  request: {
    body: {
      description: 'Password reset confirmation',
      content: { 'application/json': { schema: PasswordResetConfirmSchema } },
    },
  },
  responses: {
    200: {
      description: 'Password reset successful',
      content: { 'application/json': { schema: MessageResponseSchema } },
    },
    400: {
      description: 'Invalid or expired token',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

authRouter.post(
  '/reset-password',
  validateBody(passwordResetConfirmSchema),
  async (req, res, next) => {
    try {
      await confirmPasswordReset(
        (req.validatedBody as { token: string; newPassword: string }).token,
        (req.validatedBody as { token: string; newPassword: string }).newPassword
      );
      res.json({ message: 'Password has been reset successfully' });
    } catch (err) {
      next(err);
    }
  }
);

/* ─── Change Password (authenticated) ─── */
registry.registerPath({
  method: 'post',
  path: '/change-password',
  tags: ['Auth'],
  description: 'Change password while authenticated',
  request: {
    body: {
      description: 'Change password payload',
      content: { 'application/json': { schema: ChangePasswordSchema } },
    },
  },
  responses: {
    200: {
      description: 'Password changed',
      content: { 'application/json': { schema: MessageResponseSchema } },
    },
    401: {
      description: 'Invalid current password',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

authRouter.post(
  '/change-password',
  authMiddleware,
  validateBody(changePasswordSchema),
  async (req, res, next) => {
    try {
      const authReq = req as any;
      await changePassword(
        authReq.auth.user.id,
        (req.validatedBody as { currentPassword: string; newPassword: string }).currentPassword,
        (req.validatedBody as { currentPassword: string; newPassword: string }).newPassword
      );
      res.json({ message: 'Password changed successfully. Please log in again.' });
    } catch (err) {
      next(err);
    }
  }
);
