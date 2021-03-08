const CONF = {
    defaultUser: undefined,
    defaultPort: undefined,
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
    port: number | undefined
    user: string | undefined
    strictHostKeyChecking: boolean
    acceptKeys: string[]
    allowPassword: boolean
    groups: string[]
    comment: string
    hide: boolean
}

type HostSTO = {
    alias: string
} & HostConfig

class DuplicateErr extends Error {
    constructor(alias: string) {
        super(`alias="${alias}" duplicated with exist host`)
    }
}

class Host {
    alias: string
    host: string
    port: number
    user: string
    strictHostKeyChecking: boolean
    acceptKeys: string[]
    allowPassword: boolean
    comment: string
    groups: string[]
    hide: boolean
    constructor(alias: string, config: Partial<HostConfig> = {}) {
        const conf = {
            ...{
                port: CONF.defaultPort,
                user: CONF.defaultUser,
                strictHostKeyChecking: true,
                acceptKeys: [],
                allowPassword: CONF.defaultAllowPassword,
                groups: [],
                comment: '',
                hide: false
            },
            ...config,
        } as HostConfig
        if (!config.host) {
            // panic
        }
        this.alias = alias
        this._load(conf)
    }
    private _space(): string {
        return ' '.repeat(CONF.space)
    }
    private _load(config: HostConfig) {
        this.host = config.host
        this.port = config.port
        this.user = config.user
        this.strictHostKeyChecking = config.strictHostKeyChecking
        this.acceptKeys = config.acceptKeys
        this.allowPassword = config.allowPassword
        this.comment = config.comment.replace('\n', '')
        this.groups = config.groups
        this.hide = config.hide
    }
    update(config: Partial<HostConfig>): Host {
        const conf = { ...this.toJSON(), ...config } as HostConfig
        this._load(conf)
        return this
    }
    toString(
        keys: string[] = [],
        ignoreAcceptKey?: boolean
    ): string | undefined {
        const key = keys.filter((k) => this.acceptKeys.indexOf(k) != -1)[0]
        if (!key && !this.allowPassword && !ignoreAcceptKey) {
            return undefined
        }
        const info: string =
            `Host ${this.alias}\n` +
            [
                `HostName ${this.host}`,
                this.user ? `User ${this.user}` : undefined,
                this.port ? `Port ${this.port}` : undefined,
                this.strictHostKeyChecking
                    ? undefined
                    : 'StrictHostKeyChecking no',
                key ? `IdentityFile ${CONF.keyPath + key}` : undefined, // TODO:
            ]
                .filter((s) => s != undefined)
                .map((s) => this._space() + s)
                .join('\n')
        return this.comment ? `# ${this.comment}\n` + info : info
    }
    toJSON(): HostSTO {
        return {
            alias: this.alias,
            host: this.host,
            port: this.port,
            user: this.user,
            strictHostKeyChecking: this.strictHostKeyChecking,
            acceptKeys: this.acceptKeys,
            allowPassword: this.allowPassword,
            groups: this.groups,
            comment: this.comment,
            hide: this.hide
        }
    }
}

class Hosts {
    items: Host[]
    constructor() {
        this.items = []
    }
    load(profile: HostSTO[], ignoreDuplicate: boolean): void {
        for (const h of profile) {
            try {
                this.add(h.alias, h)
            } catch (e) {
                if (e instanceof DuplicateErr) {
                    if (ignoreDuplicate) {
                        continue
                    } else {
                        throw e
                    }
                }
            }
        }
    }
    dump(): HostSTO[] {
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
    out(mochiKey: string[]): string {
        return this.items
            .map((h) => h.toString(mochiKey))
            .filter((h) => typeof h != 'undefined')
            .join('\n\n')
    }
}

export { CONF as config }

export { Host, Hosts }
