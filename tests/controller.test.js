import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createPlayerController } from '../src/player/controller.js';
import { normalizeSongs } from '../src/utils/library.js';

const songs = normalizeSongs([
  { path: '/music/first.mp3', id: 'first', title: 'First', duration: 60 },
  { path: '/music/second.mp3', id: 'second', title: 'Second', duration: 90 },
]);

function nativeStub() {
  let state = { songId: null, currentIndex: -1, isPlaying: false, currentTime: 0, duration: 0, shuffle: false, repeatMode: 'off', error: null };
  let listener;
  const calls = [];
  const native = {
    async addListener(name, handler) { assert.equal(name, 'stateChanged'); listener = handler; return { remove() { listener = null; } }; },
    async getState() { return state; },
    async setQueue(args) { calls.push(['setQueue', args]); state = { ...state, songId: args.songs[args.startIndex].id, currentIndex: args.startIndex, duration: 60, isPlaying: true }; },
    async setRepeat(args) { calls.push(['setRepeat', args]); state.repeatMode = args.mode; },
    async setShuffle(args) { calls.push(['setShuffle', args]); state.shuffle = args.enabled; },
    async seek(args) { calls.push(['seek', args]); state.currentTime = args.time; },
    async play() { state.isPlaying = true; },
    async pause() { state.isPlaying = false; },
    async next() {}, async previous() {},
    async stop() { state = { ...state, songId: null, currentIndex: -1, isPlaying: false }; },
  };
  return { native, calls, emit(patch) { state = { ...state, ...patch }; listener?.(state); } };
}

test('native commands use the exported Swift contract and native state drives the UI', async () => {
  const stub = nativeStub();
  const player = createPlayerController({ native: stub.native, onState() {} });
  await player.ready;
  player.setQueue(songs);
  await player.playSong(songs[0]);
  assert.deepEqual(stub.calls[0], ['setQueue', { songs, startIndex: 0, autoplay: true }]);
  assert.equal(player.getState().currentSong.id, 'first');
  // The native queue advances while JS is backgrounded; no JS next call is required.
  stub.emit({ songId: 'second', currentIndex: 1, currentTime: 12, duration: 90 });
  assert.equal(player.getState().currentSong.id, 'second');
  assert.equal(player.getState().currentTime, 12);
  await player.setRepeat('one');
  await player.setShuffle(true);
  await player.seek(999);
  assert.equal(player.getState().repeatMode, 'one');
  assert.equal(player.getState().shuffle, true);
  assert.equal(player.getState().currentTime, 90);
  player.dispose();
});

test('failed native playback reports an error instead of showing a playing disc', async () => {
  const stub = nativeStub();
  stub.native.setQueue = async () => { throw new Error('Không còn quyền đọc thư mục'); };
  const player = createPlayerController({ native: stub.native, onState() {} });
  await player.ready;
  player.setQueue(songs);
  await player.playSong(songs[0]);
  assert.equal(player.getState().isPlaying, false);
  assert.match(player.getState().error, /quyền/);
  await player.stop();
  assert.equal(player.getState().currentSong, null);
  player.dispose();
});

test('every frontend native command is exported by the Swift plugin', () => {
  const source = readFileSync(new URL('../ios/App/App/NativeAudioPlugin.swift', import.meta.url), 'utf8');
  for (const method of ['setQueue', 'getState', 'play', 'pause', 'next', 'previous', 'seek', 'setShuffle', 'setRepeat', 'stop']) {
    assert.ok(source.includes(`CAPPluginMethod(name: "${method}"`), `Missing bridge export ${method}`);
    assert.match(source, new RegExp(`@objc func ${method}\\(`));
  }
});

test('metadata normalization keeps duplicate filenames from different subfolders distinct', () => {
  const result = normalizeSongs([
    { path: '/music/a/song.mp3', name: 'song.mp3', artist: 'A', duration: NaN },
    { path: '/music/b/song.mp3', name: 'song.mp3', artist: 'B', coverArt: 'data:image/jpeg;base64,test' },
    { path: '/music/video.mp4', type: 'video' },
  ]);
  assert.equal(result.length, 2);
  assert.notEqual(result[0].id, result[1].id);
  assert.equal(result[0].duration, 0);
  assert.ok(result[1].coverArt);
});
