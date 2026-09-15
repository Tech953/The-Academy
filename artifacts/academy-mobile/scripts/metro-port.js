const net = require("net");

const DEFAULT_METRO_PORT = 8081;
const MAX_PORT_SEARCH = 20;

function getConfiguredMetroPort(env = process.env) {
  const value = env.EXPO_METRO_PORT || env.METRO_PORT;
  const port = Number(value || DEFAULT_METRO_PORT);

  if (!Number.isInteger(port) || port < 1024 || port > 65535) {
    throw new Error(
      `Invalid Metro port "${value}". Set EXPO_METRO_PORT or METRO_PORT to an integer between 1024 and 65535.`,
    );
  }

  return port;
}

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, "127.0.0.1");
  });
}

async function findAvailableMetroPort(
  preferredPort,
  { isAvailable = isPortAvailable, maxSearch = MAX_PORT_SEARCH } = {},
) {
  for (let offset = 0; offset < maxSearch; offset += 1) {
    const candidate = preferredPort + offset;
    if (candidate > 65535) break;

    if (await isAvailable(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    `Could not find an available Metro port from ${preferredPort} through ${preferredPort + maxSearch - 1}. ` +
      "Set EXPO_METRO_PORT or METRO_PORT to choose another range.",
  );
}

function createMetroRequestUrl(port, pathname, query = {}) {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const url = new URL(`http://localhost:${port}${normalizedPath}`);

  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, String(value));
  }

  return url.toString();
}

module.exports = {
  DEFAULT_METRO_PORT,
  MAX_PORT_SEARCH,
  createMetroRequestUrl,
  findAvailableMetroPort,
  getConfiguredMetroPort,
  isPortAvailable,
};