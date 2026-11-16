import { describe, expect, it } from 'vitest';
import { createCorsOrigin, matchesOrigin, parseAllowedOrigins } from './cors.js';

describe('parseAllowedOrigins', () => {
  it('usa localhost por defecto', () => {
    expect(parseAllowedOrigins(undefined)).toEqual(['http://localhost:5173']);
  });

  it('separa por comas y descarta vacíos', () => {
    expect(parseAllowedOrigins(' http://a.dev, ,https://b.dev ')).toEqual([
      'http://a.dev',
      'https://b.dev',
    ]);
  });
});

describe('matchesOrigin', () => {
  it('compara orígenes exactos', () => {
    expect(matchesOrigin('https://turbopre.vercel.app', 'https://turbopre.vercel.app')).toBe(true);
    expect(matchesOrigin('https://otro.vercel.app', 'https://turbopre.vercel.app')).toBe(false);
  });

  it('permite cualquier origen con *', () => {
    expect(matchesOrigin('https://cualquier.cosa', '*')).toBe(true);
  });

  it('soporta comodines de subdominio de un nivel', () => {
    const rule = 'https://*.vercel.app';

    expect(matchesOrigin('https://turbopre.vercel.app', rule)).toBe(true);
    expect(matchesOrigin('https://turbopre-git-qa-equipo.vercel.app', rule)).toBe(true);
    expect(matchesOrigin('https://vercel.app', rule)).toBe(false);
    expect(matchesOrigin('https://a.b.vercel.app', rule)).toBe(false);
    expect(matchesOrigin('http://turbopre.vercel.app', rule)).toBe(false);
  });

  it('no interpreta los puntos como comodines', () => {
    expect(matchesOrigin('https://turbopreXvercel.app', 'https://*.vercel.app')).toBe(false);
  });
});

describe('createCorsOrigin', () => {
  it('deja pasar peticiones sin Origin', () => {
    const validator = createCorsOrigin('https://turbopre.vercel.app');
    let allowed: boolean | string | RegExp | Array<string | RegExp> | undefined;

    validator(undefined, (_error, allow) => {
      allowed = allow;
    });

    expect(allowed).toBe(true);
  });

  it('bloquea orígenes no autorizados sin lanzar error', () => {
    const validator = createCorsOrigin('https://turbopre.vercel.app');
    let receivedError: Error | null | undefined;
    let allowed: boolean | string | RegExp | Array<string | RegExp> | undefined;

    validator('https://intruso.dev', (error, allow) => {
      receivedError = error;
      allowed = allow;
    });

    expect(receivedError).toBeNull();
    expect(allowed).toBe(false);
  });
});
