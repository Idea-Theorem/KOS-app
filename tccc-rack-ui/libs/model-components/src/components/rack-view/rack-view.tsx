/**
 * (C) Copyright 2025, Kondra, All rights reserved.
 */

import styled from '@emotion/styled';

import { kosComponent, KosLog } from '@kosdev-code/kos-ui-sdk';
import type { RackModel, RackServices } from '@tccc-rack/tccc-rack-models';
import { useContent, withRack } from '../../hooks';
import { BundleView } from '../bundle-view';
import ImagePreloader from '../image-preloader/image-preloader';
import { ImageScreen } from '../image-screen';
import { Overlay } from '../overlay';
import { ReferenceView } from '../reference-view';
import { VideoScreen } from '../video-screen';

const log = KosLog.createLogger({ name: 'rack-view' });
log.debug('rack-view component loaded');
const extractLayoutData = (layout: RackServices.LayoutDescriptor) => {
  return {
    display: layout.display,
    screens: Object.values(layout.screens).map((screen) => screen),
  };
};

interface Props {
  rack: RackModel;
}
export const RackViewBase: React.FunctionComponent<Props> = kosComponent(
  ({ rack }) => {
    const screenMap = rack.screenMap;

    const videoSources = rack.videoSources;
    const imageSources = rack.imageSources;
    const regions = rack.regions;
    const layout = rack.layout || {
      name: "SIM_DR_ZONE",
      display: { width: 1280, height: 1024 },
      screens: {
        1: {
          name: "main",
          display: { width: 1280, height: 720 }, // common video height ratio
          position: { x: 0, y: 152 } // centers vertically (1024 - 720) / 2
        }
      }
    };
    const { videoRefs, ready, next } = useContent(
      rack,
      Object.values(layout?.screens ?? 2).length,
      videoSources,
      rack.maxVideoDurationSec.value
    );

   log.debug('No layout found, using mock layout');
   if (!layout || !rack || Object.values(screenMap).length === 0) {
      return (
        <div
          style={{
            color: 'white',
            padding: 12,
            fontSize: 12,
            maxHeight: '100vh', // limit to viewport height
            overflowY: 'auto',  // enable vertical scroll
            whiteSpace: 'pre-wrap', // so lines wrap nicely
          }}
        >
          <strong>Rack</strong>
          <pre>{JSON.stringify(rack, null, 2)}</pre>

          <strong>Layout</strong>
          <pre>{JSON.stringify(layout, null, 2)}</pre>

          <strong>Screen Map</strong>
          <pre>{JSON.stringify(screenMap, null, 2)}</pre>
        </div>
      );
    }

    const { display, screens } = extractLayoutData(layout);
    const screensView = Object.entries(screenMap).map(
      ([screenIndex, screen], idx) => {
        const area = screen?.isExtended ? 'extended' : `${idx + 1}`;
        const isVideo = screen?.assetType === 'video';
        return screen ? (
          <VideoGrid
            visible={ready}
            className={`area-${area} area`}
            key={screen.id}
          >
            {rack.displayOverlay.value ? <Overlay screen={screen} /> : null}
            {rack.displayReferenceOverlay.value ? <ReferenceView /> : null}
            {isVideo ? (
              <VideoScreen
                screen={screen}
                isMain={idx === 0}
                index={screenIndex}
                ref={videoRefs.current[idx]}
              />
            ) : (
              <ImageScreen screen={screen} onComplete={next} />
            )}
          </VideoGrid>
        ) : (
          <EmptyView key={idx}>Video is unavailable.</EmptyView>
        );
      }
    );

    return (
      <>
        <ImagePreloader imageSources={imageSources} />
        <RackViewContainer
          display={display}
          screens={screens}
          regions={regions}
        >
          {rack.displayBundleOverlay.value ? (
            <BundleView rack={rack}></BundleView>
          ) : null}
          {screensView}
        </RackViewContainer>
      </>
    );
  }
);

const RackViewContainer = styled.div<{
  regions: string[];
  display: RackServices.DisplayLayout;
  screens: RackServices.ScreenLayout[];
}>`
  width: ${(props) => props.display.width}px;
  height: ${(props) => props.display.height}px;
  background-color: black;
  overflow: hidden;
  color: white;
  justify-content: center;
  align-items: center;
  top: 0;
  left: 0;
  position: relative;
  ${(props) =>
    props.screens.map((screen, idx) => {
      return `.area-${idx + 1} {
        position: absolute;
        top: ${screen.position.y}px;
        left: ${screen.position.x}px;
        width: ${screen.display.width}px;
        height: ${screen.display.height}px;
        background-color: black;
      }`;
    })}

  .area-extended {
    position: absolute;
    width: ${(props) => props.display.width}px;
    height: ${(props) => props.display.height}px;
    background-color: black;
    overflow: hidden;
  }
`;

const VideoGrid = styled.div<{ visible: boolean }>`
  width: 100%;
  height: 100%;
  visibility: ${(props) => (props.visible ? 'visible' : 'hidden')};
`;

export const EmptyView = styled.div`
  width: 100%;
  height: 100%;
  background-color: black;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
`;
export const RackView = withRack(RackViewBase);

export default RackView;
