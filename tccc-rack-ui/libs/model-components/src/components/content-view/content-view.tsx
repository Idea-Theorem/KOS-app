/**
 * (C) Copyright 2025, Kondra, All rights reserved.
 */

import styled from '@emotion/styled';

import { kosComponent, KosLog } from '@kosdev-code/kos-ui-sdk';

const log = KosLog.createLogger({ name: 'content-view' });
log.debug('content-view component loaded');

const ContentViewContainer = styled.div``;

interface Props {}
export const ContentView: React.FunctionComponent<Props> = kosComponent(() => {
  return <ContentViewContainer>content-view</ContentViewContainer>;
});

export default ContentView;
