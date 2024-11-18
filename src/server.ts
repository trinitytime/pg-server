import { pgServer } from './pgServer'

export class Server {
  server: pgServer = new pgServer()

  async listen(port: number) {
    await this.server.listen(port)

    return this
  }

  async close() {2
    await this.server.close()

    return this
  }

  query() {}
}

export function createServer() {
  return new Server()
}
