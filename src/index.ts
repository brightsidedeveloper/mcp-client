import client from './client/MCPClient.js'

async function main() {
  try {
    await client.connectToServers()
    await client.chatLoop()
  } finally {
    await client.cleanup()
    process.exit(0)
  }
}

main()
