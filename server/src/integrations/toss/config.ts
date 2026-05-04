import { readRequiredServerEnv } from '../../config/serverEnv.js';

export function readTossServerConfig() {
  return {
    clientSecret: readRequiredServerEnv('TOSS_CLIENT_SECRET'),
    pointPromotionSecret: readRequiredServerEnv('TOSS_POINT_PROMOTION_SECRET'),
  };
}
