/**
 * (C) Copyright 2025, Kondra, All rights reserved.
 */

import { KosModelRegistry } from '@kosdev-code/kos-dispense-sdk';

import { initKosProvider } from '@kosdev-code/kos-ui-sdk';
import { Bundle, Rack, Screen } from '@tccc-rack/tccc-rack-models';

KosModelRegistry.dispense.models().model(Rack).model(Screen).model(Bundle);

const { KosCoreContextProvider } = initKosProvider();

export { KosCoreContextProvider };
