import net from 'node:net'
import tls from 'node:tls'
import {
  AuthenticationCleartextPassword,
  AuthenticationOk,
  BackendKeyData,
  ParameterStatus,
  ReadyForQuery,
  SSLResponse,
} from './protocol/backendMessages'
import { FrontendMessageCodes, PasswordMessage, StartupMessage } from './protocol/frontendMessages'
import type { Context } from './server/context'
import { Session } from './server/session'

export interface pgServerOptions {
  port: number
  hostname?: string
  path?: string
}

class EventHandler {
  query(_context: Context): any {
    return []
  }

  error(err: Error) {
    console.error(err)
  }
}

function sendParameters(socket: net.Socket, headers: Record<string, string>) {
  for (const [key, value] of Object.entries(headers)) {
    socket.write(ParameterStatus(key, value))
  }
  socket.write(BackendKeyData())
}

export class pgServer {
  event = new EventHandler()
  headers = {
    server_version: '14.0',
    server_encoding: 'UTF8',
    client_encoding: 'UTF8',
    DateStyle: 'ISO, MDY',
  }

  server: net.Server = net.createServer()
  tlsOptions: tls.TlsOptions = {}
  isSecure = false // https or not
  isPassword = false // password or not

  #sessions: Session[] = []

  constructor(options = {}, headers = {}) {
    this.headers = { ...this.headers, ...headers }
    this.setupServer(options)
  }

  setupServer(options: Record<string, any>) {
    const opts = {
      rejectUnauthorized: false,
      ...options,
    }

    this.server.on('connection', (socket) => {
      socket.once('data', (data) => {
        this.handleStartup(socket, new Uint8Array(data))
      })
    })
  }

  listen({ port, hostname, path }: pgServerOptions) {
    const { promise, resolve, reject } = Promise.withResolvers()

    if (path) {
      this.server.listen(path, resolve)
    } else {
      this.server.listen(port, hostname, resolve)
    }

    return promise
  }

  close() {
    const { promise, resolve, reject } = Promise.withResolvers()

    this.server.close(resolve)

    return promise
  }

  handleStartup(socket: net.Socket, buffer: Uint8Array) {
    const startupMessage = StartupMessage(buffer)

    if (startupMessage.isSecure) {
      if (this.isSecure) {
        const secureSocket = new tls.TLSSocket(socket, { isServer: true, ...this.tlsOptions })
        this.handleConnection(secureSocket)
      } else {
        socket.once('data', (data) => {
          this.handleStartup(socket, new Uint8Array(data))
        })
      }

      socket.write(SSLResponse(this.isSecure))
      if (!this.isSecure) {
        // 다시 읽기 위해 리턴
        return
      }
    } else {
      this.handleConnection(socket)
    }

    if (this.isPassword) {
      socket.write(AuthenticationCleartextPassword())
    } else {
      sendParameters(socket, this.headers)
      socket.write(ReadyForQuery())
    }
  }

  handleConnection(socket: net.Socket, startupMessage: Record<string, any> = {}) {
    const session = new Session(socket, startupMessage)

    session.onQuery(async (context) => {
      return await this.event.query(context)
    })

    session.onMessage((code, buffer) => {
      switch (code) {
        case FrontendMessageCodes.PasswordMessage: {
          // 모든 응답 전송
          const password = PasswordMessage(buffer)
          // TODO: check password
          socket.write(AuthenticationOk())
          sendParameters(socket, this.headers)
          socket.write(ReadyForQuery())
          break
        }
      }
    })

    this.#sessions.push(session)

    socket.on('end', () => {
      this.#sessions = this.#sessions.filter((s) => s !== session)
    })

    socket.on('error', (err) => {
      Promise.resolve()
        .then(() => this.event.error(err))
        .then(() => socket.destroy())
    })
  }
}
