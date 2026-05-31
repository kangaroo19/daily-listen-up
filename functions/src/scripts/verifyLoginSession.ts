import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { collections } from '../domain/collections.js';
import { hashAppSessionToken } from '../services/loginSession.js';

const projectId = process.env.GCLOUD_PROJECT ?? process.env.FIREBASE_PROJECT_ID ?? 'daily-listen-up-dev';
const mockTossPort = Number(process.env.MOCK_TOSS_PORT ?? 7123);
const functionUrl = `http://127.0.0.1:5001/${projectId}/asia-northeast3/api/api/login/toss`;

if (getApps().length === 0) {
  initializeApp({ projectId });
}

const calls: string[] = [];
const server = createServer(async (req, res) => {
  calls.push(`${req.method} ${req.url}`);

  if (req.method === 'POST' && req.url === '/api-partner/v1/apps-in-toss/user/oauth2/generate-token') {
    const body = await readJson(req);

    if (body.authorizationCode !== 'mock-authorization-code' || body.referrer !== 'SANDBOX') {
      writeJson(res, 400, { resultType: 'FAIL', error: { reason: 'Unexpected authorization request' } });
      return;
    }

    writeJson(res, 200, {
      resultType: 'SUCCESS',
      success: {
        tokenType: 'Bearer',
        accessToken: 'mock-server-access-token',
        refreshToken: 'mock-server-refresh-token',
        expiresIn: 3599,
        scope: 'user_key',
      },
    });
    return;
  }

  if (req.method === 'GET' && req.url === '/api-partner/v1/apps-in-toss/user/oauth2/login-me') {
    if (req.headers.authorization !== 'Bearer mock-server-access-token') {
      writeJson(res, 401, { resultType: 'FAIL', error: { reason: 'Unexpected authorization header' } });
      return;
    }

    writeJson(res, 200, {
      resultType: 'SUCCESS',
      success: {
        userKey: 443731104,
        scope: 'user_key',
        agreedTerms: ['terms_tag1'],
      },
    });
    return;
  }

  writeJson(res, 404, { resultType: 'FAIL', error: { reason: 'Not found' } });
});

await listen(server, mockTossPort);

try {
  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      authorizationCode: 'mock-authorization-code',
      referrer: 'SANDBOX',
    }),
  });
  const responseBody = (await response.json()) as {
    appSessionToken?: string;
    expiresAt?: string;
    accessToken?: string;
    refreshToken?: string;
    userKey?: string;
  };

  if (!response.ok || typeof responseBody.appSessionToken !== 'string') {
    throw new Error(`Login function did not return an app session: ${JSON.stringify(responseBody)}`);
  }

  if ('accessToken' in responseBody || 'refreshToken' in responseBody || 'userKey' in responseBody) {
    throw new Error('Login response exposed server-only Toss data.');
  }

  const db = getFirestore();
  const userSnapshot = await db.collection(collections.users).where('userKey', '==', '443731104').limit(1).get();

  if (userSnapshot.empty) {
    throw new Error('Expected linked internal user was not stored.');
  }

  const tokenId = hashAppSessionToken(responseBody.appSessionToken);
  const sessionSnapshot = await db.collection(collections.appSessions).doc(tokenId).get();

  if (!sessionSnapshot.exists) {
    throw new Error('Expected app session was not stored.');
  }

  const session = sessionSnapshot.data();

  if (session?.userId !== userSnapshot.docs[0].id) {
    throw new Error('Stored app session is not linked to the internal user.');
  }

  if (calls.join(',') !== 'POST /api-partner/v1/apps-in-toss/user/oauth2/generate-token,GET /api-partner/v1/apps-in-toss/user/oauth2/login-me') {
    throw new Error(`Unexpected Toss mock calls: ${calls.join(',')}`);
  }

  console.log(`Verified ${collections.users}/${userSnapshot.docs[0].id}`);
  console.log(`Verified ${collections.appSessions}/${tokenId}`);
  console.log('Verified server-only Toss token exchange and login-me calls.');
  console.log('Verified login response exposes only appSessionToken and expiresAt.');
} finally {
  await close(server);
}

function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    req.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown>);
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function writeJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify(body));
}

function listen(serverToStart: ReturnType<typeof createServer>, port: number): Promise<void> {
  return new Promise((resolve) => {
    serverToStart.listen(port, '127.0.0.1', resolve);
  });
}

function close(serverToClose: ReturnType<typeof createServer>): Promise<void> {
  return new Promise((resolve, reject) => {
    serverToClose.close((error) => {
      if (error == null) {
        resolve();
      } else {
        reject(error);
      }
    });
  });
}
