/**
 * User-safe error mapping for the AI assistant stream.
 * Internal failures (provider errors, stack traces, secrets) must never reach
 * the client, so every error collapses to one fixed Spanish message.
 */

/** Fixed message shown to the client when the assistant stream fails. */
export const ASSISTANT_ERROR_MESSAGE =
  'Ocurrió un error procesando tu consulta. Intentá de nuevo.';

/**
 * Maps any stream error to the fixed user-safe message. The raw error is never
 * returned; callers should log it server-side for diagnostics.
 */
export function assistantErrorMessage(_error: unknown): string {
  return ASSISTANT_ERROR_MESSAGE;
}
