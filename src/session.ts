import { EventEmitter } from 'node:events'
import type net from 'node:net'
import { BindComplete, ParseComplete, ReadyForQuery } from './protocol/backendMessages'
import { BufferReceiver } from './protocol/bufferReceiver'
import { Bind, Execute, FrontendMessageCodes, Parse, Query } from './protocol/frontendMessages'
import { Context } from './server/context'
import { Request } from './server/request'
import type { QueryHandler } from './server/types'

export class Session {
  socket: net.Socket
  queryHandler: QueryHandler

  query: string | null = null
  params: any[] = []

  constructor(socket: net.Socket, queryHandler: QueryHandler) {
    this.socket = socket
    this.queryHandler = queryHandler

    const receiver = new BufferReceiver()
    socket.on('data', (data) => {
      receiver.parse(new Uint8Array(data), (code, buffer) => {
        console.log('Received message:', code.toString(16), buffer)
        this.handleRequest(code, buffer)
      })
    })
  }

  handleRequest(code: number, buffer: Uint8Array) {
    console.log('handleRequest:', code, buffer)

    switch (code) {
      case FrontendMessageCodes.Query: {
        const query = Query(buffer)
        console.log('Received query:', query)
        const request = new Request({ query })
        this.requestQuery(request)
        break
      }

      case FrontendMessageCodes.PasswordMessage: {
        // 모든 응답 전송
        // const password = PasswordMessage(buffer)
        // console.log('Received password: ', password)
        // socket.write(AuthenticationOk())
        // socket.write(ParameterStatus('server_version', '14.0'))
        // socket.write(ParameterStatus('server_encoding', 'UTF8'))
        // socket.write(ParameterStatus('client_encoding', 'UTF8'))
        // socket.write(ParameterStatus('DateStyle', 'ISO, MDY'))
        // socket.write(BackendKeyData())
        // socket.write(ReadyForQuery())
        break
      }

      case FrontendMessageCodes.Terminate: {
        this.socket.end()
        break
      }

      case FrontendMessageCodes.Parse: {
        const parse = Parse(buffer)
        this.query = parse.query
        console.log('Received parse:', parse)
        this.socket.write(ParseComplete())
        break
      }

      case FrontendMessageCodes.Bind: {
        const bind = Bind(buffer)
        this.params = bind.params
        console.log('Received bind:', bind)
        this.socket.write(BindComplete())
        break
      }

      case FrontendMessageCodes.Execute: {
        const execute = Execute(buffer)
        console.log('Received execute:', execute)
        // this.socket.write(CommandComplete('UPDATE', 0))
        const query = this.query
        if (!query) {
          console.error('No query to execute')
          break
        }

        const request = new Request({ query })
        this.query = null
        this.requestQuery(request)
        break
      }

      case FrontendMessageCodes.Sync: {
        console.log('Received sync:', buffer)
        this.socket.write(ReadyForQuery())
        return
      }

      default: {
        console.error('Unknown message code:', code)
        break
      }
    }
  }

  async requestQuery(request: Request) {
    const response = new Response(this.socket)

    const context = new Context(request, response)

    const result = await Promise.resolve().then(() => this.queryHandler(context))

    // response가 resolved 상태인지 확인

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
  }
}
