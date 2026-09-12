import React from 'react';
import { formatTime } from '../../utils/formatTime';

export default function SongItem({ song, isActive, onClick }) {
  return (
    <div 
      onClick={() => onClick(song)}
      style={{
        display: 'flex', alignItems: 'center', padding: '12px 16px',
        borderBottom: '1px solid var(--bg-card)', cursor: 'pointer',
        backgroundColor: isActive ? 'rgba(108, 92, 231, 0.1)' : 'transparent',
        borderLeft: isActive ? '4px solid var(--accent)' : '4px solid transparent'
      }}
    >
      <div style={{
        width: '40px', height: '40px', borderRadius: '8px',
        backgroundColor: 'var(--bg-card)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', marginRight: '12px',
        overflow: 'hidden', flexShrink: 0
      }}>
        {song.coverArt ? (
          <img src={song.coverArt} alt={song.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: '1.2rem' }}>🎵</span>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ 
          color: isActive ? 'var(--accent-light)' : 'var(--text-primary)', 
          fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
        }}>
          {song.title}
        </div>
        <div style={{ 
          color: 'var(--text-secondary)', fontSize: '0.85rem',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
        }}>
          {song.artist}
        </div>
      </div>
      <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginLeft: '12px' }}>
        {formatTime(song.duration)}
      </div>
    </div>
  );
}
