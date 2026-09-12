export const readMetadata = (fileUrl) => {
  return new Promise((resolve) => {
    if (!window.jsmediatags) {
      const filename = fileUrl.split('/').pop() || 'Unknown';
      resolve({
        title: filename,
        artist: 'Nghệ sĩ chưa biết',
        album: 'Album chưa biết',
        coverArt: null
      });
      return;
    }

    window.jsmediatags.read(fileUrl, {
      onSuccess: function(tag) {
        const tags = tag.tags;
        let coverArt = null;

        if (tags.picture) {
          let base64String = "";
          for (let i = 0; i < tags.picture.data.length; i++) {
              base64String += String.fromCharCode(tags.picture.data[i]);
          }
          coverArt = `data:${tags.picture.format};base64,${window.btoa(base64String)}`;
        }

        resolve({
          title: tags.title || fileUrl.split('/').pop(),
          artist: tags.artist || 'Nghệ sĩ chưa biết',
          album: tags.album || 'Album chưa biết',
          coverArt
        });
      },
      onError: function(error) {
        console.warn("Metadata error", error);
        resolve({
          title: fileUrl.split('/').pop(),
          artist: 'Nghệ sĩ chưa biết',
          album: 'Album chưa biết',
          coverArt: null
        });
      }
    });
  });
};
