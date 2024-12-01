import { pgServer, type pgServerOptions } from '../pgServer'
import type { Context } from './context'

export class Server {
  server: pgServer = new pgServer()
  #queryHandler: QueryHandler | null = null

  async listen(options: pgServerOptions) {
    return this.server.listen(options)
  }

  async close() {
    await this.server.close()

    return this
  }

  query(handler: (c: Context) => any) {
    this.#queryHandler = handler
  }
}

export function createServer() {
  return new Server()
}
