/**
 * (C) Copyright 2025, Kondra, All rights reserved.
 */

import styled from '@emotion/styled';
import { kosComponent, KosLog } from '@kosdev-code/kos-ui-sdk';
import { RackView } from '@tccc-rack/model-components';

const log = KosLog.createLogger({ name: 'main-view' });
log.debug('main-view component loaded');

const Main = styled.div`
  width: 100vw;
  height: 100vh;
  background-color: black;
  overflow: hidden;
`;

export const MainView: React.FunctionComponent = kosComponent(() => {
  return (
    <Main>
      <RackView />
    </Main>
  );
});
