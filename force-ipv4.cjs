// Force IPv4 in Node's undici fetch to fix IPv6 timeout issues with Cloudflare
try {
  const { Agent, setGlobalDispatcher } = require('undici');
  const dns = require('dns');

  setGlobalDispatcher(new Agent({
    connect: {
      lookup: (hostname, options, callback) => {
        dns.lookup(hostname, options, (err, address, family) => {
          if (options && options.all && Array.isArray(address)) {
            const v4 = address.filter(a => a.family === 4);
            return callback(err, v4.length ? v4 : address);
          }
          callback(err, address, family);
        });
      }
    }
  }));
} catch (e) {
  // Ignore if undici is not found
}
