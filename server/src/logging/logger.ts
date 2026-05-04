export const logger = {
  info(message: string) {
    console.info(message);
  },
  error(message: string, error: unknown) {
    console.error(message, sanitizeError(error));
  },
};

function sanitizeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'unknown_error';
}
