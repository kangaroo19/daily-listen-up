import test from 'node:test';
import assert from 'node:assert/strict';
import { readTossMtlsConfigFromEnv } from '../services/tossMtlsConfig.js';

test('keeps local mTLS file path configuration when paths are provided', () => {
  const config = readTossMtlsConfigFromEnv({
    TOSS_MTLS_CERT_PATH: './local-cert.pem',
    TOSS_MTLS_KEY_PATH: './local-key.pem',
    TOSS_MTLS_CERT: 'release-cert',
    TOSS_MTLS_KEY: 'release-key',
  });

  assert.deepEqual(config, {
    certPath: './local-cert.pem',
    keyPath: './local-key.pem',
  });
});

test('reads release mTLS certificate and key from secret environment values', () => {
  const config = readTossMtlsConfigFromEnv({
    TOSS_MTLS_CERT: '-----BEGIN CERTIFICATE-----\nrelease-cert\n-----END CERTIFICATE-----',
    TOSS_MTLS_KEY: '-----BEGIN PRIVATE KEY-----\nrelease-key\n-----END PRIVATE KEY-----',
  });

  assert.deepEqual(config, {
    cert: '-----BEGIN CERTIFICATE-----\nrelease-cert\n-----END CERTIFICATE-----',
    key: '-----BEGIN PRIVATE KEY-----\nrelease-key\n-----END PRIVATE KEY-----',
  });
});

test('normalizes escaped newlines in release mTLS secret values', () => {
  const config = readTossMtlsConfigFromEnv({
    TOSS_MTLS_CERT: '-----BEGIN CERTIFICATE-----\\nrelease-cert\\n-----END CERTIFICATE-----\\n',
    TOSS_MTLS_KEY: '-----BEGIN PRIVATE KEY-----\\nrelease-key\\n-----END PRIVATE KEY-----\\n',
  });

  assert.deepEqual(config, {
    cert: '-----BEGIN CERTIFICATE-----\nrelease-cert\n-----END CERTIFICATE-----',
    key: '-----BEGIN PRIVATE KEY-----\nrelease-key\n-----END PRIVATE KEY-----',
  });
});

test('normalizes quoted escaped CRLF release mTLS secret values', () => {
  const config = readTossMtlsConfigFromEnv({
    TOSS_MTLS_CERT: '"-----BEGIN CERTIFICATE-----\\r\\nrelease-cert\\r\\n-----END CERTIFICATE-----\\r\\n"',
    TOSS_MTLS_KEY: '"-----BEGIN PRIVATE KEY-----\\r\\nrelease-key\\r\\n-----END PRIVATE KEY-----\\r\\n"',
  });

  assert.deepEqual(config, {
    cert: '-----BEGIN CERTIFICATE-----\nrelease-cert\n-----END CERTIFICATE-----',
    key: '-----BEGIN PRIVATE KEY-----\nrelease-key\n-----END PRIVATE KEY-----',
  });
});

test('does not enable mTLS unless both certificate and key are available', () => {
  assert.equal(
    readTossMtlsConfigFromEnv({
      TOSS_MTLS_CERT: 'release-cert',
    }),
    undefined,
  );
  assert.equal(
    readTossMtlsConfigFromEnv({
      TOSS_MTLS_KEY: 'release-key',
    }),
    undefined,
  );
});
