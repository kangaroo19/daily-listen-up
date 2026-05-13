import request from 'supertest'
import { describe, expect, it } from 'vitest'

import { createApp } from '../app'

describe('GET /api/health', () => {
  it('returns the server health status', async () => {
    const app = createApp()

    const response = await request(app).get('/api/health')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      ok: true,
      service: 'daily-listen-up-server',
    })
  })
})
