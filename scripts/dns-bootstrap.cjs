const dns = require('node:dns');

// Some Windows networks return malformed SRV responses through their DHCP DNS
// resolver. Configure public resolvers before Next.js starts or creates workers.
if (process.platform === 'win32') {
  dns.setServers(['1.1.1.1', '8.8.8.8']);
}
