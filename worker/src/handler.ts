import * as CF from './cf'
import { genToken } from './utils'
import { config as CONF, Hosts } from '../../dist/main'

declare global {
    const KV: CF.KV
}

class STO {
    kv: CF.KV
    constructor(kv: CF.KV) {
        this.kv = kv
    }
    async get(
        key: string,
        type?: 'text',
        init?: string,
        write?: boolean
    ): Promise<string> {
        const val = await this.kv.get(key, type)
        if (val == null) {
            if (write && typeof init != 'undefined') {
                await this.kv.put(key, init)
            }
        }
        return val || init || ''
    }
    async set(key: string, value: string): Promise<void> {
        await this.kv.put(key, value)
    }
}

export async function handleRequest(req: Request): Promise<Response> {
    const sto = new STO(KV)
    const method = req.method
    const panic = async (
        status: number = 400,
        data: Record<string, unknown>
    ): Promise<Response> => {
        return new Response(JSON.stringify(data, null, 4), {
            status: status,
        })
    }
    let res: string = '' // TODO:
    try {
        const _res = {} as Record<string, unknown>
        const url = new URL(req.url)
        const token = await sto.get('SSHCONF_TOKEN', 'text', genToken(6), true)
        const config = JSON.parse(url.searchParams.get('config') || '{}')
        Object.assign(CONF, config)
        _res['config'] = CONF
        const hosts = new Hosts()
        const profile = await sto.get('SSHCONF_PROFILE', 'text', '[]', true)
        hosts.load(JSON.parse(profile), true)
        if (url.searchParams.get('token') != token) {
            return panic(401, { errMsg: 'Unauthorized' })
        }
        if (method == 'GET') {
            const format = url.searchParams.get('format')
            const mochiKey = (url.searchParams.get('keys') || '').split(',')
            if (format == 'file') {
                res = hosts.out(mochiKey)
            }
            _res['data'] = hosts.dump()
        } else {
            const body = await req.json()
            const host = body['host']
            if (method == 'POST') {
                const { alias } = host
                _res['data'] = hosts.add(alias, host).toJSON()
            }
            if (method == 'PATCH') {
                const { alias } = host
                const h = hosts.get(alias)
                _res['data'] = h.update(host).toJSON()
            }
            if (method == 'DELETE') {
                const { alias } = host
                hosts.del(alias)
            }
            await sto.set('SSHCONF_PROFILE', JSON.stringify(hosts.dump()))
        }
        if (!res) {
            res = JSON.stringify(_res, null, 4)
        }
    } catch (e) {
        return panic(400, { errMsg: e.message })
    }
    return new Response(res)
}
