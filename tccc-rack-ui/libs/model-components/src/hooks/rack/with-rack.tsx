/**
 * (C) Copyright 2025, Kondra, All rights reserved.
 */

import { RackModel } from '@tccc-rack/tccc-rack-models';
import { useRack } from './use-rack';

interface RackProps {
  rack: RackModel;
}

type HoCRackProps = RackProps;
// react HOC to provide a Rack to a component
export function withRack<T extends HoCRackProps = HoCRackProps>(
  WrappedComponent: React.ComponentType<T>
) {
  return (props: Omit<T, keyof RackProps>) => {
    const { model, status, KosModelLoader } = useRack();

    return (
      <KosModelLoader {...status}>
        <WrappedComponent {...(props as T)} rack={model} />
      </KosModelLoader>
    );
  };
}
