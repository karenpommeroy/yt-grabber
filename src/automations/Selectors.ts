export const AlbumsHrefSelector = "//ytmusic-app-layout//div[@id='content']/ytmusic-browse-response//ytmusic-section-list-renderer//div[@id='content-group']//div[contains(@class, 'header-renderer')]/yt-formatted-string/a[contains(text(), 'Album')]";

export const SinglesHrefSelector = "//ytmusic-app-layout//div[@id='content']/ytmusic-browse-response//ytmusic-section-list-renderer//div[@id='content-group']//div[contains(@class, 'header-renderer')]/yt-formatted-string/a[contains(text(), 'Single')]";

export const AlbumFilterSelector = "//ytmusic-app-layout//div[@id='content']/ytmusic-browse-response//ytmusic-section-list-renderer/div[@id='header']//iron-selector//ytmusic-chip-cloud-chip-renderer[not(@is-selected)]//a[contains(@title, 'Album')]";

export const SingleFilterSelector = "//ytmusic-app-layout//div[@id='content']/ytmusic-browse-response//ytmusic-section-list-renderer/div[@id='header']//iron-selector//ytmusic-chip-cloud-chip-renderer[not(@is-selected)]//a[contains(@title, 'Single')]";

export const AlbumLinkSelector = "//ytmusic-app-layout//div[@id='content']/ytmusic-browse-response//ytmusic-section-list-renderer/div[@id='contents']/ytmusic-grid-renderer/div[@id='items']/*[contains(@class, 'ytmusic-grid-renderer')]//a[contains(@class, 'yt-simple-endpoint') and contains(@class, 'yt-formatted-string')]";

export const SingleLinkSelector = "//ytmusic-app-layout//div[@id='content']/ytmusic-browse-response//ytmusic-section-list-renderer/div[@id='contents']/ytmusic-grid-renderer/div[@id='items']/*[contains(@class, 'ytmusic-grid-renderer')]//a[contains(@class, 'yt-simple-endpoint') and contains(@class, 'yt-formatted-string')]";

export const AlbumsDirectLinkSelector = "//ytmusic-app-layout//div[@id='content']/ytmusic-browse-response//ytmusic-section-list-renderer//div[@id='content-group']//div[contains(@class, 'header-renderer')]/yt-formatted-string[contains(text(), 'Album')]//ancestor::div[contains(@class, 'ytmusic-shelf')]//div[@id='items-wrapper']/ul/*[contains(@class, 'ytmusic-carousel')]//a[contains(@class, 'yt-simple-endpoint') and contains(@class, 'yt-formatted-string')]";

export const SinglesDirectLinkSelector = "//ytmusic-app-layout//div[@id='content']/ytmusic-browse-response//ytmusic-section-list-renderer//div[@id='content-group']//div[contains(@class, 'header-renderer')]/yt-formatted-string/a[contains(text(), 'Single')]//ancestor::div[contains(@class, 'ytmusic-shelf')]//div[@id='items-wrapper']/ul/*[contains(@class, 'ytmusic-carousel')]//a[contains(@class, 'yt-simple-endpoint') and contains(@class, 'yt-formatted-string')]";

export const YtMusicSearchInputSelector = "//ytmusic-app-layout//ytmusic-search-box//input[@id='input']";

export const YtMusicArtistsChipSelector = "//ytmusic-app-layout//ytmusic-search-page//div[contains(@class, 'content')]//ytmusic-section-list-renderer//ytmusic-chip-cloud-renderer//iron-selector[@id='chips']//a[contains(@class, 'ytmusic-chip-cloud-chip-renderer')]//yt-formatted-string[contains(text(), 'Wykonawcy') or contains(text(), 'Artists')]//ancestor::a";

export const YtMusicArtistBestResultLinkSelector = "//ytmusic-app-layout//div[@id='content']/ytmusic-search-page//ytmusic-section-list-renderer//div[@id='contents']//ytmusic-card-shelf-renderer//div[contains(@class, 'card-container')]//div[contains(@class, 'card-content-container')]//a[contains(@class, 'yt-simple-endpoint') and contains(@class, 'thumbnail-link')]";

export const YtMusicAlbumsChipSelector = "//ytmusic-app-layout//ytmusic-search-page//div[contains(@class, 'content')]//ytmusic-section-list-renderer//ytmusic-chip-cloud-renderer//iron-selector[@id='chips']//a[contains(@class, 'ytmusic-chip-cloud-chip-renderer')]//yt-formatted-string[contains(text(), 'Albumy') or contains(text(), 'Albums')]//ancestor::a";

export const YtMusicSongsChipSelector = "//ytmusic-app-layout//ytmusic-search-page//div[contains(@class, 'content')]//ytmusic-section-list-renderer//ytmusic-chip-cloud-renderer//iron-selector[@id='chips']//a[contains(@class, 'ytmusic-chip-cloud-chip-renderer')]//yt-formatted-string[contains(text(), 'Utwory') or contains(text(), 'Songs')]//ancestor::a";

export const YtMusicSearchResultsSelector = "//ytmusic-app-layout//div[@id='content']//ytmusic-search-page//div[@id='contents']//ytmusic-shelf-renderer//div[@id='contents']//ytmusic-responsive-list-item-renderer/a";
