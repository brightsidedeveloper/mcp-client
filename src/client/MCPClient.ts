import dotenv from 'dotenv'

dotenv.config()

class MCPClient {
  constructor() {}

  helloWorld() {
    console.log('Hello World!')
  }
}

const client = new MCPClient()
Object.freeze(client)
export default client
