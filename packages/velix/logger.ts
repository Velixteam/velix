/**
 * Velix v5 Logger
 * Minimalist, professional output inspired by modern CLIs
 */

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
};

const c = colors;

function getTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${c.dim}${hours}:${minutes}:${seconds}${c.reset}`;
}

function getStatusColor(status: number) {
  if (status >= 500) return c.red;
  if (status >= 400) return c.yellow;
  if (status >= 300) return c.cyan;
  if (status >= 200) return c.green;
  return c.white;
}

function fmtTime(ms: number) {
  if (ms < 1) return `${c.gray}<1ms${c.reset}`;
  if (ms < 100) return `${c.green}${ms}ms${c.reset}`;
  if (ms < 500) return `${c.yellow}${ms}ms${c.reset}`;
  return `${c.red}${ms}ms${c.reset}`;
}

const VERSION = '5.0.4';

const LOGO = `
  ${c.cyan}▲${c.reset} ${c.bold}Velix${c.reset} ${c.dim}v${VERSION}${c.reset}
`;

export const logger = {
  logo() {
    console.log(LOGO);
    console.log(`${c.dim}  ──────────────────────────────────────────────${c.reset}`);
    console.log('');
  },

  serverStart(config: any, startTime = Date.now()) {
    const { port, host, mode, pagesDir } = config;
    const elapsed = Date.now() - startTime;

    console.log(LOGO);
    console.log(`  ${c.green}✔${c.reset} ${c.bold}Ready${c.reset} in ${elapsed}ms`);
    console.log('');
    console.log(`  ${c.bold}Local:${c.reset}      ${c.cyan}http://${host}:${port}${c.reset}`);
    console.log(`  ${c.bold}Mode:${c.reset}       ${mode === 'development' ? c.yellow : c.green}${mode}${c.reset}`);
    if (pagesDir) console.log(`  ${c.bold}App:${c.reset}        ${c.dim}${pagesDir}${c.reset}`);
    console.log('');
  },

  request(method: string, path: string, status: number, time: number, extra: { type?: string } = {}) {
    const statusColor = getStatusColor(status);
    const timeStr = fmtTime(time);

    let badge = `${c.dim}○${c.reset}`;
    if (extra.type === 'dynamic' || extra.type === 'ssr') badge = `${c.white}ƒ${c.reset}`;
    else if (extra.type === 'api') badge = `${c.cyan}λ${c.reset}`;

    const statusStr = `${statusColor}${status}${c.reset}`;
    console.log(`  ${badge} ${c.white}${method}${c.reset} ${path} ${statusStr} ${c.dim}${timeStr}${c.reset}`);
  },

  info(msg: string) { console.log(`  ${c.cyan}ℹ${c.reset} ${msg}`); },
  success(msg: string) { console.log(`  ${c.green}✔${c.reset} ${msg}`); },
  warn(msg: string) { console.log(`  ${c.yellow}⚠${c.reset} ${c.yellow}${msg}${c.reset}`); },

  error(msg: string, err: Error | null = null) {
    console.log(`  ${c.red}✖${c.reset} ${c.red}${msg}${c.reset}`);
    if (err?.stack) {
      console.log('');
      console.log(`${c.dim}${err.stack.split('\n').slice(1, 4).join('\n')}${c.reset}`);
      console.log('');
    }
  },

  compile(file: string, time: number) {
    console.log(`  ${c.white}●${c.reset} Compiling ${c.dim}${file}${c.reset} ${c.dim}(${time}ms)${c.reset}`);
  },

  hmr(file: string) {
    console.log(`  ${c.green}↻${c.reset} Fast Refresh ${c.dim}${file}${c.reset}`);
  },

  plugin(name: string) {
    console.log(`  ${c.cyan}◆${c.reset} Plugin ${c.dim}${name}${c.reset}`);
  },

  route(path: string, type: string) {
    const typeLabel = type === 'api' ? 'λ' : type === 'dynamic' ? 'ƒ' : '○';
    const color = type === 'api' ? c.cyan : type === 'dynamic' ? c.white : c.dim;
    console.log(`  ${color}${typeLabel}${c.reset} ${path}`);
  },

  divider() { console.log(`${c.dim}  ──────────────────────────────────────────────${c.reset}`); },
  blank() { console.log(''); },

  portInUse(port: number | string) {
    this.error(`Port ${port} is already in use.`);
    this.blank();
    console.log(`  ${c.dim}Try:${c.reset}`);
    console.log(`  1. Kill the process on port ${port}`);
    console.log(`  2. Use a different port via PORT env var`);
    this.blank();
  },

  build(stats: { time: number }) {
    this.blank();
    console.log(`  ${c.green}✔${c.reset} Build completed`);
    this.blank();
    console.log(`  ${c.dim}Total time:${c.reset} ${c.white}${stats.time}ms${c.reset}`);
    this.blank();
  },
};

export default logger;
