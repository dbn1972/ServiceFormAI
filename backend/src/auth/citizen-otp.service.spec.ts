import { UnauthorizedException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AuthService } from './auth.service';
import { CitizenOtpService } from './citizen-otp.service';
import { OTP_DELIVERY_PROVIDER, OtpDeliveryProvider } from './otp-delivery.provider';
import { CitizenOtpChallenge } from '../database/entities/citizen-otp-challenge.entity';
import { ConsumerUser } from '../database/entities/consumer-user.entity';

describe('CitizenOtpService', () => {
  const challengeRepository = {
    findOne: jest.fn(),
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => value),
    update: jest.fn(),
    count: jest.fn().mockResolvedValue(0),
  };
  const consumerRepository = {
    findOne: jest.fn(),
  };
  const manager = {
    query: jest.fn(),
    getRepository: jest.fn((entity) =>
      entity === CitizenOtpChallenge ? challengeRepository : consumerRepository,
    ),
  };
  const dataSource = {
    transaction: jest.fn(async (callback) => callback(manager)),
  } as unknown as DataSource;
  const authService = {
    createConsumerSessionForMobile: jest.fn(),
  } as unknown as AuthService;
  const provider: OtpDeliveryProvider = {
    send: jest.fn(),
  };

  let service: CitizenOtpService;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OTP_PEPPER = 'test-otp-pepper-at-least-32-characters';
    process.env.OTP_TEST_CODE = '654321';
    process.env.NODE_ENV = 'test';
    delete process.env.OTP_FIXED_TEST_ENABLED;
    delete process.env.OTP_FIXED_TEST_MOBILE;
    delete process.env.OTP_FIXED_TEST_CODE;
    service = new CitizenOtpService(
      dataSource,
      authService,
      provider,
    );
  });

  it('normalizes mobile, stores only a digest, and sends the code', async () => {
    challengeRepository.findOne.mockResolvedValue(null);

    const result = await service.issue('+91 98765 43210', '127.0.0.1');

    expect(result.challengeId).toBeDefined();
    expect(result.retryAfterSeconds).toBe(30);
    expect(challengeRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        mobile_e164: '+919876543210',
        code_digest: expect.not.stringContaining('654321'),
        failed_attempts: 0,
      }),
    );
    expect(provider.send).toHaveBeenCalledWith('+919876543210', '654321');
  });

  it('uses the fixed code only for the configured test mobile without sending it', async () => {
    process.env.NODE_ENV = 'production';
    process.env.OTP_FIXED_TEST_ENABLED = 'true';
    process.env.OTP_FIXED_TEST_MOBILE = '+919876543210';
    process.env.OTP_FIXED_TEST_CODE = '000000';
    challengeRepository.findOne.mockResolvedValue(null);

    const issueResult = await service.issue('+91 98765 43210', '127.0.0.1');
    const issuedChallenge = challengeRepository.save.mock.calls[0][0];
    challengeRepository.findOne.mockResolvedValueOnce(issuedChallenge);
    const expectedSession = { user: { id: 'citizen-test' }, tokens: { accessToken: 'a' } };
    (authService.createConsumerSessionForMobile as jest.Mock).mockResolvedValue(expectedSession);

    expect(provider.send).not.toHaveBeenCalled();
    await expect(
      service.verify(issueResult.challengeId, '+919876543210', '000000'),
    ).resolves.toEqual(expectedSession);
    expect(authService.createConsumerSessionForMobile).toHaveBeenCalledWith('+919876543210');
  });

  it('consumes a valid challenge and creates a citizen session', async () => {
    challengeRepository.findOne.mockResolvedValueOnce(null);
    const issueResult = await service.issue('+919876543210', '127.0.0.1');
    const issuedChallenge = challengeRepository.save.mock.calls[0][0];
    challengeRepository.findOne.mockResolvedValueOnce(issuedChallenge);
    const expectedSession = { user: { id: 'citizen-1' }, tokens: { accessToken: 'a' } };
    (authService.createConsumerSessionForMobile as jest.Mock).mockResolvedValue(expectedSession);

    await expect(
      service.verify(issueResult.challengeId, '+91 98765 43210', '654321'),
    ).resolves.toEqual(expectedSession);
    expect(challengeRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ consumed_at: expect.any(Date) }),
    );
    expect(authService.createConsumerSessionForMobile).toHaveBeenCalledWith('+919876543210');

    challengeRepository.findOne.mockResolvedValueOnce(issuedChallenge);
    await expect(
      service.verify(issueResult.challengeId, '+919876543210', '654321'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it.each([
    ['expired', { expires_at: new Date(Date.now() - 1), consumed_at: null, failed_attempts: 0 }],
    ['consumed', { expires_at: new Date(Date.now() + 60_000), consumed_at: new Date(), failed_attempts: 0 }],
    ['exhausted', { expires_at: new Date(Date.now() + 60_000), consumed_at: null, failed_attempts: 5 }],
  ])('rejects an %s challenge without creating a session', async (_label, state) => {
    challengeRepository.findOne.mockResolvedValue({
      id: 'challenge-1',
      mobile_e164: '+919876543210',
      code_digest: 'digest',
      max_attempts: 5,
      ...state,
    });

    await expect(
      service.verify('challenge-1', '+919876543210', '654321'),
    ).rejects.toThrow(UnauthorizedException);
    expect(authService.createConsumerSessionForMobile).not.toHaveBeenCalled();
  });

  it('increments failed attempts for a wrong code', async () => {
    const challenge = {
      id: 'challenge-1',
      mobile_e164: '+919876543210',
      code_digest: 'wrong-digest',
      expires_at: new Date(Date.now() + 60_000),
      consumed_at: null,
      failed_attempts: 1,
      max_attempts: 5,
    };
    challengeRepository.findOne.mockResolvedValue(challenge);

    await expect(
      service.verify('challenge-1', '+919876543210', '654321'),
    ).rejects.toThrow(UnauthorizedException);
    expect(challengeRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ failed_attempts: 2 }),
    );
  });
});