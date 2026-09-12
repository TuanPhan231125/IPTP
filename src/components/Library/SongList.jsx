import React from 'react';
import SongItem from './SongItem';

export default function SongList({ songs, currentSong, onSongSelect }) {
  if (!songs || songs.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Không tìm thấy bài hát nào
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      {songs.map((song) => (
        <SongItem 
          key={song.id} 
          song={song} 
          isActive={currentSong?.id === song.id}
          onClick={onSongSelect}
        />
      ))}
    </div>
  );
}
