// every message is prefixed with a single bye
const CODE_LENGTH = 1
// every message has an int32 length which includes itself but does
// NOT include the code in the length
const LEN_LENGTH = 4

const HEADER_LENGTH = CODE_LENGTH + LEN_LENGTH

type ParserMode = 'text' | 'binary'

type ParserOptions = {
  mode: ParserMode
}

const emptyBuffer = new Uint8Array(0)

export class BufferReceiver {
  private buffer: Uint8Array = emptyBuffer
  private bufferLength = 0
  private bufferOffset = 0
  private mode: ParserMode

  constructor(opts?: ParserOptions) {
    if (opts?.mode === 'binary') {
      throw new Error('Binary mode not supported yet')
    }
    this.mode = opts?.mode || 'text'
  }

  appendBuffer(buffer: Uint8Array) {
    if (this.bufferLength === 0) {
      this.buffer = buffer
      this.bufferOffset = 0
      this.bufferLength = buffer.byteLength

      return this.buffer
    }

    const newLength = this.bufferLength + buffer.byteLength
    const newFullLength = newLength + this.bufferOffset
    if (newFullLength > this.buffer.byteLength) {
      // We can't concat the new buffer with the remaining one
      let newBuffer: Uint8Array
      if (newLength <= this.buffer.byteLength && this.bufferOffset >= this.bufferLength) {
        // We can move the relevant part to the beginning of the buffer instead of allocating a new buffer
        newBuffer = this.buffer
      } else {
        // Allocate a new larger buffer
        let newBufferLength = Math.ceil(this.buffer.byteLength * 1.5)
        while (newLength >= newBufferLength) {
          newBufferLength = Math.ceil(newBufferLength * 1.5)
        }
        newBuffer = new Uint8Array(newBufferLength)
      }
      // Move the remaining buffer to the new one
      // newBuffer.set(this.buffer, this.bufferOffset, this.bufferLength - this.bufferOffset)
      newBuffer.set(this.buffer.subarray(this.bufferOffset, this.bufferOffset + this.bufferLength), 0)
      this.buffer = newBuffer
      this.bufferOffset = 0
    }
    // Concat the new buffer with the remaining one
    this.buffer.set(buffer, this.bufferOffset + this.bufferLength)
    this.bufferLength = newLength

    return this.buffer
  }

  public parse(buffer: Uint8Array, callback: (code: number, buffer: Uint8Array) => void) {
    this.appendBuffer(buffer)
    const bufferFullLength = this.bufferOffset + this.bufferLength

    let offset = this.bufferOffset
    while (offset + HEADER_LENGTH <= bufferFullLength) {
      // code is 1 byte long - it identifies the message type
      const code = this.buffer[offset]
      // length is 1 Uint32BE - it is the length of the message EXCLUDING the code
      const length = new DataView(this.buffer.buffer).getUint32(offset + CODE_LENGTH, false)
      const fullMessageLength = CODE_LENGTH + length
      if (fullMessageLength + offset <= bufferFullLength) {
        callback(code, this.buffer.subarray(offset + HEADER_LENGTH, offset + HEADER_LENGTH + length))
        offset += fullMessageLength
      } else {
        break
      }
    }

    if (offset === bufferFullLength) {
      console.log('No more data in buffer')
      // No more use for the buffer
      this.buffer = emptyBuffer
      this.bufferLength = 0
      this.bufferOffset = 0
    } else {
      // Adjust the cursors of remainingBuffer
      this.bufferLength = bufferFullLength - offset
      this.bufferOffset = offset
    }
  }
}
