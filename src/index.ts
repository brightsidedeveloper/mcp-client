import client from './client/MCPClient.js'
import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { sleep } from '@anthropic-ai/sdk/core.mjs'

const app = new Hono()

// API Key Middleware
const apiKeyMiddleware = async (c: any, next: () => Promise<void>) => {
  const apiKey: string | undefined = c.req.header('X-API-Key')
  const validApiKey: string = 'tim' // Replace with your actual API key

  if (!apiKey || apiKey !== validApiKey) {
    return c.json(
      {
        error: 'Unauthorized',
        message: 'Valid API key required',
      },
      401
    )
  }
  await next()
}

// Apply middleware to all routes
app.use('*', apiKeyMiddleware)

// Simple GET endpoint with typed response
app.post('/api/prompt', async (c) => {
  const body = await c.req.json()
  console.log(body)
  const response = await client.prompt(body.message)

  return c.json(response)
})

// Error handling with typed response
app.onError((err: Error, c) => {
  console.error(err)
  return c.json(
    {
      error: 'Internal Server Error',
      message: 'Something went wrong',
    },
    500
  )
})

const port: number = 3000

async function main() {
  try {
    await client.connectToServers()
    serve(
      {
        fetch: app.fetch,
        port: port,
      },
      () => {
        console.log(`Server running on http://localhost:${port}`)
      }
    )
    await sleep(1_000_000)
  } finally {
    await client.cleanup()
    process.exit(0)
  }
}

main()
