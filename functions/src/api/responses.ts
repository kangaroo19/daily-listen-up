import type { Response } from 'express';

export function sendJson(res: Response, status: number, body: unknown): void {
  setCorsHeaders(res);
  res.status(status).set('content-type', 'application/json').send(JSON.stringify(body));
}

export function setCorsHeaders(res: Response): void {
  res.set('access-control-allow-origin', '*');
  res.set('access-control-allow-methods', 'GET,POST,OPTIONS');
  res.set('access-control-allow-headers', 'authorization,content-type');
}
