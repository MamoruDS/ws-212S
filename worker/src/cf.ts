interface KV {
    get(key: string, type: 'text'): Promise<string>
    get(key: string, type: 'json'): Promise<Record<string, unknown>>
    get(key: string, type: 'arrayBuffer'): Promise<ArrayBuffer>
    get(key: string, type: 'stream'): Promise<ReadableStream>
    get(
        key: string,
        type?: 'text' | 'json' | 'arrayBuffer' | 'stream'
    ): Promise<string>

    put(
        key: string,
        value: string | ArrayBuffer | ReadableStream,
        config?: Partial<{
            expiration: number
            expirationTtl: number
            metadata: Record<string, unknown>
        }>
    ): Promise<void>
}

export { KV }
