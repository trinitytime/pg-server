import { Client } from 'pg'
import { createServer } from '../server'

const server = createServer()
await server.listen({ port: 22222 })

// const client = new Client({
//   host: 'localhost',
//   port: 5432,
//   user: 'postgres',
//   password: 'any_password', // 어떤 비밀번호든 허용
//   database: 'postgres',
// })

const client = new Client({
  connectionString: 'postgres://postgres:any_password@localhost:22222/postgres?aaa=bbb',
  // ssl: {
  //   rejectUnauthorized: false, // For self-signed certificates
  // },
})

await Promise.resolve()
  .then(() => client.connect())
  .then(() => {
    client
    client.query('SELECT * FROM users')
  })
  .then((result) => console.log(result.rows))
  .then(() => client.query('SELECT $1::text as name', ['brianc']))
  .then((result) => console.log(result.rows))
  .catch((err) => console.error(err))
  .finally(() => client.end())

await server.close()

// 처음에 디비툴이디 보내오는 쿼리들
// SET DateStyle = 'ISO';
// SET client_min_messages = notice;
// SET client_encoding = 'UNICODE';

// SET extra_float_digits = 3;

// SET은 update 0 로 반환되는 것이 아니라 그냥 OK로 반환되는 것이다.?
// select set_config('bytea_output', 'hex', false) from pg_settings where name = 'bytea_output';

// pg_catalog.pg_settings
/*
name
setting
unit
category
short_desc
extra_desc
context
vartype
source
min_val
max_val
enumvals / text array
boot_val
reset_val
sourcefile
sourceline / int4
pending_restart / boolean
*/

// select version();
// PostgreSQL 13.4 on x86_64-pc-linux-gnu, compiled by gcc (GCC) 8.3.1 20191121 (Red Hat 8.3.1-5), 64-bit

// Parse
// Bind
// Execute
// Sync
