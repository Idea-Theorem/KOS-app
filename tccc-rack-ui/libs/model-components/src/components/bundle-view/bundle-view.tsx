/**
 * (C) Copyright 2025, Kondra, All rights reserved.
 */

import styled from '@emotion/styled';

import { kosComponent, KosLog } from '@kosdev-code/kos-ui-sdk';
import { type BundleModel, type RackModel } from '@tccc-rack/tccc-rack-models';

const log = KosLog.createLogger({ name: 'bundle-view' });
log.debug('bundle-view component loaded');

export const BundleViewContainer = styled.div<{ borderColor?: string }>`
  position: absolute;
  z-index: 20;
  top: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  border: 3px solid ${(props) => props.borderColor ?? 'gray'};
  padding: 10px;
  gap: 10px;
  justify-content: flex-start;
  align-items: flex-start;
  overflow-y: scroll;
  height: 900px;
  width: 30%;
`;
const BundleItem = styled.div<{
  canPlay: boolean;
  isActive: boolean;
  isSideActive: boolean;
  mfg: boolean;
}>`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 100px;
  border: 3px solid;
  padding: 8px;
  font-size: x-large;
  color: white;
  width: 100%;
  background-color: ${(props) =>
    props.isActive
      ? 'rgba(0,0,255,0.7)'
      : props.isSideActive
      ? 'rgba(0,255,0,.4)'
      : props.mfg
      ? 'rgba(128, 0, 255, 0.6)'
      : props.canPlay
      ? 'rgba(0,0,0,.4)'
      : 'rgba(255,0,0,.4)'};
`;

const BundleRow = styled.div`
  display: flex;
  gap: 4px;
  word-wrap: break-word;
`;

const BundleStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;
interface BundleProps {
  bundle: BundleModel;
  isActive: boolean;
  isSideActive: boolean;
}

const BundleItemView: React.FunctionComponent<BundleProps> = ({
  bundle,
  isActive,
  isSideActive,
}) => {
  const type =
    bundle.type === 'main'
      ? bundle.mainScreen?.isExtended
        ? 'Extended'
        : bundle.screens.data.length > 1
        ? 'Multi'
        : 'Main'
      : 'Side';
  return (
    <BundleItem
      mfg={bundle.mfg}
      key={bundle.id}
      canPlay={bundle.canPlay}
      isActive={isActive}
      isSideActive={isSideActive}
    >
      <BundleRow>
        BundleID: <div>{bundle.id}</div>
      </BundleRow>
      <BundleRow>
        Priority: <div>{bundle.priority}</div>
      </BundleRow>
      <BundleRow>
        Type:{' '}
        <div>
          {type} {bundle.mfg ? ' - Manufacturing' : ''}
        </div>
      </BundleRow>
      <BundleRow>
        <BundleStack>
          {bundle.screens.data.map((screen) => {
            return (
              <>
                <BundleRow key={screen.id}>
                  {screen.assetPath.substring(
                    screen.assetPath.lastIndexOf('/')
                  )}
                </BundleRow>
                <BundleRow key={screen.id + 'ERROR'}>
                  Errors: {screen.errorCount}
                </BundleRow>
              </>
            );
          })}
        </BundleStack>
      </BundleRow>
    </BundleItem>
  );
};
interface Props {
  rack: RackModel;
}
export const BundleView: React.FunctionComponent<Props> = kosComponent(
  ({ rack }) => {
    const borderColor =
      rack.displayOverlay.value && rack.currentBundle
        ? rack.currentBundle.led.color
        : 'gray';
    const bundles = rack.allBundles.map((bundle) => {
      return (
        <BundleItemView
          key={bundle.id}
          bundle={bundle}
          isActive={bundle === rack.currentBundle}
          isSideActive={rack.currentSideBundles.includes(bundle)}
        />
      );
    });
    return (
      <BundleViewContainer borderColor={borderColor}>
        {bundles}
      </BundleViewContainer>
    );
  }
);

export default BundleView;
