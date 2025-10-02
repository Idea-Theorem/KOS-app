/**
 * (C) Copyright 2025, Kondra, All rights reserved.
 */

import { KosLog } from '@kosdev-code/kos-ui-sdk';
import { useEffect, useState } from 'react';

interface Props {
  imageSources: string[];
}

const ImagePreloader = ({ imageSources }: Props) => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (imageSources.length === 0) {
      setLoading(false); // No images to preload
      return;
    }

    setLoading(true); // Start loading
    let isMounted = true; // To avoid state updates on unmounted components

    const _images = imageSources.map((src) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        if (isMounted) {
          // Check if all images are loaded
          if (_images.every((image) => image.complete)) {
            setLoading(false);
          }
        }
      };
      return img;
    });

    return () => {
      isMounted = false; // Prevent state updates if unmounted
      _images.forEach((img) => {
        KosLog.info(`Cleaning up preloaded image: ${img.src}`);
        img.src = ''; // Release memory
      });
    };
  }, [imageSources]);

  if (imageSources.length === 0) {
    return null; // No images to preload, render nothing
  }

  return (
    <div>{loading ? 'Images are preloading...' : 'Images are loaded!'}</div>
  );
};

export default ImagePreloader;
