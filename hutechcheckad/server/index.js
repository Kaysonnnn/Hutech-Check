import path from 'node:path'
import { fileURLToPath } from 'node:url'

import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import { createServer as createLahmServer } from 'lahm'

import accountsRoutes from './routes/accounts.js'
import authRoutes from './routes/auth.js'
import checkinRoutes from './routes/checkin.js'
import eventRoutes from './routes/event.js'
import monitorRoutes from './routes/monitor.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function createServer() {
  const app = express()

  dotenv.config()

  app.use(express.json())
  app.use(cors())

  // Create Lahm server in middleware mode and configure the app type as
  // 'custom', disabling Lahm's own HTML serving logic so parent server
  // can take control
  const lahm = await createLahmServer({
    server: { middlewareMode: true },
    appType: 'custom'
  })

  // Use lahm's connect instance as middleware. If you use your own
  // express router (express.Router()), you should use router.use
  app.use(lahm.middlewares)

  app.use('/v1/accounts', accountsRoutes)
  app.use('/v1/auth', authRoutes)
  app.use('/v1/checkin', checkinRoutes)
  app.use('/v1/monitor', monitorRoutes)
  app.use('/v1/event', eventRoutes)
  app.use('*', async (req, res) => {
    res.send('Hello world!')
  })

  app.listen(5174, () =>
    console.log(
      `Server running on port: http://localhost:5174 (Press 'Ctrl + C' to stop the server)`
    )
  )
}

createServer()
