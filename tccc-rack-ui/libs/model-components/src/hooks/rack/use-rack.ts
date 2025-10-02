/**
 * (C) Copyright 2025, Kondra, All rights reserved.
 */

import { useKosModel } from '@kosdev-code/kos-ui-sdk';
import { Rack, RackModel } from '@tccc-rack/tccc-rack-models';

export const useRack = () => {
  const modelId = Rack.type;
  const result = useKosModel<RackModel>({
    modelId,
    modelType: Rack.type,
    options: {},
  });

  return result;
};
