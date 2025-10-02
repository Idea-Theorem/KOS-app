/**
 * (C) Copyright 2025, Kondra, All rights reserved.
 */

import styled from '@emotion/styled';

import { kosComponent, KosLog } from '@kosdev-code/kos-ui-sdk';
import type { ScreenModel } from '@tccc-rack/tccc-rack-models';
import { useEffect } from 'react';

const log = KosLog.createLogger({ name: 'image-screen' });
log.debug('image-screen component loaded');

interface Props {
  screen: ScreenModel;
  onComplete: (context: string) => void;
}
export const ImageScreen: React.FunctionComponent<Props> = kosComponent(
  ({ screen, onComplete }) => {
    useEffect(() => {
      const timeout = setTimeout(() => {
        onComplete('image');
      }, screen.duration * 1000);
      return () => {
        clearTimeout(timeout);
      };
    }, [onComplete, screen]);
    return <Image src={screen.assetUrl} />;
  }
);

const Image = styled.img`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  object-fit: contain;
`;

export default ImageScreen;
