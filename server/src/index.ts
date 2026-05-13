import 'dotenv/config'

import { createApp } from './app'

const DEFAULT_PORT = 4000
const port = Number(process.env.SERVER_PORT ?? DEFAULT_PORT)
const app = createApp()

app.listen(port, () => {
  console.log(`daily-listen-up-server listening on port ${port}`)
})
