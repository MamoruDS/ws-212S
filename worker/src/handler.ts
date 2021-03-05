import * as CF from './cf'
import { genToken } from './utils'
import { config, Hosts } from '../../dist/main'

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
    let res: string = ''
    try {
        const _res = {} as Record<string, unknown>
        const body = await req.json()
        const token = await sto.get('SSHCONF_TOKEN', 'text', genToken(6), true)
        if (body['token'] != token) {
            panic(401, _res)
        }
        const mochiKey = body['key']
        const hosts = new Hosts()
        const profile = await sto.get('SSHCONF_PROFILE', 'text', '[]', true)
        hosts.load(JSON.parse(profile), true)
        if (method == 'POST') {
            _res['data'] = hosts.out(mochiKey)
        } else {
            const host = body['host']
            if (method == 'PUT') {
                const { alias } = host
                _res['data'] = hosts.add(alias, host).toString(mochiKey)
            }
            if (method == 'PATCH') {
                const { alias } = host
                const h = hosts.get(alias)
                _res['data'] = h.update(host)
            }
            if (method == 'DELETE') {
                const { alias } = host
                hosts.del(alias)
            }
            await sto.set('SSHCONF_PROFILE', JSON.stringify(hosts.dump()))
        }
        const t = body['type']
        if (t == 'file' && method == 'POST') {
            res = hosts.out(mochiKey)
        } else {
            res = JSON.stringify(_res, null, 4)
        }
    } catch (e) {
        panic(400, { errMsg: e.message })
    }
    return new Response(res)
}
