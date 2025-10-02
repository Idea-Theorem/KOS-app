/**
 * (C) Copyright 2025, Kondra, All rights reserved.
 */

import type {
  IKosDataModel,
  IKosIdentifiable,
  KosContextLogger,
  KosCreationContext,
  PublicModelInterface,
} from '@kosdev-code/kos-ui-sdk';
import { kosModel, kosParentAware } from '@kosdev-code/kos-ui-sdk';
import { HOST, PORT } from '../../common/utils/host-utils';
import type { BundleModel } from '../bundle';
import type { ScreenOptions } from './types';

export const MODEL_TYPE = 'screen-model';

export type ScreenModel = PublicModelInterface<ScreenModelImpl>;

/**
 * ScreenModel represents an individual piece of content displayed on a rack screen.
 * 
 * This KOS model manages:
 * - Asset loading and URL generation
 * - Play tracking and rotation logic
 * - Error handling with automatic retry limits
 * - Display duration for images
 * - Video playback repetition
 * 
 * Screens are children of BundleModel and track their playback statistics
 * including current plays, lifetime plays, and error counts.
 * 
 * @example
 * ```typescript
 * const screen = Screen.instance('screen-1')
 *   .options({
 *     assetType: 'video',
 *     assetPath: '/content/video.mp4',
 *     showOnScreen: ['1'],
 *     numberOfTimesToPlay: 3
 *   })
 *   .build();
 * ```
 */
@kosParentAware()
@kosModel(MODEL_TYPE)
export class ScreenModelImpl implements IKosDataModel, IKosIdentifiable {
  /** Unique identifier for this screen instance */
  id: string;
  private logger: KosContextLogger;
  
  /** Whether this screen extends across multiple physical displays */
  isExtended: boolean;
  
  /** Array of screen indices where this content should be displayed (e.g., ['1', '2']) */
  showOnScreen: string[];
  
  /** Type of asset ('video' or 'image') */
  assetType: string;
  
  /** Base URL for asset retrieval */
  baseUrl: string;
  
  /** Relative path to the asset file */
  assetPath: string;
  
  /** Optional start date for scheduled content */
  startDate?: Date;
  
  /** Optional end date for scheduled content */
  endDate?: Date;
  
  /** Reference to parent bundle model */
  bundle: BundleModel;
  
  /** Index position within the bundle */
  index: number;
  
  /** Number of times this content has played in current rotation */
  currentPlays: number;
  
  /** Target number of plays before rotating (for videos) */
  numberOfTimesToPlay: number;
  
  /** Display duration in seconds (for images) */
  duration: number;
  
  /** Total number of times this content has ever played */
  lifetimePlays: number;
  
  /** Count of consecutive errors - content disabled after 3 errors */
  errorCount: number;

  constructor(
    modelId: string,
    options: ScreenOptions,
    context: KosCreationContext
  ) {
    this.id = modelId;
    this.logger = context.logger;
    this.isExtended = options.isExtended;
    this.showOnScreen = options.showOnScreen;
    this.assetType = options.assetType;
    this.baseUrl = options.baseUrl;
    this.assetPath = options.assetPath;
    this.startDate = options.startDate;
    this.endDate = options.endDate;
    this.index = options.index;
    this.bundle = context.kosContext.parentModel as BundleModel;
    this.currentPlays = 0;
    this.numberOfTimesToPlay = options.numberOfTimesToPlay ?? 0;
    this.duration = options.duration ?? 0;
    this.lifetimePlays = 0;
    this.errorCount = 0;
  }

  updateModel(options: ScreenOptions): void {
    // Update model properties here.
  }

  /**
   * Increment the error count for this screen
   * After 3 errors, the screen will be excluded from rotation
   */
  updateErrorCount(): void {
    this.errorCount++;
  }

  /**
   * Clear the error count, typically after successful playback
   */
  clearErrorCount(): void {
    this.errorCount = 0;
  }

  /**
   * Get the parent bundle's ID
   */
  get bundleId() {
    return this.bundle.id;
  }
  
  /**
   * Generate the full URL for the asset
   * Combines host, port, base URL and asset path
   */
  get assetUrl(): string {
    if (!this.assetPath) {
      return '';
    }
    return encodeURI(`http://${HOST}:${PORT}${this.baseUrl}${this.assetPath}`);
  }

  /**
   * Increment play count and determine if content should continue playing
   * @returns true if content should continue playing, false if rotation needed
   */
  incrementPlays(): boolean {
    if (this.currentPlays + 1 < this.numberOfTimesToPlay) {
      this.currentPlays++;
      this.lifetimePlays++;
      this.clearErrorCount();
      return true;
    } else {
      this.currentPlays = 0;
      this.lifetimePlays++;
      this.clearErrorCount();
      return false;
    }
  }
  // -------------------LIFECYCLE----------------------------

  async init(): Promise<void> {
    this.logger.debug(`initializing screen ${this.id}`);
  }

  async load(): Promise<void> {
    this.logger.debug(`loading screen ${this.id}`);
  }
}
