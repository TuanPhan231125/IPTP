export const INITIAL_PLAYER_STATE = {
  songId: null, currentSong: null, isPlaying: false, currentTime: 0, duration: 0,
  currentIndex: -1, shuffle: false, repeatMode: 'off', error: null,
};

const finiteTime = (value) => Number.isFinite(value) ? Math.max(0, value) : 0;

// The native player owns playback and its queue while the WebView is suspended.
// This adapter also provides an HTML Audio preview for browsers.
export function createPlayerController({ native = null, audioFactory = () => new Audio(), onState, random = Math.random }) {
  let state = { ...INITIAL_PLAYER_STATE };
  let queue = [];
  let audio = null;
  let disposed = false;
  let nativeListener = null;
  let commandChain = Promise.resolve();
  const audioListeners = [];

  const publish = (patch = {}) => {
    if (disposed) return;
    state = { ...state, ...patch };
    state.currentTime = finiteTime(state.currentTime);
    state.duration = finiteTime(state.duration);
    state.currentSong = queue.find((song) => song.id === state.songId) || null;
    onState({ ...state });
  };

  const reportError = (error) => publish({ isPlaying: false, error: error?.message || 'Không thể phát bài này. Hãy kiểm tra file và quyền thư mục.' });
  const execute = (operation) => {
    commandChain = commandChain.then(async () => {
      if (disposed) return;
      try { await operation(); } catch (error) { reportError(error); }
    });
    return commandChain;
  };
  const sync = async () => {
    if (native) publish(await native.getState());
  };
  const nativeCommand = (method, args) => execute(async () => {
    publish({ error: null });
    await native[method](args);
    await sync();
  });

  const playBrowserSong = async (song) => {
    const index = queue.findIndex((item) => item.id === song.id);
    if (index < 0) return;
    publish({ songId: song.id, currentIndex: index, currentTime: 0, duration: song.duration, isPlaying: false, error: null });
    audio.src = song.url;
    await audio.play();
    publish({ isPlaying: !audio.paused });
  };

  const moveBrowser = async (direction, ended = false) => {
    if (!queue.length) return;
    let index = queue.findIndex((song) => song.id === state.songId);
    if (ended && state.repeatMode === 'one') {
      audio.currentTime = 0;
      await audio.play();
      return;
    }
    if (direction < 0 && audio.currentTime > 3) {
      audio.currentTime = 0;
      publish({ currentTime: 0 });
      return;
    }
    if (state.shuffle && queue.length > 1) {
      index = (Math.max(index, 0) + 1 + Math.floor(random() * (queue.length - 1))) % queue.length;
    } else {
      index += direction;
      if (index >= queue.length) {
        if (state.repeatMode === 'all') index = 0;
        else { audio.pause(); publish({ isPlaying: false }); return; }
      }
      if (index < 0) index = queue.length - 1;
    }
    await playBrowserSong(queue[index]);
  };

  async function initialize() {
    if (native) {
      nativeListener = await native.addListener('stateChanged', (nextState) => publish(nextState));
      if (disposed) { await nativeListener.remove(); return; }
      await sync();
      return;
    }
    audio = audioFactory();
    audio.preload = 'metadata';
    const listen = (event, handler) => { audio.addEventListener(event, handler); audioListeners.push([event, handler]); };
    listen('timeupdate', () => publish({ currentTime: audio.currentTime }));
    listen('durationchange', () => publish({ duration: audio.duration }));
    listen('play', () => publish({ isPlaying: true, error: null }));
    listen('pause', () => publish({ isPlaying: false }));
    listen('ended', () => { publish({ isPlaying: false }); execute(() => moveBrowser(1, true)); });
    listen('error', () => reportError(new Error('Không tải được nhạc mẫu. Kiểm tra Internet rồi chọn lại bài.')));
    publish();
  }
  const ready = initialize().catch(reportError);
  commandChain = ready;

  return {
    ready,
    getState: () => ({ ...state }),
    setQueue(songs) {
      queue = songs;
      publish(native ? {} : { currentIndex: queue.findIndex((song) => song.id === state.songId) });
    },
    playSong(song) {
      const startIndex = queue.findIndex((item) => item.id === song.id);
      if (startIndex < 0) return Promise.resolve();
      return native
        ? nativeCommand('setQueue', { songs: queue, startIndex, autoplay: true })
        : execute(() => playBrowserSong(song));
    },
    play() {
      return native ? nativeCommand('play') : execute(async () => {
        if (!state.currentSong) return;
        publish({ error: null });
        if (audio.ended) audio.currentTime = 0;
        await audio.play();
      });
    },
    pause: () => native ? nativeCommand('pause') : execute(() => audio.pause()),
    next: () => native ? nativeCommand('next') : execute(() => moveBrowser(1)),
    previous: () => native ? nativeCommand('previous') : execute(() => moveBrowser(-1)),
    seek(time) {
      const bounded = Math.min(finiteTime(time), state.duration || finiteTime(time));
      return native ? nativeCommand('seek', { time: bounded }) : execute(() => { audio.currentTime = bounded; publish({ currentTime: bounded }); });
    },
    setShuffle(enabled) {
      return native ? nativeCommand('setShuffle', { enabled }) : execute(() => publish({ shuffle: enabled }));
    },
    setRepeat(mode) {
      if (!['off', 'all', 'one'].includes(mode)) return Promise.resolve();
      return native ? nativeCommand('setRepeat', { mode }) : execute(() => publish({ repeatMode: mode }));
    },
    refresh: () => execute(sync),
    stop() {
      return native ? nativeCommand('stop') : execute(() => {
        audio.pause(); audio.removeAttribute('src'); audio.load();
        publish({ ...INITIAL_PLAYER_STATE, shuffle: state.shuffle, repeatMode: state.repeatMode });
      });
    },
    dismissError: () => publish({ error: null }),
    dispose() {
      disposed = true;
      if (nativeListener) nativeListener.remove();
      if (audio) {
        for (const [event, handler] of audioListeners) audio.removeEventListener(event, handler);
        audio.pause(); audio.removeAttribute('src'); audio.load();
      }
    },
  };
}
