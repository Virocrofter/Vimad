import { Router, type Request, type Response, type NextFunction } from 'express';
import { OpenAPIRegistry, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { validateBody } from '../../common/validate.js';
import { ErrorResponseSchema } from '../../common/openapi-schemas.js';
import {
  lookupReservation,
  verifyIdentity,
  getDigitalKey,
  submitCheckIn,
  getStayDetails,
  requestService,
  updatePreferences,
  verifyIdentitySchema,
  checkInSchema,
  serviceRequestSchema,
} from './guest-portal.service.js';

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

const LookupInputSchema = z
  .object({
    confirmationNumber: z.string(),
    lastName: z.string(),
  })
  .openapi('GuestPortalLookupInput');

const VerifyIdentityInputSchema = verifyIdentitySchema.openapi('VerifyIdentityInput');
const CheckInInputSchema = checkInSchema.openapi('CheckInInput');
const ServiceRequestInputSchema = serviceRequestSchema.openapi('ServiceRequestInput');
const UpdatePreferencesInputSchema = z
  .object({
    preferences: z.record(z.string(), z.string()),
  })
  .openapi('UpdatePreferencesInput');

const TokenParamSchema = z.object({ token: z.string() }).openapi('TokenParam');

const LookupResponseSchema = z
  .object({
    data: z.object({
      found: z.boolean(),
      confirmationNumber: z.string(),
      guestName: z.string(),
      arrivalDate: z.string(),
      departureDate: z.string(),
    }),
  })
  .openapi('GuestPortalLookupResponse');

const VerifyIdentityResponseSchema = z
  .object({
    data: z.object({
      verified: z.boolean(),
      token: z.string(),
      guestName: z.string(),
    }),
  })
  .openapi('VerifyIdentityResponse');

const StayDetailsResponseSchema = z
  .object({
    data: z.object({
      token: z.string(),
      guestName: z.string(),
      roomNumber: z.string(),
      arrivalDate: z.string(),
      departureDate: z.string(),
      checkedIn: z.boolean(),
      digitalKeyReady: z.boolean(),
    }),
  })
  .openapi('StayDetailsResponse');

const CheckInResponseSchema = z
  .object({
    data: z.object({
      success: z.boolean(),
      token: z.string(),
      checkedIn: z.boolean(),
      estimatedArrivalTime: z.string().optional(),
    }),
  })
  .openapi('CheckInResponse');

const DigitalKeyResponseSchema = z
  .object({
    data: z.object({
      token: z.string(),
      keyCode: z.string(),
      activeFrom: z.string(),
      activeUntil: z.string(),
    }),
  })
  .openapi('DigitalKeyResponse');

const ServiceRequestResponseSchema = z
  .object({
    data: z.object({
      id: z.string(),
      token: z.string(),
      type: z.enum(['housekeeping', 'maintenance', 'concierge', 'amenity']),
      message: z.string(),
      status: z.string(),
      createdAt: z.string(),
    }),
  })
  .openapi('ServiceRequestResponse');

const PreferencesResponseSchema = z
  .object({
    data: z.object({
      token: z.string(),
      preferences: z.record(z.string(), z.string()),
      updatedAt: z.string(),
    }),
  })
  .openapi('PreferencesResponse');

export const guestPortalRouter = Router();

// Public endpoints — no auth middleware
registry.registerPath({
  method: 'post',
  path: '/lookup',
  tags: ['Guest Portal'],
  description: 'Look up a reservation',
  request: {
    body: {
      description: 'Reservation lookup payload',
      content: { 'application/json': { schema: LookupInputSchema } },
    },
  },
  responses: {
    200: {
      description: 'Reservation lookup result',
      content: { 'application/json': { schema: LookupResponseSchema } },
    },
    400: {
      description: 'Validation error',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

guestPortalRouter.post(
  '/lookup',
  validateBody(LookupInputSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await lookupReservation(
        (req.validatedBody as { confirmationNumber: string; lastName: string }).confirmationNumber,
        (req.validatedBody as { confirmationNumber: string; lastName: string }).lastName
      );
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

registry.registerPath({
  method: 'post',
  path: '/verify',
  tags: ['Guest Portal'],
  description: 'Verify guest identity',
  request: {
    body: {
      description: 'Identity verification payload',
      content: { 'application/json': { schema: VerifyIdentityInputSchema } },
    },
  },
  responses: {
    200: {
      description: 'Identity verified',
      content: { 'application/json': { schema: VerifyIdentityResponseSchema } },
    },
    400: {
      description: 'Validation error',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

guestPortalRouter.post(
  '/verify',
  validateBody(verifyIdentitySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await verifyIdentity(
        req.validatedBody as z.infer<typeof verifyIdentitySchema>
      );
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

// Authenticated guest endpoints (token from verify)
registry.registerPath({
  method: 'get',
  path: '/stay/{token}',
  tags: ['Guest Portal'],
  description: 'Get stay details by token',
  request: {
    params: TokenParamSchema,
  },
  responses: {
    200: {
      description: 'Stay details',
      content: { 'application/json': { schema: StayDetailsResponseSchema } },
    },
    404: {
      description: 'Stay not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

guestPortalRouter.get('/stay/:token', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await getStayDetails(req.params.token);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

registry.registerPath({
  method: 'post',
  path: '/check-in',
  tags: ['Guest Portal'],
  description: 'Submit check-in',
  request: {
    body: {
      description: 'Check-in payload',
      content: { 'application/json': { schema: CheckInInputSchema } },
    },
  },
  responses: {
    200: {
      description: 'Check-in submitted',
      content: { 'application/json': { schema: CheckInResponseSchema } },
    },
    400: {
      description: 'Validation error',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

guestPortalRouter.post(
  '/check-in',
  validateBody(checkInSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await submitCheckIn(req.validatedBody as z.infer<typeof checkInSchema>);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

registry.registerPath({
  method: 'get',
  path: '/digital-key/{token}',
  tags: ['Guest Portal'],
  description: 'Get digital key by token',
  request: {
    params: TokenParamSchema,
  },
  responses: {
    200: {
      description: 'Digital key',
      content: { 'application/json': { schema: DigitalKeyResponseSchema } },
    },
    404: {
      description: 'Stay not found',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

guestPortalRouter.get(
  '/digital-key/:token',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await getDigitalKey(req.params.token);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

registry.registerPath({
  method: 'post',
  path: '/service-request',
  tags: ['Guest Portal'],
  description: 'Submit a service request',
  request: {
    body: {
      description: 'Service request payload',
      content: { 'application/json': { schema: ServiceRequestInputSchema } },
    },
  },
  responses: {
    201: {
      description: 'Service request received',
      content: { 'application/json': { schema: ServiceRequestResponseSchema } },
    },
    400: {
      description: 'Validation error',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

guestPortalRouter.post(
  '/service-request',
  validateBody(serviceRequestSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await requestService(
        req.validatedBody as z.infer<typeof serviceRequestSchema>
      );
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);

registry.registerPath({
  method: 'patch',
  path: '/preferences/{token}',
  tags: ['Guest Portal'],
  description: 'Update guest preferences',
  request: {
    params: TokenParamSchema,
    body: {
      description: 'Preferences payload',
      content: { 'application/json': { schema: UpdatePreferencesInputSchema } },
    },
  },
  responses: {
    200: {
      description: 'Preferences updated',
      content: { 'application/json': { schema: PreferencesResponseSchema } },
    },
    400: {
      description: 'Validation error',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

guestPortalRouter.patch(
  '/preferences/:token',
  validateBody(z.object({ preferences: z.record(z.string(), z.string()) })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await updatePreferences(
        req.params.token,
        (req.validatedBody as { preferences: Record<string, string> }).preferences
      );
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  }
);
