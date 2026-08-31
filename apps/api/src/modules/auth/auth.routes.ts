import { Router } from 'express';
import { validateBody } from '../../common/validate.js';
import { register, login, registerSchema, loginSchema } from './auth.service.js';

export const authRouter = Router();

authRouter.post('/register', validateBody(registerSchema), async (req, res, next) => {
  try {
    const result = await register(req.validatedBody as Parameters<typeof register>[0]);
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/login', validateBody(loginSchema), async (req, res, next) => {
  try {
    const result = await login(req.validatedBody as Parameters<typeof login>[0]);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});
