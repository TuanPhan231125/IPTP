import React, { useState, useEffect } from 'react';
import FolderPickerScreen from './components/FolderPicker/FolderPickerScreen';
import LibraryScreen from './components/Library/LibraryScreen';
import PlayerScreen from './components/Player/PlayerScreen';
import MiniPlayer from './components/Player/MiniPlayer';
import useLibrary from './hooks/useLibrary';
import useAudioPlayer from './hooks/useAudioPlayer';

export default function App() {
  const [showPlayer, setShowPlayer] = useState(false);
  const [isPicking, setIsPicking] = useState(false);
  const library = useLibrary();
  const player = useAudioPlayer();
  const { setQueue, stop } = player;

  useEffect(() => { setQueue(library.songs); }, [library.songs, setQueue]);
  useEffect(() => {
    if (!library.folderSelected && !library.isLoading) setShowPlayer(false);
  }, [library.folderSelected, library.isLoading]);

  const pickFolder = async () => {
    if (isPicking) return;
    setIsPicking(true);
    try {
      const success = await library.pickFolder();
      if (success) { await stop(); setShowPlayer(false); }
    } finally { setIsPicking(false); }
  };

  const chooseSong = (song) => {
    player.playSong(song);
    setShowPlayer(true);
  };

  return (
    <div className="app-container">
      {!library.folderSelected ? (
        <FolderPickerScreen onPickFolder={pickFolder} error={library.error} isLoading={library.isLoading || isPicking} isDemo={library.isDemo} />
      ) : (
        <div className="library-page">
          <LibraryScreen
            songs={library.songs} currentSong={player.currentSong}
            isLoading={library.isLoading} isPicking={isPicking}
            error={library.error} isDemo={library.isDemo} folderPath={library.folderPath}
            onSongSelect={chooseSong} onRefresh={library.refreshLibrary} onChangeFolder={pickFolder}
          />
          {player.currentSong && (
            <MiniPlayer song={player.currentSong} isPlaying={player.isPlaying}
              onTogglePlay={player.togglePlay} onTap={() => setShowPlayer(true)} />
          )}
        </div>
      )}
      {showPlayer && player.currentSong && (
        <PlayerScreen {...player} onBack={() => setShowPlayer(false)} />
      )}
      {player.error && (
        <div className="error-toast" role="alert">
          <span>{player.error}</span>
          <button aria-label="Đóng thông báo" onClick={player.dismissError}>✕</button>
        </div>
      )}
    </div>
  );
}