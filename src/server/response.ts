import type net from 'node:net'
import { CommandComplete, DataRow, ReadyForQuery, RowDescription } from '../protocol/backendMessages'
import { rowDescriptionFromFields } from '../protocol/rowDescription'

function isDate(obj: any): obj is Date {
  return obj instanceof Date && !Number.isNaN(obj.getTime())
}

function extractDescription(row: any[]) {
  const fields = row.map((value) => {
    if (undefined === value) return 'text'
    if (null === value) return 'text'
    const type = typeof value

    if (type === 'string') return 'text'
    if (type === 'number') return 'numeric'
    if (type === 'boolean') return 'boolean'

    if (type === 'object') {
      if (isDate(value)) return 'timestamptz'
      return 'jsonb'
    }

    return 'text'
  })

  return rowDescriptionFromFields(fields)
}

export class Response {
  socket: net.Socket
  command: string
  description: Record<string, number> | null = null
  rowCount = 0
  isSendRowDesc = false
  resolved = false

  constructor(socket: net.Socket, command: string) {
    this.socket = socket
    this.command = command
  }

  private sendRowDescription() {
    if (!this.isSendRowDesc && this.description) {
      this.socket.write(RowDescription(this.description))
      this.isSendRowDesc = true
    }
  }

  setFields(fields: Record<string, any>) {
    if (!this.isSendRowDesc) {
      this.description = rowDescriptionFromFields(fields)

      this.socket.write(RowDescription(this.description))

      this.isSendRowDesc = true
    }
  }

  sendRowValues(row: any[]) {
    if (!this.isSendRowDesc) {
      this.setFields(extractDescription(row))
    }

    if (this.description) {
      this.socket.write(DataRow(this.description, row))
      ++this.rowCount
    } else {
      throw new Error('Row Description is null')
    }
  }

  sendRowJSON(row: Record<string, any>) {
    const rowArray = Object.values(row)

    return this.sendRowValues(rowArray)
  }

  flush() {
    this.socket.write(CommandComplete(this.command, this.rowCount))
    this.socket.write(ReadyForQuery())
    this.resolved = true
  }
}
