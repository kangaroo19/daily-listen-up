import type {
  TossLoginRequest,
  TossLoginResponse,
} from '../../../shared/api/contracts.js';
import type { TossClient } from '../integrations/toss/client.js';
import { AppError } from './errors.js';

export class AuthService {
  constructor(private readonly tossClient: TossClient) {}

  async loginWithToss(request: TossLoginRequest): Promise<TossLoginResponse> {
    validateTossLoginRequest(request);

    if (process.env.LOCAL_AUTH_BYPASS_ENABLED === 'true') {
      return { userKey: `local-${request.authorizationCode}` };
    }

    const token = await this.tossClient.exchangeAuthorizationCode(request);
    const user = await this.tossClient.fetchUser(token.accessToken);

    return { userKey: user.userKey };
  }
}

function validateTossLoginRequest(request: TossLoginRequest): void {
  if (
    typeof request.authorizationCode !== 'string' ||
    request.authorizationCode.trim() === ''
  ) {
    throw new AppError(422, 'validation_error', '인가 코드가 필요해요.');
  }

  if (request.referrer !== 'DEFAULT' && request.referrer !== 'SANDBOX') {
    throw new AppError(
      422,
      'validation_error',
      'referrer 값이 올바르지 않아요.',
    );
  }
}
