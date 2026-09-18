/* apps/api/src/modules/sms/sms.service.test.ts */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { messagesCreate, twilioFactory } = vi.hoisted(() => {
  const messagesCreate = vi.fn();
  const twilioFactory = vi.fn(() => ({ messages: { create: messagesCreate } }));
  return { messagesCreate, twilioFactory };
});

vi.mock('twilio', () => ({ default: twilioFactory }));

vi.mock('../../common/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// Default: Twilio credentials absent → SMS disabled. The enabled scenario
// below re-mocks env and re-imports the module with a fresh registry.
vi.mock('../../common/env.js', () => ({
  env: {},
}));

import { logger } from '../../common/logger.js';
import {
  sendSms,
  renderTemplate,
  sendTemplatedSms,
  sendBookingConfirmation,
  sendCheckInCode,
  smsSendSchema,
  SMS_TEMPLATES,
} from './sms.service.js';

const mockLoggerWarn = logger.warn as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => vi.clearAllMocks());

describe('smsSendSchema', () => {
  it('accepts an E.164 number and a body', () => {
    expect(smsSendSchema.safeParse({ to: '+15551234567', body: 'Hello' }).success).toBe(true);
  });

  it('rejects numbers that are not E.164', () => {
    expect(smsSendSchema.safeParse({ to: '5551234567', body: 'Hello' }).success).toBe(false);
    expect(smsSendSchema.safeParse({ to: '+0123', body: 'Hello' }).success).toBe(false);
  });

  it('rejects bodies over 1600 characters', () => {
    expect(smsSendSchema.safeParse({ to: '+15551234567', body: 'x'.repeat(1601) }).success).toBe(
      false
    );
  });
});

describe('sendSms (Twilio not configured)', () => {
  it('logs instead of sending and returns a mock sid', async () => {
    const result = await sendSms({ to: '+15551234567', body: 'Test message' });

    expect(result.success).toBe(true);
    expect(result.sid).toMatch(/^mock-/);
    expect(twilioFactory).not.toHaveBeenCalled();
    expect(messagesCreate).not.toHaveBeenCalled();
    expect(mockLoggerWarn).toHaveBeenCalledTimes(1);
  });
});

describe('renderTemplate', () => {
  it('replaces all template variables', () => {
    const body = renderTemplate('booking-confirmation', {
      guestName: 'Ada',
      confirmationNumber: 'RSV-1',
      propertyName: 'Grand Hotel',
      arrivalDate: '2026-09-10',
    });

    expect(body).toContain('Hi Ada');
    expect(body).toContain('RSV-1');
    expect(body).toContain('Grand Hotel');
    expect(body).not.toContain('{{guestName}}');
  });

  it('throws for an unknown template', () => {
    expect(() => renderTemplate('does-not-exist', {})).toThrow('Template does-not-exist not found');
  });

  it('warns when variables remain unreplaced', () => {
    renderTemplate('checkout-reminder', {});

    expect(mockLoggerWarn).toHaveBeenCalledWith(
      expect.objectContaining({ templateId: 'checkout-reminder' }),
      'unreplaced template variables'
    );
  });

  it('exposes templates whose declared variables all appear in the body', () => {
    for (const template of Object.values(SMS_TEMPLATES)) {
      for (const variable of template.variables) {
        expect(template.body).toContain(`{{${variable}}}`);
      }
    }
  });
});

describe('templated senders (SMS disabled)', () => {
  it('sendTemplatedSms renders the template and sends it', async () => {
    const result = await sendTemplatedSms('+15551234567', 'check-in-code', {
      propertyName: 'Grand Hotel',
      code: 'AB12CD34',
      roomNumber: '204',
      arrivalDate: '2026-09-10',
    });

    expect(result.success).toBe(true);
    expect(mockLoggerWarn).toHaveBeenCalledWith(
      expect.objectContaining({ bodyLength: expect.any(Number) }),
      expect.stringContaining('SMS not configured')
    );
  });

  it('sendBookingConfirmation uses the booking-confirmation template', async () => {
    const result = await sendBookingConfirmation('+15551234567', {
      guestName: 'Ada',
      confirmationNumber: 'RSV-1',
      propertyName: 'Grand Hotel',
      arrivalDate: '2026-09-10',
    });
    expect(result.success).toBe(true);
  });

  it('sendCheckInCode uses the check-in-code template', async () => {
    const result = await sendCheckInCode('+15551234567', {
      propertyName: 'Grand Hotel',
      code: 'AB12CD34',
      roomNumber: '204',
      arrivalDate: '2026-09-10',
    });
    expect(result.success).toBe(true);
  });
});

describe('sendSms (Twilio configured)', () => {
  async function importEnabledService() {
    vi.resetModules();
    vi.doMock('../../common/env.js', () => ({
      env: {
        TWILIO_ACCOUNT_SID: 'AC123',
        TWILIO_AUTH_TOKEN: 'token',
        TWILIO_PHONE_NUMBER: '+15550001111',
      },
    }));
    vi.doMock('twilio', () => ({ default: twilioFactory }));
    vi.doMock('../../common/logger.js', () => ({
      logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    }));
    return import('./sms.service.js');
  }

  it('sends via the Twilio client and returns the message sid', async () => {
    messagesCreate.mockResolvedValue({ sid: 'SM123', status: 'queued' });
    const service = await importEnabledService();

    const result = await service.sendSms({ to: '+15551234567', body: 'Hello' });

    expect(twilioFactory).toHaveBeenCalledWith('AC123', 'token');
    expect(messagesCreate).toHaveBeenCalledWith({
      body: 'Hello',
      from: '+15550001111',
      to: '+15551234567',
    });
    expect(result).toEqual({ success: true, sid: 'SM123' });
  });

  it('returns success: false with the provider error message on failure', async () => {
    messagesCreate.mockRejectedValue(Object.assign(new Error('Invalid number'), { code: 21211 }));
    const service = await importEnabledService();

    const result = await service.sendSms({ to: '+15551234567', body: 'Hello' });

    expect(result).toEqual({ success: false, error: 'Invalid number' });
  });
});
