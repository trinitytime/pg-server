import { pgServer, type pgServerOptions } from './pgServer'

export class Server {
  server: pgServer = new pgServer()

  async listen(options: pgServerOptions) {
    return this.server.listen(options)
  }

  async close() {
    await this.server.close()

    return this
  }

  query() {}
}

export function createServer() {
  return new Server()
}
