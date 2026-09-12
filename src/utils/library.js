export function normalizeSongs(files) {
  const unique = new Map();
  for (const file of files) {
    if (file.type && file.type !== 'audio') continue;
    const url = file.path || file.url;
    if (!url) continue;
    const fallback = (file.name || url.split('/').pop() || 'Bài hát').replace(/\.[^/.]+$/, '');
    unique.set(url, {
      id: file.id || url, url, title: file.title?.trim() || fallback,
      artist: file.artist?.trim() || 'Nghệ sĩ chưa biết', album: file.album?.trim() || 'Album chưa biết',
      coverArt: file.coverArt || null, duration: Number.isFinite(file.duration) ? Math.max(0, file.duration) : 0,
      type: 'audio', extension: file.extension || '', size: file.size || 0,
    });
  }
  return [...unique.values()].sort((a, b) => a.title.localeCompare(b.title, 'vi', { numeric: true }) || a.id.localeCompare(b.id));
}

export function filterAndSortSongs(songs, query, sortBy = 'title') {
  const needle = query.trim().toLocaleLowerCase('vi');
  const field = ['title', 'artist', 'album'].includes(sortBy) ? sortBy : 'title';
  return songs.filter((song) => [song.title, song.artist, song.album].some((value) => value.toLocaleLowerCase('vi').includes(needle)))
    .sort((a, b) => a[field].localeCompare(b[field], 'vi', { numeric: true }) || a.title.localeCompare(b.title, 'vi', { numeric: true }) || a.id.localeCompare(b.id));
}