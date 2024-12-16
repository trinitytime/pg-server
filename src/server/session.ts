import { EventEmitter } from 'node:events'
import type net from 'node:net'
import { BindComplete, ParseComplete, ReadyForQuery } from '../protocol/backendMessages'
import { BufferReceiver } from '../protocol/bufferReceiver'
import { Bind, Execute, FrontendMessageCodes, Parse, Query, getCodeName } from '../protocol/frontendMessages'
import { Context } from './context'
import { Request } from './request'
import { Response } from './response'
import type { MessageHandler, QueryHandler } from './types'

export class Session extends EventEmitter {
  socket: net.Socket
  queryHandler: QueryHandler | null = null
  messageHandler: MessageHandler | null = null

  user: string | null = null
  database: string | null = null

  query: string | null = null
  params: any[] = []

  constructor(socket: net.Socket, startupMessage: Record<string, string>) {
    super()

    this.user = startupMessage.user
    this.database = startupMessage.database

    this.socket = socket

    const receiver = new BufferReceiver()
    socket.on('data', (data) => {
      receiver.parse(new Uint8Array(data), (code, buffer) => {
        this.handleRequest(code, buffer)
      })
    })

    socket.on('error', (err) => {
      console.error('Socket error:', err)
      socket.destroy()
    })
  }

  handleRequest(code: number, buffer: Uint8Array) {
    switch (code) {
      case FrontendMessageCodes.Query: {
        const query = Query(buffer)
        const request = new Request({ query, params: [] })
        this.requestQuery(request)
        break
      }

      case FrontendMessageCodes.Terminate: {
        this.socket.end()
        break
      }

      case FrontendMessageCodes.Parse: {
        const parse = Parse(buffer)
        this.query = parse.query
        this.socket.write(ParseComplete())
        break
      }

      case FrontendMessageCodes.Bind: {
        const bind = Bind(buffer)
        this.params = bind.params
        this.socket.write(BindComplete())
        break
      }

      case FrontendMessageCodes.Describe: {
        break
      }

      case FrontendMessageCodes.Execute: {
        const execute = Execute(buffer)
        const query = this.query
        if (!query) {
          console.error('No query to execute')
          break
        }

        const request = new Request({ query, params: this.params })
        this.query = null
        this.requestQuery(request)
        break
      }

      case FrontendMessageCodes.Sync: {
        break
      }

      default: {
        if (this.messageHandler) {
          this.messageHandler(code, buffer)
          break
        }
        console.error('Unknown message code:', code)
        break
      }
    }
  }

  onQuery(queryHandler: QueryHandler) {
    this.queryHandler = queryHandler
  }

  onMessage(messageHandler: MessageHandler) {
    this.messageHandler = messageHandler
  }

  async requestQuery(request: Request) {
    const response = new Response(this.socket, request.command)

    const context = new Context(request, response)

    const queryHandler = this.queryHandler ?? ((_context: Context) => null)

    const result = await Promise.resolve().then(() => queryHandler(context))

    // response가 resolved 상태인지 확인
    if (response.resolved) {
      return
    }

    // 응답 데이터가 없는 경우
    if (null === result || undefined === result) {
      response.flush()
      return
    }

    // 응답 데이터가 배열인 경우
    if (Array.isArray(result)) {
      // 값 배열의 배열인 경우
      if (Array.isArray(result[0])) {
        for (const row of result) {
          response.sendRowValues(row)
        }
        response.flush()
        return
      }

      // json 객체 배열인 경우
      if (typeof result[0] === 'object') {
        for (const row of result) {
          response.sendRowJSON(row)
        }
        response.flush()
        return
      }

      // 값 배열인 경우
      response.sendRowValues(result)
      response.flush()
      return
    }

    // json 데이터인 경우
    if (typeof result === 'object') {
      response.sendRowJSON(result)
      response.flush()
      return
    }

    // 어디에도 해당하지 않는 경우
    response.flush()
  }
}
