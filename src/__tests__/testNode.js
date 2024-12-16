// const view = new DataView(new ArrayBuffer(4))

class Event {
  handleEvent() {
    console.log('handleEvent')
  }
}

const event = new Event()

event.handleEvent = () => {
  console.log('handleEvent modified')
}

// console.log(view)

event.handleEvent() // handleEvent modified

const record = [
  [1, 2],
  [3, 4],
]

function isDoubleArray(array) {
  return Array.isArray(array) && Array.isArray(array[0])
}

console.log(
  isDoubleArray([
    [1, 2],
    [3, 4],
  ]),
)

console.log(isDoubleArray([]))
console.log(isDoubleArray([{}, {}]))
console.log(typeof [])
console.log(typeof {})
console.log(Array.isArray({}))

console.log(typeof null) // object
console.log(typeof undefined) // undefined
console.log(typeof 1) // number
console.log(typeof 1.1) // number
console.log(typeof 'abc') // string
console.log(typeof true) // boolean
console.log(typeof new Date()) // object
function isDate(obj) {
  return obj instanceof Date && !Number.isNaN(obj.getTime())
}

console.log(isDate(new Date())) // true
console.log(isDate('2021-01-01')) // false
console.log(isDate(new Date('invalid date'))) // false
console.log(typeof new RegExp()) // object
console.log(typeof new Error()) // object
console.log(typeof Number.NaN) // number
