/**
 * (C) Copyright 2025, Kondra, All rights reserved.
 */

import { ClassNames } from '@emotion/react';
import styled from '@emotion/styled';
import { kosComponent, KosLog } from '@kosdev-code/kos-ui-sdk';

const log = KosLog.createLogger({ name: 'reference-view' });
log.debug('reference-view component loaded');

const ReferenceViewContainer = styled.div`
  z-index: 9999;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  position: relative;
  border: 3px solid white;
  background-color: transparent;
`;

const Circle = styled.div`
  position: absolute;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 3px solid white;
`;

const CenterCircle = styled(Circle)`
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`;

interface Props {}
export const ReferenceView: React.FunctionComponent<Props> = kosComponent(
  () => {
    return (
      <ClassNames>
        {({ css }) => {
          return (
            <ReferenceViewContainer>
              <Circle
                className={css`
                  top: 25px;
                  left: 25px;
                `}
              />
              <Circle
                className={css`
                  top: 25px;
                  right: 25px;
                `}
              />
              <CenterCircle />
              <Circle
                className={css`
                  bottom: 25px;
                  left: 25px;
                `}
              />
              <Circle
                className={css`
                  bottom: 25px;
                  right: 25px;
                `}
              />
            </ReferenceViewContainer>
          );
        }}
      </ClassNames>
    );
  }
);

export default ReferenceView;
