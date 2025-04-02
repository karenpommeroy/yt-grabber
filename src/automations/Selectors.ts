export const AlbumsHrefSelector = "//ytmusic-app-layout//div[@id='content']/ytmusic-browse-response//ytmusic-section-list-renderer//div[@id='content-group']//div[contains(@class, 'header-renderer')]/yt-formatted-string/a[contains(text(), 'Album')]";

export const AlbumFilterSelector = "//ytmusic-app-layout//div[@id='content']/ytmusic-browse-response//ytmusic-section-list-renderer/div[@id='header']//iron-selector//a[contains(@title, 'Album')]";

export const AlbumLinkSelector = "//ytmusic-app-layout//div[@id='content']/ytmusic-browse-response//ytmusic-section-list-renderer/div[@id='contents']/ytmusic-grid-renderer/div[@id='items']/*[contains(@class, 'ytmusic-grid-renderer')]//a[contains(@class, 'yt-simple-endpoint') and contains(@class, 'yt-formatted-string')]";

export const AlbumsDirectLinkSelector = "//ytmusic-app-layout//div[@id='content']/ytmusic-browse-response//ytmusic-section-list-renderer//div[@id='content-group']//div[contains(@class, 'header-renderer')]/yt-formatted-string[contains(text(), 'Album')]//ancestor::div[contains(@class, 'ytmusic-shelf')]//div[@id='items-wrapper']/ul/*[contains(@class, 'ytmusic-carousel')]//a[contains(@class, 'yt-simple-endpoint') and contains(@class, 'yt-formatted-string')]";
