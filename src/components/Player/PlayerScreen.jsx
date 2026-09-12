import React from 'react';
import VinylDisc from './VinylDisc';
import PlayerControls from './PlayerControls';

export default function PlayerScreen(props) {
  const { currentSong, isPlaying, onBack } = props;
  if (!currentSong) return null;
  return (
    <section className="player-screen" aria-label="Bài đang phát">
      {currentSong.coverArt && <div className="player-backdrop" style={{ backgroundImage: `url(${currentSong.coverArt})` }} />}
      <header className="player-header">
        <button aria-label="Trở lại thư viện" onClick={onBack}>⌄</button>
        <p className="eyebrow">ĐANG PHÁT TỪ THƯ VIỆN</p><span />
      </header>
      <div className="player-body">
        <VinylDisc coverArt={currentSong.coverArt} isPlaying={isPlaying} />
        <div className="song-heading">
          <h2>{currentSong.title}</h2>
          <p>{currentSong.artist}</p>
          <p className="album-name">{currentSong.album}</p>
        </div>
        <PlayerControls {...props} />
      </div>
    </section>
  );
}