const LOCAL_ORIGIN = 'http://localhost:5173';

export type CorsCallback = (
  error: Error | null,
  allow?: boolean | string | RegExp | Array<string | RegExp>,
) => void;

export type CorsOriginValidator = (origin: string | undefined, callback: CorsCallback) => void;

/**
 * Lee `CORS_ORIGIN` como lista separada por comas.
 *
 * Reglas soportadas:
 * - `*` permite cualquier origen.
 * - `https://*.vercel.app` permite cualquier subdominio de un nivel.
 * - Cualquier otro valor se compara de forma exacta.
 */
export function parseAllowedOrigins(raw: string | undefined): string[] {
  return (raw ?? LOCAL_ORIGIN)
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
}

export function matchesOrigin(origin: string, rule: string): boolean {
  if (rule === '*') {
    return true;
  }

  if (!rule.includes('*')) {
    return rule === origin;
  }

  const pattern = new RegExp(`^${rule.split('*').map(escapeRegExp).join('[^./]+')}$`);
  return pattern.test(origin);
}

export function createCorsOrigin(raw: string | undefined): CorsOriginValidator {
  const rules = parseAllowedOrigins(raw);

  return (origin, callback) => {
    // Peticiones sin cabecera Origin (curl, health checks, server-to-server).
    if (!origin) {
      callback(null, true);
      return;
    }

    callback(
      null,
      rules.some((rule) => matchesOrigin(origin, rule)),
    );
  };
}
