import express from 'express'

import { healthRouter } from './routes/health'
import { createTossLoginRouter } from './routes/tossLogin'

export function createApp() {
  const app = express()

  app.use(express.json())
  app.use('/api/health', healthRouter)
  app.use('/api/login/toss', createTossLoginRouter())

  return app
}
