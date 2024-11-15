//binary data writer tuned for encoding binary specific to the postgres binary protocol

export class BufferWriter {
  private buffer: Uint8Array
  private view: DataView
  private offset = 5
  private headerPosition = 0

  constructor(size = 256) {
    this.buffer = new Uint8Array(size)
    this.view = new DataView(this.buffer.buffer)
  }

  private ensure(size: number): void {
    const remaining = this.buffer.byteLength - this.offset
    if (remaining < size) {
      const oldBuffer = this.buffer
      // exponential growth factor of around ~ 1.5
      // https://stackoverflow.com/questions/2269063/buffer-growth-strategy
      const newSize = oldBuffer.byteLength + (oldBuffer.byteLength >> 1) + size
      this.buffer = new Uint8Array(newSize)
      this.view = new DataView(this.buffer.buffer)
      this.buffer.set(new Uint8Array(oldBuffer))
    }
  }

  addCode(code: number): BufferWriter {
    this.view.setUint8(this.headerPosition, code)
    return this
  }

  addInt8(num: number): BufferWriter {
    this.ensure(1)
    this.view.setInt8(this.offset, num)
    this.offset++
    return this
  }

  addInt16(num: number): BufferWriter {
    this.ensure(2)
    this.view.setInt16(this.offset, num)
    this.offset += 2
    return this
  }

  addInt32(num: number): BufferWriter {
    this.ensure(4)
    this.view.setInt32(this.offset, num)
    this.offset += 4
    return this
  }

  addInt64(num: number): BufferWriter {
    this.ensure(8)
    this.view.setBigInt64(this.offset, BigInt(num))
    this.offset += 8
    return this
  }

  addFloat32(num: number): BufferWriter {
    this.ensure(4)
    this.view.setFloat32(this.offset, num)
    this.offset += 4
    return this
  }

  addFloat64(num: number): BufferWriter {
    this.ensure(8)
    this.view.setFloat64(this.offset, num)
    this.offset += 8
    return this
  }

  addCString(string: string): BufferWriter {
    if (string) {
      this.addBuffer(new TextEncoder().encode(string))
    }

    this.addInt8(0) // null terminator

    return this
  }

  addString(string = ''): BufferWriter {
    this.addBuffer(new TextEncoder().encode(string))

    return this
  }

  addBuffer(otherBuffer: Uint8Array, length = 0): BufferWriter {
    const byteLength = length === 0 ? otherBuffer.byteLength : length
    this.ensure(byteLength)
    this.buffer.set(otherBuffer.subarray(0, byteLength), this.offset)
    this.offset += byteLength
    return this
  }

  flush(): Uint8Array {
    //length is everything in this packet minus the code
    const length = this.offset - (this.headerPosition + 1)
    this.view.setUint32(this.headerPosition + 1, length)

    return this.buffer.subarray(0, this.offset)
  }

  clear() {
    this.buffer.fill(0)
    this.offset = 5
  }
}
