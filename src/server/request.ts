export class Request {
  #query: string | null = null
  #params: any[] = []

  constructor({ query }: { query: string }) {
    this.#query = query
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
