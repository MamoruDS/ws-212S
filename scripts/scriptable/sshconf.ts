const CONF = {
    token: '',
    blink: '',
    keys: [''],
    format: 'file',
    config: {
        keyPath: '',
    },
} as {
    token: string
    blink: string
    keys: string[]
    format: 'file'
    config: Partial<{
        defaultUser: string
        defaultPort: number
        keyPath: string
    }>
}

const cmd = (cmd: string): void => {
    log('\n> run cmd in blink:\n\t' + cmd)
    Safari.open(
        `blinkshell://run?key=${CONF.blink}&cmd=${encodeURIComponent(cmd)}`
    )
}

class Fs {
    _fs
    root
    constructor() {
        this._fs = FileManager.local()
        this.root = this._fs.libraryDirectory() + '/Caches'
    }
    write(path: string, content: string) {
        this._fs.writeString(this.root + '/' + path, content)
    }
    read(path: string, init = null) {
        let res = this._fs.readString(this.root + '/' + path)
        if (res == null) {
            return init
        } else {
            return res
        }
    }
}

const run = async (forceUpdate = false) => {
    if (!forceUpdate) cmd('echo started from scriptable')
    const fs = new Fs()
    const profile = JSON.parse(
        fs.read('sshconf', '{"lastUpdate":0, "hosts":[]}')
    )
    if (Date.now() - (profile.lastUpdate || 0) > 604800000 || forceUpdate) {
        profile.hosts = []
        log('profile expired, fetching workers...')
        let uri = `https://sshconf.mamoru.workers.dev/?token=${
            CONF.token
        }&keys=${CONF.keys.join(',')}&format=${CONF.format}${
            Object.keys(CONF.config)
                ? `&config=${encodeURIComponent(JSON.stringify(CONF.config))}`
                : ''
        }`
        cmd(`curl "${uri}" > .ssh/config`)
        const req = new Request(uri)
        const res = await req.loadString()

        const re = /Host\s(?<host>[\w|\.|-|_]+)/gm
        while (true) {
            const mat = re.exec(res)
            if (mat == null) break
            profile.hosts.push(mat.groups['host'])
        }

        profile.lastUpdate = Date.now()
        fs.write('sshconf', JSON.stringify(profile, null, 4))
    } else {
        log('using local profile:' + fs.root + '/sshconf')
    }

    const hosts = []
    profile.hosts.forEach((h) => {
        hosts.push(h)
    })

    const table = new UITable()
    if (!forceUpdate) {
        const update = new UITableRow()
        update.addText('force update profile from workers')
        update.onSelect = () => {
            run(true)
        }
        table.addRow(update)
    }
    for (const h of hosts) {
        const host = new UITableRow()
        host.addText(h)
        host.onSelect = () => {
            cmd(`ssh ${h}`)
        }
        table.addRow(host)
    }

    table.present()
}

run()
