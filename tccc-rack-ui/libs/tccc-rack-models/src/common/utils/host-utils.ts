/**
 * (C) Copyright 2025, Kondra, All rights reserved.
 */

import { getQueryParams } from '@kosdev-code/kos-ui-sdk';

/**
 * Determines the appropriate hostname for API requests.
 * 
 * First checks for a 'host' query parameter in the current URL.
 * If found and valid, extracts the hostname from that URL.
 * Otherwise, falls back to the current window's hostname.
 * 
 * This allows for flexible configuration during development and
 * deployment scenarios where the API host may differ from the
 * application host.
 * 
 * @returns The hostname to use for API requests
 * 
 * @example
 * ```typescript
 * // Current page: http://localhost:4200?host=http://192.168.1.100:8080
 * const host = getDefaultHost(); // Returns '192.168.1.100'
 * 
 * // Current page: http://localhost:4200 (no host param)
 * const host = getDefaultHost(); // Returns 'localhost'
 * ```
 */
export const getDefaultHost = () => {
  const defaultHost = window.location.hostname;

  const params = getQueryParams();
  const hostUrl = (params as any)?.host;
  let host;
  try {
    const _url = new URL(hostUrl);
    host = _url.hostname;
  } catch {
    // ignore errors
  }

  const result = host ?? defaultHost;
  return result;
};

/**
 * Determines the appropriate port for API requests.
 * 
 * First checks for a 'host' query parameter in the current URL.
 * If found and valid, extracts the port from that URL.
 * Otherwise, falls back to the current window's port.
 * 
 * This complements getDefaultHost() to provide complete host:port
 * configuration for API endpoints.
 * 
 * @returns The port to use for API requests
 * 
 * @example
 * ```typescript
 * // Current page: http://localhost:4200?host=http://192.168.1.100:8080
 * const port = getDefaultPort(); // Returns '8080'
 * 
 * // Current page: http://localhost:4200 (no host param)
 * const port = getDefaultPort(); // Returns '4200'
 * ```
 */
export const getDefaultPort = () => {
  const defaultPort = window.location.port;

  const params = getQueryParams();
  const hostUrl = (params as any)?.host;
  let port;
  try {
    const _url = new URL(hostUrl);
    port = _url.port;
  } catch {
    // ignore errors
  }

  const result = port ?? defaultPort;
  return result;
};

/** The resolved hostname for API requests */
export const HOST = getDefaultHost();

/** The resolved port for API requests */
export const PORT = getDefaultPort();
