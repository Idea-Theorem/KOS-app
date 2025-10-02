/**
 * (C) Copyright 2025, Kondra, All rights reserved.
 */

import { KosLog } from '@kosdev-code/kos-ui-sdk';
import { updateColor } from './services';

/**
 * Removes the alpha channel from a hex color string
 * @param hex - Hex color string (with or without alpha channel)
 * @returns Hex color string without alpha channel
 */
function stripAlpha(hex: string): string {
  // Remove the alpha channel (if present)
  const cleanedHex = hex.length === 9 ? hex.slice(0, 7) : hex;
  return cleanedHex;
}

/**
 * Validates and cleans a hex color string
 * @param hex - Hex color string to clean
 * @param cleanAlpha - Whether to remove alpha channel
 * @returns Clean hex string without '#' prefix, or 'FFFFFF' if invalid
 */
function cleanHex(hex: string, cleanAlpha: boolean): string {
  // Remove the alpha channel (if present)
  const cleanedHex = cleanAlpha ? stripAlpha(hex) : hex;

  // Check if the hex is valid
  if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(cleanedHex)) {
    KosLog.error(`Invalid hex color provided ${cleanedHex}.  Returning white.`);
    return '#FFFFFF'.slice(1);
  }

  return cleanedHex.slice(1);
}

/**
 * Converts hex color to RGB format
 * @param hex - Hex color string
 * @param strip - Whether to remove alpha channel before conversion
 * @returns RGB color string in format 'rgb(r, g, b)'
 */
function hexToRGB(hex: string, strip: boolean): string {
  // Remove the alpha channel (if present)
  const cleanedHex = strip ? stripAlpha(hex) : hex;

  // Parse the R, G, and B components
  const r = parseInt(cleanedHex.slice(1, 3), 16);
  const g = parseInt(cleanedHex.slice(3, 5), 16);
  const b = parseInt(cleanedHex.slice(5, 7), 16);

  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Configuration options for LED initialization
 */
interface LedOptions {
  /** Hex color code for the LED (with or without '#' prefix) */
  color: string;
  /** LED mode (e.g., 'solid', 'blink', 'fade') */
  mode: string;
}

/**
 * LED controller class for managing device LED status indicators.
 * 
 * This class handles LED color changes and communicates with the physical
 * LED hardware through the LED service. It automatically validates and
 * cleans color values before sending them to the device.
 * 
 * @example
 * ```typescript
 * const led = new Led({ color: '#FF0000', mode: 'solid' });
 * await led.activate(); // Sets LED to red
 * ```
 */
export class Led {
  /** Current LED color (hex format) */
  color: string;
  /** Current LED mode */
  mode: string;
  
  /**
   * Creates a new LED controller instance
   * @param options - LED configuration options
   */
  constructor({ color, mode }: LedOptions) {
    this.color = color;
    this.mode = mode;
  }

  /**
   * Activates the LED with the current color and mode.
   * 
   * Validates and cleans the hex color, then sends the color update
   * command to the physical LED device. The color is automatically
   * stripped of any alpha channel before transmission.
   * 
   * @throws {FetchError} When LED service communication fails
   * 
   * @example
   * ```typescript
   * const led = new Led({ color: '#00FF00', mode: 'solid' });
   * await led.activate(); // LED turns green
   * ```
   */
  async activate() {
    KosLog.info(`Activating LED - Color: ${this.color}, Mode: ${this.mode}`);

    // Clean the hex color by removing the alpha channel
    const cleanedHex = cleanHex(this.color, true);

    await updateColor(cleanedHex);
  }
}
