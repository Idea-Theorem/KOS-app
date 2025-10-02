/**
 * (C) Copyright 2025, Kondra, All rights reserved.
 */

import { KosLog } from '@kosdev-code/kos-ui-sdk';
import type { RackModel } from '@tccc-rack/tccc-rack-models';
import {
  createRef,
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

type VideoRefs = {
  videoRefs: MutableRefObject<MutableRefObject<HTMLVideoElement | null>[]>;
  ready: boolean;
  next: (context: string) => void;
};

const log = KosLog.createLogger({ name: 'use-content' });

export const useContent = (
  rack: RackModel,
  count: number,
  videoSources: string[],
  endTime = -1
): VideoRefs => {
  const videoRefs = useRef<MutableRefObject<HTMLVideoElement | null>[]>(
    Array.from({ length: count }).map(() =>
      createRef<HTMLVideoElement | null>()
    )
  );

  const [readyVideos, setReadyVideos] = useState<boolean[]>(
    Array(count).fill(false)
  );

  const [replayCount, setReplayCount] = useState(0);

  const [ready, setReady] = useState(false);

  const resetSideVideo = useCallback(
    (screenIndex: string) => {
      const screenIdx = parseInt(screenIndex, 10);

      setReadyVideos((prev) => {
        const updated = [...prev];
        updated[screenIdx - 1] = false;
        return updated;
      });
      const replay = rack.fillSide(screenIndex);
      if (replay) {
        setReadyVideos((prev) => {
          const updated = [...prev];
          updated[screenIdx - 1] = true;
          return updated;
        });
      }
    },
    [rack]
  );
  const resetVideos = useCallback(
    (context: string) => {
      setReadyVideos((prev) => {
        const updated = [...prev];
        for (let i = 0; i < updated.length; i++) {
          updated[i] = false;
        }
        return updated;
      });
      const replay = rack.fillNext(context);
      setReadyVideos((prev) => {
        const updated = [...prev];
        for (let i = 0; i < updated.length; i++) {
          if (replay.includes(i)) {
            updated[i] = true;
          }
        }
        return updated;
      });
    },
    [rack]
  );
  useEffect(() => {
    const cleanupCallbacks: (() => void)[] = [];

    videoSources.forEach((_, index) => {
      const videoElement = videoRefs.current[index]?.current;

      if (videoElement) {
        const bufferingThreshold = 5000; // 5 seconds in milliseconds
        let bufferingStartTime: number | null = null;
        let bufferingTimeout: NodeJS.Timeout | null = null;
        if (!videoElement.hasAttribute('data-listeners-attached')) {
          const handleCanPlayThrough = () => {
            setReadyVideos((prev) => {
              const updated = [...prev];
              updated[index] = true;
              return updated;
            });
          };

          const handleError = (e: Event) => {
            console.error(`Error loading video ${index + 1}:`, e);

            //retry playing the video
            const src = videoElement?.src;
            videoElement.src = '';
            videoElement.load();
            videoElement.src = src;
            videoElement.play().catch((e) => {
              const screenIndex = videoElement.dataset.index;
              if (screenIndex) {
                rack.screenMap[screenIndex]?.updateErrorCount();
                if (screenIndex === '1') {
                  resetVideos('play error');
                } else {
                  resetSideVideo(screenIndex);
                }
              }
            });
          };

          const handleEnded = (e: Event) => {
            e.preventDefault();
            e.stopPropagation();
            // Available in Chrome DevTools
            //only fill next if the video is the main video
            KosLog.info(
              `video ended ${videoElement.dataset.asset} from bundle ${videoElement.dataset.bundle}`
            );
            if (videoElement.dataset.main === 'true') {
              const main = rack.screenMap['1'];
              if (!main) {
                throw new Error('No main screen found');
              }
              const playAgain = main.incrementPlays();
              if (playAgain) {
                // Play the video again
                setReadyVideos((prev) => {
                  const updated = [...prev];
                  for (let i = 0; i < updated.length; i++) {
                    updated[i] = true;
                  }
                  return updated;
                });
              } else {
                resetVideos('handle ended');
              }
            } else {
              // start by looking in the bundle

              // then look for the next filler
              const screenIndex = videoElement.dataset.index;
              if (screenIndex) {
                const screen = rack.screenMap[screenIndex];
                const screenIdx = parseInt(screenIndex, 10);
                if (screen && screenIdx) {
                  const playAgain = screen.incrementPlays();
                  if (playAgain) {
                    // only play the side video again
                    setReadyVideos((prev) => {
                      const updated = [...prev];
                      updated[screenIdx - 1] = true;
                      return updated;
                    });
                  } else {
                    resetSideVideo(screenIndex);
                  }
                }
              }
            }
          };

          const handleWaiting = () => {
            if (!bufferingStartTime) {
              bufferingStartTime = Date.now();
              log.info('Buffering started...');

              bufferingTimeout = setTimeout(() => {
                const bufferingDuration =
                  Date.now() - (bufferingStartTime || 0);
                if (bufferingDuration >= bufferingThreshold) {
                  log.info(
                    `Buffering has exceeded ${
                      bufferingThreshold / 1000
                    } seconds.`
                  );
                  takeActionOnBuffering();
                }
              }, bufferingThreshold);
            }
          };
          const handleTimeUpdate = () => {
            if (videoElement.currentTime >= endTime) {
              videoElement.pause();

              log.info('Video ended at defined time:', endTime);
              const endedEvent = new Event('ended');
              videoElement.dispatchEvent(endedEvent); // Dispatch the event on the video element
            }
          };

          const handlePause = () => {
            if (videoElement.ended) {
              log.debug('The video has ended.');
            } else if (videoElement.seeking) {
              log.debug('The video is seeking.');
            } else {
              log.debug(
                'The video has been paused by the user or programmatically.'
              );
            }
          };

          const handlePlaying = () => {
            if (bufferingStartTime) {
              const bufferingDuration = Date.now() - (bufferingStartTime || 0);
              log.debug(
                `Buffering lasted ${bufferingDuration / 1000} seconds.`
              );
              bufferingStartTime = null; // Reset buffering start time
              if (bufferingTimeout) clearTimeout(bufferingTimeout); // Clear the timeout
            }
          };

          const takeActionOnBuffering = () => {
            log.info('Taking action due to prolonged buffering.');

            resetVideos('buffering');
          };

          const handleCanPlay = () => {
            log.debug('The video can resume playback.');
          };

          if (endTime > 0) {
            videoElement.addEventListener('timeupdate', handleTimeUpdate);
          }
          videoElement.crossOrigin = 'anonymous';
          videoElement.addEventListener('playing', handlePlaying);
          videoElement.addEventListener('pause', handlePause);
          videoElement.addEventListener('waiting', handleWaiting);
          videoElement.addEventListener('canplay', handleCanPlay);
          videoElement.addEventListener('canplaythrough', handleCanPlayThrough);
          videoElement.addEventListener('error', handleError);
          videoElement.addEventListener('ended', handleEnded);
          videoElement.setAttribute('data-listeners-attached', 'true');
          cleanupCallbacks.push(() => {
            videoElement.removeEventListener(
              'canplaythrough',
              handleCanPlayThrough
            );
            videoElement.removeEventListener('error', handleError);

            videoElement.removeEventListener('ended', handleEnded);
            videoElement.removeEventListener('timeupdate', handleTimeUpdate);
            videoElement.removeEventListener('pause', handlePause);
            videoElement.removeEventListener('waiting', handleWaiting);
            videoElement.removeEventListener('canplay', handleCanPlay);

            videoElement.removeEventListener('playing', handlePlaying);
            videoElement.removeAttribute('data-listeners-attached');
            if (bufferingTimeout) clearTimeout(bufferingTimeout);

            videoElement.pause(); // Pause the video
            videoElement.src = ''; // Clear the source
            videoElement.load(); // Reset the video
            videoElement.remove();
          });
        }
      }
      // Cleanup listeners on unmount
    });
    return () => {
      cleanupCallbacks.forEach((cb) => cb());
    };
  }, [endTime, rack, resetSideVideo, resetVideos, videoSources]);

  useEffect(() => {
    // Play all videos when all are ready
    const _count = videoSources.length;
    const _ready = readyVideos.slice(0, _count).every((ready) => ready);
    if (_ready) {
      setReady(true);
      videoRefs.current.forEach((videoRef, index) => {
        const videoElement = videoRef.current;
        if (videoElement?.dataset.asset) {
          videoElement?.play().catch((e) => {
            console.error(`Error playing video ${index + 1}:`, e);

            //retry playing the video
            const src = videoElement?.src;
            videoElement.src = '';
            videoElement.load();
            videoElement.src = src;
            videoElement.play().catch((e) => {
              const screenIndex = videoElement.dataset.index;
              if (screenIndex) {
                rack.screenMap[screenIndex]?.updateErrorCount();
                if (screenIndex === '1') {
                  resetVideos('play error');
                } else {
                  resetSideVideo(screenIndex);
                }
              }
            });
          });
        }
      });
    } else {
      setReady(false);
    }
  }, [
    readyVideos,
    videoSources,
    replayCount,
    rack,
    resetVideos,
    resetSideVideo,
  ]);

  return { videoRefs, ready, next: resetVideos };
};

export default useContent;
