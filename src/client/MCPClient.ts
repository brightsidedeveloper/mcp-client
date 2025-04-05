import Anthropic from '@anthropic-ai/sdk'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import readline from 'readline/promises'

import dotenv from 'dotenv'
import { MessageParam } from '@anthropic-ai/sdk/resources/index.mjs'
dotenv.config()

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
if (!ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not set')

interface Config {
  mcpServers: Record<string, MCPServer>
}

interface MCPServer {
  command: string
  args: string[]
}

interface Tool {
  name: string
  description?: string
  input_schema: any
}

class MCPClient {
  private mcp: Client
  private anthropic: Anthropic
  private transports: Map<string, StdioClientTransport> = new Map()
  private tools: Tool[] = []
  private config: Config

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: ANTHROPIC_API_KEY,
    })
    this.mcp = new Client({ name: 'mcp-client', version: '1.0.0' })
    this.config = this.getConfig()
  }

  public async connectToServers() {
    const serverPromises = Object.entries(this.config.mcpServers).map(([serverName, server]) => this.connectToServer(serverName, server))
    await Promise.all(serverPromises)
  }

  public async chatLoop() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    try {
      console.log('\nMCP Client Started!')
      console.log("Type your queries or 'quit' to exit.")

      while (true) {
        const message = await rl.question('\nQuery: ')
        if (message.toLowerCase() === 'quit') {
          break
        }
        const response = await this.processQuery(message)
        console.log('\n' + response)
      }
    } catch (e) {
      console.log('Error:', e)
    } finally {
      rl.close()
    }
  }

  public async cleanup() {
    await this.mcp.close()
  }

  private getConfig(): Config {
    return {
      mcpServers: {
        email: {
          command: 'node',
          args: ['/Users/timvanlerberg/Desktop/mcp-2/build/index.js'],
        },
      },
    }
  }

  private async processQuery(query: string) {
    const messages: MessageParam[] = [
      {
        role: 'user',
        content: query,
      },
    ]

    console.log(this.tools)

    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      messages,
      tools: this.tools,
    })

    const finalText = []
    const toolResults = []

    for (const content of response.content) {
      if (content.type === 'text') {
        finalText.push(content.text)
      } else if (content.type === 'tool_use') {
        const toolName = content.name
        const toolArgs = content.input as { [x: string]: unknown } | undefined

        const result = await this.mcp.callTool({
          name: toolName,
          arguments: toolArgs,
        })
        toolResults.push(result)
        finalText.push(`[Calling tool ${toolName} with args ${JSON.stringify(toolArgs)}]`)

        messages.push({
          role: 'user',
          content: result.content as string,
        })

        const response = await this.anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1000,
          messages,
        })

        finalText.push(response.content[0].type === 'text' ? response.content[0].text : '')
      }
    }

    return finalText.join('\n')
  }

  private async connectToServer(serverName: string, server: MCPServer) {
    try {
      const scriptPath = server.args[0]
      const isJs = scriptPath.endsWith('.js')
      const isPy = scriptPath.endsWith('.py')

      if (!isJs && !isPy) {
        throw new Error(`Server script for ${serverName} must be a .js or .py file`)
      }

      const command = server.command || (isPy ? (process.platform === 'win32' ? 'python' : 'python3') : process.execPath)

      const transport = new StdioClientTransport({
        command,
        args: server.args,
      })

      this.transports.set(serverName, transport)
      this.mcp.connect(transport)

      const toolsResult = await this.mcp.listTools()
      const serverTools = toolsResult.tools.map((tool) => ({
        name: `${serverName}_${tool.name}`,
        description: tool.description,
        input_schema: tool.inputSchema,
      }))

      this.tools.push(...serverTools)
      console.log(
        `Connected to ${serverName} with tools:`,
        serverTools.map((tool) => tool.name)
      )
    } catch (e) {
      console.error(`Failed to connect to ${serverName}:`, e)
      throw e
    }
  }
}

const client = new MCPClient()
Object.freeze(client)
export default client
