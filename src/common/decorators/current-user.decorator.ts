import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserPayload {
  userId: string;
  email: string;
  role: string;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): CurrentUserPayload => {
    const request = context
      .switchToHttp()
      .getRequest<{ user: CurrentUserPayload }>();

    return request.user;
  },
);
