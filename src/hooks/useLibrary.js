import { useState, useCallback, useEffect, useRef } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { normalizeSongs } from '../utils/library.js';

const FolderPicker = registerPlugin('FolderPicker');
const isNative = Capacitor.isNativePlatform();
const DEMO_SONGS = [1, 2, 3].map((number) => ({
  id: `demo-${number}`, name: `SoundHelix Song ${number}.mp3`,
  title: `SoundHelix Song ${number}`, artist: 'SoundHelix', album: 'Nhạc mẫu trực tuyến',
  path: `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${number}.mp3`, type: 'audio',
}));

export default function useLibrary() {
  const [songs, setSongs] = useState([]);
  const [folderSelected, setFolderSelected] = useState(false);
  const [folderPath, setFolderPath] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const mounted = useRef(false);
  const scanPromise = useRef(null);

  const loadLibrary = useCallback(async () => {
    if (scanPromise.current) return scanPromise.current;
    setIsLoading(true);
    setError(null);
    const task = (async () => {
      try {
        const result = isNative ? await FolderPicker.scanFolder() : { files: DEMO_SONGS, folderPath: 'Nhạc mẫu trực tuyến' };
        if (!mounted.current) return false;
        setSongs(normalizeSongs(result.files || []));
        setFolderPath(result.folderPath || '');
        setFolderSelected(true);
        return true;
      } catch (err) {
        if (mounted.current) {
          setError(`Không thể đọc thư mục. Hãy chọn lại thư mục nhạc. ${err.message || ''}`);
          setFolderSelected(false);
          setSongs([]);
        }
        return false;
      } finally {
        if (mounted.current) setIsLoading(false);
      }
    })();
    scanPromise.current = task;
    try { return await task; } finally { scanPromise.current = null; }
  }, []);

  useEffect(() => {
    mounted.current = true;
    let cancelled = false;
    (async () => {
      try {
        if (!isNative) { setIsLoading(false); return; }
        const result = await FolderPicker.checkBookmark();
        if (cancelled) return;
        if (result.hasBookmark) await loadLibrary();
        else {
          setIsLoading(false);
          if (result.error) setError('Thư mục trước đó không còn truy cập được. Vui lòng chọn lại.');
        }
      } catch (err) {
        if (!cancelled) {
          setIsLoading(false);
          setError(`Không thể mở thư viện: ${err.message || 'Vui lòng thử lại.'}`);
        }
      }
    })();
    return () => { cancelled = true; mounted.current = false; };
  }, [loadLibrary]);

  const pickFolder = useCallback(async () => {
    setError(null);
    try {
      const result = isNative ? await FolderPicker.pickFolder() : { success: true };
      if (!result.success) return false;
      return await loadLibrary();
    } catch (err) {
      if (!/cancel/i.test(`${err.code || ''} ${err.message || ''}`)) {
        setError(`Không thể chọn thư mục. ${err.message || ''}`);
      }
      return false;
    }
  }, [loadLibrary]);

  return { songs, folderSelected, folderPath, isLoading, error, isDemo: !isNative, pickFolder, refreshLibrary: loadLibrary };
}