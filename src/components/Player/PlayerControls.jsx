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

  const [dragTime, setDragTime] = React.useState(null);
  const safeDuration = Number.isFinite(duration) ? Math.max(0, duration) : 0;
  const safeTime = Math.min(Number.isFinite(currentTime) ? Math.max(0, currentTime) : 0, safeDuration);
  const displayTime = dragTime !== null ? dragTime : safeTime;
  const finishDrag = () => { if (dragTime !== null) { handleSeek(dragTime); setDragTime(null); } };
  return (
    <div className="player-controls">
      <div className="progress-section">
        <input aria-label="Tua bAi hAt" type="range" min="0" max={safeDuration || 1}
          step="0.1" value={displayTime} disabled={!safeDuration} 
          onChange={(event) => setDragTime(Number(event.target.value))}
          onPointerUp={finishDrag} onTouchEnd={finishDrag} />
        <div className="progress-labels"><span>{formatTime(displayTime)}</span><span>{formatTime(safeDuration)}</span></div>
      </div>
      <div className="transport-controls">
        <button aria-label="PhÃ¡t ngáº«u nhiÃªn" aria-pressed={shuffle} onClick={handleToggleShuffle} className={shuffle ? 'active' : ''}><Icon name="shuffle"/></button>
        <button aria-label="BÃ i trÆ°á»›c" onClick={handlePrev}><Icon name="previous" size={28}/></button>
        <button aria-label={isPlaying ? 'Táº¡m dá»«ng' : 'PhÃ¡t nháº¡c'} className="play-button" onClick={handleTogglePlay}><Icon name={isPlaying ? "pause" : "play"} size={30}/></button>
        <button aria-label="BÃ i tiáº¿p theo" onClick={handleNext}><Icon name="next" size={28}/></button>
        <button aria-label={repeatMode === 'one' ? 'Láº·p má»™t bÃ i' : repeatMode === 'all' ? 'Láº·p thÆ° viá»‡n' : 'KhÃ´ng láº·p'}
          aria-pressed={repeatMode !== 'off'} onClick={handleToggleRepeat} className={repeatMode !== 'off' ? 'active' : ''}>
          <Icon name="repeat"/>{repeatMode === "one" && <sup>1</sup>}
        </button>
      </div>
    </div>
  );
}
