/**
 * Service addresses for this app, read once at startup.
 *
 * Values come from /config.js, which the container writes when it starts
 * (see nginx.conf.template), then build-time env vars, then production
 * defaults. One image therefore serves production and staging; an image run
 * with no configuration behaves exactly as production.
 */
import { getServiceConfig } from '@cloistr/collab-common/config'

export const serviceConfig = getServiceConfig()

/**
 * Host whose /.well-known/nostr.json the Lookup page queries for Cloistr names.
 *
 * Production keeps the bare cloistr.xyz namespace. Any other environment
 * queries its own identity host (this app's own URL), so a staging lookup
 * never reaches production.
 */
export function cloistrNip05Host(): string {
  if (serviceConfig.environment !== 'production' && serviceConfig.appUrl) {
    try {
      return new URL(serviceConfig.appUrl).host
    } catch {
      // A malformed appUrl is already reported by the config reader.
    }
  }
  return 'cloistr.xyz'
}
