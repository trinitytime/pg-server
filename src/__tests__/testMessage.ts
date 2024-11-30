import { BufferReader } from '../protocol/bufferReader'
import { AuthenticationOk, DataRow, ParameterStatus, ReadyForQuery } from '../protocol/message'
import { rowDescriptionFromFields } from '../protocol/rowDescription'

console.log(AuthenticationOk())

const p1 = ParameterStatus('server_version', '14.0')
const p2 = ParameterStatus('server_encoding', 'UTF8')
const p3 = ParameterStatus('client_encoding', 'UTF8')
const p4 = ParameterStatus('DateStyle', 'ISO, MDY')

const r = new BufferReader(p1.buffer)
console.log(r.byte())
console.log(r.int32())
console.log(`${r.cstring()}: ${r.cstring()}`)

const r2 = new BufferReader(p2.buffer)
console.log(r2.byte())
console.log(r2.int32())
console.log(`${r2.cstring()}: ${r2.cstring()}`)

console.log(ReadyForQuery())

const fields = {
  id: String,
  name: String,
  age: Number,
  created: Date,
}

const desc = rowDescriptionFromFields(fields)

const rows = [
  [1, 'Test User 1', 30, new Date().toISOString()],
  [2, '사용자 2', 55, new Date().toISOString()],
]

const r1 = DataRow(desc, rows[0])

console.log(r1)
const reader = new BufferReader(r1.buffer)

console.log('code: ', reader.int8())
console.log('length: ', reader.int32())
console.log('column: ', reader.int16())

const len1 = reader.int32()
console.log('len1: ', len1)
console.log(reader.string(len1))

const len2 = reader.int32()
console.log('len2: ', len2)
console.log(reader.string(len2))

const len3 = reader.int32()
console.log('len3: ', len3)
console.log(reader.int32())

const len4 = reader.int32()
console.log('len4: ', len4)
console.log(reader.string(len4))
