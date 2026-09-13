import React from 'react';
import Icon from '../Icon';
import { formatTime } from '../../utils/formatTime';

export default function PlayerControls({
  isPlaying, togglePlay, prev, next, seek, currentTime, duration,
  shuffle, repeatMode, toggleShuffle, toggleRepeat,
  onTogglePlay, onPrev, onNext, onSeek, onToggleShuffle, onToggleRepeat
}) {
  const handleTogglePlay = onTogglePlay || togglePlay;
  const handlePrev = onPrev || prev;
  const handleNext = onNext || next;
  const handleSeek = onSeek || seek;
  const handleToggleShuffle = onToggleShuffle || toggleShuffle;
  const handleToggleRepeat = onToggleRepeat || toggleRepeat;

  const safeDuration = Number.isFinite(duration) ? Math.max(0, duration) : 0;
  const safeTime = Math.min(Number.isFinite(currentTime) ? Math.max(0, currentTime) : 0, safeDuration);
  return (
    <div className="player-controls">
      <div className="progress-section">
        <input aria-label="Tua bài hát" type="range" min="0" max={safeDuration || 1}
          step="0.1" value={safeTime} disabled={!safeDuration} onChange={(event) => handleSeek(Number(event.target.value))} />
        <div className="progress-labels"><span>{formatTime(safeTime)}</span><span>{formatTime(safeDuration)}</span></div>
      </div>
      <div className="transport-controls">
        <button aria-label="Phát ngẫu nhiên" aria-pressed={shuffle} onClick={handleToggleShuffle} className={shuffle ? 'active' : ''}><Icon name="shuffle"/></button>
        <button aria-label="Bài trước" onClick={handlePrev}><Icon name="previous" size={28}/></button>
        <button aria-label={isPlaying ? 'Tạm dừng' : 'Phát nhạc'} className="play-button" onClick={handleTogglePlay}><Icon name={isPlaying ? "pause" : "play"} size={30}/></button>
        <button aria-label="Bài tiếp theo" onClick={handleNext}><Icon name="next" size={28}/></button>
        <button aria-label={repeatMode === 'one' ? 'Lặp một bài' : repeatMode === 'all' ? 'Lặp thư viện' : 'Không lặp'}
          aria-pressed={repeatMode !== 'off'} onClick={handleToggleRepeat} className={repeatMode !== 'off' ? 'active' : ''}>
          <Icon name="repeat"/>{repeatMode === "one" && <sup>1</sup>}
        </button>
      </div>
    </div>
  );
}