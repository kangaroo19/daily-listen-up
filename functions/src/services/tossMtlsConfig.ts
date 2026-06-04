import { readFileSync } from 'node:fs';

export type TossMtlsConfig =
  | {
      certPath: string;
      keyPath: string;
    }
  | {
      cert: string;
      key: string;
    };

type TossMtlsEnv = Partial<Record<'TOSS_MTLS_CERT_PATH' | 'TOSS_MTLS_KEY_PATH' | 'TOSS_MTLS_CERT' | 'TOSS_MTLS_KEY', string>>;

export function readTossMtlsConfigFromEnv(env: TossMtlsEnv = process.env): TossMtlsConfig | undefined {
  const certPath = readNonEmptyEnv(env.TOSS_MTLS_CERT_PATH);
  const keyPath = readNonEmptyEnv(env.TOSS_MTLS_KEY_PATH);

  if (certPath != null && keyPath != null) {
    return {
      certPath,
      keyPath,
    };
  }

  const cert = readNonEmptyEnv(env.TOSS_MTLS_CERT);
  const key = readNonEmptyEnv(env.TOSS_MTLS_KEY);

  if (cert == null || key == null) {
    return undefined;
  }

  return {
    cert: normalizePemSecret(cert),
    key: normalizePemSecret(key),
  };
}

export function hasTossMtlsConfig(env: TossMtlsEnv = process.env): boolean {
  return readTossMtlsConfigFromEnv(env) != null;
}

export function getTossMtlsRequestOptions(mtlsConfig: TossMtlsConfig): { cert: Buffer | string; key: Buffer | string } {
  if ('certPath' in mtlsConfig) {
    return {
      cert: readFileSync(mtlsConfig.certPath),
      key: readFileSync(mtlsConfig.keyPath),
    };
  }

  return {
    cert: mtlsConfig.cert,
    key: mtlsConfig.key,
  };
}

function readNonEmptyEnv(value: string | undefined): string | undefined {
  return value == null || value === '' ? undefined : value;
}

function normalizePemSecret(value: string): string {
  const trimmed = value.trim();
  const unquoted =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))
      ? trimmed.slice(1, -1)
      : trimmed;

  return unquoted
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();
}
