import { describe, it } from 'node:test';
import assert from 'node:assert';
import { formatTime } from '../src/utils/formatTime.js';
import { isAudioFile, isVideoFile } from '../src/utils/fileTypes.js';

// Test cơ bản cho utils — chạy bằng `node --test`

describe('formatTime', () => {

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
