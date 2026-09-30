import { Injectable, ServiceUnavailableException } from '@nestjs/common';

export const OTP_DELIVERY_PROVIDER = Symbol('OTP_DELIVERY_PROVIDER');

export interface OtpDeliveryProvider {
  send(mobile: string, code: string): Promise<void>;
}

@Injectable()
export class HttpOtpDeliveryProvider implements OtpDeliveryProvider {
  async send(mobile: string, code: string): Promise<void> {
    const providerUrl = process.env.OTP_PROVIDER_URL;

    if (!providerUrl) {
      if (process.env.NODE_ENV === 'test') {
        return;
      }
      throw new ServiceUnavailableException('OTP delivery is not configured');
    }

    const parsedUrl = new URL(providerUrl);
    if (process.env.NODE_ENV === 'production' && parsedUrl.protocol !== 'https:') {
      throw new ServiceUnavailableException('OTP delivery configuration is invalid');
    }
    if (process.env.NODE_ENV === 'production' && !process.env.OTP_PROVIDER_API_KEY) {
      throw new ServiceUnavailableException('OTP delivery credentials are not configured');
    }

    const response = await fetch(parsedUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(process.env.OTP_PROVIDER_API_KEY
          ? { authorization: `Bearer ${process.env.OTP_PROVIDER_API_KEY}` }
          : {}),
      },
      body: JSON.stringify({ mobile, code }),
      signal: AbortSignal.timeout(5_000),
      redirect: 'error',
    });

    if (!response.ok) {
      throw new ServiceUnavailableException('OTP delivery failed');
    }
  }
}