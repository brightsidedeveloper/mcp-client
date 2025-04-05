import client from './client/MCPClient.js'

async function main() {
  if (process.argv.length < 3) {
    console.log('Usage: node index.ts <path_to_server_script>')
    return
  }
  try {
    await client.connectToServers()
    await client.chatLoop()
  } finally {
    await client.cleanup()
    process.exit(0)
  }
}

main()
