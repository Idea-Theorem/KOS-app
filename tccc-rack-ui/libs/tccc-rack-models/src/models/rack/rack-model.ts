/**
 * (C) Copyright 2025, Kondra, All rights reserved.
 */

import type {
  DeviceModel,
  IKosDataModel,
  IKosIdentifiable,
  IKosModelContainer,
  KosConfigProperty,
  KosContextLogger,
  KosCreationContext,
  PublicModelInterface,
} from '@kosdev-code/kos-ui-sdk';
import {
  Device,
  kosChild,
  kosConfigProperty,
  kosDependency,
  KosLog,
  kosModel,
  KosModelContainer,
  kosModelEffect,
} from '@kosdev-code/kos-ui-sdk';
import { timeToSeconds } from '../../common/utils/time-utils';
import { Bundle, type BundleModel, type BundleOptions } from '../bundle';
import { Screen, type ScreenModel, type ScreenOptions } from '../screen';
import {
  getLayoutDescriptor,
  getRacks,
  type AssetData,
  type LayoutDescriptor,
  type RackResponse,
} from './services';
import type { RackOptions } from './types';

export const MODEL_TYPE = 'rack-model';

export type RackModel = PublicModelInterface<RackModelImpl>;

export const INDEX_BY_TYPE = 'indexByType';
export const INDEX_BY_MANUFACTURING = 'indexByManufacturing';
export const KEY_MANUFACTURING = 'mfg';
export const KEY_STANDARD = 'standard';

/**
 * RackModel manages the orchestration of multi-screen digital rack displays.
 * 
 * This KOS model handles:
 * - Multi-screen layout configuration and synchronization
 * - Content bundle management with priority-based scheduling
 * - Manufacturing vs standard content separation
 * - LED color control based on active content
 * - Automatic content rotation and error recovery
 * 
 * The rack supports both standard and manufacturing modes, with content
 * prioritization ensuring the most important content is displayed first.
 * 
 * @example
 * ```typescript
 * const rack = Rack.instance('rack-1').build();
 * rack.start(); // Begin content rotation
 * ```
 */
@kosModel(MODEL_TYPE)
export class RackModelImpl implements IKosDataModel, IKosIdentifiable {
  /** Unique identifier for this rack instance */
  id: string;
  private logger: KosContextLogger;
  
  /** Container for all content bundles, indexed by type and manufacturing status */
  @kosChild bundles: IKosModelContainer<BundleModel>;
  
  /** Controls visibility of debug overlay on screens */
  @kosConfigProperty({ path: 'system:app', attribute: 'displayOverlay' })
  displayOverlay!: KosConfigProperty<boolean>;

  /** Controls visibility of bundle information overlay */
  @kosConfigProperty({ path: 'system:app', attribute: 'displayBundleOverlay' })
  displayBundleOverlay!: KosConfigProperty<boolean>;

  /** Controls visibility of reference grid overlay for testing */
  @kosConfigProperty({
    path: 'system:app',
    attribute: 'displayReferenceOverlay',
  })
  displayReferenceOverlay!: KosConfigProperty<boolean>;

  /** Maximum duration in seconds for video playback before rotation */
  @kosConfigProperty({ path: 'system:app', attribute: 'maxVideoDurationSec' })
  maxVideoDurationSec!: KosConfigProperty<number>;

  /** KOS platform log level configuration */
  @kosConfigProperty({ path: 'system:app', attribute: 'logLevel' })
  kosLogLevel!: KosConfigProperty<string>;

  /** Map of screen index to currently displayed screen model */
  screenMap: Record<string, ScreenModel | undefined> = {};

  /** Reference to the KOS device model this rack runs on */
  @kosDependency({
    modelType: Device.type,
  })
  device!: DeviceModel;

  /** Array of screen region identifiers (e.g., ['1', '2']) */
  regions: string[];

  /** Layout configuration describing screen positions and dimensions */
  layout?: LayoutDescriptor;

  constructor(
    modelId: string,
    options: RackOptions,
    context: KosCreationContext
  ) {
    this.id = modelId;
    this.logger = context.logger;
    this.regions = [];
    this.layout = undefined;
    this.bundles = new KosModelContainer({
      parentId: this.id,
      sortKey: 'priority',
      indexMap: {
        [INDEX_BY_TYPE]: 'type',
        [INDEX_BY_MANUFACTURING]: (model: BundleModel) =>
          model.mfg ? KEY_MANUFACTURING : KEY_STANDARD,
      },
    });
  }

  updateModel(options: RackOptions): void {
    // Update model properties here.
  }

  /**
   * Get all bundles sorted by priority (highest first)
   */
  get allBundles(): BundleModel[] {
    return this.bundles.data.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Get standard (non-manufacturing) bundles sorted by priority
   */
  get standardBundles(): BundleModel[] {
    return this.bundles
      .getIndexByKey(INDEX_BY_MANUFACTURING, KEY_STANDARD)
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Get manufacturing-specific bundles sorted by priority
   */
  get manufacturingBundles(): BundleModel[] {
    return this.bundles
      .getIndexByKey(INDEX_BY_MANUFACTURING, KEY_MANUFACTURING)
      .sort((a, b) => b.priority - a.priority);
  }
  /**
   * Get all main screens from standard bundles
   * Main screens are displayed on the primary display (screen 1)
   */
  get mainScreens(): ScreenModel[] {
    return this.bundles
      .getIndexByKey(INDEX_BY_TYPE, 'main')
      .filter((bundle) => !bundle.mfg)
      .map((bundle) => {
        return bundle.mainScreen;
      }) as ScreenModel[];
  }

  /**
   * Get all main screens from manufacturing bundles
   */
  get manufacturingMainScreens(): ScreenModel[] {
    return this.bundles
      .getIndexByKey(INDEX_BY_TYPE, 'main')
      .filter((bundle) => bundle.mfg)
      .map((bundle) => {
        return bundle.mainScreen;
      }) as ScreenModel[];
  }

  /**
   * Get all secondary screens from standard bundles
   * Secondary screens are displayed on side displays (not screen 1)
   */
  get secondaryScreens(): ScreenModel[] {
    return this.bundles
      .getIndexByKey(INDEX_BY_TYPE, 'secondary')
      .filter((bundle) => !bundle.mfg)
      .sort((a, b) => b.priority - a.priority)
      .flatMap((bundle) => {
        return bundle.screens.data.filter((s) => !s.showOnScreen.includes('1'));
      });
  }

  /**
   * Get all secondary screens from manufacturing bundles
   */
  get manufacturingSecondaryScreens(): ScreenModel[] {
    return this.bundles
      .getIndexByKey(INDEX_BY_TYPE, 'secondary')
      .filter((bundle) => bundle.mfg)
      .sort((a, b) => b.priority - a.priority)
      .flatMap((bundle) => {
        return bundle.screens.data.filter((s) => !s.showOnScreen.includes('1'));
      });
  }

  /**
   * Get the bundle currently displayed on the main screen
   */
  get currentBundle(): BundleModel | undefined {
    return this.screenMap['1']?.bundle;
  }

  /**
   * Get bundles currently displayed on side screens
   */
  get currentSideBundles(): BundleModel[] {
    const keys = Object.keys(this.screenMap).filter((key) => key !== '1');
    const screens = keys.map((key) => this.screenMap[key]);
    return screens
      .map((screen) => screen?.bundle)
      .filter(Boolean) as BundleModel[];
  }

  // -------------------LIFECYCLE----------------------------

  private findNextItemWithPriority(
    array: ScreenModel[],
    startIndex: number,
    targetPriority: number
  ): number {
    const validScreens = array.filter((screen) => screen.bundle.canPlay);
    if (validScreens.length === 0) {
      return -1;
    }

    const n = array.length;
    if (n === 0) return -1; // Handle empty array case (returning -1 for no items)

    // Search through the array, wrapping around if necessary
    for (let i = 0; i < n; i++) {
      const currentIndex = (startIndex + i) % n; // Circular indexing
      if (
        array[currentIndex].bundle.priority <= targetPriority &&
        array[currentIndex].bundle.canPlay
      ) {
        return currentIndex; // Return the index of the matching item
      }
    }

    // If no match is found, return the first item
    return 0;
  }
  private nextFiller(screenIndex: string, mfg: boolean): ScreenModel {
    const screenList = mfg
      ? this.manufacturingSecondaryScreens
      : this.secondaryScreens;
    const currentScreen = this.screenMap[screenIndex];
    if (!currentScreen) {
      return screenList[0];
    }
    const currentIndex = screenList.indexOf(currentScreen);
    const newIndex = this.findNextItemWithPriority(
      screenList,
      currentIndex,
      currentScreen.bundle.priority
    );
    if (newIndex === -1) {
      if (mfg) {
        throw new Error('No manufacturing screens found');
      }
      return this.nextFiller(screenIndex, true);
    }
    return screenList[newIndex];
  }
  private nextByPriority(mfg: boolean): BundleModel | undefined {
    const bundles = mfg ? this.manufacturingBundles : this.standardBundles;
    if (!this.currentBundle) {
      const _next = bundles.find(
        (bundle) =>
          bundle.mainScreen &&
          bundle.canPlay &&
          bundle.mainScreen.errorCount < 3
      );
      if (!_next) {
        if (mfg) {
          KosLog.error('No manufacturing screens found');
          return undefined;
        }
        return this.nextByPriority(true);
      }
      return _next;
    } else {
      const playable = this.mainScreens.filter(
        (screen) => screen.bundle.canPlay
      );
      if (playable.length === 1) {
        if (playable[0].errorCount > 3) {
          return;
        } else {
          return this.currentBundle;
        }
      }
      const currentPriority = this.currentBundle.priority;
      const currentIndex = bundles.indexOf(this.currentBundle);
      const _next = bundles.find(
        (bundle, index) =>
          bundle.priority <= currentPriority &&
          bundle.mainScreen &&
          bundle.mainScreen.errorCount < 3 &&
          bundle.canPlay &&
          bundle !== this.currentBundle &&
          index > currentIndex
      );

      if (!_next) {
        const _first = bundles.find(
          (bundle) =>
            bundle.mainScreen &&
            bundle.canPlay &&
            bundle !== this.currentBundle &&
            bundle.mainScreen.errorCount < 3
        );
        if (!_first) {
          if (mfg) {
            if (
              bundles.length === 1 &&
              bundles[0].mainScreen &&
              bundles[0].mainScreen.errorCount < 3
            ) {
              return bundles[0];
            }
            KosLog.error('No manufacturing screens found');
            return undefined;
          }
          return this.nextByPriority(true);
        }
        return _first;
      }
      return _next;
    }
  }

  private _started = false;
  /**
   * Start the rack's content rotation system
   * Begins automatic content cycling based on priority and schedule
   */
  start(): void {
    if (this._started) {
      return;
    }
    this._started = true;
    this.fillNext('start');
  }

  /**
   * Fill a side screen with the next appropriate content
   * @param screenIndex The index of the screen to fill
   * @returns true if the same content is replayed, false if new content
   */
  fillSide(screenIndex: string): boolean {
    const screen = this.nextFiller(screenIndex, false);
    const replay = this.screenMap[screenIndex] === screen;
    this.screenMap[screenIndex] = screen;

    return replay;
  }
  
  /**
   * Fill all screens with the next appropriate content based on priority
   * Handles main screen rotation and coordinates side screen content
   * @param context Debug context string for logging
   * @returns Array of screen indices that need to replay content
   */
  fillNext(context: string): number[] {
    const [mainInx, ...sideIndexes] = this.regions;
    this.logger.debug(`fill next called from ${context}`);
    this.logger.debug(`filling next bundle for rack ${this.id}`);

    // find the next screen in the bundles that will fill screen 1 by looking at the showOnScreen property
    const _next = this.nextByPriority(false);
    const mainScreen = _next?.mainScreen;

    // find the next main screen
    const data: Record<string, ScreenModel | undefined> = {
      [mainInx]: mainScreen,
    };

    // update the led color
    mainScreen?.bundle.led.activate();

    // if the main screen is extended, don't show a side screen
    // if the main screen is not extended, show the next screen that is not the main screen
    if (!mainScreen?.isExtended) {
      sideIndexes.forEach((sideIndex) => {
        const side = _next?.screens.data.find(
          (screen) =>
            screen.showOnScreen.includes(sideIndex) && screen.errorCount < 3
        );
        if (side) {
          data[sideIndex] = side;
        } else {
          // if the side screen is not in the current bundle, look in the other bundles
          // first look in the secondary screens for something with a priority greater than
          // or equal to the current bundle
          let _side = _next
            ? this.secondaryScreens.find(
                (screen) =>
                  screen.showOnScreen.includes(sideIndex) &&
                  screen.bundle.priority <= _next.priority &&
                  this.screenMap[sideIndex] !== screen &&
                  screen.errorCount < 3
              )
            : undefined;

          if (!_side) {
            // if nothing is found in the secondary screens, look in the other bundles for any priority
            _side = this.secondaryScreens.find((screen) => {
              return (
                screen.showOnScreen.includes(sideIndex) && screen.errorCount < 3
              );
            });
          }

          if (_side) {
            data[sideIndex] = _side;
          }
        }
      });
      // fist look in the current bundle for the side screen
    }
    const replay: number[] = [];
    if (this.screenMap[mainInx] !== data[mainInx]) {
      this.screenMap[mainInx] = data[mainInx];
    } else {
      replay.push(0);
    }
    sideIndexes.forEach((sideIndex, idx) => {
      if (this.screenMap[sideIndex] !== data[sideIndex]) {
        this.screenMap[sideIndex] = data[sideIndex];
      } else {
        replay.push(parseInt(sideIndex));
      }
    });
    return replay;
    // find the next screen in the bundles that will fill screen 2 by looking at the showOnScreen property
  }

  /**
   * Get all image asset URLs currently displayed
   * Used for preloading images before display
   */
  get imageSources(): string[] {
    return Object.values(this.screenMap)
      .filter((screen) => screen?.assetType !== 'video')
      .map((screen) => {
        return screen?.assetUrl || '';
      })
      .filter(Boolean) as string[];
  }

  /**
   * Get all video asset URLs currently displayed
   * Used for video synchronization and preloading
   */
  get videoSources(): string[] {
    return Object.values(this.screenMap)
      .filter((screen) => screen?.assetType === 'video')
      .map((screen) => {
        return screen?.assetUrl || '';
      })
      .filter(Boolean) as string[];
  }
  async init(): Promise<void> {
    this.logger.debug(`initializing rack ${this.id}`);
  }

  @kosModelEffect({
    dependencies: (model) => [model.currentBundle],
  })
  handleBundleChange() {
    this.logger.info('handleBundleChange');

    if (this.currentBundle?.led) {
      this.logger.info(`setting led color to ${this.currentBundle.led.color}`);
      try {
        this.currentBundle.led.activate();
      } catch (e) {
        this.logger.error('error activating led', e);
      }
    }
  }
  @kosModelEffect({
    dependencies: (model) => [model.kosLogLevel.value],
  })
  handleLogChange() {
    this.logger.info('handleLogChange' + this.kosLogLevel.value);
    const level = this.kosLogLevel.value as any;
    if (level) {
      this.logger.info('setting log level to ' + level);
      (window as any).kosLogLevel = level;
      (window as any).setKosLogLevel(level);
      KosLog.setDefaultLevel(level);
    }
  }

  @kosModelEffect({
    dependencies: (model) => [model.device.nodeType],
  })
  async handleDeviceChange() {
    this.logger.info('handleDeviceChange' + this.device.nodeType);
    const [error, layout] = await getLayoutDescriptor(this.device.nodeType);
    if (error) {
      this.logger.error('error getting layout descriptor', error);
      return;
    }

    if (layout) {
      this.logger.info('layout descriptor', layout);
      this.layout = layout;
    }
  }

  private updateScreenData(racks: RackResponse[]) {
    racks.forEach((screen) => {
      const bundleData = screen.json;
      const mfg = screen.mfg;
      const bundleOptions: BundleOptions = {
        mfg,
        basePath: screen.basePath,
        startDate: bundleData.startDate
          ? new Date(bundleData.startDate)
          : undefined,
        endDate: bundleData.endDate ? new Date(bundleData.endDate) : undefined,
        priority: Number.parseInt(bundleData.priority),
        led: {
          color: bundleData.ledColor,
          mode: bundleData.ledMode,
        },
      };
      const { schedule, ...screens } = bundleData.screen;
      const bundleModel = Bundle.instance(screen.id)
        .options(bundleOptions)
        .build();

      Object.keys(schedule).forEach((key) => {
        const { endTime, startTime, isActive } =
          schedule[key]?.attributes ?? {};
        const day = Number.parseInt(key);
        const startSeconds = timeToSeconds(startTime ?? '00:00:00');
        const endSeconds = timeToSeconds(endTime ?? '23:59:59');
        bundleModel.schedule.updateSchedule(
          day,
          isActive ?? true,
          startSeconds,
          endSeconds
        );
      });
      const assets = bundleData.assets.reduce<Record<number, AssetData>>(
        (acc, asset) => {
          acc[asset.dbId] = asset;
          return acc;
        },
        {}
      );
      Object.keys(screens).forEach((key) => {
        const screenData = screens[key].attributes;
        const showOnScreens: any[] = JSON.parse(screenData.showOnScreen);

        const screenOptions: ScreenOptions = {
          isExtended: screenData.isExtended === 'true',
          showOnScreen: showOnScreens.map((screen) => screen.toString()),
          baseUrl: screen.basePath,
          assetPath: assets[screenData.assetFile.dbId].path,
          assetType: screenData.assetType,

          index: Number.parseInt(key),
          kosParentId: bundleModel.id,
          numberOfTimesToPlay:
            screenData.assetType === 'video'
              ? screenData.numberOfTimesToPlay ?? 1
              : 0,
          duration:
            screenData.assetType !== 'video' ? screenData.duration ?? 5 : 0,
        };
        const screenModel = Screen.instance(`${bundleModel.id}-${key}`)
          .options(screenOptions)
          .build();
        bundleModel.screens.addModel(screenModel);
      });

      this.bundles.addModel(bundleModel);
    });
  }
  /**
   * Load rack configuration and content from the server
   * Fetches all bundles, screens, and layout configuration
   * Automatically starts content rotation after loading
   */
  async load(): Promise<void> {
    this.logger.warn(`loading rack ${this.id} on device ${this.device.name}`);
    const screens = await getRacks();
    this.regions = ['1', '2'];
    this.updateScreenData(screens?.data || []);

    const [error, layout] = await getLayoutDescriptor(this.device.nodeType);
    if (error) {
      this.logger.error('error getting layout descriptor', error);
      throw error;
    }

    if (layout) {
      this.logger.info('layout descriptor', layout);
      this.layout = layout;
    }

    this.start();
  }
}
