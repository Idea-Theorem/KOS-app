/**
 * (C) Copyright 2025, Kondra, All rights reserved.
 */

/**
 * Converts a time string to total seconds since midnight.
 * 
 * Parses a time string in HH:MM:SS format and converts it to the
 * total number of seconds elapsed since midnight (00:00:00).
 * This is commonly used for schedule calculations where times
 * need to be compared numerically.
 * 
 * @param timeStr - Time string in HH:MM:SS format (e.g., "14:30:15")
 * @returns Total seconds since midnight (0-86399)
 * 
 * @example
 * ```typescript
 * const morningSeconds = timeToSeconds("09:30:00"); // Returns 34200
 * const eveningSeconds = timeToSeconds("17:45:30"); // Returns 63930
 * const midnightSeconds = timeToSeconds("00:00:00"); // Returns 0
 * const endOfDaySeconds = timeToSeconds("23:59:59"); // Returns 86399
 * ```
 */
export function timeToSeconds(timeStr: string): number {
  const [hours, minutes, seconds] = timeStr.split(':').map(Number);
  return hours * 3600 + minutes * 60 + seconds;
}
