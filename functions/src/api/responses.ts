import type { Response } from 'express';

export function sendJson(res: Response, status: number, body: unknown): void {
  res.status(status).set('content-type', 'application/json').send(JSON.stringify(body));
}

export function sendNotImplemented(res: Response, endpoint: string, nextTask: string, boundary?: unknown): void {
  sendJson(res, 501, {
    code: 'not_implemented',
    endpoint,
    nextTask,
    boundary,
  });
}
