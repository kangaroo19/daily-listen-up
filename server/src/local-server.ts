import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from 'node:http';
import { handleApiRequest } from './http/app.js';
import { logger } from './logging/logger.js';

const DEFAULT_PORT = 8787;

const server = createServer(async (incomingMessage, serverResponse) => {
  const request = await toWebRequest(incomingMessage);
  const response = await handleApiRequest(request);
  await writeNodeResponse(response, serverResponse);
});

const port = readPort();

server.listen(port, () => {
  logger.info(`backend_listening http://localhost:${port}`);
});

function readPort(): number {
  const rawPort = process.env.BACKEND_PORT ?? process.env.PORT;

  if (rawPort == null || rawPort.trim() === '') {
    return DEFAULT_PORT;
  }

  const port = Number.parseInt(rawPort, 10);
  return Number.isInteger(port) && port > 0 ? port : DEFAULT_PORT;
}

async function toWebRequest(message: IncomingMessage): Promise<Request> {
  const host = message.headers.host ?? `localhost:${port}`;
  const url = new URL(message.url ?? '/', `http://${host}`);
  const headers = new Headers();

  for (const [key, value] of Object.entries(message.headers)) {
    if (Array.isArray(value)) {
      headers.set(key, value.join(', '));
    } else if (value != null) {
      headers.set(key, value);
    }
  }

  const body =
    message.method === 'GET' || message.method === 'HEAD'
      ? undefined
      : await readBody(message);

  return new Request(url, {
    method: message.method,
    headers,
    body,
  });
}

async function readBody(message: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];

  for await (const chunk of message) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString('utf8');
}

async function writeNodeResponse(
  response: Response,
  serverResponse: ServerResponse,
): Promise<void> {
  serverResponse.statusCode = response.status;
  response.headers.forEach((value, key) => {
    serverResponse.setHeader(key, value);
  });

  if (response.body == null) {
    serverResponse.end();
    return;
  }

  const body = Buffer.from(await response.arrayBuffer());
  serverResponse.end(body);
}
