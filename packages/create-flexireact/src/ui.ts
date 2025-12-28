/**
 * UI Components for create-flexireact CLI
 */

export const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',

  // Neon Emerald theme
  primary: '\x1b[38;2;0;255;156m',
  green: '\x1b[38;2;0;255;156m',
  cyan: '\x1b[38;2;0;200;200m',
  red: '\x1b[38;2;255;100;100m',
  yellow: '\x1b[38;2;255;200;100m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
};

const c = colors;

export const BANNER = `
${c.primary}╔═══════════════════════════════════════════════════════════════╗${c.reset}
${c.primary}║${c.reset}                                                               ${c.primary}║${c.reset}
${c.primary}║${c.reset}   ${c.primary}███████╗${c.reset}${c.cyan}██╗     ${c.reset}${c.primary}███████╗${c.reset}${c.cyan}██╗  ██╗${c.reset}${c.primary}██╗${c.reset}                      ${c.primary}║${c.reset}
${c.primary}║${c.reset}   ${c.primary}██╔════╝${c.reset}${c.cyan}██║     ${c.reset}${c.primary}██╔════╝${c.reset}${c.cyan}╚██╗██╔╝${c.reset}${c.primary}██║${c.reset}                      ${c.primary}║${c.reset}
${c.primary}║${c.reset}   ${c.primary}█████╗  ${c.reset}${c.cyan}██║     ${c.reset}${c.primary}█████╗  ${c.reset}${c.cyan} ╚███╔╝ ${c.reset}${c.primary}██║${c.reset}                      ${c.primary}║${c.reset}
${c.primary}║${c.reset}   ${c.primary}██╔══╝  ${c.reset}${c.cyan}██║     ${c.reset}${c.primary}██╔══╝  ${c.reset}${c.cyan} ██╔██╗ ${c.reset}${c.primary}██║${c.reset}                      ${c.primary}║${c.reset}
${c.primary}║${c.reset}   ${c.primary}██║     ${c.reset}${c.cyan}███████╗${c.reset}${c.primary}███████╗${c.reset}${c.cyan}██╔╝ ██╗${c.reset}${c.primary}██║${c.reset}                      ${c.primary}║${c.reset}
${c.primary}║${c.reset}   ${c.primary}╚═╝     ${c.reset}${c.cyan}╚══════╝${c.reset}${c.primary}╚══════╝${c.reset}${c.cyan}╚═╝  ╚═╝${c.reset}${c.primary}╚═╝${c.reset}  ${c.dim}React Framework${c.reset}   ${c.primary}║${c.reset}
${c.primary}║${c.reset}                                                               ${c.primary}║${c.reset}
${c.primary}║${c.reset}   ${c.dim}v4.1.0${c.reset}  ${c.primary}⚡${c.reset} ${c.white}The Modern React Framework${c.reset}                      ${c.primary}║${c.reset}
${c.primary}║${c.reset}                                                               ${c.primary}║${c.reset}
${c.primary}╚═══════════════════════════════════════════════════════════════╝${c.reset}
`;

export const SUCCESS_BANNER = (projectName: string): string => `
${c.primary}╔═══════════════════════════════════════════════════════════════╗${c.reset}
${c.primary}║${c.reset}                                                               ${c.primary}║${c.reset}
${c.primary}║${c.reset}   ${c.green}✓${c.reset} ${c.bold}Project created successfully!${c.reset}                           ${c.primary}║${c.reset}
${c.primary}║${c.reset}                                                               ${c.primary}║${c.reset}
${c.primary}║${c.reset}   ${c.dim}Next steps:${c.reset}                                                ${c.primary}║${c.reset}
${c.primary}║${c.reset}                                                               ${c.primary}║${c.reset}
${c.primary}║${c.reset}   ${c.cyan}cd${c.reset} ${projectName.padEnd(52)}${c.primary}║${c.reset}
${c.primary}║${c.reset}   ${c.cyan}npm install${c.reset}                                                ${c.primary}║${c.reset}
${c.primary}║${c.reset}   ${c.cyan}npm run dev${c.reset}                                                ${c.primary}║${c.reset}
${c.primary}║${c.reset}                                                               ${c.primary}║${c.reset}
${c.primary}║${c.reset}   ${c.dim}Then open${c.reset} ${c.primary}http://localhost:3000${c.reset}                          ${c.primary}║${c.reset}
${c.primary}║${c.reset}                                                               ${c.primary}║${c.reset}
${c.primary}╚═══════════════════════════════════════════════════════════════╝${c.reset}
`;
