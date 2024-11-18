import { BufferWriter } from './bufferWriter'
import { writeDataRow } from './dataRow'

export const BackendMessageCodes = {
  AuthenticationOk: 0x52, // 'R'
  AuthenticationKerberosV5: 0x52, // 'R'
  AuthenticationCleartextPassword: 0x52, // 'R'
  AuthenticationMD5Password: 0x52, // 'R'
  AuthenticationGSS: 0x52, // 'R'
  AuthenticationGSSContinue: 0x52, // 'R'
  AuthenticationSSPI: 0x52, // 'R'
  AuthenticationSASL: 0x52, // 'R'
  AuthenticationSASLContinue: 0x52, // 'R'
  BackendKeyData: 0x4b, // 'K'
  BindComplete: 0x32, // '2'
  CloseComplete: 0x33, // '3'
  CommandComplete: 0x43, // 'C'
  CopyData: 0x64, // 'd'
  CopyDone: 0x63, // 'c'
  CopyInResponse: 0x47, // 'G'
  CopyOutResponse: 0x48, // 'H'
  CopyBothResponse: 0x57, // 'W'
  DataRow: 0x44, // 'D'
  EmptyQueryResponse: 0x49, // 'I'
  ErrorResponse: 0x45, // 'E'
  FunctionCallResponse: 0x56, // 'V'
  NegotiateProtocolVersion: 0x76, // 'v'
  NoData: 0x6e, // 'n'
  NoticeMessage: 0x4e, // 'N'
  NotificationResponse: 0x41, // 'A'
  ParameterDescription: 0x74, // 't'
  ParameterStatus: 0x53, // 'S'
  ParseComplete: 0x31, // '1'
  PortalSuspended: 0x73, // 's'
  ReadyForQuery: 0x5a, // 'Z'
  RowDescription: 0x54, // 'T'
} as const

export function AuthenticationCleartextPassword() {
  const writer = new BufferWriter(9)
  writer.addCode(BackendMessageCodes.AuthenticationCleartextPassword).addInt32(3) // clear text

  return writer.flush()
}

export function AuthenticationOk() {
  const writer = new BufferWriter(9)
  writer.addCode(BackendMessageCodes.AuthenticationOk).addInt32(0) // auth ok

  return writer.flush()
}

export function ParameterStatus(key: string, value: string) {
  const writer = new BufferWriter(128)
  writer.addCode(BackendMessageCodes.ParameterStatus)
  writer.addCString(key)
  writer.addCString(value)

  return writer.flush()
}

export function BackendKeyData() {
  const writer = new BufferWriter(13)
  writer.addCode(BackendMessageCodes.BackendKeyData)
  writer.addInt32(Math.floor(Math.random() * 100000))
  writer.addInt32(Math.floor(Math.random() * 100000))

  return writer.flush()
}

export function ReadyForQuery() {
  const writer = new BufferWriter(6)
  writer.addCode(BackendMessageCodes.ReadyForQuery)
  writer.addString('I') // IDLE 상태

  return writer.flush()
}

export function RowDescription(desc: Record<string, number>) {
  const writer = new BufferWriter()
  writer.addCode(BackendMessageCodes.RowDescription)
  writer.addInt16(Object.keys(desc).length) // field count

  for (const [name, type] of Object.entries(desc)) {
    writer.addCString(name)
    writer.addInt32(0) // table OID
    writer.addInt16(0) // columnId
    writer.addInt32(type) // data type OID
    writer.addInt16(-1) // data type size
    writer.addInt32(-1) // type modifier
    writer.addInt16(0) // format code
  }

  return writer.flush()
}

export function DataRow(desc: Record<string, number>, row: Record<string, any> | any[]) {
  const values = Array.isArray(row) ? row : Object.values(row)
  return writeDataRow(new BufferWriter(), desc, values)
}

export function CommandComplete(command: string, rowCount: number) {
  const commandTag = `${command} ${rowCount}`
  const writer = new BufferWriter(commandTag.length + 6)
  writer.addCode(BackendMessageCodes.CommandComplete)
  writer.addCString(commandTag)

  return writer.flush()
}

export function EmptyQueryResponse() {
  const writer = new BufferWriter(5)
  writer.addCode(BackendMessageCodes.EmptyQueryResponse)

  return writer.flush()
}

export function ErrorResponse(message: string) {
  const writer = new BufferWriter()
  writer.addCode(BackendMessageCodes.ErrorResponse)
  writer.addCString('SERROR') // severity
  writer.addCString('C12345') // code
  writer.addCString('M' + message) // message

  return writer.flush()
}

export function SSLResponse(accept: boolean) {
  const writer = new BufferWriter(1)
  writer.addString(accept ? 'S' : 'N')

  return writer.flush()
}
