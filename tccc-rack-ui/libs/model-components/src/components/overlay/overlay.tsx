/**
 * (C) Copyright 2025, Kondra, All rights reserved.
 */

import styled from '@emotion/styled';

import { kosComponent, KosLog } from '@kosdev-code/kos-ui-sdk';
import type { ScreenModel } from '@tccc-rack/tccc-rack-models';

const log = KosLog.createLogger({ name: 'overlay' });
log.debug('overlay component loaded');

interface Props {
  screen: ScreenModel;
  children?: React.ReactNode;
}
export const Overlay: React.FunctionComponent<Props> = kosComponent(
  ({ screen, children }) => {
    return (
      <OverlayContainer>
        <DataContainer>
          <div>URL: {screen.assetUrl}</div>
          <div>BundleID: {screen.bundleId}</div>
          <div>Current Plays: {screen.currentPlays}</div>
          <div>Loops: {screen.numberOfTimesToPlay}</div>
          <div>Lifetime Plays: {screen.lifetimePlays}</div>
          <div>Priority: {screen.bundle.priority}</div>
          {children}
        </DataContainer>
      </OverlayContainer>
    );
  }
);

const DataContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 20px;
  color: white;
  font-size: xx-large;
  border-radius: 10px;
`;
const OverlayContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  z-index: 9;
  width: 60%;

  background-color: rgba(0, 0, 0, 0.1);
  border: 1px solid white;
  border-radius: 10px;
  margin: 10px;
  display: flex;
  justify-content: flex-start;
  flex-direction: column;
  font-size: x-large;
`;

export default Overlay;
