import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const TenantId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    // Only trust the tenant ID from the validated JWT payload — never from raw request properties.
    return request.user?.tenantId ?? null;
  },
);
