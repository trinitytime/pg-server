import { Client } from 'pg'
import { createServer } from '../server'

const server = createServer()
await server.listen(15432)

// const client = new Client({
//   host: 'localhost',
//   port: 5432,
//   user: 'postgres',
//   password: 'any_password', // 어떤 비밀번호든 허용
//   database: 'postgres',
// })

const client = new Client({
  connectionString: 'postgres://postgres:any_password@localhost:15432/postgres?aaa=bbb',
  // ssl: {
  //   rejectUnauthorized: false, // For self-signed certificates
  // },
})

await Promise.resolve()
  .then(() => client.connect())
  .then(() => client.query('SELECT * FROM users'))
  .then((result) => console.log(result.rows))
  .catch((err) => console.error(err))
  .finally(() => client.end())

// await server.close()
