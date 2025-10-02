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
const { getAll, getOne } = ServiceFactory.build({
  basePath: `${URL}/api/system/content`,
});

const log = KosLog.createLogger({ name: 'rack-service', group: 'Services' });

/**
 * Asset data structure containing media file information
 */
export interface AssetData {
  /** Relative path to the asset file */
  path: string;
  /** Database ID of the asset */
  dbId: number;
  /** Asset width in pixels */
  width: number;
  /** CMS path reference */
  cmsPath: string;
  /** Asset height in pixels */
  height: number;
  /** Type of asset ('video' or 'image') */
  assetType: string;
  /** Resource type classification */
  resourceType: string;
}

/**
 * Schedule configuration for a specific day
 */
interface ScheduleData {
  /** Schedule data type */
  type: string;
  attributes: {
    /** Whether this schedule is active */
    isActive: boolean;
    /** Start time in HH:MM:SS format */
    startTime: string;
    /** End time in HH:MM:SS format */
    endTime: string;
  };
}

/**
 * Individual screen configuration data
 */
interface ScreenData {
  /** Data type identifier */
  type: 'screen';
  attributes: {
    /** Whether screen spans multiple displays */
    isExtended: string;
    /** JSON string of screen indices where content should display */
    showOnScreen: string;
    /** Type of content ('video' or 'image') */
    assetType: string;
    /** Reference to the asset file */
    assetFile: {
      /** Asset type classification */
      type: 'Graphic Asset';
      /** Database ID of the asset */
      dbId: number;
    };
    /** Number of times to play video content */
    numberOfTimesToPlay?: number;
    /** Duration to display image content (seconds) */
    duration?: number;
  };
}

/**
 * Complete screen bundle payload from the server
 */
interface ScreenPayload {
  /** Display priority level */
  priority: string;
  /** Database identifier */
  dbId: number;
  /** Bundle name */
  name: string;
  /** Content start date */
  startDate: string;
  /** Content end date */
  endDate: string;
  /** Target device type */
  deviceType: string;
  /** LED color for this bundle */
  ledColor: string;
  /** LED mode for this bundle */
  ledMode: string;
  /** Screen configurations and scheduling */
  screen: Record<string, ScreenData> & {
    /** Weekly schedule configuration */
    schedule: Record<string, ScheduleData>;
  };
  /** All assets referenced by screens */
  assets: AssetData[];
}

/**
 * Rack response structure from the content service
 */
export interface RackResponse {
  /** Unique bundle identifier */
  id: string;
  /** Base path for asset URLs */
  basePath: string;
  /** Complete bundle configuration */
  json: ScreenPayload;
  /** Whether this is manufacturing content */
  mfg: boolean;
}

/**
 * Display dimensions configuration
 */
export interface DisplayLayout {
  /** Display width in pixels */
  width: number;
  /** Display height in pixels */
  height: number;
}

/**
 * Individual screen layout configuration
 */
export interface ScreenLayout {
  /** Screen identifier name */
  name: string;
  /** Screen dimensions */
  display: DisplayLayout;
  /** Screen position coordinates */
  position: PositionLayout;
}

/**
 * Screen position coordinates
 */
interface PositionLayout {
  /** X coordinate in pixels */
  x: number;
  /** Y coordinate in pixels */
  y: number;
}

/**
 * Complete layout configuration for a device type
 */
export interface LayoutDescriptor {
  /** Layout configuration name */
  name: string;
  /** Overall display dimensions */
  display: DisplayLayout;
  /** Individual screen configurations by index */
  screens: Record<string, ScreenLayout>;
}

/**
 * Response type for layout descriptor requests
 * Returns either an error string or the layout descriptor
 */
type LayoutResponse = [string, undefined] | [undefined, LayoutDescriptor];

/**
 * Retrieves all rack content bundles from the content service.
 * 
 * Fetches the complete list of content bundles including their screens,
 * assets, scheduling, and metadata. This is typically called during
 * rack initialization to load all available content.
 * 
 * @returns Promise resolving to service response containing rack bundles
 * 
 * @example
 * ```typescript
 * const response = await getRacks();
 * const bundles = response.data; // Array of RackResponse objects
 * ```
 */
export const getRacks = async () => {
  log.debug('sending GET for rack');
  const response = await getAll<RackResponse>({});
  return response;
};

/**
 * Retrieves the layout configuration for a specific device type.
 * 
 * Fetches the screen layout descriptor that defines how content should
 * be positioned and sized for the given device type. This includes
 * overall display dimensions and individual screen configurations.
 * 
 * @param nodeType - The device type identifier (e.g., 'single', 'dual')
 * @returns Promise resolving to tuple of [error, descriptor] or [undefined, descriptor]
 * 
 * @example
 * ```typescript
 * const [error, layout] = await getLayoutDescriptor('dual');
 * if (!error && layout) {
 *   console.log('Display size:', layout.display.width, 'x', layout.display.height);
 * }
 * ```
 */
export const getLayoutDescriptor = async (
  nodeType: string
): Promise<LayoutResponse> => {
  if (!nodeType) {
    throw new Error('nodeType is required');
  }
  try {
    const response = await getOne<LayoutDescriptor>({
      urlOverride: `${URL}/api/kos/descriptor/system:app/tccc.rack.device.layout.${nodeType}`,
    });
    if (!response) {
      return ['unknownError', undefined];
    }
    return [undefined, response.data];
  } catch (error) {
    if (error instanceof FetchError) {
      log.error(`Error fetching device layout descriptor: ${error.payload.error}`);
      return [error.payload.error, undefined];
    }
  }

  return ['unknownError', undefined];
};
