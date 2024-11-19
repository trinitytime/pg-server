export class BufferReader {
  private buffer: Uint8Array
  private offset = 0
  // TODO(bmc): support non-utf8 encoding?
  private encoding: BufferEncoding = 'utf-8'
  private dataView: DataView

  constructor(buffer: Uint8Array, offset = 0) {
    this.buffer = buffer
    this.dataView = new DataView(this.buffer.buffer, buffer.byteOffset)
    this.offset = offset
  }

  clone(): BufferReader {
    return new BufferReader(this.buffer, this.offset)
  }

  public setBuffer(offset: number, buffer: Uint8Array): void {
    this.offset = offset
    this.buffer = buffer
    this.dataView = new DataView(buffer.buffer, buffer.byteOffset)
  }

  public byte(): number {
    const result = this.dataView.getUint8(this.offset)
    this.offset++
    return result
  }

  public int8(): number {
    const result = this.dataView.getInt8(this.offset)
    this.offset++
    return result
  }

  public int16(): number {
    const result = this.dataView.getInt16(this.offset)
    this.offset += 2
    return result
  }

  public int32(): number {
    const result = this.dataView.getInt32(this.offset)
    this.offset += 4
    return result
  }

  public int64(): bigint {
    return this.dataView.getBigInt64(this.offset)
  }

  public string(length: number): string {
    const bytes = this.buffer.subarray(this.offset, this.offset + length)
    const result = new TextDecoder(this.encoding).decode(bytes)
    this.offset += length
    return result
  }

  public cstring(): string {
    const start = this.offset
    let end = start
    while (this.buffer[end++] !== 0 && end <= this.buffer.byteLength) {}
    this.offset = end
    const bytes = this.buffer.subarray(start, end - 1)
    return new TextDecoder(this.encoding).decode(bytes)
  }

  public bytes(length: number): Uint8Array {
    const result = this.buffer.subarray(this.offset, length)
    this.offset += length
    return result
  }
}
