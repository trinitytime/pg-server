import { pgServer, type pgServerOptions } from '../pgServer'
import type { Context } from './context'

export class Server {
  #server: pgServer = new pgServer()

  async listen(options: pgServerOptions) {
    return this.#server.listen(options)
  }

  async close() {
    await this.#server.close()

    return this
  }

  query(handler: (c: Context) => any) {
    this.#server.event.query = handler
  }

  onError(handler: (err: Error) => any) {
    this.#server.event.error = handler
  }
}

export function createServer() {
  return new Server()
}
