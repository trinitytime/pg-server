import type net from 'node:net'

export class Response {
  socket: net.Socket
  resolved = false

  constructor(socket: net.Socket) {
    this.socket = socket
  }

  send() {}

  flush() {
    this.resolved = true
  }
}
