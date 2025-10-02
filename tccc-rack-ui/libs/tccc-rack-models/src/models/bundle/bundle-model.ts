/**
 * (C) Copyright 2025, Kondra, All rights reserved.
 */

import type {
  IKosDataModel,
  IKosIdentifiable,
  IKosModelContainer,
  KosConfigProperty,
  KosContextLogger,
  KosCreationContext,
  PublicModelInterface,
} from '@kosdev-code/kos-ui-sdk';
import {
  kosChild,
  kosConfigProperty,
  kosModel,
  KosModelContainer,
} from '@kosdev-code/kos-ui-sdk';
import { Led } from '../../common/led/led';
import { ScreenSchedule } from '../../common/schedule/schedule';
import type { ScreenModel } from '../screen';
import type { BundleOptions } from './types';

export const MODEL_TYPE = 'bundle-model';

export type BundleModel = PublicModelInterface<BundleModelImpl>;

/**
 * BundleModel groups screens together with shared scheduling, priority, and LED control.
 * 
 * This KOS model manages:
 * - Content grouping and priority-based display ordering
 * - Time-based scheduling with start/end dates and daily schedules
 * - LED color control synchronized with content display
 * - Manufacturing vs standard content separation
 * - Main and secondary screen coordination
 * 
 * Bundles contain one or more screens and determine when and how content
 * should be displayed based on scheduling rules and priority levels.
 * 
 * @example
 * ```typescript
 * const bundle = Bundle.instance('bundle-1')
 *   .options({
 *     priority: 100,
 *     mfg: false,
 *     led: { color: 'blue', mode: 'solid' },
 *     startDate: new Date('2024-01-01'),
 *     endDate: new Date('2024-12-31')
 *   })
 *   .build();
 * ```
 */
@kosModel(MODEL_TYPE)
export class BundleModelImpl implements IKosDataModel, IKosIdentifiable {
  /** Unique identifier for this bundle instance */
  id: string;
  private logger: KosContextLogger;
  
  /** Base path for all assets in this bundle */
  basePath: string;
  
  /** Optional start date - content not shown before this date */
  startDate?: Date;
  
  /** Optional end date - content not shown after this date */
  endDate?: Date;
  
  /** Priority level for display ordering (higher numbers = higher priority) */
  priority: number;
  
  /** Whether this is manufacturing-specific content */
  mfg: boolean;
  
  /** LED controller for status indication */
  led: Led;
  
  /** Weekly schedule configuration */
  schedule: ScreenSchedule;
  
  /** System setting to ignore end dates during testing */
  @kosConfigProperty({ path: 'system:app', attribute: 'ignoreEndDates' })
  ignoreEndDates!: KosConfigProperty<boolean>;
  
  /** Container for all screens in this bundle */
  @kosChild screens: IKosModelContainer<ScreenModel>;
  constructor(
    modelId: string,
    options: BundleOptions,
    context: KosCreationContext
  ) {
    this.id = modelId;
    this.logger = context.logger;
    this.basePath = options.basePath;
    this.priority = options.priority;
    this.startDate = options.startDate;
    this.endDate = options.endDate;
    this.mfg = options.mfg;
    this.screens = new KosModelContainer({
      parentId: this.id,
    });
    this.led = new Led({ color: options.led.color, mode: options.led.mode });
    this.schedule = new ScreenSchedule();
  }

  /**
   * Get bundle type based on screen content
   * @returns 'main' if contains main screen content, 'secondary' otherwise
   */
  get type(): string {
    if (this.mainScreen) {
      return 'main';
    } else {
      return 'secondary';
    }
  }

  /**
   * Get the main screen (displayed on screen index '1')
   * @returns The main screen or undefined if none exists
   */
  get mainScreen(): ScreenModel | undefined {
    return this.screens.data.find((screen) =>
      screen.showOnScreen.includes('1')
    );
  }

  /**
   * Get all screen indices that this bundle displays content on
   * @returns Sorted array of screen indices (e.g., ['1', '2'])
   */
  get screensToShow(): string[] {
    const allScreens = this.screens.data.reduce<string[]>((acc, screen) => {
      screen.showOnScreen.forEach((screenIndex) => {
        if (!acc.includes(screenIndex)) {
          acc.push(screenIndex);
        }
      });
      return acc;
    }, []);
    return allScreens.sort();
  }

  /**
   * Determine if this bundle can currently be played
   * Checks date range, schedule, and system override settings
   * @returns true if bundle should be available for playback
   */
  get canPlay(): boolean {
    const now = new Date();
    const startDate = this.startDate ?? now;
    const later = new Date(now);
    const noEndDate = new Date('9999-12-31T23:59:59');
    const endDate = this.ignoreEndDates.value
      ? later.setHours(now.getHours() + 10)
      : this.endDate ?? noEndDate;

    const scheduleActive = this.schedule.isActive();
    return (
      now >= startDate &&
      now < endDate &&
      (this.ignoreEndDates.value || scheduleActive)
    );
  }

  updateModel(options: BundleOptions): void {
    // Update model properties here.
  }

  // -------------------LIFECYCLE----------------------------
}
