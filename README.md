# ws-212S

```javascript
// hosts.js
const sshconf = require('./dist/main')

sshconf.config.defaultUser = 'uname'
sshconf.config.allowPassword = false

const hosts = new sshconf.Hosts()

hosts.add('VPS', {
    host: 'server.your.hostname',
    user: 'remote',
    acceptKeys: ['id_rsa'],
    allowPassword: false,
    strictHostKeyChecking: false,
    comment: 'vps @server.your.hostname',
})

hosts.add('PI', {
    host: '10.0.1.1',
    allowPassword: false,
    strictHostKeyChecking: false,
    comment: 'raspberry pi',
})

console.log(JSON.stringify(hosts.dump()))
```

```
node hosts.js > hosts.json
```
