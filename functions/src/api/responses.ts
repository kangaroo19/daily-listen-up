import type { Response } from 'express';

export function sendJson(res: Response, status: number, body: unknown): void {
  res.status(status).set('content-type', 'application/json').send(JSON.stringify(body));
}
