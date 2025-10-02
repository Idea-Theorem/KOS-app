/**
 * (C) Copyright 2025, Kondra, All rights reserved.
 */

import {
  FetchError,
  KosLog,
  ServiceFactory,
  resolveServiceUrl,
} from '@kosdev-code/kos-ui-sdk';
const { URL } = resolveServiceUrl('RACK_SERVICE');
const { postModel } = ServiceFactory.build({
  basePath: `${URL}/api/system/leds`,
});

const log = KosLog.createLogger({ name: 'led-service', group: 'Services' });

/**
 * Updates the LED color on the physical device.
 * 
 * Sends a POST request to the LED service to change the color of the
 * device's LED indicator. The color should be provided as a hex string
 * without the '#' prefix (e.g., 'FF0000' for red).
 * 
 * @param color - Hex color code without '#' prefix (e.g., 'FF0000')
 * @returns Promise resolving to the service response
 * @throws {FetchError} When the service request fails or returns non-200 status
 * 
 * @example
 * ```typescript
 * // Set LED to red
 * await updateColor('FF0000');
 * 
 * // Set LED to blue
 * await updateColor('0000FF');
 * ```
 */
export const updateColor = async (color: string) => {
  log.debug(`sending POST to update LED color to ${color}`);
  const response = await postModel<any>({
    model: {},
    urlOverride: `${URL}/api/system/leds/${color}`,
  });
  if (response?.status !== 200) {
    throw new FetchError('Failed to update LED color');
  }
  return response;
};
