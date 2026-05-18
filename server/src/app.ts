import express from 'express'

import { healthRouter } from './routes/health'
import { createMeRouter } from './routes/me'
import { createTodayQuizRouter } from './routes/todayQuiz'
import { createTossLoginRouter } from './routes/tossLogin'

export function createApp() {
  const app = express()

  app.use(express.json())
  app.use('/api/health', healthRouter)
  app.use('/api/login/toss', createTossLoginRouter())
  app.use('/api/me', createMeRouter())
  app.use('/api/today-quiz', createTodayQuizRouter())

  return app
}
