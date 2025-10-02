/**
 * (C) Copyright 2025, Kondra, All rights reserved.
 */

export interface BundleOptions {
  basePath: string;
  priority: number;
  startDate?: Date;
  endDate?: Date;
  mfg: boolean;
  led: {
    color: string;
    mode: string;
  };
}
