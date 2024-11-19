import { BufferReader } from './bufferReader'

export const FrontendMessageCodes = {
  Bind: 0x42, // 'B'
  CancelRequest: 0x10, // 16
  Close: 0x43, // 'C'
  CopyData: 0x64, // 'd'
  CopyDone: 0x63, // 'c'
  CopyFail: 0x66, // 'f'
  Describe: 0x44, // 'D'
  Execute: 0x45, // 'E'
  Flush: 0x48, // 'H'
  FunctionCall: 0x46, // 'F'
  GSSENCRequest: 0x08, // 8
  GSSResponse: 0x70, // 'p'
  Parse: 0x50, // 'P'
  PasswordMessage: 0x70, // 'p'
  Query: 0x51, // 'Q'
  SASLInitialResponse: 0x70, // 'p'
  SASLResponse: 0x70, // 'p'
  SSLRequest: 0xfe, // no code
  StartupMessage: 0xff, // no code
  Sync: 0x53, // 'S'
  Terminate: 0x58, // 'X'
} as const

export function StartupMessage(buffer: Uint8Array) {
  const br = new BufferReader(buffer)
  const length = br.int32()
  const version = br.int32()

  const isSecure = version === 80877103
  if (isSecure) {
    const message = {
      isSecure,
      version,
    }
    return message
  }

  const message = {
    isSecure: false,
    version,
    [br.cstring()]: br.cstring(),
    [br.cstring()]: br.cstring(),
    [br.cstring()]: br.cstring(),
    options: br.cstring(),
  }

  return message
}

export function SSLRequest(buffer: Uint8Array) {
  const br = new BufferReader(buffer)

  const length = br.int32()
  const version = br.int32()

  return { version }
}

export function PasswordMessage(buffer: Uint8Array) {
  const br = new BufferReader(buffer)

  return br.cstring()
}

export function Query(buffer: Uint8Array) {
  const br = new BufferReader(buffer)

  return br.cstring()
}

export function Parse(buffer: Uint8Array) {
  const br = new BufferReader(buffer)

  const name = br.cstring()
  const query = br.cstring()
  const numParams = br.int16()

  const params = []
  for (let i = 0; i < numParams; i++) {
    const type = br.int32()
    params.push(type)
  }

  return { name, query, params }
}

export function Bind(buffer: Uint8Array) {
  const br = new BufferReader(buffer)

  const portal = br.cstring()
  const statement = br.cstring()
  const numFormats = br.int16()

  const formats = []
  for (let i = 0; i < numFormats; i++) {
    formats.push(br.int16())
  }

  const numParams = br.int16()
  const params = []
  for (let i = 0; i < numParams; i++) {
    const length = br.int32()
    const value = br.bytes(length)
    params.push(value)
  }

  const numResultsFormats = br.int16()
  const resultsFormats = []
  for (let i = 0; i < numResultsFormats; i++) {
    resultsFormats.push(br.int16())
  }

  return { portal, statement, formats, params, resultsFormats }
}

export function Execute(buffer: Uint8Array) {
  const br = new BufferReader(buffer)

  const portal = br.cstring()
  const maxRows = br.int32()

  return { portal, maxRows }
}

export function Sync(buffer: Uint8Array) {
  return {}
}
