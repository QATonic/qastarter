import { lookup } from 'node:dns';
import { request } from 'node:https';
import { BlockList, isIP, type LookupFunction } from 'node:net';

export const MAX_SPEC_BYTES = 5 * 1024 * 1024;

const privateIPv4 = new BlockList();
for (const [address, prefix] of [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.88.99.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
] as const)
  privateIPv4.addSubnet(address, prefix, 'ipv4');

const globalIPv6 = new BlockList();
globalIPv6.addSubnet('2000::', 3, 'ipv6');
const reservedIPv6 = new BlockList();
reservedIPv6.addSubnet('2001::', 23, 'ipv6');
reservedIPv6.addSubnet('2001:db8::', 32, 'ipv6');
reservedIPv6.addSubnet('2002::', 16, 'ipv6');

export function isPublicAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) return !privateIPv4.check(address, 'ipv4');
  // Restrict IPv6 to global unicast. This also excludes IPv4-mapped loopback,
  // local, link-local and transition addresses, regardless of textual spelling.
  return family === 6 && globalIPv6.check(address, 'ipv6') && !reservedIPv6.check(address, 'ipv6');
}

export function isOpenApiUrlSafe(value: string): boolean {
  try {
    const url = new URL(value);
    const host = url.hostname
      .replace(/^\[|\]$/g, '')
      .toLowerCase()
      .replace(/\.$/, '');
    return (
      url.protocol === 'https:' &&
      !url.username &&
      !url.password &&
      host !== 'localhost' &&
      !host.endsWith('.localhost') &&
      !host.endsWith('.local') &&
      !host.endsWith('.internal') &&
      (!isIP(host) || isPublicAddress(host))
    );
  } catch {
    return false;
  }
}

// Check the actual addresses used to open the socket, rather than doing a
// separate DNS preflight followed by a second, potentially different lookup.
export const publicLookup: LookupFunction = (hostname, options, callback) => {
  lookup(hostname, { all: true, verbatim: true }, (error, addresses) => {
    if (error) return callback(error, '');
    if (!addresses.length || addresses.some(({ address }) => !isPublicAddress(address))) {
      return callback(new Error('OpenAPI hostname resolves to a non-public address'), '');
    }
    if (options.all) callback(null, addresses);
    else callback(null, addresses[0].address, addresses[0].family);
  });
};

/** Download a standalone spec. Redirects are deliberately not followed. */
export function fetchOpenApiSpec(value: string, timeoutMs = 10_000): Promise<string> {
  if (!isOpenApiUrlSafe(value)) return Promise.reject(new Error('Unsafe OpenAPI URL'));

  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error?: Error, text?: string) => {
      if (settled) return;
      settled = true;
      clearTimeout(deadline);
      if (error) reject(error);
      else resolve(text!);
    };
    const req = request(
      value,
      {
        lookup: publicLookup,
        agent: false,
        headers: {
          Accept: 'application/json, application/yaml, text/yaml',
          'Accept-Encoding': 'identity',
        },
      },
      (response) => {
        const fail = (error: Error) => {
          finish(error);
          response.destroy();
          req.destroy();
        };
        if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
          return fail(new Error(`OpenAPI download returned HTTP ${response.statusCode}`));
        }
        if (
          response.headers['content-encoding'] &&
          response.headers['content-encoding'] !== 'identity'
        ) {
          return fail(new Error('Compressed OpenAPI responses are not supported'));
        }
        if (Number(response.headers['content-length']) > MAX_SPEC_BYTES) {
          return fail(new Error('OpenAPI spec exceeds 5 MB'));
        }
        const chunks: Buffer[] = [];
        let size = 0;
        response.on('data', (chunk: Buffer) => {
          size += chunk.length;
          if (size > MAX_SPEC_BYTES) return fail(new Error('OpenAPI spec exceeds 5 MB'));
          chunks.push(chunk);
        });
        response.on('end', () => finish(undefined, Buffer.concat(chunks).toString('utf8')));
        response.on('error', (error) => finish(error));
        response.on('aborted', () => finish(new Error('OpenAPI response aborted')));
      }
    );
    // A wall-clock deadline covers DNS, TLS, headers and the complete body,
    // including a server which sends headers then stalls indefinitely.
    const deadline = setTimeout(() => {
      const error = new Error('OpenAPI download timed out');
      finish(error);
      req.destroy(error);
    }, timeoutMs);
    req.on('error', (error) => finish(error));
    req.end();
  });
}
