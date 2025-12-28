/**
 * FlexiReact Logger
 * Minimalist, professional output inspired by modern CLIs
 */

// ANSI color codes (Picocolors-like API for internal use if needed, but we prefer external libs)
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',

  // Text colors
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

// Helper to strip colors if needed (not implemented here for simplicity)

// Get current time formatted
function getTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${c.dim}${hours}:${minutes}:${seconds}${c.reset}`;
}

// Status code colors
function getStatusColor(status) {
  if (status >= 500) return c.red;
  if (status >= 400) return c.yellow;
  if (status >= 300) return c.cyan;
  if (status >= 200) return c.green;
  return c.white;
}

// Method colors
function getMethodColor(method) {
  return c.white; // Keep methods neutral for calmness
}

// Format time
function formatTime(ms) {
  if (ms < 1) return `${c.gray}<1ms${c.reset}`;
  if (ms < 100) return `${c.green}${ms}ms${c.reset}`;
  if (ms < 500) return `${c.yellow}${ms}ms${c.reset}`;
  return `${c.red}${ms}ms${c.reset}`;
}

// Minimalist Logo
const LOGO = `
  ${c.white}▲${c.reset} ${c.bold}FlexiReact${c.reset} ${c.dim}4.1.0${c.reset}
`;

export const logger = {
  // Show startup logo
  logo() {
    console.log(LOGO);
    console.log(`${c.dim}  ──────────────────────────────────────────────${c.reset}`);
    console.log('');
  },

  // Server started - Minimalist style
  serverStart(config, startTime = Date.now()) {
    const { port, host, mode, pagesDir } = config;
    const elapsed = Date.now() - startTime;

    // We use console.log directly for better control
    console.log(`  ${c.green}✔${c.reset} ${c.bold}Ready${c.reset} in ${elapsed}ms`);
    console.log('');
    console.log(`  ${c.bold}Local:${c.reset}      ${c.cyan}http://${host}:${port}${c.reset}`);
    console.log(`  ${c.bold}Mode:${c.reset}       ${mode === 'development' ? c.yellow : c.green}${mode}${c.reset}`);
    console.log(`  ${c.bold}Pages:${c.reset}      ${c.dim}${pagesDir}${c.reset}`);
    console.log('');
  },

  // HTTP request log - Compact single line
  request(method: string, path: string, status: number, time: number, extra: { type?: string } = {}) {
    const methodColor = getMethodColor(method);
    const statusColor = getStatusColor(status);
    const timeStr = formatTime(time);

    // Minimalist badges
    let badge = `${c.dim}○${c.reset}`; // Default (static/asset)

    if (extra.type === 'dynamic' || extra.type === 'ssr') {
      badge = `${c.white}ƒ${c.reset}`;
    } else if (extra.type === 'api') {
      badge = `${c.cyan}λ${c.reset}`;
    }

    const statusStr = `${statusColor}${status}${c.reset}`;
    const methodStr = `${methodColor}${method}${c.reset}`;

    // Align: Badge Method Path Status duration
    console.log(`  ${badge} ${methodStr} ${path} ${statusStr} ${c.dim}${timeStr}${c.reset}`);
  },

  // Info message
  info(msg) {
    console.log(`  ${c.cyan}ℹ${c.reset} ${msg}`);
  },

  // Success message
  success(msg) {
    console.log(`  ${c.green}✔${c.reset} ${msg}`);
  },

  // Warning message
  warn(msg) {
    console.log(`  ${c.yellow}⚠${c.reset} ${c.yellow}${msg}${c.reset}`);
  },

  // Error message
  error(msg: string, err: Error | null = null) {
    console.log(`  ${c.red}✖${c.reset} ${c.red}${msg}${c.reset}`);
    if (err && err.stack) {
      console.log('');
      const stack = err.stack.split('\n').slice(1, 4).join('\n');
      console.log(`${c.dim}${stack}${c.reset}`);
      console.log('');
    }
  },

  // Compilation message
  compile(file, time) {
    console.log(`  ${c.white}●${c.reset} Compiling ${c.dim}${file}${c.reset} ${c.dim}(${time}ms)${c.reset}`);
  },

  // Hot reload
  hmr(file) {
    console.log(`  ${c.green}↻${c.reset} Fast Refresh ${c.dim}${file}${c.reset}`);
  },

  // Plugin loaded
  plugin(name) {
    console.log(`  ${c.cyan}◆${c.reset} Plugin ${c.dim}${name}${c.reset}`);
  },

  // Route info
  route(path, type) {
    // Keep it super clean
    const typeLabel = type === 'api' ? 'λ' : type === 'dynamic' ? 'ƒ' : '○';
    const color = type === 'api' ? c.cyan : type === 'dynamic' ? c.white : c.dim;
    console.log(`  ${color}${typeLabel}${c.reset} ${path}`);
  },

  // Divider
  divider() {
    console.log(`${c.dim}  ──────────────────────────────────────────────${c.reset}`);
  },

  // Blank line
  blank() {
    console.log('');
  },

  // Port in use error
  portInUse(port) {
    this.error(`Port ${port} is already in use.`);
    this.blank();
    console.log(`  ${c.dim}Try:${c.reset}`);
    console.log(`  1. Kill the process on port ${port}`);
    console.log(`  2. Use a different port via PORT env var`);
    this.blank();
  },

  // Build info
  build(stats) {
    this.blank();
    console.log(`  ${c.green}✔${c.reset} Build completed`);
    this.blank();
    console.log(`  ${c.dim}Route${c.reset}                               ${c.dim}Size${c.reset}`);
    console.log(`  ${c.dim}──────────────────────────────────────────────${c.reset}`);
    // We expect the caller to list routes individually if needed
    console.log(`  ${c.dim}Total time:${c.reset} ${c.white}${stats.time}ms${c.reset}`);
    this.blank();
  },
};

export default logger;
