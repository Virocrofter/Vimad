/* apps/web/src/lib/diagnostics.ts — Support & diagnostics helpers.
 * Ring-buffers the last 100 console entries so "Copy logs" can attach real
 * client-side logs to a support bundle. Capture installs once per app load;
 * entries before first Settings visit are not buffered (documented on page).
 */
export interface LogEntry {
  ts: string;
  level: 'error' | 'warn' | 'info';
  message: string;
}

const MAX_ENTRIES = 100;
const buffer: LogEntry[] = [];
let installed = false;

function stringify(args: unknown[]): string {
  return args
    .map((a) => {
      if (a instanceof Error) return `${a.name}: ${a.message}`;
      if (typeof a === 'string') return a;
      try {
        return JSON.stringify(a);
      } catch {
        return String(a);
      }
    })
    .join(' ');
}

function wrap(level: LogEntry['level']) {
  const orig = console[level].bind(console);
  console[level] = (...args: unknown[]) => {
    buffer.push({ ts: new Date().toISOString(), level, message: stringify(args) });
    if (buffer.length > MAX_ENTRIES) buffer.splice(0, buffer.length - MAX_ENTRIES);
    orig(...args);
  };
}

export function ensureLogCapture(): void {
  if (installed) return;
  installed = true;
  wrap('error');
  wrap('warn');
  wrap('info');
}

export function getBufferedLogs(): LogEntry[] {
  return buffer.slice();
}

export function buildDiagnosticsBundle(extra: Record<string, unknown>): string {
  return JSON.stringify({ ...extra, clientLogs: getBufferedLogs() }, null, 2);
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const okCopied = document.execCommand('copy');
      document.body.removeChild(ta);
      return okCopied;
    } catch {
      return false;
    }
  }
}
