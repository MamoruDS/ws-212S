const CONF = {
    defaultUser: 'root',
    defaultPort: 22,
    defaultAllowPassword: true,
    keyPath: '~/.ssh/',
    space: 4,
} as {
    defaultUser: string
    defaultPort: number
    defaultAllowPassword: boolean
    keyPath: string
    space: number
}

type HostConfig = {
    host: string
    port: number
    user: string
    strictHostKeyChecking: boolean
    acceptKeys: string[]
    allowPassword: boolean
    comment: string
}

class DuplicateErr extends Error {
    constructor(alias: string) {
        super(`alias="${alias}" duplicated with exist host`)
    }
}

class Host {
    group: string[]
    comment: string
    alias: string
    host: string
    port: number
    user: string
    strictHostKeyChecking: boolean
    acceptKeys: string[]
    allowPassword: boolean
    constructor(alias: string, config: Partial<HostConfig> = {}) {
        config = {
            ...{
                port: CONF.defaultPort,
                user: CONF.defaultUser,
                strictHostKeyChecking: true,
                acceptKeys: [],
                allowPassword: CONF.defaultAllowPassword,
                comment: '',
            },
            ...config,
        }
        if (!config.host) {
            // panic
        }
        this.alias = alias
        this.host = config.host
        this.port = config.port
        this.user = config.user
        this.strictHostKeyChecking = config.strictHostKeyChecking
        this.acceptKeys = config.acceptKeys
        this.allowPassword = config.allowPassword
        this.comment = config.comment.replace('\n', '')
    }
    private _space(): string {
        return ' '.repeat(CONF.space)
    }
    toString(key?: string): string {
        return (
            `# ${this.comment}\n` +
            `Host ${this.alias}\n` +
            [
                `HostName ${this.host}`,
                `User ${this.user}`,
                `Port ${this.port}`,
                this.strictHostKeyChecking
                    ? undefined
                    : 'StrictHostKeyChecking no',
                key ? `IdentityFile ${CONF.keyPath + key}` : undefined, // TODO:
            ]
                .filter((s) => s != undefined)
                .map((s) => this._space() + s)
                .join('\n')
        )
    }
    toJSON(): Record<string, unknown> {
        return {}
    }
}

class Hosts {
    items: Host[]
    constructor() {
        this.items = []
    }
    load(): void {}
    dump(): Record<string, unknown>[] {
        return this.items.map((h) => h.toJSON())
    }
    private findIdx(alias: string): number {
        for (const idx in this.items) {
            if (this.items[idx].alias == alias) {
                return parseInt(idx)
            }
        }
        return -1
    }
    private findOne(alias: string): Host | undefined {
        // return this.items.filter((h) => (h.alias = alias))[0]
        return this.items[this.findIdx(alias)]
    }
    add(alias: string, config: Partial<HostConfig> = {}): Host {
        const host = new Host(alias, config)
        if (!this.findOne(alias)) {
            this.items.push(host)
        } else {
            throw new DuplicateErr(alias)
        }
        return host
    }
    get(alias: string): Host {
        return this.findOne(alias)
    }
    del(alias: string): void {
        const idx = this.findIdx(alias)
        if (idx != -1) {
            this.items.splice(idx, 1)
        }
    }
    out(keyName: string, ignoreNoneKeyHost: boolean = false): string {
        return this.items
            .filter((h) => {
                if (h.acceptKeys.length == 0) {
                    if (ignoreNoneKeyHost) {
                        return false
                    } else {
                        return h.allowPassword
                    }
                }
                return h.acceptKeys.indexOf(keyName) != -1
            })
            .map((h) => h.toString(h.acceptKeys.length ? keyName : undefined))
            .join('\n\n')
    }
}

export { CONF as config }

export { Host, Hosts }
