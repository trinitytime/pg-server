import { BackendMessageCodes } from './backendMessages'
import type { BufferWriter } from './bufferWriter'
import { builtInTypes } from './types'

function toStringValue(value: any) {
  const type = typeof value
  if (type === 'number') return String(value)
  if (value instanceof Date) return value.toISOString().replace('T', ' ')
  if (type === 'boolean') return String(value)

  return value.toString()
}

function hexToUint8Array(hex: string): Uint8Array {
  const buffer = new Uint8Array(8)
  const paddedHex = hex.length % 2 ? `0${hex}` : hex
  const matchArray = paddedHex.match(/.{1,2}/g)
  if (!matchArray) return new Uint8Array(0)
  matchArray.forEach((byte, index) => {
    buffer[index] = Number.parseInt(byte, 16)
  })

  return buffer
}

function toBufferValue(value: any) {
  const type = typeof value
  if (type === 'string') {
    let num = value
    try {
      num = BigInt(value).toString(16)
    } catch {}

    return hexToUint8Array(num)
  }

  if (type === 'bigint') {
    return hexToUint8Array(value.toString(16))
  }

  if (value instanceof Date) {
    return hexToUint8Array(value.valueOf().toString(16))
  }

  return hexToUint8Array(value.toString())
}

function toISOString(value: Date | string | number): string {
  if (value instanceof Date) return value.toISOString().replace('T', ' ')
  if (Number.isInteger(value)) return new Date(value).toISOString().replace('T', ' ')

  return String(value).replace('T', ' ')
}

export function writeDataRow(writer: BufferWriter, desc: Record<string, number>, values: any[]) {
  writer.addCode(BackendMessageCodes.DataRow)
  writer.addInt16(values.length) // field count

  const fields = Object.entries(desc)

  for (let i = 0; i < fields.length; ++i) {
    const v = values[i]
    const field = fields[i][1]

    if (v === null || v === undefined) {
      writer.addInt32(-1)
      continue
    }

    if (field === builtInTypes.TEXT) {
      const str = toStringValue(v)
      writer.addInt32(Buffer.byteLength(str))
      writer.addString(str)
      continue
    }

    if (field === builtInTypes.INT2) {
      const str = toStringValue(v)
      writer.addInt32(Buffer.byteLength(str))
      writer.addString(str)
      continue
    }

    if (field === builtInTypes.INT4) {
      const str = toStringValue(v)
      writer.addInt32(Buffer.byteLength(str))
      writer.addString(str)
      continue
    }

    if (field === builtInTypes.INT8) {
      const str = toStringValue(v)
      writer.addInt32(Buffer.byteLength(str))
      writer.addString(str)
      continue
    }

    if (field === builtInTypes.BOOL) {
      const str = String(!!v)
      writer.addInt32(Buffer.byteLength(str))
      writer.addString(str)
      continue
    }

    if (field === builtInTypes.TIMESTAMPTZ) {
      const timestamp = toISOString(v)
      writer.addInt32(Buffer.byteLength(timestamp))
      writer.addString(timestamp)
      continue
    }

    if (field === builtInTypes.FLOAT4) {
      const str = toStringValue(v)
      writer.addInt32(Buffer.byteLength(str))
      writer.addString(str)
      continue
    }

    if (field === builtInTypes.FLOAT8 || field === builtInTypes.NUMERIC) {
      const str = toStringValue(v)
      writer.addInt32(Buffer.byteLength(str))
      writer.addString(str)
      continue
    }

    writer.addInt32(0) // no data
  }

  return writer.flush()
}
