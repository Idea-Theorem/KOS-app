/**
 * (C) Copyright 2025, Kondra, All rights reserved.
 */

/**
 * Represents a single day's schedule configuration.
 * 
 * Defines whether content should be active during a specific time range
 * on a particular day of the week. Times are stored as seconds from
 * midnight (0-86399).
 */
export class ScheduleItem {
  /** Whether this schedule is active for the day */
  isActive: boolean;
  /** Start time in seconds from midnight */
  startTime: number;
  /** End time in seconds from midnight */
  endTime: number;
  
  /**
   * Creates a new schedule item for a day
   * @param isActive - Whether content is active during this period
   * @param startTime - Start time in seconds from midnight (0-86399)
   * @param endTime - End time in seconds from midnight (0-86399)
   */
  constructor(isActive: boolean, startTime: number, endTime: number) {
    this.isActive = isActive;
    this.startTime = startTime;
    this.endTime = endTime;
  }
}

/**
 * Weekly schedule manager for content display.
 * 
 * Manages a 7-day weekly schedule where each day can have its own
 * active time range. Days are numbered 1-7 corresponding to Sunday-Saturday
 * following JavaScript's Date.getDay() convention.
 * 
 * @example
 * ```typescript
 * const schedule = new ScreenSchedule();
 * // Set Monday (1) to be active from 9 AM to 5 PM
 * schedule.updateSchedule(1, true, 32400, 61200); // 9*3600, 17*3600
 * const isActive = schedule.isActive(); // Check if content should display now
 * ```
 */
export class ScreenSchedule {
  /** Schedule configuration for each day (1=Sunday, 7=Saturday) */
  schedule: Record<number, ScheduleItem> = {};
  
  /**
   * Creates a new weekly schedule with all days initially inactive
   */
  constructor() {
    // map with keys from 1 to 7 for each day of the week
    for (let i = 1; i <= 7; i++) {
      this.schedule[i] = new ScheduleItem(false, 0, 0);
    }
  }

  /**
   * Determines if content should be active based on current day and time.
   * 
   * Checks the current day of the week and time against the configured
   * schedule. If no schedule is configured for the current day, defaults
   * to active (true).
   * 
   * @returns true if content should be displayed now, false otherwise
   * 
   * @example
   * ```typescript
   * const schedule = new ScreenSchedule();
   * schedule.updateSchedule(1, true, 32400, 61200); // Monday 9 AM - 5 PM
   * const canDisplay = schedule.isActive(); // Check current time
   * ```
   */
  isActive(): boolean {
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime =
      now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    const daySchedule = this.schedule[currentDay];

    return daySchedule
      ? daySchedule.isActive &&
          currentTime >= daySchedule.startTime &&
          currentTime <= daySchedule.endTime
      : true;
  }

  /**
   * Updates the schedule configuration for a specific day.
   * 
   * Sets the active status and time range for the specified day of the week.
   * Days follow JavaScript's Date.getDay() convention: 0=Sunday, 1=Monday, etc.
   * 
   * @param day - Day of week (0=Sunday, 1=Monday, ..., 6=Saturday)
   * @param isActive - Whether content should be active on this day
   * @param startTime - Start time in seconds from midnight (0-86399)
   * @param endTime - End time in seconds from midnight (0-86399)
   * 
   * @example
   * ```typescript
   * const schedule = new ScreenSchedule();
   * // Set Tuesday active from 8:30 AM to 6:00 PM
   * schedule.updateSchedule(2, true, 30600, 64800);
   * ```
   */
  updateSchedule(
    day: number,
    isActive: boolean,
    startTime: number,
    endTime: number
  ) {
    const sched = this.schedule[day];
    if (sched) {
      sched.isActive = isActive;
      sched.startTime = startTime;
      sched.endTime = endTime;
    } else {
      this.schedule[day] = new ScheduleItem(isActive, startTime, endTime);
    }
  }
}
