import fs from 'node:fs'
import net from 'node:net'
import tls from 'node:tls'
import {
  AuthenticationCleartextPassword,
  AuthenticationOk,
  BackendKeyData,
  CommandComplete,
  DataRow,
  ParameterStatus,
  ReadyForQuery,
  RowDescription,
  SSLResponse,
} from './protocol/backendMessages'
import { BufferReceiver } from './protocol/bufferReceiver'
import { FrontendMessageCodes, Parse, PasswordMessage, Query, StartupMessage } from './protocol/frontendMessages'
import { rowDescriptionFromFields } from './protocol/rowDescription'

export interface pgServerOptions {
  port: number
  hostname?: string
  path?: string
}

export class pgServer {
  clientId = 0
  server: net.Server = net.createServer()
  tlsOptions: tls.TlsOptions = {}
  isSecure = false

  constructor() {
    this.setupServer()
  }

  setupServer() {
    const options = {
      // key: fs.readFileSync('./server.key'),
      // cert: fs.readFileSync('./server.crt'),
      // ca: fs.readFileSync('./ca-certificate.pem'), // if needed
      rejectUnauthorized: false,
    }

    // if ssl
    // this.server = tls.createServer(options, (socket) => {
    //   console.log('Server connected', socket.authorized ? 'authorized' : 'unauthorized')
    //   socket.setKeepAlive(true)
    //   socket.on('error', (err) => {
    //     console.error('Socket error:', err)
    //     socket.destroy()
    //   })
    //   socket.on('close', () => {
    //     console.log('Client connection closed')
    //   })

    //   socket.write('welcome!\n')
    //   socket.setEncoding('utf8')
    //   socket.pipe(socket)
    // })

    this.server.on('connection', (socket) => {
      const clientId = ++this.clientId
      console.log('New client connected: ' + clientId)

      let authenticationComplete = false
      const receiver = new BufferReceiver()

      socket.once('data', (data) => {
        this.handleStartup(socket, new Uint8Array(data))
      })

      socket.on('data2', (data) => {
        console.log('Received data from client:', clientId)
        const message = new Uint8Array(data)

        // const combinedBuffer = new Uint8Array(buffer.byteLength + data.length)
        // combinedBuffer.set(buffer, 0)
        // combinedBuffer.set(data, buffer.length)
        // buffer = combinedBuffer

        // 클라이언트로부터 받은 메시지 처리
        if (!authenticationComplete) {
          this.handleStartup(socket, message)
          authenticationComplete = true
          // buffer = new Uint8Array(0)
        } else {
          receiver.parse(message, (code, buffer) => {
            this.handleRequest(socket, code, buffer)
            // console.log('Received message:', message)
          })
          // this.handleQuery(socket, buffer)
          // buffer = new Uint8Array(0)
        }
      })

      socket.on('end', () => {
        console.log('Client disconnected: ' + clientId)
      })

      socket.on('error', (err) => {
        console.error('Socket error:', err)
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
      console.log('Received SSL request:', startupMessage)

      if (this.isSecure) {
        const secureSocket = new tls.TLSSocket(socket, { isServer: true, ...this.tlsOptions })
        // secureSocket.setEncoding('utf8')
        this.handleConnection(secureSocket)
      } else {
        socket.once('data', (data) => {
          this.handleStartup(socket, new Uint8Array(data))
        })
        // this.handleConnection(socket)
      }
      const sslResponse = SSLResponse(this.isSecure)
      socket.write(sslResponse)
    } else {
      console.log('Received startup message:', startupMessage)
      this.handleConnection(socket)
      console.log('Sending authentication request')
      socket.write(AuthenticationCleartextPassword())
    }
  }

  handleConnection(socket: net.Socket) {
    const receiver = new BufferReceiver()
    // socket.setEncoding('utf8')
    socket.on('data', (data) => {
      receiver.parse(new Uint8Array(data), (code, buffer) => {
        console.log('Received message:', code, buffer)
        this.handleRequest(socket, code, buffer)
      })
    })

    socket.on('end', () => {
      console.log('Client disconnected: ')
    })

    socket.on('error', (err) => {
      console.error('Socket error:', err)
      socket.destroy()
    })
  }

  handleRequest(socket: net.Socket, code: number, buffer: Uint8Array) {
    console.log('handleRequest:', code, buffer)

    if (FrontendMessageCodes.PasswordMessage === code) {
      // 모든 응답 전송
      const password = PasswordMessage(buffer)
      console.log('Received password: ', password)
      socket.write(AuthenticationOk())
      socket.write(ParameterStatus('server_version', '14.0'))
      socket.write(ParameterStatus('server_encoding', 'UTF8'))
      socket.write(ParameterStatus('client_encoding', 'UTF8'))
      socket.write(ParameterStatus('DateStyle', 'ISO, MDY'))
      socket.write(BackendKeyData())
      socket.write(ReadyForQuery())
      return
    }

    if (FrontendMessageCodes.Query === code) {
      const query = Query(buffer)
      console.log('Received query:', query)

      // 샘플 응답 데이터 생성
      const fields = {
        id: String,
        name: String,
        age: Number,
        created: Date,
        success: Boolean,
        comment: String,
      }

      const rows = [
        [1, 'Test User 1', 30, new Date().toISOString(), true, 'comment'],
        [2, '사용자 2', 55, new Date(), false, null],
      ]

      const desc = rowDescriptionFromFields(fields)

      socket.write(RowDescription(desc))
      const r1 = DataRow(desc, rows[0])
      // console.log('row1:', r1)
      socket.write(r1)
      socket.write(DataRow(desc, rows[1]))
      socket.write(CommandComplete('SELECT', rows.length))
      socket.write(ReadyForQuery())

      return
    }

    if (FrontendMessageCodes.Terminate === code) {
      socket.end()
      return
    }

    if (FrontendMessageCodes.Parse === code) {
      const parse = Parse(buffer)
      console.log('Received parse:', parse)
      return
    }

    console.error('Unknown message code:', code)
  }
}
