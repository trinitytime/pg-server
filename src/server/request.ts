export class Request {
  #query: string | null = null
  #params: any[] = []

  command = 'SELECT'

  constructor({ query, params }: { query: string; params: any[] }) {
    this.#query = query
    this.#params = params
  }

  set query(query: string) {
    this.#query = query
  }

  get query() {
    return this.#query ?? ''
  }

  set params(params: any[]) {
    this.#params = params
  }
}
