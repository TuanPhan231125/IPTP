import React from 'react';

export default function VinylDisc({ coverArt, isPlaying }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', margin: '2rem 0' }}>
      <div 
        style={{
          width: '280px', height: '280px', borderRadius: '50%',
          backgroundColor: '#111', position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5), 0 0 20px rgba(108, 92, 231, 0.2)',
          backgroundImage: coverArt ? `url(${coverArt})` : 'linear-gradient(45deg, #111, #222)',
          backgroundSize: 'cover', backgroundPosition: 'center',
          animation: 'spin 8s linear infinite',
          animationPlayState: isPlaying ? 'running' : 'paused'
        }}
      >
        <style>
          {`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}
        </style>
        
        {/* Vinyl Grooves Overlay */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          borderRadius: '50%',
          background: 'repeating-radial-gradient(circle, transparent, transparent 4px, rgba(0,0,0,0.1) 4px, rgba(0,0,0,0.1) 5px)',
          boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)'
        }} />
        
        {/* Center Hole */}
        <div style={{
          width: '30px', height: '30px', borderRadius: '50%',
          backgroundColor: '#fff', position: 'relative', zIndex: 10,
          border: '4px solid #333'
        }} />
      </div>
    </div>
  );
}
