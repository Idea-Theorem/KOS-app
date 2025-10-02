/**
 * (C) Copyright 2025, Kondra, All rights reserved.
 */

import styled from '@emotion/styled';

import { kosComponent, KosLog } from '@kosdev-code/kos-ui-sdk';
import type { ScreenModel } from '@tccc-rack/tccc-rack-models';
import { forwardRef } from 'react';

const log = KosLog.createLogger({ name: 'image-screen' });
log.debug('image-screen component loaded');

interface Props {
  screen: ScreenModel;
  isMain: boolean;
  index: string;
}
export const VideoScreen = kosComponent(
  forwardRef<HTMLVideoElement, Props>(({ screen, isMain, index }, ref) => {
    return (
      <Video
        data-main={isMain}
        data-bundle={screen.bundleId}
        data-extended={screen.isExtended}
        data-index={index}
        data-asset={screen.assetUrl}
        ref={ref}
        src={screen.assetUrl}
        autoPlay
        muted
      />
    );
  })
);

const Video = styled.video`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
`;

export default VideoScreen;
