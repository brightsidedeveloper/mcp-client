import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import dotenv from 'dotenv'

dotenv.config()

interface Config {
  mcpServers: Record<string, MCPServer>
}

interface MCPServer {
  command: string
  args: string[]
}
class MCPClient {
  private mcp: Client
  private transport: StdioClientTransport | null = null
  private config: Config

  constructor() {
    this.mcp = new Client({ name: 'mcp-client', version: '1.0.0' })
    this.config = this.getConfig()
    this.connectToServers()
  }

  private getConfig() {
    return {
      mcpServers: {
        email: {
          command: 'node',
          args: ['/Users/timvanlerberg/Desktop/mcp-2/build/index.js'],
        },
      },
    }
  }

  private async connectToServers() {}

  public async helloWorld() {
    console.log('Hello, world!')
  }
}

const client = new MCPClient()
Object.freeze(client)
export default client
