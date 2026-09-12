import React, { useMemo, useState } from 'react';
import SongList from './SongList';
import { filterAndSortSongs } from '../../utils/library.js';

export default function LibraryScreen({ songs, currentSong, isLoading, isPicking, error, isDemo, folderPath, onSongSelect, onRefresh, onChangeFolder }) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('title');
  const filteredSongs = useMemo(() => filterAndSortSongs(songs, search, sortBy), [songs, search, sortBy]);

  return (
    <div className={`library-content ${currentSong ? 'with-mini-player' : ''}`}>
      <header className="library-header">
        <div>
          <p className="eyebrow">VIBEPLAYER</p>
          <h1>Thư viện nhạc</h1>
          <p className="muted small" title={folderPath}>{songs.length} bài hát{isDemo ? ' · Nhạc mẫu trực tuyến' : ''}</p>
        </div>
        <div className="header-actions">
          <button aria-label="Quét lại thư mục" title="Quét lại thư mục" disabled={isLoading || isPicking} onClick={onRefresh}>↻</button>
          <button aria-label="Đổi thư mục" title="Đổi thư mục" disabled={isLoading || isPicking} onClick={onChangeFolder}>📂</button>
        </div>
      </header>
      <div className="library-filters">
        <input aria-label="Tìm bài, nghệ sĩ hoặc album" type="search" placeholder="Tìm bài, nghệ sĩ, album…" value={search} onChange={(event) => setSearch(event.target.value)} />
        <label className="sort-label">Sắp xếp
          <select aria-label="Sắp xếp thư viện" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            <option value="title">Tên bài</option><option value="artist">Nghệ sĩ</option><option value="album">Album</option>
          </select>
        </label>
      </div>
      {isDemo && <p className="demo-banner">Đang xem thử bằng nhạc Internet. Import nhạc local hoạt động trong app iPhone.</p>}
      {error && <p className="inline-error" role="alert">{error}</p>}
      {isLoading ? <div className="empty-state" role="status">Đang đọc nhạc và ảnh bìa…</div>
        : <SongList songs={filteredSongs} currentSong={currentSong} onSongSelect={onSongSelect} />}
    </div>
  );
}