import { useState, useEffect, useRef, useCallback } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { createPlayerController, INITIAL_PLAYER_STATE } from '../player/controller.js';

const NativeAudio = registerPlugin('NativeAudio');

export default function useAudioPlayer() {
  const [state, setState] = useState(INITIAL_PLAYER_STATE);
  const [nativeHistory, setNativeHistory] = useState([]);
  const [queue, setQueueState] = useState([]);
  const queueRef = useRef([]);
  const controllerRef = useRef(null);

  useEffect(() => {
    const controller = createPlayerController({
      native: Capacitor.isNativePlatform() ? NativeAudio : null,
      onState: setState,
    });
    controllerRef.current = controller;
    controller.setQueue(queueRef.current);
    const refreshHistory = () => { if (Capacitor.isNativePlatform()) NativeAudio.getHistory().then(r => setNativeHistory(r.items || [])).catch(() => {}); };
    refreshHistory();
    const historyTimer = setInterval(refreshHistory, 5000);
    const refresh = () => { refreshHistory(); if (document.visibilityState !== 'hidden') controller.refresh(); };
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('pageshow', refresh);
    return () => {
      clearInterval(historyTimer);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('pageshow', refresh);
      controller.dispose();
      controllerRef.current = null;
    };
  }, []);

  const setQueue = useCallback((songs) => {
    queueRef.current = songs;
    setQueueState(songs);
    controllerRef.current?.setQueue(songs);
  }, []);
  const updateQueue = useCallback((songs) => {
    queueRef.current = songs; setQueueState(songs);
    return controllerRef.current?.updateQueue(songs);
  }, []);
  const showVideo = useCallback(() => controllerRef.current?.showVideo(), []);
  const setSleepTimer = useCallback((minutes) => controllerRef.current?.setSleepTimer(minutes), []);
  const playSong = useCallback((song) => controllerRef.current?.playSong(song), []);
  const pause = useCallback(() => controllerRef.current?.pause(), []);
  const resume = useCallback(() => controllerRef.current?.play(), []);
  const togglePlay = useCallback(() => {
    const controller = controllerRef.current;
    return controller?.getState().isPlaying ? controller.pause() : controller?.play();
  }, []);
  const next = useCallback(() => controllerRef.current?.next(), []);
  const prev = useCallback(() => controllerRef.current?.previous(), []);
  const seek = useCallback((time) => controllerRef.current?.seek(time), []);
  const stop = useCallback(() => controllerRef.current?.stop(), []);
  const toggleShuffle = useCallback(() => {
    const controller = controllerRef.current;
    return controller?.setShuffle(!controller.getState().shuffle);
  }, []);
  const toggleRepeat = useCallback(() => {
    const controller = controllerRef.current;
    const modes = ['off', 'all', 'one'];
    return controller?.setRepeat(modes[(modes.indexOf(controller.getState().repeatMode) + 1) % modes.length]);
  }, []);
  const dismissError = useCallback(() => controllerRef.current?.dismissError(), []);

  useEffect(() => {
    document.title = state.currentSong ? `${state.currentSong.title} — TPUGSOUND` : 'TPUGSOUND';
  }, [state.currentSong]);

  return { ...state, nativeHistory, queue, setQueue, updateQueue, showVideo, setSleepTimer, playSong, pause, resume, togglePlay, next, prev, seek, stop, toggleShuffle, toggleRepeat, dismissError };
}