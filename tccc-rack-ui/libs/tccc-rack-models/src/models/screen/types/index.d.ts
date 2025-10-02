/**
 * (C) Copyright 2025, Kondra, All rights reserved.
 */

import type { KosParentAware } from '@kosdev-code/kos-ui-sdk';

export interface ScreenOptions extends KosParentAware {
  isExtended: boolean;
  showOnScreen: string[];
  assetType: string;
  baseUrl: string;
  assetPath: string;
  startDate?: Date;
  endDate?: Date;
  index: number;
  numberOfTimesToPlay?: number;
  duration?: number;
}
