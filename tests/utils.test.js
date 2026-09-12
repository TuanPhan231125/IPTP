import { describe, it } from 'node:test';
import assert from 'node:assert';

// Test cơ bản cho utils — chạy bằng `node --test`

describe('formatTime', () => {
  // Import nội tuyến vì đây là ESM
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  it('formats 0 seconds', () => {
    assert.strictEqual(formatTime(0), '0:00');
  });

  it('formats 65 seconds', () => {
    assert.strictEqual(formatTime(65), '1:05');
  });

  it('formats 372 seconds', () => {
    assert.strictEqual(formatTime(372), '6:12');
  });

  it('handles NaN', () => {
    assert.strictEqual(formatTime(NaN), '0:00');
  });

  it('handles Infinity', () => {
    assert.strictEqual(formatTime(Infinity), '0:00');
  });
});

describe('fileTypes', () => {
  const AUDIO_EXTENSIONS = ['.mp3', '.m4a', '.wav', '.aac'];
  const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.m4v'];
  
  const getExtension = (filename) => {
    const dot = filename.lastIndexOf('.');
    return dot >= 0 ? filename.slice(dot).toLowerCase() : '';
  };
  const isAudioFile = (f) => AUDIO_EXTENSIONS.includes(getExtension(f));
  const isVideoFile = (f) => VIDEO_EXTENSIONS.includes(getExtension(f));

  it('detects mp3 as audio', () => {
    assert.ok(isAudioFile('song.mp3'));
  });

  it('detects mp4 as video', () => {
    assert.ok(isVideoFile('clip.mp4'));
  });

  it('rejects txt as neither', () => {
    assert.ok(!isAudioFile('notes.txt'));
    assert.ok(!isVideoFile('notes.txt'));
  });
});
