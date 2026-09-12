import React from 'react';

export default function MiniPlayer({ song, isPlaying, onTogglePlay, togglePlay, onTap }) {
  const handleTogglePlay = onTogglePlay || togglePlay;
  
  return (
    <div 
      style={{
        position: 'absolute', bottom: '0', left: '0', right: '0',
        height: '70px', backgroundColor: 'rgba(26, 26, 46, 0.95)',
        backdropFilter: 'blur(10px)', borderTop: '1px solid var(--bg-card)',
        display: 'flex', alignItems: 'center', padding: '0 16px', zIndex: 50,
        boxShadow: '0 -4px 10px rgba(0,0,0,0.2)'
      }}
    >
      <div 
        onClick={onTap}
        style={{ flex: 1, display: 'flex', alignItems: 'center', cursor: 'pointer', overflow: 'hidden' }}
      >
        <div style={{
          width: '40px', height: '40px', borderRadius: '8px', overflow: 'hidden',
          backgroundColor: 'var(--bg-card)', flexShrink: 0, marginRight: '12px'
        }}>
          {song.coverArt ? (
             <img src={song.coverArt} alt={song.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
             <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🎵</div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <span style={{ fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.title}</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.artist}</span>
        </div>
      </div>
      
      <button 
        onClick={(e) => { e.stopPropagation(); if(handleTogglePlay) handleTogglePlay(); }}
        style={{
          width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.5rem', flexShrink: 0, marginLeft: '12px'
        }}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>
    </div>
  );
}
