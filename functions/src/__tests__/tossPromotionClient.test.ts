import test from 'node:test';
import assert from 'node:assert/strict';
import { createTossPromotionClient } from '../services/tossPromotionClient.js';

test('calls Toss promotion S2S endpoints with x-toss-user-key and server-only promotion code', async () => {
  const requests: Array<{ url: string; init: RequestInit }> = [];
  const client = createTossPromotionClient(
    async (url, init) => {
      requests.push({ url: String(url), init: init ?? {} });

      if (String(url).endsWith('/get-key')) {
        return jsonResponse({ resultType: 'SUCCESS', success: { key: 'promotion_key_1' } });
      }

      if (String(url).endsWith('/execution-result')) {
        return jsonResponse({ resultType: 'SUCCESS', success: 'SUCCESS' });
      }

      return jsonResponse({ resultType: 'SUCCESS', success: { key: 'promotion_key_1' } });
    },
    'https://apps-in-toss-api.toss.im',
    undefined,
  );

  const key = await client.createPromotionKey('toss_user_key_1');
  await client.executePromotion({
    userKey: 'toss_user_key_1',
    promotionCode: 'TEST_PROMOTION_CODE',
    key,
    amount: 10,
  });
  const status = await client.getExecutionResult({
    userKey: 'toss_user_key_1',
    promotionCode: 'TEST_PROMOTION_CODE',
    key,
  });

  assert.equal(status, 'SUCCESS');
  assert.deepEqual(
    requests.map((request) => new URL(request.url).pathname),
    [
      '/api-partner/v1/apps-in-toss/promotion/execute-promotion/get-key',
      '/api-partner/v1/apps-in-toss/promotion/execute-promotion',
      '/api-partner/v1/apps-in-toss/promotion/execution-result',
    ],
  );
  assert.equal(requests[0].init.headers?.['x-toss-user-key' as keyof HeadersInit], 'toss_user_key_1');
  assert.deepEqual(JSON.parse(String(requests[1].init.body)), {
    promotionCode: 'TEST_PROMOTION_CODE',
    key: 'promotion_key_1',
    amount: 10,
  });
});

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      'content-type': 'application/json',
    },
  });
}
