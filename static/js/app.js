    'use strict';

    // ── i18n Translation Helper ───────────────────────────────
    const t = (key, params) => (window.i18n ? window.i18n.t(key, params) : (window.t ? window.t(key, params) : key));

    // ── DOM refs ──────────────────────────────────────────────
    const $form = document.getElementById('search-form');
    const $input = document.getElementById('search-input');
    const $searchClearBtn = document.getElementById('btn-search-clear');
    const $searchSuggestions = document.getElementById('search-suggestions');
    const $searchBtn = document.getElementById('search-btn');
    const $loading = document.getElementById('loading');
    const $loadingText = document.getElementById('loading-text');
    const $emptyState = document.getElementById('empty-state');
    const $errorState = document.getElementById('error-state');
    const $errorMsg = document.getElementById('error-msg');
    const $noResults = document.getElementById('no-results-state');
    const $results = document.getElementById('results');
    const $grid = document.getElementById('results-grid');
    const $count = document.getElementById('results-count');
    const $toastWrap = document.getElementById('toast-container');

    // Pagination elements
    const $limitSelect = document.getElementById('limit-select');
    const $paginationControls = document.getElementById('pagination-controls');
    const $btnFirst = document.getElementById('btn-first');
    const $btnPrev = document.getElementById('btn-prev');
    const $btnNext = document.getElementById('btn-next');
    const $btnLast = document.getElementById('btn-last');
    const $paginationPages = document.getElementById('pagination-pages');
    const $pageCurrent = document.getElementById('page-current');
    const $pageTotal = document.getElementById('page-total');
    const $globalQualityGlider = document.getElementById('global-quality-glider');

    // Artist & Mode DOM refs
    const $searchModeGlider = document.getElementById('search-mode-glider');
    const $tabModeSongs = document.getElementById('tab-mode-songs');
    const $tabModeArtists = document.getElementById('tab-mode-artists');
    const $artistSearchResults = document.getElementById('artist-search-results');
    const $artistResultsGrid = document.getElementById('artist-results-grid');
    const $artistResultsCount = document.getElementById('artist-results-count');
    const $artistSuggestionsBar = document.getElementById('artist-suggestions-bar');
    const $artistSuggestionChips = document.getElementById('artist-suggestion-chips');
    const $artistLoadMoreWrap = document.getElementById('artist-load-more-wrap');
    const $btnLoadMoreArtists = document.getElementById('btn-load-more-artists');
    const $btnLoadMoreArtistsLabel = document.getElementById('btn-load-more-artists-label');

    // Artist Discography DOM refs
    const $artistView = document.getElementById('artist-view');
    const $btnBackArtist = document.getElementById('btn-back-artist');
    const $artistAvatar = document.getElementById('artist-avatar');
    const $artistName = document.getElementById('artist-name');
    const $artistGenre = document.getElementById('artist-genre');
    const $artistStats = document.getElementById('artist-stats');
    const $tabTopSongs = document.getElementById('tab-top-songs');
    const $tabAlbums = document.getElementById('tab-albums');
    const $panelTopSongs = document.getElementById('panel-top-songs');
    const $panelAlbums = document.getElementById('panel-albums');
    const $topSongsList = document.getElementById('top-songs-list');
    const $albumsGrid = document.getElementById('albums-grid');
    const $btnSelectAllTop = document.getElementById('btn-select-all-top');
    const $topSongsLimitSelect = document.getElementById('top-songs-limit-select');
    const $topSongsSubtitle = document.getElementById('top-songs-subtitle');

    // Favorites DOM refs
    const $tabModeFavorites = document.getElementById('tab-mode-favorites');
    const $tabFavBadge = document.getElementById('tab-fav-badge');
    const $favoritesSection = document.getElementById('favorites-section');
    const $favoritesList = document.getElementById('favorites-list');
    const $favoritesCountPill = document.getElementById('favorites-count-pill');
    const $favoritesEmptyState = document.getElementById('favorites-empty-state');
    const $favoritesActionsBar = document.getElementById('favorites-actions-bar');
    const $btnFavPlayAll = document.getElementById('btn-fav-play-all');
    const $btnFavShuffle = document.getElementById('btn-fav-shuffle');
    const $btnFavDownloadAll = document.getElementById('btn-fav-download-all');
    const $btnFavExport = document.getElementById('btn-fav-export');
    const $btnFavImport = document.getElementById('btn-fav-import');
    const $favImportInput = document.getElementById('fav-import-input');
    const $btnFavClear = document.getElementById('btn-fav-clear');
    const $btnFavDiscover = document.getElementById('btn-fav-discover');
    const $btnFavEmptyImport = document.getElementById('btn-fav-empty-import');

    // Batch Action Bar DOM refs
    const $batchActionBar = document.getElementById('batch-action-bar');

    // ══════════════════════════════════════════════════════════════
    //  FAVORITES STORAGE & STATE MANAGER (v1.20.0)
    // ══════════════════════════════════════════════════════════════
    const FAV_STORAGE_KEY = 'melodyxx_favorites_v1';
    let favoritesQueue = [];
    let currentQueueIndex = -1;
    let isFavoritesAutoplay = false;

    /**
     * Intelligently parses artist name from video title if YouTube metadata returned 'Unknown'.
     * Supports:
     *   - 'Artist - Title' / 'Artist – Title' / 'Artist : Title'
     *   - 'Artist "Song Title" MV' / "Artist 'Song Title'"
     */
    function extractArtistFromTitle(title) {
      if (!title) return '';
      const raw = String(title).trim();
      // 1. Check for separators ' - ', ' – ', ' — ', ' : '
      const seps = [' - ', ' – ', ' — ', ' : '];
      for (const sep of seps) {
        if (raw.includes(sep)) {
          const parts = raw.split(sep);
          let cand = parts[0].trim();
          cand = cand.replace(/\[[^\]]*\]|\([^\)]*\)/g, '').trim();
          cand = cand.replace(/^(MV|M\/V|Official|Audio)\s+/i, '').trim();
          cand = cand.replace(/\s+(VEVO|Official|Topic)$/i, '').trim();
          if (cand && cand.length >= 2 && cand.length <= 60) {
            return cand;
          }
        }
      }
      // 2. Check for quotes e.g. TWICE "What is Love?" M/V or NewJeans 'Super Shy'
      const quoteMatch = raw.match(/^([^"'\u2018\u2019\u201c\u201d]+)\s*["'\u2018\u2019\u201c\u201d]/);
      if (quoteMatch && quoteMatch[1]) {
        let cand = quoteMatch[1].trim();
        cand = cand.replace(/\[[^\]]*\]|\([^\)]*\)/g, '').trim();
        if (cand && cand.length >= 2 && cand.length <= 60) {
          return cand;
        }
      }
      return '';
    }

    function getFavorites() {
      try {
        const raw = localStorage.getItem(FAV_STORAGE_KEY);
        const list = raw ? JSON.parse(raw) : [];
        let modified = false;
        list.forEach(item => {
          if (!item) return;
          const art = String(item.artist || item.channel || '').trim();
          if (!art || art.toLowerCase() === 'unknown' || art.toLowerCase() === 'unknown artist') {
            const parsed = extractArtistFromTitle(item.title);
            if (parsed) {
              item.artist = parsed;
              modified = true;
            }
          }
        });
        if (modified) {
          try { localStorage.setItem(FAV_STORAGE_KEY, JSON.stringify(list)); } catch (_) {}
        }
        return list;
      } catch (e) {
        console.warn('[Favorites] Failed to read from localStorage:', e);
        return [];
      }
    }

    function saveFavorites(list) {
      try {
        localStorage.setItem(FAV_STORAGE_KEY, JSON.stringify(list));
        updateFavoritesBadge();
        return true;
      } catch (e) {
        console.warn('[Favorites] Failed to write to localStorage:', e);
        toast('error', 'Storage full or inaccessible.');
        return false;
      }
    }

    function isFavorite(idOrUrlOrTrack) {
      if (!idOrUrlOrTrack) return false;
      const list = getFavorites();
      if (typeof idOrUrlOrTrack === 'object') {
        const tId = String(idOrUrlOrTrack.id || idOrUrlOrTrack.url || '').trim();
        if (tId && list.some(item => (item.id && String(item.id).trim() === tId) || (item.url && String(item.url).trim() === tId))) {
          return true;
        }
        if (idOrUrlOrTrack.title && idOrUrlOrTrack.artist) {
          const matchTitle = String(idOrUrlOrTrack.title).trim().toLowerCase();
          const matchArtist = String(idOrUrlOrTrack.artist).trim().toLowerCase();
          return list.some(item => item.title && item.artist && item.title.trim().toLowerCase() === matchTitle && item.artist.trim().toLowerCase() === matchArtist);
        }
        return false;
      }
      const cleanId = String(idOrUrlOrTrack).trim();
      return list.some(item => (item.id && String(item.id).trim() === cleanId) || (item.url && String(item.url).trim() === cleanId));
    }

    function updateFavoritesBadge() {
      if (!$tabFavBadge) return;
      const count = getFavorites().length;
      if (count > 0) {
        $tabFavBadge.textContent = count > 99 ? '99+' : count;
        $tabFavBadge.style.display = 'inline-flex';
      } else {
        $tabFavBadge.style.display = 'none';
      }
      // Re-align search glider immediately whenever badge visibility or count shifts tab dimensions
      if (typeof updateSearchModeGlider === 'function') {
        requestAnimationFrame(() => updateSearchModeGlider(false));
      }
    }

    function renderStarSvg(isActive) {
      if (isActive) {
        return `<svg class="fav-star-svg active" width="15" height="15" viewBox="0 0 24 24" fill="#fbbf24" stroke="#fbbf24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
      }
      return `<svg class="fav-star-svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
    }

    function updateMiniFavButton() {
      if (!$miniFavBtn) return;
      const track = currentPlayingTrackData;
      const trackId = currentPlayingTrackId || (track && (track.id || track.url));
      const isFav = isFavorite(trackId) || (track ? isFavorite(track) : false);
      $miniFavBtn.classList.toggle('active', isFav);
      $miniFavBtn.innerHTML = renderStarSvg(isFav);
      const label = isFav ? 'Remove from favorites' : 'Add to favorites';
      $miniFavBtn.setAttribute('aria-label', label);
      $miniFavBtn.setAttribute('title', label);
    }

    function updateAllFavStarButtons(trackId, isFav) {
      if (!trackId) {
        updateMiniFavButton();
        return;
      }
      const cleanId = String(trackId).trim();
      document.querySelectorAll('.btn-card-fav, .btn-track-fav').forEach(btn => {
        const bId = String(btn.dataset.id || btn.dataset.url || '').trim();
        if (bId === cleanId) {
          btn.classList.toggle('active', isFav);
          btn.innerHTML = renderStarSvg(isFav);
          const title = isFav ? 'Remove from favorites' : 'Add to favorites';
          btn.title = title;
          btn.setAttribute('aria-label', title);
        }
      });
      updateMiniFavButton();
    }

    function toggleFavorite(track) {
      if (!track) return false;
      const list = getFavorites();
      const trackId = track.id || track.url;
      const existingIndex = list.findIndex(item =>
        (item.id && trackId && item.id === trackId) ||
        (item.url && track.url && item.url === track.url) ||
        (item.title && track.title && item.artist && track.artist &&
         item.title.trim().toLowerCase() === track.title.trim().toLowerCase() &&
         item.artist.trim().toLowerCase() === track.artist.trim().toLowerCase())
      );

      let nowFav = false;
      if (existingIndex !== -1) {
        list.splice(existingIndex, 1);
        toast('info', `Removed "${track.title}" from Favorites.`);
      } else {
        const rawArt = track.artist || track.channel || '';
        const cleanArt = (!rawArt || rawArt.trim().toLowerCase() === 'unknown' || rawArt.trim().toLowerCase() === 'unknown artist')
          ? (extractArtistFromTitle(track.title) || 'Unknown Artist')
          : rawArt;

        list.unshift({
          id: trackId,
          url: track.url || '',
          title: track.title || 'Unknown Title',
          artist: cleanArt,
          album: track.album || '',
          duration: track.duration || '',
          thumbnail: track.thumbnail || track.artwork_url || '',
          preview_url: track.preview_url || '',
          added_at: Date.now()
        });
        nowFav = true;
        toast('success', `Saved "${track.title}" to Favorites.`);
      }

      saveFavorites(list);
      updateAllFavStarButtons(trackId, nowFav);

      if (isFavoritesAutoplay && currentPlayingTrackId) {
        favoritesQueue = [...list];
        const newIdx = favoritesQueue.findIndex(t => String(t.id || t.url).trim() === String(currentPlayingTrackId).trim());
        if (newIdx !== -1) {
          currentQueueIndex = newIdx;
        }
      }

      if (searchMode === 'favorites') {
        renderFavorites();
      }
      return nowFav;
    }
    const $batchCount = document.getElementById('batch-count');
    const $btnBatchClear = document.getElementById('btn-batch-clear');
    const $btnBatchDownload = document.getElementById('btn-batch-download');
    const $btnBatchDlText = document.getElementById('btn-batch-dl-text');

    // Batch Progress Widget DOM refs
    const $batchProgressWidget = document.getElementById('batch-progress-widget');
    const $batchProgressTitle = document.getElementById('batch-progress-title');
    const $batchProgressSub = document.getElementById('batch-progress-sub');
    const $batchProgressFill = document.getElementById('batch-progress-fill');
    const $batchProgressCount = document.getElementById('batch-progress-count');
    const $batchProgressStatus = document.getElementById('batch-progress-status');
    const $btnBatchCancel = document.getElementById('btn-batch-cancel');
    const $batchProgressActions = document.getElementById('batch-progress-actions');
    const $btnBatchRetry = document.getElementById('btn-batch-retry');
    const $btnBatchRetryText = document.getElementById('btn-batch-retry-text');
    const $btnBatchDismiss = document.getElementById('btn-batch-dismiss');
    const $batchSpinner = document.getElementById('batch-spinner');

    // Release Log / What's New DOM refs
    const $btnReleaseLog = document.getElementById('btn-open-release-log') || document.getElementById('btn-release-log');
    const $releaseLogBadge = document.getElementById('release-log-badge');
    const $releaseLogModal = document.getElementById('release-log-modal');
    const $releaseLogCard = document.getElementById('release-modal-card');
    const $btnReleaseClose = document.getElementById('btn-release-close');
    const $releaseModalBody = document.getElementById('release-modal-body');
    const $releaseSearchInput = document.getElementById('release-search-input');
    const $releaseSearchClear = document.getElementById('release-search-clear');
    const $releaseVersionSelect = document.getElementById('release-version-select');
    const $releaseTypeChips = document.getElementById('release-type-chips');
    const $releaseFooterCount = document.getElementById('release-footer-count');
    const $btnReleaseScrollTop = document.getElementById('btn-release-scroll-top');

    // Bug Reporter DOM refs
    const $btnOpenBugReport = document.getElementById('btn-open-bug-report');
    const $bugReportModal = document.getElementById('bug-report-modal');
    const $btnReportClose = document.getElementById('btn-report-close');
    const $btnReportCancel = document.getElementById('btn-report-cancel');
    const $reportForm = document.getElementById('report-form');
    const $reportName = document.getElementById('report-name');
    const $reportNameError = document.getElementById('report-name-error');
    const $reportEmail = document.getElementById('report-email');
    const $reportEmailError = document.getElementById('report-email-error');
    const $reportCategory = document.getElementById('report-category');
    const $reportDescription = document.getElementById('report-description');
    const $reportCharCount = document.getElementById('report-char-count');
    const $reportDropzone = document.getElementById('report-dropzone');
    const $reportFileInput = document.getElementById('report-file-input');
    const $dropzoneIdle = document.getElementById('dropzone-idle');
    const $dropzonePreview = document.getElementById('dropzone-preview');
    const $previewMediaWrap = document.getElementById('preview-media-wrap');
    const $previewFilename = document.getElementById('preview-filename');
    const $previewFilesize = document.getElementById('preview-filesize');
    const $btnPreviewRemove = document.getElementById('btn-preview-remove');
    const $diagAppVersion = document.getElementById('diag-app-version');
    const $diagPlatform = document.getElementById('diag-platform');
    const $diagScreen = document.getElementById('diag-screen');
    const $diagPage = document.getElementById('diag-page');
    const $btnReportSubmit = document.getElementById('btn-report-submit');

    // Support Modal DOM refs
    const $btnFloatingSupport = document.getElementById('btn-floating-support');
    const $supportModal = document.getElementById('support-modal');
    const $btnSupportClose = document.getElementById('btn-support-close');

    // Global state
    let searchMode = 'songs'; // 'songs' | 'artists'
    let isSearching = false;
    let allSearchResults = [];
    let currentPage = 1;
    let itemsPerPage = 10;
    let currentSearchQuery = '';
    let currentSearchOffset = 0;
    let hasMoreSearchResults = false;
    let isLoadingMoreResults = false;
    let activePlaybackSource = null; // 'favorites' | 'search' | 'artist' | null
    let activeSearchTrackIndex = -1;
    let currentPreferredQuality = '320';
    try {
      currentPreferredQuality = localStorage.getItem('melodyxx_quality') || localStorage.getItem('listen_now_quality') || '320';
    } catch (_) {}

    let currentPlayingBtn = null;
    let currentPlayingTrackId = null;
    let currentPlayingTrackData = null;

    // Batch download state
    const selectedTracks = new Map(); // trackId -> trackObj
    let isBatchDownloading = false;
    let cancelBatchDownload = false;
    let lastArtistSearchResults = [];
    let lastArtistSuggestions = [];
    let displayedArtistCount = 0;
    const ARTIST_BATCH_SIZE = 12;
    let currentDiscography = null;

    // ── Helpers ───────────────────────────────────────────────

    /** Format view count to human-readable string */
    function formatViews(n) {
      if (!n || n === 0) return '';
      if (n >= 1_000_000) return t('views_million', { count: (n / 1_000_000).toFixed(1) });
      if (n >= 1_000) return t('views_thousand', { count: (n / 1_000).toFixed(0) });
      return t('views_count', { count: n });
    }

    let qualityGliderInit = false;
    let lastQualityToggleWidth = 0;

    /** Show / hide the named state panel */
    function showState(state) {
      $emptyState.style.display = state === 'empty' ? 'block' : 'none';
      $errorState.style.display = state === 'error' ? 'block' : 'none';
      $noResults.style.display = state === 'no-results' ? 'block' : 'none';
      $results.classList.toggle('visible', state === 'results');
      $loading.classList.toggle('visible', state === 'loading');
      if ($artistSearchResults) $artistSearchResults.style.display = state === 'artists' ? 'block' : 'none';
      if ($artistView) $artistView.style.display = state === 'artist-view' ? 'block' : 'none';
      if ($favoritesSection) $favoritesSection.style.display = state === 'favorites' ? 'block' : 'none';

      // Keep SEO features showcase visible on initial empty landing, hide on favorites, search results, or artist view
      const $seoSection = document.getElementById('seo-info-section');
      if ($seoSection) {
        $seoSection.style.display = (state === 'empty') ? 'block' : 'none';
      }

      if (state === 'results' && !qualityGliderInit) {
        requestAnimationFrame(() => updateQualityGlider(true));
      }
    }

    /** Render a toast notification */
    function toast(type, msg, duration = 4000) {
      const icons = {
        success: `<svg viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>`,
        error: `<svg viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
        info: `<svg viewBox="0 0 24 24" fill="none" stroke="#c084fc" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`
      };

      // Prevent stacking duplicate or consecutive cooldown toasts
      if ($toastWrap) {
        const plainMsg = msg.replace(/<[^>]+>/g, '').trim();
        const isCooldownMsg = plainMsg.includes('before submitting another report');
        $toastWrap.querySelectorAll('.toast').forEach(t => {
          const tText = t.innerText.trim();
          if (tText === plainMsg || (isCooldownMsg && tText.includes('before submitting another report'))) {
            t.remove();
          }
        });
      }

      const el = document.createElement('div');
      el.className = `toast ${type}`;
      el.setAttribute('role', 'status');
      el.innerHTML = `
      <span class="toast-icon" aria-hidden="true">${icons[type] || icons.info}</span>
      <span class="toast-msg">${msg}</span>`;
      $toastWrap.appendChild(el);
      setTimeout(() => {
        el.style.animation = 'toast-out 0.3s ease forwards';
        el.addEventListener('animationend', () => el.remove());
      }, duration);
    }

    /** Escape HTML to prevent XSS */
    function esc(str) {
      const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
      return String(str).replace(/[&<>"']/g, c => map[c]);
    }

    // ── SVG Icons ────────────────────────────────────────────

    const ICON_DOWNLOAD = `<svg class="btn-icon" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2"
      d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M16 12l-4 4-4-4M12 3v13"/>
  </svg>`;

    const ICON_SPIN = `<svg class="btn-icon" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
      d="M4 12a8 8 0 018-8v4l3-3-3-3V4A10 10 0 1012 22"/>
  </svg>`;

    const ICON_CHECK = `<svg class="btn-icon" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
  </svg>`;

    const ICON_PLAY = `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`;
    const ICON_PAUSE = `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;

    const TRACK_ICON_PLAY = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`;
    const TRACK_ICON_PAUSE = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;
    const TRACK_ICON_SPIN = `<svg class="spinner-track-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>`;

    const CARD_ICON_PLAY = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`;
    const CARD_ICON_PAUSE = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;
    const CARD_ICON_SPIN = `<svg class="spinner-card-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>`;

    function isTrackMatching(el, targetId) {
      if (!el || !targetId) return false;
      const t = String(targetId).trim().toLowerCase();
      const trackId = String(el.dataset.trackId || el.dataset.id || '').trim().toLowerCase();
      const url = String(el.dataset.url || '').trim().toLowerCase();
      const preview = String(el.dataset.preview || '').trim().toLowerCase();
      if ((trackId && trackId === t) || (url && url === t) || (preview && preview === t)) {
        return true;
      }
      // If el is a card or container, inspect its children buttons or attributes
      const child = el.querySelector ? el.querySelector('.btn-card-play, .btn-fav-play, .btn-track-play, [data-url], [data-track-id], [data-id]') : null;
      if (child) {
        const cTrackId = String(child.dataset.trackId || child.dataset.id || '').trim().toLowerCase();
        const cUrl = String(child.dataset.url || '').trim().toLowerCase();
        const cPreview = String(child.dataset.preview || '').trim().toLowerCase();
        if ((cTrackId && cTrackId === t) || (cUrl && cUrl === t) || (cPreview && cPreview === t)) {
          return true;
        }
      }
      return false;
    }

    function syncAllPlaybackButtons(isPlaying) {
      const activeId = currentPlayingTrackId ? String(currentPlayingTrackId).trim() : '';
      const isBuffering = isMiniLoading || isTrackSwitching;

      // 1. Sync floating mini player icon & state
      if ($miniPlayer) {
        $miniPlayer.classList.toggle('playing', !!isPlaying || isBuffering);
        if (isBuffering) {
          $miniPlayer.classList.add('loading');
        } else {
          $miniPlayer.classList.remove('loading');
        }
      }
      if (!isBuffering) {
        setMiniIcon(!isPlaying);
      } else {
        if ($miniPlayIcon) {
          $miniPlayIcon.classList.add('mini-spin-anim');
          $miniPlayIcon.innerHTML = MINI_ICON_SPIN;
        }
        if ($miniCurrent) $miniCurrent.textContent = 'Buffering…';
      }

      // 2. Sync all cards (both Search results in $grid and Favorites in $favoritesList)
      document.querySelectorAll('.card').forEach(card => {
        const isThis = activeId ? isTrackMatching(card, activeId) : false;

        card.classList.toggle('is-playing', isThis && (!!isPlaying || isBuffering));
        card.classList.toggle('is-paused', isThis && !isPlaying && !isBuffering);

        const playBtn = card.querySelector('.btn-card-play, .btn-fav-play');
        if (playBtn) {
          if (isThis && isBuffering) {
            playBtn.classList.add('loading');
            playBtn.classList.remove('playing', 'paused');
            const iconSpan = playBtn.querySelector('.btn-play-icon');
            const textSpan = playBtn.querySelector('.btn-play-label');
            if (iconSpan) iconSpan.innerHTML = CARD_ICON_SPIN;
            if (textSpan) textSpan.textContent = 'Buffering…';
          } else {
            playBtn.classList.remove('loading');
            playBtn.classList.toggle('playing', isThis && !!isPlaying);
            playBtn.classList.toggle('paused', isThis && !isPlaying);

            const iconSpan = playBtn.querySelector('.btn-play-icon');
            const textSpan = playBtn.querySelector('.btn-play-label');

            if (isThis) {
              if (iconSpan) iconSpan.innerHTML = isPlaying ? CARD_ICON_PAUSE : CARD_ICON_PLAY;
              if (textSpan) textSpan.textContent = isPlaying ? 'Pause' : 'Resume';
            } else {
              if (iconSpan) iconSpan.innerHTML = CARD_ICON_PLAY;
              if (textSpan) textSpan.textContent = 'Play';
            }
          }
        }
      });

      // 3. Sync Discography track rows
      document.querySelectorAll('.btn-track-play').forEach(btn => {
        const isThis = activeId ? isTrackMatching(btn, activeId) : false;
        if (isThis && isBuffering) {
          btn.classList.add('loading');
          btn.classList.remove('playing');
          btn.innerHTML = TRACK_ICON_SPIN;
        } else {
          btn.classList.remove('loading');
          btn.classList.toggle('playing', isThis && !!isPlaying);
          btn.innerHTML = (isThis && !!isPlaying) ? TRACK_ICON_PAUSE : TRACK_ICON_PLAY;
        }
      });
    }

    function resetCurrentPlayingBtn() {
      if (currentPlayingBtn) {
        currentPlayingBtn = null;
      }
      syncAllPlaybackButtons(false);
    }

    function updateCurrentPlayingBtn(isPlaying) {
      syncAllPlaybackButtons(isPlaying);
    }

    // ── Build card HTML ───────────────────────────────────────

    function buildCard(item, index) {
      const views = formatViews(item.views);
      const cardId = `card-${index}`;
      const btnId = `btn-dl-${index}`;
      const playBtnId = `btn-play-${index}`;
      const rawChan = item.channel || item.artist || '';
      const displayChannel = (!rawChan || rawChan.trim().toLowerCase() === 'unknown' || rawChan.trim().toLowerCase() === 'unknown artist')
        ? (extractArtistFromTitle(item.title) || 'YouTube Music')
        : rawChan;

      return `
    <article class="card" id="${cardId}" data-url="${esc(item.url)}" data-id="${esc(item.id)}" role="listitem" aria-label="${esc(item.title)}">
      <div class="card-thumb-wrap">
        <img
          class="card-thumb"
          src="${esc(item.thumbnail)}"
          alt="${esc(item.title)} thumbnail"
          loading="lazy"
          decoding="async"
          onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 160 90%22><rect fill=%22%231a1a2e%22 width=%22160%22 height=%2290%22/><text x=%2280%22 y=%2250%22 fill=%22%234b4c6e%22 text-anchor=%22middle%22 font-size=%2224%22>♪</text></svg>'"
        />
        <span class="card-duration" aria-label="Duration ${esc(item.duration)}">${esc(item.duration)}</span>
      </div>

      <div class="card-info">
        <h3 class="card-title" title="${esc(item.title)}">${esc(item.title)}</h3>
        <div class="card-meta">
          <span class="card-channel" aria-label="Channel: ${esc(displayChannel)}">${esc(displayChannel)}</span>
          ${views ? `<span class="card-views" aria-label="${views}">${views}</span>` : ''}
        </div>
      </div>

      <div class="card-action">
        <div class="card-action-top-row">
          <button
            type="button"
            class="btn-card-play"
            id="${playBtnId}"
            data-url="${esc(item.url)}"
            data-title="${esc(item.title)}"
            data-artist="${esc(displayChannel)}"
            data-thumb="${esc(item.thumbnail)}"
            aria-label="${t('play_preview_title')}: ${esc(item.title)}"
            title="${t('play_preview_title')}"
          >
            <span class="btn-play-icon">${CARD_ICON_PLAY}</span>
            <span class="btn-play-label" data-i18n="play">${t('play')}</span>
            <span class="play-equalizer" aria-hidden="true">
              <span></span><span></span><span></span>
            </span>
          </button>
          <button
            type="button"
            class="btn-card-fav ${isFavorite(item.url) ? 'active' : ''}"
            id="btn-fav-${index}"
            data-url="${esc(item.url)}"
            data-title="${esc(item.title)}"
            data-artist="${esc(displayChannel)}"
            data-duration="${esc(item.duration)}"
            data-thumb="${esc(item.thumbnail)}"
            aria-label="${isFavorite(item.url) ? t('remove_from_favorites') : t('add_to_favorites')}"
            title="${isFavorite(item.url) ? t('remove_from_favorites') : t('add_to_favorites')}"
          >
            ${renderStarSvg(isFavorite(item.url))}
          </button>
        </div>
        <button
          class="btn-download"
          id="${btnId}"
          data-url="${esc(item.url)}"
          data-title="${esc(item.title)}"
          data-quality="${currentPreferredQuality}"
          aria-label="Download MP3: ${esc(item.title)}"
          title="${t('download_as_kbps', { quality: currentPreferredQuality })}"
        >
          <div class="progress-fill" style="width: 0%"></div>
          <span class="btn-text">
            ${ICON_DOWNLOAD}
            <span class="btn-dl-label" data-i18n="download_mp3">${t('download_mp3')}</span>
          </span>
        </button>
      </div>
    </article>`;
    }

    // ── Search Results Playback Engine ───────────────────────

    async function playSearchTrack(item, index) {
      if (!item) return;

      activePlaybackSource = 'search';
      isFavoritesAutoplay = false; // Disengage favorites playlist queue
      activeSearchTrackIndex = index;
      currentPlayingTrackId = String(item.url || item.id || '').trim();
      const rawArt = item.channel || item.artist || '';
      const cleanArt = (!rawArt || rawArt.trim().toLowerCase() === 'unknown' || rawArt.trim().toLowerCase() === 'unknown artist')
        ? (extractArtistFromTitle(item.title) || 'YouTube Music')
        : rawArt;
      currentPlayingTrackData = {
        id: item.url || item.id,
        url: item.url || '',
        title: item.title,
        artist: cleanArt,
        thumbnail: item.thumbnail,
        duration: item.duration
      };

      // Engage buffering lock immediately before pausing audio
      isTrackSwitching = true;
      setMiniLoading(true, 'Buffering…');

      // Immediately silence previous stream
      try {
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
      } catch (_) {}

      // If item is on another page, navigate there so card is in DOM
      const pageOfItem = Math.floor(index / itemsPerPage) + 1;
      if (currentPage !== pageOfItem) {
        currentPage = pageOfItem;
        renderPage();
      }

      const btn = document.getElementById(`btn-play-${index}`);
      if (btn) {
        currentPlayingBtn = btn;
      }

      // Sync playback buttons so active card and mini player reflect loading state immediately
      syncAllPlaybackButtons(false);

      showMiniPlayer(item.title, item.channel || item.artist, item.thumbnail);
      setMiniLoading(true, 'Buffering…');
      updateMediaSessionMetadata(item.title, item.channel || item.artist, item.thumbnail);

      const targetId = currentPlayingTrackId;

      try {
        const res = await fetch(`/api/preview?url=${encodeURIComponent(item.url)}`);
        if (!res.ok) throw new Error('Preview not found');
        const data = await res.json();

        if (currentPlayingTrackId !== targetId) return; // Stale track clicked

        audioPlayer.src = data.stream_url;
        await audioPlayer.play();

        isTrackSwitching = false;
        setMiniLoading(false);
        syncAllPlaybackButtons(true);
      } catch (err) {
        console.error('[Search Playback Error]', err);
        isTrackSwitching = false;
        setMiniLoading(false);
        syncAllPlaybackButtons(false);
        currentPlayingBtn = null;
        toast('error', 'Preview unavailable for this video.');
      }
    }

    // ── Pagination Logic ─────────────────────────────────────

    function getPaginationRange(current, total) {
      if (total <= 7) {
        return Array.from({ length: total }, (_, i) => i + 1);
      }
      const pages = [];
      pages.push(1);

      let start = Math.max(2, current - 1);
      let end = Math.min(total - 1, current + 1);

      if (current <= 3) {
        start = 2;
        end = 4;
      } else if (current >= total - 2) {
        start = total - 3;
        end = total - 1;
      }

      if (start > 2) {
        pages.push('...');
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < total - 1) {
        pages.push('...');
      }

      pages.push(total);
      return pages;
    }

    function renderPage() {
      const totalPages = Math.ceil(allSearchResults.length / itemsPerPage) || 1;

      if (currentPage < 1) currentPage = 1;
      if (currentPage > totalPages) currentPage = totalPages;

      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const pageItems = allSearchResults.slice(startIndex, endIndex);

      // Render cards
      $grid.innerHTML = pageItems.map((item, i) => buildCard(item, startIndex + i)).join('');

      // Update pagination UI
      $pageCurrent.textContent = currentPage;
      $pageTotal.textContent = totalPages;

      if ($btnFirst) $btnFirst.disabled = currentPage === 1;
      if ($btnPrev) $btnPrev.disabled = currentPage === 1;
      if ($btnLast) $btnLast.disabled = currentPage === totalPages;

      if (currentPage < totalPages) {
        $btnNext.disabled = false;
        $btnNext.innerHTML = `${t('page_next')}`;
        $btnNext.title = 'Next Page';
      } else if (currentPage === totalPages && hasMoreSearchResults) {
        $btnNext.disabled = isLoadingMoreResults;
        $btnNext.innerHTML = isLoadingMoreResults ? (t('buffering') || 'Loading…') : `${t('page_next')}`;
        $btnNext.title = `Load more results (Page ${currentPage + 1})`;
      } else {
        $btnNext.disabled = true;
        $btnNext.innerHTML = `${t('page_next')}`;
        $btnNext.title = '';
      }

      // Render smart numeric page jump buttons
      if ($paginationPages) {
        const pages = getPaginationRange(currentPage, totalPages);
        $paginationPages.innerHTML = pages.map(p => {
          if (p === '...') {
            return `<span class="page-num ellipsis" aria-hidden="true">&hellip;</span>`;
          }
          const isActive = p === currentPage;
          return `<button type="button" class="page-num ${isActive ? 'active' : ''}" data-page="${p}" aria-label="Page ${p}" ${isActive ? 'aria-current="page"' : ''}>${p}</button>`;
        }).join('');

        $paginationPages.querySelectorAll('.page-num[data-page]').forEach(btn => {
          btn.addEventListener('click', () => {
            const targetPage = parseInt(btn.dataset.page, 10);
            if (!isNaN(targetPage) && targetPage !== currentPage) {
              currentPage = targetPage;
              renderPage();
              const $resultsCount = document.getElementById('results-count');
              if ($resultsCount) {
                $resultsCount.scrollIntoView({ behavior: 'smooth' });
              }
            }
          });
        });
      }

      // Allow clicking on current page label to jump directly
      if ($pageCurrent) {
        $pageCurrent.style.cursor = 'pointer';
        $pageCurrent.title = 'Click to jump directly to any page';
        $pageCurrent.onclick = async () => {
          const promptLabel = hasMoreSearchResults ? `${totalPages}+` : totalPages;
          const input = prompt(`Jump directly to page (1 - ${promptLabel}):`, currentPage);
          if (input !== null) {
            const p = parseInt(input, 10);
            if (!isNaN(p) && p >= 1 && p !== currentPage) {
              if (p <= totalPages) {
                currentPage = p;
                renderPage();
                const $resultsCount = document.getElementById('results-count');
                if ($resultsCount) $resultsCount.scrollIntoView({ behavior: 'smooth' });
              } else if (hasMoreSearchResults && !isLoadingMoreResults) {
                while (p > Math.ceil(allSearchResults.length / itemsPerPage) && hasMoreSearchResults && !isLoadingMoreResults) {
                  await loadMoreSearchResults();
                }
                const newTotal = Math.ceil(allSearchResults.length / itemsPerPage);
                currentPage = Math.min(p, newTotal);
                renderPage();
                const $resultsCount = document.getElementById('results-count');
                if ($resultsCount) $resultsCount.scrollIntoView({ behavior: 'smooth' });
              }
            }
          }
        };
      }

      $paginationControls.style.display = (allSearchResults.length > itemsPerPage || hasMoreSearchResults) ? 'flex' : 'none';

      // Attach preview player handlers (scoped to search results grid)
      $grid.querySelectorAll('.btn-card-play').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();

          const trackUrl = String(btn.dataset.url || '').trim();

          // Same button clicked: toggle play/pause without losing reference
          if (currentPlayingTrackId === trackUrl && activePlaybackSource === 'search') {
            if (audioPlayer.paused) {
              audioPlayer.play();
            } else {
              audioPlayer.pause();
            }
            return;
          }

          // INSTANT ZERO-LATENCY VISUAL FEEDBACK ON CLICK:
          isTrackSwitching = true;
          isMiniLoading = true;
          currentPlayingTrackId = trackUrl;
          currentPlayingBtn = btn;

          btn.classList.remove('paused', 'playing');
          btn.classList.add('loading');
          const iconSpan = btn.querySelector('.btn-play-icon');
          const textSpan = btn.querySelector('.btn-play-label');
          if (iconSpan) iconSpan.innerHTML = CARD_ICON_SPIN;
          if (textSpan) textSpan.textContent = 'Buffering…';
          const card = btn.closest('.card');
          if (card) {
            card.classList.add('is-playing');
            card.classList.remove('is-paused');
          }

          showMiniPlayer(btn.dataset.title, btn.dataset.artist, btn.dataset.thumb);
          setMiniLoading(true, 'Buffering…');

          const index = allSearchResults.findIndex(item => item.url === trackUrl || item.id === trackUrl);
          const item = index >= 0 ? allSearchResults[index] : {
            url: btn.dataset.url,
            title: btn.dataset.title,
            channel: btn.dataset.artist,
            thumbnail: btn.dataset.thumb
          };

          await playSearchTrack(item, index >= 0 ? index : 0);
        });
      });

      // Attach download handlers
      pageItems.forEach((item, i) => {
        const btn = document.getElementById(`btn-dl-${startIndex + i}`);
        if (btn) btn.addEventListener('click', () => handleDownload(btn, item));
      });

      // Attach card favorite star listeners
      document.querySelectorAll('.btn-card-fav').forEach(favBtn => {
        favBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const track = {
            id: favBtn.dataset.url,
            url: favBtn.dataset.url,
            title: favBtn.dataset.title,
            artist: favBtn.dataset.artist,
            duration: favBtn.dataset.duration,
            thumbnail: favBtn.dataset.thumb
          };
          toggleFavorite(track);
        });
      });
    }

    async function loadMoreSearchResults() {
      if (isLoadingMoreResults || !hasMoreSearchResults || !currentSearchQuery) return;
      isLoadingMoreResults = true;

      $btnNext.disabled = true;
      $btnNext.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px; display: inline-block; vertical-align: middle; animation: spin 0.8s linear infinite; margin-right: 4px;">
          <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.25)"></circle>
          <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" stroke-linecap="round"></path>
        </svg>Loading…
      `;

      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(currentSearchQuery)}&limit=50&offset=${currentSearchOffset}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.detail || `HTTP ${res.status}`);
        }

        const newItems = data.results || [];
        if (newItems.length === 0) {
          hasMoreSearchResults = false;
          toast('info', t('toast_no_more_results'));
        } else {
          // Deduplicate against existing allSearchResults
          const existingIds = new Set(allSearchResults.map(item => item.id || item.url));
          const filteredNewItems = newItems.filter(item => {
            const id = item.id || item.url;
            return id && !existingIds.has(id);
          });

          currentSearchOffset += newItems.length;
          hasMoreSearchResults = Boolean(data.has_more !== false && newItems.length >= 10);

          if (filteredNewItems.length > 0) {
            allSearchResults = allSearchResults.concat(filteredNewItems);
            currentPage++;
            $count.textContent = t('results_count', { count: allSearchResults.length });
            toast('success', t('toast_loaded_more_songs', { count: filteredNewItems.length }));
          } else if (!hasMoreSearchResults) {
            toast('info', t('toast_no_more_new_results'));
          } else {
            toast('info', t('toast_fetching_more'));
            isLoadingMoreResults = false;
            return await loadMoreSearchResults();
          }
        }
      } catch (err) {
        console.error('[Load More Search Error]', err);
        toast('error', err.message || 'Failed to load more results.');
      } finally {
        isLoadingMoreResults = false;
        renderPage();
        const $resultsCount = document.getElementById('results-count');
        if ($resultsCount) {
          $resultsCount.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }

    if ($btnFirst) {
      $btnFirst.addEventListener('click', () => {
        if (currentPage > 1) {
          currentPage = 1;
          renderPage();
          const $resultsCount = document.getElementById('results-count');
          if ($resultsCount) {
            $resultsCount.scrollIntoView({ behavior: 'smooth' });
          }
        }
      });
    }

    $btnPrev.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        renderPage();
        const $resultsCount = document.getElementById('results-count');
        if ($resultsCount) {
          $resultsCount.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });

    $btnNext.addEventListener('click', async () => {
      const totalPages = Math.ceil(allSearchResults.length / itemsPerPage);
      if (currentPage < totalPages) {
        currentPage++;
        renderPage();
        const $resultsCount = document.getElementById('results-count');
        if ($resultsCount) {
          $resultsCount.scrollIntoView({ behavior: 'smooth' });
        }
      } else if (currentPage === totalPages && hasMoreSearchResults && !isLoadingMoreResults) {
        await loadMoreSearchResults();
      }
    });

    if ($btnLast) {
      $btnLast.addEventListener('click', () => {
        const totalPages = Math.ceil(allSearchResults.length / itemsPerPage);
        if (currentPage < totalPages) {
          currentPage = totalPages;
          renderPage();
          const $resultsCount = document.getElementById('results-count');
          if ($resultsCount) {
            $resultsCount.scrollIntoView({ behavior: 'smooth' });
          }
        }
      });
    }

    $limitSelect.addEventListener('change', (e) => {
      itemsPerPage = parseInt(e.target.value, 10);
      currentPage = 1;
      renderPage();
    });

    // ── Global Quality Sync ───────────────────────────────────

    // ── Global Quality Sync with Fluid Glider ────────────────
    function updateQualityGlider(instant = false) {
      if (!$globalQualityGlider) return;
      const activeBtn = document.querySelector(`.global-q-btn[data-quality="${currentPreferredQuality}"]`);
      if (!activeBtn) return;
      const parent = activeBtn.parentElement;
      if (!parent) return;

      const parentRect = parent.getBoundingClientRect();
      const btnRect = activeBtn.getBoundingClientRect();

      const width = btnRect.width;
      if (width === 0) {
        // Element is currently not visible/rendered (e.g. results panel is hidden)
        return;
      }

      const left = btnRect.left - parentRect.left;

      if (instant) {
        $globalQualityGlider.style.transition = 'none';
      } else {
        $globalQualityGlider.style.transition = '';
      }

      $globalQualityGlider.style.width = `${width}px`;
      $globalQualityGlider.style.transform = `translateX(${left}px)`;
      $globalQualityGlider.classList.add('ready');

      if (instant) {
        void $globalQualityGlider.offsetWidth;
        $globalQualityGlider.style.transition = '';
      }
    }

    function setGlobalQuality(quality) {
      if (!quality) return;
      currentPreferredQuality = String(quality);
      try {
        localStorage.setItem('melodyxx_quality', currentPreferredQuality);
      } catch (_) {}

      // 1. Sync header toggle buttons
      document.querySelectorAll('.global-q-btn').forEach(btn => {
        const isActive = btn.dataset.quality === currentPreferredQuality;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });
      // Always slide smoothly with CSS animation on user change
      updateQualityGlider(false);

      // 2. Update all card download buttons with preferred quality
      document.querySelectorAll('.btn-download').forEach(dlBtn => {
        dlBtn.dataset.quality = currentPreferredQuality;
        dlBtn.title = `Download as ${currentPreferredQuality}kbps MP3`;
      });

      // 3. Update discography estimated size if currently viewing an artist
      if (currentDiscography && currentDiscography.top_songs) {
        let totalSec = 0;
        currentDiscography.top_songs.forEach(s => { totalSec += (s.duration_sec || 0); });
        const $statSize = document.getElementById('artist-stat-size');
        if ($statSize && totalSec > 0) {
          const qBitrate = parseInt(currentPreferredQuality || '320', 10) || 320;
          const mb = Math.round((totalSec * (qBitrate / 8)) / 1024);
          $statSize.textContent = mb >= 1000 ? `~${(mb / 1024).toFixed(1)} GB` : `~${mb} MB`;
        }
      }
    }

    // Attach listeners to header global quality buttons
    document.querySelectorAll('.global-q-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        setGlobalQuality(btn.dataset.quality);
      });
    });

    // Initialize UI with preferred quality
    setGlobalQuality(currentPreferredQuality);
    requestAnimationFrame(() => updateQualityGlider(true));
    window.addEventListener('resize', () => updateQualityGlider(true));

    // Observe quality toggle container for initial visibility and significant window resize
    const $qualityToggle = document.querySelector('.global-quality-toggle');
    if ($qualityToggle && typeof ResizeObserver !== 'undefined') {
      const roQuality = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const w = Math.round(entry.contentRect.width);
          if (w > 0) {
            if (!qualityGliderInit) {
              qualityGliderInit = true;
              lastQualityToggleWidth = w;
              updateQualityGlider(true);
            } else if (Math.abs(w - lastQualityToggleWidth) > 5) {
              // Only snap on real container/viewport resizing (> 5px), never on micro text shifts
              lastQualityToggleWidth = w;
              updateQualityGlider(true);
            }
          }
        }
      });
      roQuality.observe($qualityToggle);
    }

    // ── Search Mode Switcher with Fluid Sliding Glider ────────
    function updateSearchModeGlider(instant = false) {
      if (!$searchModeGlider || !$tabModeSongs || !$tabModeArtists) return;
      let activeTab = $tabModeSongs;
      if (searchMode === 'artists') activeTab = $tabModeArtists;
      else if (searchMode === 'favorites') activeTab = $tabModeFavorites;
      if (!activeTab) activeTab = $tabModeSongs;
      const parent = activeTab.parentElement;
      if (!parent) return;

      const parentRect = parent.getBoundingClientRect();
      const tabRect = activeTab.getBoundingClientRect();

      const left = tabRect.left - parentRect.left;
      const width = tabRect.width;

      if (instant) {
        $searchModeGlider.style.transition = 'none';
      } else {
        $searchModeGlider.style.transition = '';
      }

      $searchModeGlider.style.width = `${width}px`;
      $searchModeGlider.style.transform = `translateX(${left}px)`;
      $searchModeGlider.classList.add('ready');

      if (instant) {
        // Force reflow and re-enable transition for future user clicks
        void $searchModeGlider.offsetWidth;
        $searchModeGlider.style.transition = '';
      }
    }

    if ($tabModeSongs && $tabModeArtists) {
      $tabModeSongs.addEventListener('click', () => {
        searchMode = 'songs';
        $tabModeSongs.classList.add('active');
        $tabModeSongs.setAttribute('aria-selected', 'true');
        $tabModeArtists.classList.remove('active');
        $tabModeArtists.setAttribute('aria-selected', 'false');
        if ($tabModeFavorites) {
          $tabModeFavorites.classList.remove('active');
          $tabModeFavorites.setAttribute('aria-selected', 'false');
        }
        updateSearchModeGlider();
        $input.placeholder = t('search_placeholder_songs');
        clearSelection();
        if (allSearchResults.length > 0) {
          showState('results');
        } else {
          showState('empty');
        }
      });

      $tabModeArtists.addEventListener('click', () => {
        searchMode = 'artists';
        $tabModeArtists.classList.add('active');
        $tabModeArtists.setAttribute('aria-selected', 'true');
        $tabModeSongs.classList.remove('active');
        $tabModeSongs.setAttribute('aria-selected', 'false');
        if ($tabModeFavorites) {
          $tabModeFavorites.classList.remove('active');
          $tabModeFavorites.setAttribute('aria-selected', 'false');
        }
        updateSearchModeGlider();
        $input.placeholder = t('search_placeholder_artists');
        clearSelection();
        if (currentDiscography) {
          showState('artist-view');
        } else if (lastArtistSearchResults && lastArtistSearchResults.length > 0) {
          renderArtistSuggestions(lastArtistSuggestions);
          if ($artistResultsGrid.children.length === 0) {
            renderArtistResults(lastArtistSearchResults, true);
          } else {
            showState('artists');
          }
        } else {
          showState('empty');
        }
      });

      if ($tabModeFavorites) {
        $tabModeFavorites.addEventListener('click', () => {
          searchMode = 'favorites';
          $tabModeFavorites.classList.add('active');
          $tabModeFavorites.setAttribute('aria-selected', 'true');
          $tabModeSongs.classList.remove('active');
          $tabModeSongs.setAttribute('aria-selected', 'false');
          $tabModeArtists.classList.remove('active');
          $tabModeArtists.setAttribute('aria-selected', 'false');
          updateSearchModeGlider();
          $input.placeholder = t('search_placeholder_favorites');
          clearSelection();
          showState('favorites');
          renderFavorites();
        });
      }

      if ($btnFavDiscover && $tabModeSongs) {
        $btnFavDiscover.addEventListener('click', () => {
          $tabModeSongs.click();
          if ($input) $input.focus();
        });
      }

      // Initialize view state and glider position on page load
      showState('empty');
      requestAnimationFrame(() => updateSearchModeGlider(true));
      window.addEventListener('resize', () => updateSearchModeGlider(true));

      // Observe tab elements and container to auto-sync glider on content/badge/font shifts
      if ('ResizeObserver' in window && $tabModeFavorites) {
        const roTabs = new ResizeObserver(() => {
          if (typeof updateSearchModeGlider === 'function') {
            updateSearchModeGlider(false);
          }
        });
        roTabs.observe($tabModeFavorites);
        if ($tabModeSongs) roTabs.observe($tabModeSongs);
        if ($tabModeArtists) roTabs.observe($tabModeArtists);
        if ($tabModeSongs.parentElement) roTabs.observe($tabModeSongs.parentElement);
      }
    }

    // ── Search & URL Validation ───────────────────────────────

    function isYouTubeUrl(url) {
      const raw = (url || '').trim();
      if (!raw) return false;
      let candidate = raw;
      if (!/^https?:\/\//i.test(candidate)) {
        if (/^\/\//.test(candidate)) {
          candidate = 'https:' + candidate;
        } else if (/^www\./i.test(candidate) || /(?:youtube\.com|youtu\.be|youtube-nocookie\.com)/i.test(candidate)) {
          candidate = 'https://' + candidate;
        } else {
          return false;
        }
      }
      try {
        const parsed = new URL(candidate);
        const host = (parsed.hostname || '').toLowerCase();
        if (!host) return false;
        const allowedDomains = ['youtube.com', 'youtu.be', 'youtube-nocookie.com'];
        return allowedDomains.some(dom => host === dom || host.endsWith('.' + dom));
      } catch (_) {
        return false;
      }
    }

    function isExternalNonYoutubeUrl(text) {
      const raw = (text || '').trim();
      if (!raw) return false;
      if (/^(?:https?|ftp):\/\//i.test(raw) || /^\/\//.test(raw)) {
        return !isYouTubeUrl(raw);
      }
      if (/^www\.[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/i.test(raw)) {
        return !isYouTubeUrl(raw);
      }
      if (!raw.includes(' ') && /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,6}(?::\d+)?(?:\/.*)?$/.test(raw)) {
        return !isYouTubeUrl(raw);
      }
      return false;
    }

    async function performSearch(query) {
      if (!query || !query.trim()) return;
      const q = query.trim();

      if (typeof hideSearchSuggestions === 'function') {
        hideSearchSuggestions();
      }
      if ($input) $input.blur();

      if (searchMode === 'favorites') {
        renderFavorites(q);
        return;
      }

      if (searchMode === 'artists') {
        await performArtistSearch(q);
        return;
      }

      // Safeguard: Block non-YouTube external links immediately without server network calls
      if (isExternalNonYoutubeUrl(q)) {
        if ($errorMsg) {
          $errorMsg.textContent = t('err_only_yt_urls');
        }
        showState('error');
        toast('error', t('err_only_yt_urls'));
        return;
      }

      isSearching = true;
      showState('loading');
      $loadingText.textContent = 'Searching for songs…';
      $searchBtn.disabled = true;

      currentSearchQuery = q;
      currentSearchOffset = 0;
      hasMoreSearchResults = false;
      isLoadingMoreResults = false;

      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=50&offset=0`);
        let data;
        const resText = await res.text();
        try {
          data = JSON.parse(resText);
        } catch (_) {
          data = { detail: resText.slice(0, 200) || `HTTP ${res.status}` };
        }

        if (!res.ok) {
          throw new Error(data.detail || `HTTP ${res.status}`);
        }

        allSearchResults = data.results || [];

        if (allSearchResults.length === 0) {
          showState('no-results');
          return;
        }

        currentSearchOffset = allSearchResults.length;
        const isUrl = q.trim().startsWith('http://') || q.trim().startsWith('https://');
        hasMoreSearchResults = !isUrl && (data.has_more === true || (data.has_more !== false && allSearchResults.length >= 10));

        $count.textContent = t('results_count', { count: allSearchResults.length });
        showState('results');

        currentPage = 1;
        renderPage();

      } catch (err) {
        console.error('[Search Error]', err);
        $errorMsg.textContent = err.message || 'An error occurred while searching. Please try again.';
        showState('error');
      } finally {
        $searchBtn.disabled = false;
        isSearching = false;
        if (typeof hideSearchSuggestions === 'function') {
          hideSearchSuggestions();
        }
      }
    }

    // ── Artist Search & Discography ───────────────────────────

    async function performArtistSearch(query) {
      if (typeof hideSearchSuggestions === 'function') {
        hideSearchSuggestions();
      }
      if ($input) $input.blur();

      const q = (query || '').trim();

      // Safeguard: artist search should not accept URLs
      if (isExternalNonYoutubeUrl(q) || isYouTubeUrl(q)) {
        if ($errorMsg) {
          $errorMsg.textContent = t('err_artist_no_urls');
        }
        showState('error');
        toast('error', t('err_artist_no_urls'));
        return;
      }

      isSearching = true;
      showState('loading');
      $loadingText.textContent = `Searching artists for ${q}…`;
      $searchBtn.disabled = true;

      try {
        const res = await fetch(`/api/artist/search?q=${encodeURIComponent(q)}&limit=48`);
        let data;
        const resText = await res.text();
        try {
          data = JSON.parse(resText);
        } catch (_) {
          data = { detail: resText.slice(0, 200) || `HTTP ${res.status}` };
        }
        if (!res.ok) throw new Error(data.detail || `HTTP ${res.status}`);

        const artists = data.results || [];
        const suggestions = data.suggestions || [];
        lastArtistSearchResults = artists;
        lastArtistSuggestions = suggestions;

        if (artists.length === 0) {
          showState('no-results');
          return;
        }

        renderArtistSuggestions(suggestions);
        renderArtistResults(artists, true);
      } catch (err) {
        console.error('[Artist Search Error]', err);
        $errorMsg.textContent = err.message || 'Failed to search artists. Please try again.';
        showState('error');
      } finally {
        $searchBtn.disabled = false;
        isSearching = false;
        if (typeof hideSearchSuggestions === 'function') {
          hideSearchSuggestions();
        }
      }
    }

    function renderArtistSuggestions(suggestions) {
      if (!$artistSuggestionsBar || !$artistSuggestionChips) return;
      if (!suggestions || suggestions.length === 0) {
        $artistSuggestionsBar.style.display = 'none';
        $artistSuggestionChips.innerHTML = '';
        return;
      }

      $artistSuggestionsBar.style.display = 'flex';
      $artistSuggestionChips.innerHTML = suggestions.map(s => `
        <button type="button" class="suggestion-chip" data-query="${esc(s)}" aria-label="Search suggested artist ${esc(s)}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <span>${esc(s)}</span>
        </button>
      `).join('');

      $artistSuggestionChips.querySelectorAll('.suggestion-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          const q = chip.dataset.query;
          if (q) {
            $searchInput.value = q;
            if (typeof updateSearchClearBtn === 'function') updateSearchClearBtn();
            performArtistSearch(q);
          }
        });
      });
    }

    const ARTIST_PLACEHOLDER_SVG = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>`;

    // ── Country Flag Graphic Renderer ──────────────────────────
    function getCountryCodeFromFlag(flagEmoji) {
      if (!flagEmoji || typeof flagEmoji !== 'string') return '';
      const codePoints = [...flagEmoji].map(c => c.codePointAt(0));
      if (codePoints.length === 2 &&
          codePoints[0] >= 127462 && codePoints[0] <= 127487 &&
          codePoints[1] >= 127462 && codePoints[1] <= 127487) {
        return String.fromCharCode(codePoints[0] - 127397, codePoints[1] - 127397).toLowerCase();
      }
      return '';
    }

    const COUNTRY_NAME_TO_CODE = {
      'indonesia': 'id',
      'sweden': 'se',
      'united kingdom': 'gb',
      'england': 'gb',
      'great britain': 'gb',
      'scotland': 'gb',
      'united states': 'us',
      'usa': 'us',
      'south korea': 'kr',
      'korea': 'kr',
      'japan': 'jp',
      'canada': 'ca',
      'australia': 'au',
      'germany': 'de',
      'france': 'fr',
      'italy': 'it',
      'spain': 'es',
      'brazil': 'br',
      'netherlands': 'nl',
      'norway': 'no',
      'denmark': 'dk',
      'finland': 'fi',
      'malaysia': 'my',
      'singapore': 'sg',
      'thailand': 'th',
      'philippines': 'ph',
      'india': 'in',
      'china': 'cn',
      'taiwan': 'tw',
      'hong kong': 'hk',
      'mexico': 'mx',
      'turkey': 'tr',
      'egypt': 'eg',
      'saudi arabia': 'sa',
      'ireland': 'ie',
      'new zealand': 'nz',
      'switzerland': 'ch',
      'austria': 'at',
      'belgium': 'be',
      'poland': 'pl',
      'portugal': 'pt',
      'argentina': 'ar',
      'colombia': 'co',
      'russia': 'ru',
      'stockholm': 'se'
    };

    function renderCountryFlagHtml(countryCodeOrEmoji, countryName = '') {
      let code = '';
      if (typeof countryCodeOrEmoji === 'string') {
        const trimmed = countryCodeOrEmoji.trim();
        if (trimmed.length === 2 && /^[a-zA-Z]{2}$/.test(trimmed)) {
          code = trimmed.toLowerCase();
        } else {
          code = getCountryCodeFromFlag(trimmed);
        }
      }
      if (!code && countryName && typeof countryName === 'string') {
        const lowerName = countryName.toLowerCase().trim();
        for (const [cName, cCode] of Object.entries(COUNTRY_NAME_TO_CODE)) {
          if (lowerName === cName || lowerName.endsWith(cName) || lowerName.includes(cName)) {
            code = cCode;
            break;
          }
        }
      }
      if (code) {
        return `<img src="https://flagcdn.com/24x18/${code}.png" srcset="https://flagcdn.com/48x36/${code}.png 2x" width="16" height="12" alt="${esc(countryName || code.toUpperCase())}" class="country-flag-img" loading="lazy" onerror="this.style.display='none'" />`;
      }
      return '';
    }

    function renderArtistResults(artists, reset = true) {
      if (reset) {
        displayedArtistCount = 0;
        $artistResultsGrid.innerHTML = '';
      }

      appendArtistBatch(ARTIST_BATCH_SIZE);
      showState('artists');
    }

    function appendArtistBatch(count = ARTIST_BATCH_SIZE) {
      const total = lastArtistSearchResults.length;
      const nextBatch = lastArtistSearchResults.slice(displayedArtistCount, displayedArtistCount + count);
      if (nextBatch.length === 0) return;

      const html = nextBatch.map(art => {
        const flagHtml = renderCountryFlagHtml(art.country_code || art.flag, art.country);
        const countryLabel = art.country
          ? `<span class="artist-card-country" title="${esc(art.country)}">${flagHtml}${flagHtml ? ' ' : ''}${esc(art.country)}</span>`
          : '';
        const photoHtml = art.photo
          ? `<img src="${esc(art.photo)}" alt="${esc(art.name)}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" /><div class="artist-card-placeholder" style="display:none;">${ARTIST_PLACEHOLDER_SVG}</div>`
          : `<div class="artist-card-placeholder">${ARTIST_PLACEHOLDER_SVG}</div>`;

        return `
          <div class="artist-card" data-artist-id="${art.artist_id}">
            <div class="artist-card-avatar">
              ${photoHtml}
            </div>
            <div class="artist-card-info">
              <div class="artist-card-name" title="${esc(art.name)}">${esc(art.name)}</div>
              <div class="artist-card-meta">
                ${countryLabel}
                <span class="artist-card-genre">${esc(art.genre || 'Music')}</span>
              </div>
            </div>
          </div>
        `;
      }).join('');

      $artistResultsGrid.insertAdjacentHTML('beforeend', html);
      displayedArtistCount += nextBatch.length;

      // Attach click listeners to newly appended cards
      $artistResultsGrid.querySelectorAll('.artist-card:not([data-bound])').forEach(card => {
        card.setAttribute('data-bound', 'true');
        card.addEventListener('click', () => {
          loadArtistDiscography(card.dataset.artistId);
        });
      });

      // Update count & load more button
      if (total > displayedArtistCount) {
        $artistResultsCount.textContent = t('artists_showing_count', { displayed: displayedArtistCount, total });
        if ($artistLoadMoreWrap) {
          $artistLoadMoreWrap.style.display = 'flex';
          const remaining = total - displayedArtistCount;
          if ($btnLoadMoreArtistsLabel) {
            $btnLoadMoreArtistsLabel.textContent = t('load_more_artists', { count: Math.min(count, remaining) });
          }
        }
      } else {
        $artistResultsCount.textContent = t('artists_found_count', { count: total });
        if ($artistLoadMoreWrap) {
          $artistLoadMoreWrap.style.display = 'none';
        }
      }
    }

    if ($btnLoadMoreArtists) {
      $btnLoadMoreArtists.addEventListener('click', () => {
        appendArtistBatch(ARTIST_BATCH_SIZE);
      });
    }

    async function loadArtistDiscography(artistId) {
      // Ensure searchMode is set to 'artists' and glider slides to the Artists tab
      searchMode = 'artists';
      if ($tabModeArtists && $tabModeSongs) {
        $tabModeArtists.classList.add('active');
        $tabModeArtists.setAttribute('aria-selected', 'true');
        $tabModeSongs.classList.remove('active');
        $tabModeSongs.setAttribute('aria-selected', 'false');
        updateSearchModeGlider();
      }

      showState('loading');
      $loadingText.textContent = 'Loading discography & popular tracks…';
      $searchBtn.disabled = true;

      try {
        const res = await fetch(`/api/artist/${artistId}/discography`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || `HTTP ${res.status}`);

        currentDiscography = data;
        renderDiscography(data);
        showState('artist-view');
      } catch (err) {
        console.error('[Discography Error]', err);
        $errorMsg.textContent = err.message || 'Failed to load artist discography.';
        showState('error');
      } finally {
        $searchBtn.disabled = false;
      }
    }

    if ($btnBackArtist) {
      $btnBackArtist.addEventListener('click', () => {
        currentDiscography = null;
        if (lastArtistSearchResults && lastArtistSearchResults.length > 0) {
          renderArtistSuggestions(lastArtistSuggestions);
          showState('artists');
        } else if (allSearchResults.length > 0) {
          searchMode = 'songs';
          $tabModeSongs.classList.add('active');
          $tabModeArtists.classList.remove('active');
          updateSearchModeGlider();
          showState('results');
        } else {
          showState('empty');
        }
      });
    }

    // Discography Sub-tabs (Top Songs vs Albums)
    if ($tabTopSongs && $tabAlbums) {
      $tabTopSongs.addEventListener('click', () => {
        $tabTopSongs.classList.add('active');
        $tabAlbums.classList.remove('active');
        $panelTopSongs.style.display = 'block';
        $panelAlbums.style.display = 'none';
      });

      $tabAlbums.addEventListener('click', () => {
        $tabAlbums.classList.add('active');
        $tabTopSongs.classList.remove('active');
        $panelTopSongs.style.display = 'none';
        $panelAlbums.style.display = 'block';
      });
    }

    function getVisibleTopSongs() {
      if (!currentDiscography || !currentDiscography.top_songs) return [];
      const allSongs = currentDiscography.top_songs;
      const limitVal = $topSongsLimitSelect ? $topSongsLimitSelect.value : '100';
      const limit = limitVal === 'all' ? allSongs.length : (parseInt(limitVal, 10) || 100);
      return allSongs.slice(0, limit);
    }

    function renderTopSongsList() {
      if (!currentDiscography || !currentDiscography.top_songs) return;
      const allSongs = currentDiscography.top_songs;
      const visibleSongs = getVisibleTopSongs();

      if ($topSongsSubtitle) {
        $topSongsSubtitle.textContent = t('showing_popular_tracks', { visible: visibleSongs.length, total: allSongs.length });
      }

      $topSongsList.innerHTML = visibleSongs.map(track => buildTrackRow(track)).join('');
      attachTrackRowListeners($topSongsList);
      updateSelectAllTopButton();
    }

    function updateSelectAllTopButton() {
      if (!$btnSelectAllTop || !currentDiscography || !currentDiscography.top_songs) return;
      const visibleSongs = getVisibleTopSongs();
      if (visibleSongs.length === 0) return;

      const allSelected = visibleSongs.every(t => selectedTracks.has(t.track_id));
      $btnSelectAllTop.textContent = allSelected ? t('deselect_all') : t('select_all_popular');
    }

    if ($topSongsLimitSelect) {
      $topSongsLimitSelect.addEventListener('change', () => {
        renderTopSongsList();
      });
    }

    function renderDiscography(disco) {
      $artistName.textContent = disco.name;
      $artistGenre.textContent = disco.genre || 'Music';
      $artistStats.textContent = `${disco.top_songs.length} Popular Tracks • ${disco.albums.length} Albums & EPs`;

      const $artistCountry = document.getElementById('artist-country');
      if ($artistCountry) {
        if (disco.country) {
          const flagHtml = renderCountryFlagHtml(disco.country_code || disco.flag, disco.country);
          $artistCountry.innerHTML = `${flagHtml}${flagHtml ? ' ' : ''}<span>${esc(disco.country)}</span>`;
          $artistCountry.style.display = 'inline-flex';
        } else {
          $artistCountry.style.display = 'none';
        }
      }

      const photoUrl = disco.photo || disco.artwork_url || '/static/logo.png';
      $artistAvatar.src = photoUrl;
      $artistAvatar.onerror = () => { $artistAvatar.src = disco.artwork_url || '/static/logo.png'; };

      // Ambient dynamic artwork backdrop
      const $ambientBg = document.getElementById('artist-ambient-backdrop');
      if ($ambientBg) {
        if (disco.photo || disco.artwork_url) {
          $ambientBg.style.backgroundImage = `url('${disco.photo || disco.artwork_url}')`;
          $ambientBg.style.display = 'block';
        } else {
          $ambientBg.style.display = 'none';
        }
      }

      // Compute Extra Statistics & Music Insights
      // 1. Career Span (Min Year - Max Year)
      const years = [];
      if (Array.isArray(disco.albums)) {
        disco.albums.forEach(a => {
          if (a.year && a.year.length >= 4) {
            const yr = parseInt(a.year, 10);
            if (yr > 1950 && yr < 2100) years.push(yr);
          }
        });
      }
      if (Array.isArray(disco.top_songs)) {
        disco.top_songs.forEach(s => {
          if (s.year && s.year.length >= 4) {
            const yr = parseInt(s.year, 10);
            if (yr > 1950 && yr < 2100) years.push(yr);
          }
        });
      }
      const $statCareer = document.getElementById('artist-stat-career');
      if ($statCareer) {
        if (years.length > 0) {
          const minY = Math.min(...years);
          const maxY = Math.max(...years);
          $statCareer.textContent = minY === maxY ? `${minY}` : `${minY} – ${maxY}`;
        } else {
          $statCareer.textContent = '—';
        }
      }

      // 2. Latest Album Release
      const $statLatest = document.getElementById('artist-stat-latest');
      const $cardStatLatest = document.getElementById('card-stat-latest') || $statLatest?.closest('.stat-pill-card');
      if ($statLatest) {
        if (disco.albums && disco.albums.length > 0) {
          // Smart Studio Album selection: favor full studio albums over 1-track singles
          const studioAlbum = disco.albums.find(a => (a.track_count && a.track_count > 1) && !/\b(single)\b/i.test(a.title || ''))
            || disco.albums.find(a => !/\b(single)\b/i.test(a.title || ''))
            || disco.albums[0];

          let cleanTitle = studioAlbum.title || 'Latest Album';
          // Clean trailing " - Single" or " - EP"
          cleanTitle = cleanTitle.replace(/\s*-\s*(Single|EP)\s*$/i, '');
          // If title has redundant featuring tags, clean them for pill readability
          if (cleanTitle.length > 25 && /\s*\((feat\.|with).*?\)/i.test(cleanTitle)) {
            cleanTitle = cleanTitle.replace(/\s*\((feat\.|with).*?\)/i, '');
          }
          cleanTitle = cleanTitle.trim();

          const yrSuffix = studioAlbum.year ? ` (${studioAlbum.year})` : '';
          $statLatest.textContent = `${cleanTitle}${yrSuffix}`;

          const tooltip = `${studioAlbum.title || cleanTitle}${yrSuffix}${studioAlbum.track_count ? ` • ${studioAlbum.track_count} tracks` : ''} • Click to view in discography`;
          $statLatest.title = tooltip;
          if ($cardStatLatest) {
            $cardStatLatest.title = tooltip;
            $cardStatLatest.style.cursor = 'pointer';
            $cardStatLatest.onclick = () => {
              if ($tabAlbums) $tabAlbums.click();
              const targetAlbumCard = document.getElementById(`album-card-${studioAlbum.album_id}`);
              if (targetAlbumCard) {
                targetAlbumCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                if (!targetAlbumCard.classList.contains('open')) {
                  const header = targetAlbumCard.querySelector('.album-header');
                  if (header) header.click();
                }
              }
            };
          }
        } else {
          $statLatest.textContent = '—';
          $statLatest.title = '';
          if ($cardStatLatest) {
            $cardStatLatest.title = '';
            $cardStatLatest.style.cursor = 'default';
            $cardStatLatest.onclick = null;
          }
        }
      }

      // 3. Total Duration across popular songs
      let totalSec = 0;
      if (Array.isArray(disco.top_songs)) {
        disco.top_songs.forEach(s => {
          totalSec += (s.duration_sec || 0);
        });
      }
      const $statDuration = document.getElementById('artist-stat-duration');
      if ($statDuration) {
        if (totalSec > 0) {
          const hrs = Math.floor(totalSec / 3600);
          const mins = Math.floor((totalSec % 3600) / 60);
          $statDuration.textContent = hrs > 0 ? `~${hrs}h ${mins}m` : `~${mins}m`;
        } else {
          $statDuration.textContent = '—';
        }
      }

      // 4. Estimated Audio Download Size based on current preferred quality
      const $statSize = document.getElementById('artist-stat-size');
      if ($statSize) {
        if (totalSec > 0) {
          const qBitrate = parseInt(currentPreferredQuality || '320', 10) || 320;
          const mb = Math.round((totalSec * (qBitrate / 8)) / 1024);
          $statSize.textContent = mb >= 1000 ? `~${(mb / 1024).toFixed(1)} GB` : `~${mb} MB`;
        } else {
          $statSize.textContent = '—';
        }
      }

      // Render Top Songs List according to display limit
      renderTopSongsList();

      // Render Albums List
      $albumsGrid.innerHTML = disco.albums.map(album => `
        <div class="album-card" id="album-card-${album.album_id}" data-album-id="${album.album_id}">
          <div class="album-header" data-album-id="${album.album_id}">
            <img class="album-art" src="${album.artwork_url || '/static/logo.png'}" alt="Cover" loading="lazy" onerror="this.src='/static/logo.png'">
            <div class="album-info">
              <div class="album-title" title="${esc(album.title)}">${esc(album.title)}</div>
              <div class="album-meta-text">${album.year ? album.year + ' • ' : ''}${album.track_count} Tracks • ${esc(album.genre)}</div>
            </div>
            <div class="album-actions">
              <button type="button" class="btn-select-album" data-album-id="${album.album_id}">
                Select Album
              </button>
              <svg class="album-toggle-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </div>
          <div class="album-tracks-container" id="album-tracks-${album.album_id}">
            <div class="tracks-list" id="album-list-${album.album_id}">
              <div style="font-size: 0.8rem; color: var(--clr-text-muted); padding: 8px 0;">Loading tracklist...</div>
            </div>
          </div>
        </div>
      `).join('');

      // Attach Album Header click listeners (accordion toggle & lazy load tracks)
      $albumsGrid.querySelectorAll('.album-header').forEach(header => {
        header.addEventListener('click', async (e) => {
          if (e.target.closest('.btn-select-album')) return; // handled separately
          const albumId = header.dataset.albumId;
          const card = document.getElementById(`album-card-${albumId}`);
          card.classList.toggle('open');
          if (card.classList.contains('open')) {
            await ensureAlbumTracksLoaded(albumId);
          }
        });
      });

      // Attach "Select Album" click listeners
      $albumsGrid.querySelectorAll('.btn-select-album').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const albumId = btn.dataset.albumId;
          const card = document.getElementById(`album-card-${albumId}`);
          if (!card.classList.contains('open')) {
            card.classList.add('open');
          }
          const tracks = await ensureAlbumTracksLoaded(albumId);
          if (tracks && tracks.length > 0) {
            // Check if all are already selected
            const allSelected = tracks.every(t => selectedTracks.has(t.track_id));
            tracks.forEach(t => toggleTrackSelection(t, !allSelected));
            btn.textContent = !allSelected ? t('deselect_all') : t('select_album');
          }
        });
      });

      // "Select All Popular Songs" button
      if ($btnSelectAllTop) {
        $btnSelectAllTop.onclick = () => {
          if (!currentDiscography || !currentDiscography.top_songs) return;
          const visibleSongs = getVisibleTopSongs();
          if (visibleSongs.length === 0) return;

          const allSelected = visibleSongs.every(t => selectedTracks.has(t.track_id));
          visibleSongs.forEach(t => toggleTrackSelection(t, !allSelected));
          updateSelectAllTopButton();
        };
      }
    }

    async function ensureAlbumTracksLoaded(albumId) {
      const listEl = document.getElementById(`album-list-${albumId}`);
      if (!listEl) return [];
      if (listEl.dataset.loaded === 'true') {
        const albumObj = currentDiscography.albums.find(a => a.album_id === albumId);
        return albumObj ? albumObj.tracks || [] : [];
      }

      try {
        const res = await fetch(`/api/album/${albumId}/tracks`);
        const data = await res.json();
        const tracks = data.tracks || [];
        const albumObj = currentDiscography.albums.find(a => a.album_id === albumId);
        if (albumObj) albumObj.tracks = tracks;

        listEl.innerHTML = tracks.map(t => buildTrackRow(t)).join('');
        listEl.dataset.loaded = 'true';
        attachTrackRowListeners(listEl);
        return tracks;
      } catch (err) {
        console.error('Failed to load album tracks:', err);
        listEl.innerHTML = '<div style="font-size:0.8rem; color:#ff6b6b;">Failed to load album tracks.</div>';
        return [];
      }
    }

    function buildTrackRow(track) {
      const isChecked = selectedTracks.has(track.track_id);
      return `
        <div class="track-row ${isChecked ? 'selected' : ''}" id="track-row-${track.track_id}" data-id="${track.track_id}">
          <div class="track-cb-wrap">
            <input type="checkbox" class="track-checkbox" data-id="${track.track_id}" ${isChecked ? 'checked' : ''} aria-label="Select track ${esc(track.title)}">
          </div>
          <img class="track-art" src="${track.artwork_url || '/static/logo.png'}" alt="Art" loading="lazy" onerror="this.src='/static/logo.png'">
          <div class="track-main">
            <div class="track-title" title="${esc(track.title)}">${esc(track.title)}</div>
            <div class="track-sub">${esc(track.album || '')}${track.year ? ' • ' + track.year : ''}${track.duration ? `<span class="track-dur-inline"> • ${track.duration}</span>` : ''}</div>
          </div>
          <div class="track-dur">${track.duration || ''}</div>
          <div class="track-actions">
            ${track.preview_url ? `
            <button type="button" class="btn-track-action btn-track-play" data-preview="${esc(track.preview_url)}" data-title="${esc(track.title)}" data-artist="${esc(track.artist)}" data-art="${esc(track.artwork_url)}" title="Preview Audio">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            </button>` : ''}
            <button type="button" class="btn-track-action btn-track-download" data-id="${track.track_id}" title="Download Track">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            </button>
            <button type="button" class="btn-track-action btn-track-fav ${isFavorite(track.track_id) ? 'active' : ''}" data-id="${track.track_id}" data-title="${esc(track.title)}" data-artist="${esc(track.artist)}" data-album="${esc(track.album || '')}" data-art="${esc(track.artwork_url || '')}" data-preview="${esc(track.preview_url || '')}" data-duration="${esc(track.duration || '')}" title="${isFavorite(track.track_id) ? 'Remove from favorites' : 'Add to favorites'}">
              ${renderStarSvg(isFavorite(track.track_id))}
            </button>
          </div>
        </div>
      `;
    }

    function attachTrackRowListeners(container) {
      // Checkbox click
      container.querySelectorAll('.track-checkbox').forEach(cb => {
        cb.addEventListener('change', () => {
          const trackId = cb.dataset.id;
          const track = findTrackInDiscography(trackId);
          if (track) toggleTrackSelection(track, cb.checked);
        });
      });

      // Play preview click
      container.querySelectorAll('.btn-track-play').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const prevUrl = btn.dataset.preview;
          if (!prevUrl) return;

          // Same track button clicked: toggle play / pause
          if (currentPlayingBtn === btn) {
            if (audioPlayer.paused) {
              btn.innerHTML = TRACK_ICON_SPIN;
              btn.classList.add('loading');
              try {
                await audioPlayer.play();
                btn.classList.remove('loading');
                btn.classList.add('playing');
                btn.innerHTML = TRACK_ICON_PAUSE;
              } catch (_) {
                btn.classList.remove('loading', 'playing');
                btn.innerHTML = TRACK_ICON_PLAY;
              }
            } else {
              audioPlayer.pause();
              btn.classList.remove('loading', 'playing');
              btn.innerHTML = TRACK_ICON_PLAY;
            }
            return;
          }

          // Lock track switching & buffering immediately before silencing previous stream
          isTrackSwitching = true;
          isMiniLoading = true;
          activePlaybackSource = 'artist';
          isFavoritesAutoplay = false;

          // Immediately give loading feedback on button & player
          btn.innerHTML = TRACK_ICON_SPIN;
          btn.classList.add('loading');
          currentPlayingBtn = btn;
          currentPlayingTrackId = String(btn.dataset.preview || btn.dataset.id || '').trim();
          currentPlayingTrackData = {
            id: btn.dataset.id || btn.dataset.preview,
            url: btn.dataset.url || '',
            title: btn.dataset.title,
            artist: btn.dataset.artist,
            album: btn.dataset.album || '',
            duration: btn.dataset.duration || '',
            thumbnail: btn.dataset.art,
            preview_url: btn.dataset.preview
          };

          showMiniPlayer(btn.dataset.title, btn.dataset.artist, btn.dataset.art);
          setMiniLoading(true, 'Buffering…');

          // Immediately silence previous stream
          try {
            audioPlayer.pause();
            audioPlayer.currentTime = 0;
          } catch (_) {}

          // Different button clicked: reset previous active button icon back to PLAY
          resetCurrentPlayingBtn();

          try {
            audioPlayer.src = prevUrl;
            currentPlayingTrackId = String(btn.dataset.preview || btn.dataset.id || '').trim();
            await audioPlayer.play();
            btn.classList.remove('loading');
            btn.classList.add('playing');
            btn.innerHTML = TRACK_ICON_PAUSE;
          } catch (err) {
            console.error('Audio playback failed:', err);
            setMiniLoading(false);
            btn.classList.remove('loading', 'playing');
            btn.innerHTML = TRACK_ICON_PLAY;
            currentPlayingBtn = null;
            toast('error', t('toast_audio_preview_failed'));
          }
        });
      });

      // Single track download
      container.querySelectorAll('.btn-track-download').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const trackId = btn.dataset.id;
          const track = findTrackInDiscography(trackId);
          if (!track) return;

          btn.innerHTML = `<div class="spinner-small" style="margin:auto;"></div>`;
          btn.disabled = true;

          try {
            const res = await fetch('/api/download', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                url: track.url || '',
                title: track.title,
                artist: track.artist,
                album: track.album || '',
                year: track.year || '',
                poster_url: track.artwork_url || track.thumbnail || '',
                quality: currentPreferredQuality
              })
            });
            let data = null;
            try {
              data = await res.json();
            } catch (_) {}
            if (!res.ok) throw new Error((data && data.detail) || `Server error (${res.status})`);
            if (!data || !data.download_url) throw new Error('Download URL not found.');

            triggerDownload(data.download_url, data.filename);
            toast('success', t('toast_downloading_track', { artist: esc(track.artist), title: esc(track.title) }));
          } catch (err) {
            console.error(err);
            toast('error', t('toast_download_failed', { error: err.message }));
          } finally {
            btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>`;
            btn.disabled = false;
          }
        });
      });

      // Discography favorite star click
      container.querySelectorAll('.btn-track-fav').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const track = {
            id: btn.dataset.id,
            title: btn.dataset.title,
            artist: btn.dataset.artist,
            album: btn.dataset.album,
            duration: btn.dataset.duration,
            thumbnail: btn.dataset.art,
            preview_url: btn.dataset.preview
          };
          toggleFavorite(track);
        });
      });
    }

    function findTrackInDiscography(trackId) {
      if (!currentDiscography) return null;
      let found = currentDiscography.top_songs.find(t => t.track_id === trackId);
      if (found) return found;
      for (const alb of currentDiscography.albums) {
        if (alb.tracks) {
          found = alb.tracks.find(t => t.track_id === trackId);
          if (found) return found;
        }
      }
      return null;
    }

    // ── Multi-Select & Batch Actions ──────────────────────────

    function toggleTrackSelection(track, forceVal = null) {
      const isSelected = forceVal !== null ? forceVal : !selectedTracks.has(track.track_id);
      if (isSelected) {
        selectedTracks.set(track.track_id, track);
      } else {
        selectedTracks.delete(track.track_id);
      }

      document.querySelectorAll(`.track-row[data-id="${track.track_id}"]`).forEach(row => {
        row.classList.toggle('selected', isSelected);
        const cb = row.querySelector('.track-checkbox');
        if (cb) cb.checked = isSelected;
      });

      updateBatchActionBar();
      updateSelectAllTopButton();
    }

    function clearSelection() {
      selectedTracks.clear();
      document.querySelectorAll('.track-row.selected').forEach(r => r.classList.remove('selected'));
      document.querySelectorAll('.track-checkbox:checked').forEach(c => c.checked = false);
      if ($batchActionBar) $batchActionBar.style.display = 'none';
      updateSelectAllTopButton();
    }

    function updateBatchActionBar() {
      const count = selectedTracks.size;
      if (count > 0 && !isBatchDownloading) {
        $batchActionBar.style.display = 'flex';
        $batchCount.textContent = count;
        $btnBatchDlText.textContent = t('download_selected', { count });
      } else {
        $batchActionBar.style.display = 'none';
      }
    }

    if ($btnBatchClear) {
      $btnBatchClear.addEventListener('click', clearSelection);
    }

    // ── Sequential Batch Downloader (Option A) ────────────────

    if ($btnBatchDownload) {
      $btnBatchDownload.addEventListener('click', startBatchDownload);
    }

    if ($btnBatchCancel) {
      $btnBatchCancel.addEventListener('click', () => {
        cancelBatchDownload = true;
        $batchProgressStatus.textContent = 'Cancelling...';
      });
    }

    if ($btnBatchRetry) {
      $btnBatchRetry.addEventListener('click', () => {
        if ($batchProgressActions) $batchProgressActions.style.display = 'none';
        startBatchDownload();
      });
    }

    if ($btnBatchDismiss) {
      $btnBatchDismiss.addEventListener('click', () => {
        $batchProgressWidget.style.display = 'none';
        isBatchDownloading = false;
        if (selectedTracks.size > 0 && $batchActionBar) {
          $batchActionBar.style.display = 'flex';
        }
      });
    }

    
    // ══════════════════════════════════════════════════════════════
    //  FAVORITES PLAYLIST & AUTOPLAY ENGINE (v1.20.0)
    // ══════════════════════════════════════════════════════════════

    function playFavoriteQueueTrack(index) {
      if (!favoritesQueue || index < 0 || index >= favoritesQueue.length) return;
      currentQueueIndex = index;
      isFavoritesAutoplay = true;
      activePlaybackSource = 'favorites';

      const track = favoritesQueue[index];
      if (!track) return;
      currentPlayingTrackId = String(track.id || track.url || track.preview_url || '').trim();
      const rawArt = track.artist || track.channel || '';
      const cleanArt = (!rawArt || rawArt.trim().toLowerCase() === 'unknown' || rawArt.trim().toLowerCase() === 'unknown artist')
        ? (extractArtistFromTitle(track.title) || 'Unknown Artist')
        : rawArt;
      currentPlayingTrackData = {
        id: track.id || track.url,
        url: track.url || '',
        title: track.title,
        artist: cleanArt,
        thumbnail: track.thumbnail,
        duration: track.duration,
        preview_url: track.preview_url
      };

      // Immediately engage buffering state & track switching lock
      isTrackSwitching = true;
      setMiniLoading(true, 'Buffering…');

      // Immediately silence previous stream to eliminate audio dissonance
      try {
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
      } catch (_) {}

      // Update card active loading style in favorites list immediately
      if ($favoritesList) {
        $favoritesList.querySelectorAll('.card').forEach(c => {
          const isThis = isTrackMatching(c, currentPlayingTrackId);
          c.classList.toggle('is-playing', isThis);
          c.classList.remove('is-paused');
          const pBtn = c.querySelector('.btn-fav-play');
          if (pBtn) {
            pBtn.classList.remove('playing', 'paused');
            pBtn.classList.toggle('loading', isThis);
            const pIcon = pBtn.querySelector('.btn-play-icon');
            const pLabel = pBtn.querySelector('.btn-play-label');
            if (pIcon) pIcon.innerHTML = isThis ? CARD_ICON_SPIN : CARD_ICON_PLAY;
            if (pLabel) pLabel.textContent = isThis ? 'Buffering…' : 'Play';
          }
        });
      }

      showMiniPlayer(track.title, track.artist, track.thumbnail || '/static/logo.png', track.duration || '');
      updateMediaSessionMetadata(track.title, track.artist, track.thumbnail || '/static/logo.png');

      // Resolve full audio stream (prioritize direct YouTube URL, fallback to "Artist - Title" search query)
      const targetQueryOrUrl = (track.url || '').trim() || `${track.artist} - ${track.title}`;
      const targetTrackId = currentPlayingTrackId;

      fetch(`/api/preview?url=${encodeURIComponent(targetQueryOrUrl)}`)
        .then(res => {
          if (!res.ok) throw new Error(`Preview stream error (${res.status})`);
          return res.json();
        })
        .then(data => {
          if (!data || !data.stream_url) throw new Error('Stream URL unavailable');
          if (currentPlayingTrackId !== targetTrackId) return; // Stale track clicked

          // If backend resolved a full YouTube URL for an artist track, persist it in the favorite item
          if (data.youtube_url && !track.url) {
            track.url = data.youtube_url;
            try {
              const favs = getFavorites();
              const fItem = favs.find(f => (f.id && f.id === track.id) || (f.title === track.title && f.artist === track.artist));
              if (fItem) {
                fItem.url = data.youtube_url;
                saveFavorites(favs);
              }
            } catch (_) {}
          }

          audioPlayer.src = data.stream_url;
          audioPlayer.play().then(() => {
            isTrackSwitching = false;
          }).catch(e => {
            console.warn('Autoplay prevented:', e);
            isTrackSwitching = false;
            setMiniLoading(false);
          });
        })
        .catch(err => {
          console.error('[Favorites Playback] Full stream error:', err);
          // Fallback to 30s preview snippet only if full YouTube stream fails
          if (track.preview_url && currentPlayingTrackId === targetTrackId) {
            audioPlayer.src = track.preview_url;
            audioPlayer.play().then(() => {
              isTrackSwitching = false;
            }).catch(e => {
              console.warn('Fallback preview play prevented:', e);
              isTrackSwitching = false;
              setMiniLoading(false);
            });
            toast('info', t('toast_full_stream_unavailable'));
            return;
          }

          isTrackSwitching = false;
          setMiniLoading(false);
          toast('warning', t('toast_could_not_play', { title: track.title }));
          setTimeout(() => {
            if (isFavoritesAutoplay && currentQueueIndex === index) {
              playAdjacentTrack(1);
            }
          }, 1200);
        });
    }

    function renderFavorites(filterQuery = '') {
      const allFavs = getFavorites();
      const q = (filterQuery || '').trim().toLowerCase();
      const filtered = q
        ? allFavs.filter(t => (t.title || '').toLowerCase().includes(q) || (t.artist || '').toLowerCase().includes(q))
        : allFavs;

      if ($favoritesCountPill) {
        $favoritesCountPill.textContent = t('favorites_count', { count: allFavs.length });
      }
      updateFavoritesBadge();

      if (allFavs.length === 0) {
        if ($favoritesEmptyState) $favoritesEmptyState.style.display = 'flex';
        if ($favoritesList) {
          $favoritesList.innerHTML = '';
          $favoritesList.style.display = 'none';
        }
        if ($favoritesActionsBar) {
          $favoritesActionsBar.style.display = 'flex';
          $favoritesActionsBar.classList.add('is-empty');
        }
        return;
      }

      if ($favoritesActionsBar) {
        $favoritesActionsBar.style.display = 'flex';
        $favoritesActionsBar.classList.remove('is-empty');
      }

      if (filtered.length === 0) {
        if ($favoritesEmptyState) $favoritesEmptyState.style.display = 'none';
        if ($favoritesList) {
          $favoritesList.style.display = 'flex';
          $favoritesList.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: var(--clr-text-dim);">
              <p>${t('fav_no_matches', { query: esc(filterQuery) })}</p>
            </div>
          `;
        }
        return;
      }

      if ($favoritesEmptyState) $favoritesEmptyState.style.display = 'none';
      // Resynchronize currentQueueIndex with the actual playing track ID
      if (currentPlayingTrackId) {
        const foundIdx = filtered.findIndex(t => String(t.id || t.url).trim() === String(currentPlayingTrackId).trim());
        if (foundIdx !== -1) {
          currentQueueIndex = foundIdx;
        }
      }

      if ($favoritesList) {
        $favoritesList.style.display = 'flex';
        $favoritesList.innerHTML = filtered.map((item, idx) => {
          const cardId = `fav-card-${idx}`;
          const trackIdStr = String(item.id || item.url || item.preview_url || '').trim();
          const isTrackActive = currentPlayingTrackId && (
            trackIdStr === String(currentPlayingTrackId).trim() ||
            (item.url && String(item.url).trim() === String(currentPlayingTrackId).trim()) ||
            (item.preview_url && String(item.preview_url).trim() === String(currentPlayingTrackId).trim())
          );
          const isPlayingThis = isTrackActive && !audioPlayer.paused;
          const isPausedThis = isTrackActive && audioPlayer.paused;
          const cardClass = isPlayingThis ? 'is-playing' : (isPausedThis ? 'is-paused' : '');
          const btnClass = isPlayingThis ? 'playing' : (isPausedThis ? 'paused' : '');
          const btnIcon = isPlayingThis ? CARD_ICON_PAUSE : CARD_ICON_PLAY;
          const btnLabel = isPlayingThis ? t('pause') : (isPausedThis ? t('resume') : t('play'));

          const rawArt = item.artist || item.channel || '';
          const displayArtist = (!rawArt || rawArt.trim().toLowerCase() === 'unknown' || rawArt.trim().toLowerCase() === 'unknown artist')
            ? (extractArtistFromTitle(item.title) || 'Unknown Artist')
            : rawArt;

          return `
            <article class="card ${cardClass}" id="${cardId}" data-track-id="${esc(trackIdStr)}" data-url="${esc(item.url || '')}" data-preview="${esc(item.preview_url || '')}" role="listitem">
              <div class="card-thumb-wrap">
                <img class="card-thumb" src="${esc(item.thumbnail || '/static/logo.png')}" alt="${esc(item.title)}" loading="lazy" onerror="this.src='/static/logo.png'">
                ${item.duration ? `<span class="card-duration">${esc(item.duration)}</span>` : ''}
              </div>
              <div class="card-info">
                <h3 class="card-title" title="${esc(item.title)}">${esc(item.title)}</h3>
                <div class="card-meta">
                  <span class="card-channel">${esc(displayArtist)}</span>
                  ${item.album ? `<span style="font-size:0.78rem;color:var(--clr-text-dim);">• ${esc(item.album)}</span>` : ''}
                </div>
              </div>
              <div class="card-action">
                <div class="card-action-top-row">
                  <button type="button" class="btn-card-play btn-fav-play ${btnClass}" data-index="${idx}" data-track-id="${esc(trackIdStr)}" data-url="${esc(item.url || '')}" data-preview="${esc(item.preview_url || '')}" title="${btnLabel}">
                    <span class="btn-play-icon">${btnIcon}</span>
                    <span class="btn-play-label" data-i18n="${isPlayingThis ? 'pause' : (isPausedThis ? 'resume' : 'play')}">${btnLabel}</span>
                    <span class="play-equalizer" aria-hidden="true"><span></span><span></span><span></span></span>
                  </button>
                  <button type="button" class="btn-card-fav active" data-id="${esc(trackIdStr)}" data-title="${esc(item.title)}" title="${t('remove_from_favorites')}">
                    ${renderStarSvg(true)}
                  </button>
                </div>
                <button type="button" class="btn-download btn-fav-dl" data-index="${idx}" title="${t('download_as_kbps', { quality: currentPreferredQuality })}">
                  <div class="progress-fill" style="width: 0%"></div>
                  <span class="btn-text">${ICON_DOWNLOAD} <span class="btn-dl-label" data-i18n="download_mp3">${t('download_mp3')}</span></span>
                </button>
              </div>
            </article>
          `;
        }).join('');

        // Attach play listeners
        $favoritesList.querySelectorAll('.btn-fav-play').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const idx = parseInt(btn.dataset.index, 10);
            const item = filtered[idx];
            if (!item) return;

            const trackId = String(item.url || item.id || item.preview_url || '').trim();

            if (currentPlayingTrackId && isTrackMatching(btn, currentPlayingTrackId) && activePlaybackSource === 'favorites') {
              if (audioPlayer.paused) {
                audioPlayer.play();
              } else {
                audioPlayer.pause();
              }
              return;
            }

            // INSTANT ZERO-LATENCY VISUAL FEEDBACK:
            isTrackSwitching = true;
            isMiniLoading = true;
            currentPlayingTrackId = trackId;
            currentPlayingBtn = btn;

            btn.classList.remove('paused', 'playing');
            btn.classList.add('loading');
            const iconSpan = btn.querySelector('.btn-play-icon');
            const textSpan = btn.querySelector('.btn-play-label');
            if (iconSpan) iconSpan.innerHTML = CARD_ICON_SPIN;
            if (textSpan) textSpan.textContent = 'Buffering…';
            const card = btn.closest('.card');
            if (card) {
              card.classList.add('is-playing');
              card.classList.remove('is-paused');
            }

            showMiniPlayer(item.title, item.artist, item.thumbnail || '/static/logo.png', item.duration || '');
            setMiniLoading(true, 'Buffering…');

            favoritesQueue = [...filtered];
            playFavoriteQueueTrack(idx);
          });
        });

        // Attach remove favorite listener
        $favoritesList.querySelectorAll('.btn-card-fav').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const trackId = btn.dataset.id;
            const track = allFavs.find(t => (t.id || t.url) === trackId);
            if (track) toggleFavorite(track);
          });
        });

        // Attach individual download listener
        $favoritesList.querySelectorAll('.btn-fav-dl').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const idx = parseInt(btn.dataset.index, 10);
            const item = filtered[idx];
            if (!item) return;
            btn.disabled = true;
            const fill = btn.querySelector('.progress-fill');
            if (fill) fill.style.width = '35%';
            try {
              const res = await fetch('/api/download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  url: item.url || '',
                  title: item.title,
                  artist: item.artist,
                  album: item.album || '',
                  poster_url: item.thumbnail || '',
                  quality: currentPreferredQuality
                })
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.detail || 'Download failed');
              if (fill) fill.style.width = '100%';
              triggerDownload(data.download_url, data.filename);
              setTimeout(() => {
                if (fill) fill.style.width = '0%';
                btn.disabled = false;
              }, 2000);
            } catch (err) {
              console.error(err);
              toast('error', t('toast_download_failed', { error: err.message }));
              if (fill) fill.style.width = '0%';
              btn.disabled = false;
            }
          });
        });
      }
    }

    // Attach favorites header action listeners
    if ($btnFavPlayAll) {
      $btnFavPlayAll.addEventListener('click', () => {
        const favs = getFavorites();
        if (favs.length === 0) {
          toast('info', t('toast_fav_empty'));
          return;
        }
        favoritesQueue = [...favs];
        playFavoriteQueueTrack(0);
        toast('info', t('toast_playing_all_fav', { count: favs.length }));
      });
    }

    if ($btnFavShuffle) {
      $btnFavShuffle.addEventListener('click', () => {
        const favs = getFavorites();
        if (favs.length === 0) {
          toast('info', t('toast_fav_empty'));
          return;
        }
        // Fisher-Yates shuffle
        const shuffled = [...favs];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        favoritesQueue = shuffled;
        playFavoriteQueueTrack(0);
        toast('info', t('toast_shuffled_fav', { count: shuffled.length }));
      });
    }

    if ($btnFavDownloadAll) {
      $btnFavDownloadAll.addEventListener('click', () => {
        const favs = getFavorites();
        if (favs.length === 0) {
          toast('info', t('toast_fav_empty'));
          return;
        }
        const queueTracks = favs.map(item => ({
          track_id: item.id || item.url,
          url: item.url || '',
          title: item.title,
          artist: item.artist,
          album: item.album || '',
          artwork_url: item.thumbnail || ''
        }));
        startBatchDownload(queueTracks);
      });
    }

    if ($btnFavExport) {
      $btnFavExport.addEventListener('click', () => {
        const favs = getFavorites();
        if (favs.length === 0) {
          toast('info', t('toast_no_fav_export'));
          return;
        }
        const blob = new Blob([JSON.stringify(favs, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const dateStr = new Date().toISOString().slice(0, 10);
        a.download = `melodyxx-favorites-${dateStr}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast('success', t('toast_exported_fav', { count: favs.length }));
      });
    }

    if ($btnFavImport && $favImportInput) {
      $btnFavImport.addEventListener('click', () => {
        $favImportInput.click();
      });
    }

    function handleImportPlaylistFile(file) {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const parsed = JSON.parse(evt.target.result);
          const imported = Array.isArray(parsed)
            ? parsed
            : (parsed && Array.isArray(parsed.favorites) ? parsed.favorites
            : (parsed && Array.isArray(parsed.tracks) ? parsed.tracks
            : (parsed && Array.isArray(parsed.playlist) ? parsed.playlist
            : (parsed && Array.isArray(parsed.songs) ? parsed.songs : null))));
          if (!imported || !Array.isArray(imported)) throw new Error('Invalid JSON playlist array');

          const existing = getFavorites();
          const existingIds = new Set(existing.map(x => String(x.id || x.url).trim()));
          let addedCount = 0;
          imported.forEach(item => {
            if (!item) return;
            const id = String(item.id || item.url || `${item.artist || ''} - ${item.title || ''}`).trim();
            if (id && !existingIds.has(id)) {
              const rawArt = item.artist || item.channel || '';
              const cleanArt = (!rawArt || rawArt.trim().toLowerCase() === 'unknown' || rawArt.trim().toLowerCase() === 'unknown artist')
                ? (extractArtistFromTitle(item.title) || 'Unknown Artist')
                : rawArt;

              existing.push({
                id: item.id || item.url || id,
                url: item.url || '',
                title: item.title || 'Unknown Title',
                artist: cleanArt,
                album: item.album || '',
                duration: item.duration || '',
                thumbnail: item.thumbnail || item.artwork_url || '',
                preview_url: item.preview_url || '',
                added_at: item.added_at || Date.now()
              });
              existingIds.add(id);
              addedCount++;
            }
          });
          saveFavorites(existing);
          renderFavorites();
          updateFavoritesBadge();
          updateMiniFavButton();
          toast('success', t('toast_imported_fav', { count: addedCount, plural: addedCount === 1 ? '' : 's' }));
        } catch (err) {
          console.error('Import favorites error:', err);
          toast('error', t('toast_import_invalid'));
        }
        if ($favImportInput) $favImportInput.value = '';
      };
      reader.readAsText(file);
    }

    if ($btnFavImport && $favImportInput) {
      $btnFavImport.addEventListener('click', () => {
        $favImportInput.click();
      });
    }

    if ($btnFavEmptyImport && $favImportInput) {
      $btnFavEmptyImport.addEventListener('click', () => {
        $favImportInput.click();
      });
    }

    if ($favImportInput) {
      $favImportInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        handleImportPlaylistFile(file);
      });
    }

    // Direct drag-and-drop playlist JSON support on the empty state card
    if ($favoritesEmptyState) {
      ['dragenter', 'dragover'].forEach(evName => {
        $favoritesEmptyState.addEventListener(evName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          $favoritesEmptyState.classList.add('is-dragover');
        });
      });

      ['dragleave', 'drop'].forEach(evName => {
        $favoritesEmptyState.addEventListener(evName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          $favoritesEmptyState.classList.remove('is-dragover');
        });
      });

      $favoritesEmptyState.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const file = dt && dt.files && dt.files[0];
        if (file) {
          handleImportPlaylistFile(file);
        }
      });
    }

    /**
     * Custom Melodyxx Confirmation Dialog Modal
     * Replaces native browser confirm() with sleek glowing glassmorphism UI.
     */
    function showConfirmDialog({
      title = 'Are you sure?',
      subtitle = 'Confirmation',
      message = '',
      confirmText = 'Confirm',
      cancelText = 'Cancel',
      isDanger = false,
      onConfirm = null,
      onCancel = null
    }) {
      const $modal = document.getElementById('confirm-modal');
      const $title = document.getElementById('confirm-modal-title');
      const $subtitle = document.getElementById('confirm-modal-subtitle');
      const $message = document.getElementById('confirm-modal-message');
      const $badge = document.getElementById('confirm-modal-icon-badge');
      const $btnAction = document.getElementById('btn-confirm-action');
      const $btnCancel = document.getElementById('btn-confirm-cancel');
      const $btnClose = document.getElementById('btn-confirm-close');
      if (!$modal || !$title || !$message || !$btnAction) return;

      $title.textContent = title;
      if ($subtitle) $subtitle.textContent = subtitle;
      $message.innerHTML = message;
      $btnAction.textContent = confirmText;
      if ($btnCancel) $btnCancel.textContent = cancelText;

      if ($badge) {
        $badge.classList.toggle('danger', isDanger);
      }
      $btnAction.classList.toggle('danger', isDanger);

      function closeModal() {
        $modal.classList.add('closing');
        setTimeout(() => {
          $modal.setAttribute('aria-hidden', 'true');
          $modal.classList.remove('closing');
        }, 120);
        document.removeEventListener('keydown', handleKey);
      }

      function handleKey(e) {
        if (e.key === 'Escape') {
          closeModal();
          if (onCancel) onCancel();
        }
      }

      $btnAction.onclick = () => {
        closeModal();
        if (onConfirm) onConfirm();
      };

      if ($btnCancel) {
        $btnCancel.onclick = () => {
          closeModal();
          if (onCancel) onCancel();
        };
      }

      if ($btnClose) {
        $btnClose.onclick = () => {
          closeModal();
          if (onCancel) onCancel();
        };
      }

      $modal.onclick = (e) => {
        if (e.target === $modal) {
          closeModal();
          if (onCancel) onCancel();
        }
      };

      document.addEventListener('keydown', handleKey);
      $modal.setAttribute('aria-hidden', 'false');
      if ($btnAction) $btnAction.focus();
    }

    if ($btnFavClear) {
      $btnFavClear.addEventListener('click', () => {
        const favs = getFavorites();
        if (favs.length === 0) return;

        showConfirmDialog({
          title: t('confirm_clear_fav_title'),
          subtitle: t('confirm_clear_fav_subtitle'),
          message: t('confirm_clear_fav_message', { count: favs.length }),
          confirmText: t('confirm_btn_clear_all'),
          cancelText: t('confirm_btn_cancel'),
          isDanger: true,
          onConfirm: () => {
            saveFavorites([]);
            renderFavorites();
            updateFavoritesBadge();
            updateMiniFavButton();
            toast('info', t('toast_all_fav_cleared'));
          }
        });
      });
    }

    async function startBatchDownload(customQueue = null) {
      if (!customQueue && selectedTracks.size === 0) return;
      if (isBatchDownloading) {
        toast('info', t('toast_batch_in_progress'));
        return;
      }

      const queue = customQueue ? [...customQueue] : Array.from(selectedTracks.values());
      const total = queue.length;
      if (total === 0) return;
      isBatchDownloading = true;
      cancelBatchDownload = false;

      // Show progress widget & hide bottom bar
      $batchProgressWidget.style.display = 'block';
      if ($batchProgressActions) $batchProgressActions.style.display = 'none';
      if ($batchSpinner) $batchSpinner.style.display = 'inline-block';
      $batchActionBar.style.display = 'none';

      let successCount = 0;
      const failedTracks = [];

      for (let i = 0; i < total; i++) {
        if (cancelBatchDownload) {
          toast('info', t('toast_batch_cancelled'));
          break;
        }

        const track = queue[i];
        const trackNum = i + 1;

        // Update UI progress
        $batchProgressTitle.textContent = t('downloading_progress', { current: trackNum, total });
        $batchProgressSub.textContent = `${track.artist} - ${track.title}`;
        $batchProgressFill.style.width = `${Math.round(((i) / total) * 100)}%`;
        $batchProgressCount.textContent = `${trackNum} / ${total}`;
        $batchProgressStatus.textContent = t('preparing_queue');

        let attempt = 0;
        let downloaded = false;

        while (attempt < 2 && !downloaded && !cancelBatchDownload) {
          attempt++;
          try {
            const res = await fetch('/api/download', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                url: '',
                title: track.title,
                artist: track.artist,
                album: track.album,
                year: track.year,
                poster_url: track.artwork_url,
                quality: currentPreferredQuality
              })
            });

            let data = null;
            try {
              data = await res.json();
            } catch (_) {}

            if (res.status === 429) {
              $batchProgressStatus.textContent = t('batch_rate_limit');
              await new Promise(r => setTimeout(r, 5000));
              continue;
            }

            if (!res.ok) throw new Error((data && data.detail) || `Server error (${res.status})`);
            if (!data || !data.download_url) throw new Error('Download URL missing');

            triggerDownload(data.download_url, data.filename);
            downloaded = true;
            successCount++;
            $batchProgressStatus.textContent = t('batch_stream_dispatched');

            // Automatically uncheck and deselect successful track from selection state
            toggleTrackSelection(track, false);
          } catch (err) {
            console.warn(`[Batch DL Attempt ${attempt}] ${track.title}:`, err);
            if (attempt < 2 && !cancelBatchDownload) {
              $batchProgressStatus.textContent = t('batch_retrying');
              await new Promise(r => setTimeout(r, 2000));
            } else {
              failedTracks.push(track);
              $batchProgressStatus.textContent = t('batch_failed');
            }
          }
        }

        // Safe inter-download delay (3s) to avoid download manager thrashing & socket exhaustion
        if (i < total - 1 && !cancelBatchDownload) {
          $batchProgressStatus.textContent = t('batch_pacing');
          await new Promise(r => setTimeout(r, 3000));
        }
      }

      $batchProgressFill.style.width = '100%';
      if ($batchSpinner) $batchSpinner.style.display = 'none';

      if (failedTracks.length === 0) {
        $batchProgressTitle.textContent = t('batch_completed');
        $batchProgressSub.textContent = t('batch_all_downloaded', { count: successCount });
        if ($batchProgressStatus) {
          $batchProgressStatus.innerHTML = `All downloads finished &bull; <button type="button" id="btn-batch-support" style="background:none;border:none;color:var(--accent-glow, #c084fc);cursor:pointer;font-weight:600;text-decoration:underline;padding:0;font-size:inherit;">${t('batch_support_server')}</button>`;
          const $btnBatchSupport = document.getElementById('btn-batch-support');
          if ($btnBatchSupport) {
            $btnBatchSupport.addEventListener('click', () => {
              openSupportModal();
            });
          }
        }
        toast('success', t('toast_finished_download_all', { count: successCount }));

        setTimeout(() => {
          $batchProgressWidget.style.display = 'none';
          isBatchDownloading = false;
          clearSelection();
        }, 4000);
      } else {
        // Keep failed tracks selected so the user can see what failed and retry them
        isBatchDownloading = false;
        $batchProgressTitle.textContent = t('batch_incomplete');
        $batchProgressSub.textContent = t('batch_summary_failed', { success: successCount, failed: failedTracks.length });
        $batchProgressStatus.textContent = 'Failed tracks kept in queue';
        if ($btnBatchRetryText) {
          $btnBatchRetryText.textContent = t('batch_retry_btn', { count: failedTracks.length });
        }
        if ($batchProgressActions) {
          $batchProgressActions.style.display = 'flex';
        }
        toast('warning', t('toast_batch_some_failed', { count: failedTracks.length, plural: failedTracks.length === 1 ? '' : 's' }));
      }
    }

    function triggerDownload(url, filename) {
      const a = document.createElement('a');
      a.href = url;
      if (filename) {
        const cleanName = filename
          .replace(/#\w+/g, '')
          .replace(/\[[^\]]*\bofficial\b[^\]]*\]/gi, '')
          .replace(/\([^\)]*\bofficial\b[^\)]*\)/gi, '')
          .replace(/\s+/g, ' ')
          .replace(/^[-\s–—:|]+|[-\s–—:|]+(?=\.[^.]+$)/g, '')
          .trim();
        a.download = cleanName || filename;
      }
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => a.remove(), 1000);
    }

    // ── Global Player Setup ───────────────────────────────────
    const audioPlayer = document.getElementById('global-player');
    const $volumeControl = document.getElementById('volume-control');
    const $volumeSlider = document.getElementById('volume-slider');
    const $miniMuteBtn = document.getElementById('mini-mute-btn');

    // ── Mini Player DOM refs ──────────────────────────────────
    const $miniPlayer = document.getElementById('mini-player');
    const $miniThumb = document.getElementById('mini-thumb');
    const $miniTitle = document.getElementById('mini-title');
    const $miniArtist = document.getElementById('mini-artist');
    const $miniCurrent = document.getElementById('mini-current');
    const $miniDuration = document.getElementById('mini-duration');
    const $miniSeek = document.getElementById('mini-seek');
    const $miniPrev = document.getElementById('mini-prev');
    const $miniPlayPause = document.getElementById('mini-playpause');
    const $miniNext = document.getElementById('mini-next');
    const $miniPlayIcon = document.getElementById('mini-play-icon');
    const $miniFavBtn = document.getElementById('mini-fav-btn');

    // SVG paths for mini player icons
    const MINI_ICON_PLAY = 'M8 5v14l11-7z';
    const MINI_ICON_PAUSE = 'M6 19h4V5H6v14zm8-14v14h4V5h-4z';
    const MINI_ICON_SPIN = '<circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.25)" stroke-width="2.5" fill="none"/><path d="M12 3a9 9 0 0 1 9 9" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" fill="none"/>';

    let isMiniLoading = false;
    let isTrackSwitching = false;

    function setMiniLoading(isLoading, labelText = 'Buffering…') {
      isMiniLoading = !!isLoading;
      if (isMiniLoading) {
        $miniPlayer.classList.add('loading');
        $miniPlayIcon.classList.add('mini-spin-anim');
        $miniPlayIcon.innerHTML = MINI_ICON_SPIN;
        if ($miniCurrent) $miniCurrent.textContent = labelText;
        if ($miniPrev) $miniPrev.classList.add('is-disabled');
        if ($miniNext) $miniNext.classList.add('is-disabled');
      } else {
        $miniPlayer.classList.remove('loading');
        $miniPlayIcon.classList.remove('mini-spin-anim');
        if ($miniPrev) $miniPrev.classList.remove('is-disabled');
        if ($miniNext) $miniNext.classList.remove('is-disabled');
        setMiniIcon(audioPlayer.paused);
      }
    }

    // Volume icons for integrated mute button
    const VOL_ICON_HIGH = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>';
    const VOL_ICON_LOW = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>';
    const VOL_ICON_MUTED = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line>';

    let lastNonZeroVolume = 1;

    function updateVolumeUI(val) {
      const v = parseFloat(val);
      if ($volumeSlider) $volumeSlider.value = v;
      if ($miniMuteBtn) {
        const svg = $miniMuteBtn.querySelector('svg');
        if (svg) {
          if (v <= 0.001) {
            svg.innerHTML = VOL_ICON_MUTED;
            $miniMuteBtn.setAttribute('title', 'Unmute');
          } else if (v < 0.5) {
            svg.innerHTML = VOL_ICON_LOW;
            $miniMuteBtn.setAttribute('title', 'Mute');
          } else {
            svg.innerHTML = VOL_ICON_HIGH;
            $miniMuteBtn.setAttribute('title', 'Mute');
          }
        }
      }
    }

    function formatTime(seconds) {
      if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
      const m = Math.floor(seconds / 60);
      const s = Math.floor(seconds % 60);
      return `${m}:${s.toString().padStart(2, '0')}`;
    }

    function syncFooterHeight() {
      const footer = document.querySelector('footer.app-footer');
      if (footer) {
        const h = footer.offsetHeight;
        if (h > 0) {
          document.documentElement.style.setProperty('--footer-height', `${h}px`);
        }
      }
    }

    if (typeof ResizeObserver !== 'undefined') {
      const footerEl = document.querySelector('footer.app-footer');
      if (footerEl) {
        new ResizeObserver(() => syncFooterHeight()).observe(footerEl);
      }
    }
    window.addEventListener('resize', syncFooterHeight, { passive: true });
    window.addEventListener('orientationchange', syncFooterHeight, { passive: true });

    // ── Media Session API Integration (Lockscreen, Smartwatch & TWS) ──

    async function playAdjacentTrack(direction) {
      if (isTrackSwitching) return;
      isTrackSwitching = true;
      setTimeout(() => { isTrackSwitching = false; }, 350);

      // Immediately silence previous stream to eliminate audio dissonance
      try {
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
      } catch (_) {}

      // 1. Favorites Playback Mode
      if (activePlaybackSource === 'favorites' && isFavoritesAutoplay && favoritesQueue.length > 0 && currentQueueIndex >= 0) {
        let nextIndex = currentQueueIndex + direction;
        if (nextIndex < 0) nextIndex = favoritesQueue.length - 1;
        if (nextIndex >= favoritesQueue.length) nextIndex = 0;
        playFavoriteQueueTrack(nextIndex);
        return;
      }

      // 2. Search Results Playback Mode
      if (activePlaybackSource === 'search' && allSearchResults.length > 0) {
        let currentIndex = activeSearchTrackIndex;
        if (currentIndex < 0 || currentIndex >= allSearchResults.length) {
          currentIndex = allSearchResults.findIndex(item => item.url === currentPlayingTrackId || item.id === currentPlayingTrackId);
        }
        if (currentIndex === -1) currentIndex = 0;

        let nextIndex = currentIndex + direction;
        if (nextIndex < 0) {
          nextIndex = allSearchResults.length - 1;
        } else if (nextIndex >= allSearchResults.length) {
          if (hasMoreSearchResults && typeof loadMoreSearchResults === 'function') {
            await loadMoreSearchResults();
            if (nextIndex < allSearchResults.length) {
              await playSearchTrack(allSearchResults[nextIndex], nextIndex);
              return;
            }
          }
          nextIndex = 0;
        }

        const nextItem = allSearchResults[nextIndex];
        if (nextItem) {
          await playSearchTrack(nextItem, nextIndex);
          setTimeout(() => {
            const card = document.getElementById(`card-${nextIndex}`);
            if (card) card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }, 100);
        }
        return;
      }

      // 3. Artist Discography Mode (or DOM button fallback)
      const isTrackList = currentPlayingBtn && currentPlayingBtn.classList.contains('btn-track-play');
      const selector = isTrackList ? '.btn-track-play' : '.btn-card-play';
      const allPlayBtns = Array.from(document.querySelectorAll(selector));
      if (allPlayBtns.length <= 1) return;

      let currentIndex = -1;
      if (currentPlayingBtn) {
        currentIndex = allPlayBtns.indexOf(currentPlayingBtn);
      }
      if (currentIndex === -1 && currentPlayingTrackId) {
        currentIndex = allPlayBtns.findIndex(b => isTrackMatching(b, currentPlayingTrackId));
      }
      if (currentIndex === -1) return;

      let nextIndex = currentIndex + direction;
      if (nextIndex < 0) nextIndex = allPlayBtns.length - 1;
      if (nextIndex >= allPlayBtns.length) nextIndex = 0;

      const targetBtn = allPlayBtns[nextIndex];
      if (targetBtn) {
        targetBtn.click();
        targetBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }

    function updateMediaSessionMetadata(title, artist, thumb) {
      if (!('mediaSession' in navigator)) return;
      try {
        const coverArt = thumb || window.location.origin + '/static/logo.png';
        const cleanArt = (!artist || artist.trim().toLowerCase() === 'unknown' || artist.trim().toLowerCase() === 'unknown artist')
          ? (extractArtistFromTitle(title) || 'Melodyxx Artist')
          : artist;
        navigator.mediaSession.metadata = new MediaMetadata({
          title: title || 'Melodyxx Audio',
          artist: cleanArt,
          album: 'Melodyxx YouTube Audio Stream',
          artwork: [
            { src: coverArt, sizes: '96x96', type: 'image/jpeg' },
            { src: coverArt, sizes: '128x128', type: 'image/jpeg' },
            { src: coverArt, sizes: '192x192', type: 'image/jpeg' },
            { src: coverArt, sizes: '256x256', type: 'image/jpeg' },
            { src: coverArt, sizes: '384x384', type: 'image/jpeg' },
            { src: coverArt, sizes: '512x512', type: 'image/jpeg' }
          ]
        });
      } catch (err) {
        console.warn('MediaSession metadata error:', err);
      }
    }

    let lastPositionUpdate = 0;
    function updateMediaSessionPosition() {
      if (!('mediaSession' in navigator) || !('setPositionState' in navigator.mediaSession)) return;
      const now = performance.now();
      if (now - lastPositionUpdate < 500) return; // throttle 500ms
      lastPositionUpdate = now;

      if (isFinite(audioPlayer.duration) && audioPlayer.duration > 0) {
        try {
          navigator.mediaSession.setPositionState({
            duration: audioPlayer.duration,
            playbackRate: audioPlayer.playbackRate || 1,
            position: Math.min(Math.max(audioPlayer.currentTime, 0), audioPlayer.duration)
          });
        } catch (_) {}
      }
    }

    function initMediaSession() {
      if (!('mediaSession' in navigator)) return;
      const handlers = [
        ['play', () => { audioPlayer.play(); }],
        ['pause', () => { audioPlayer.pause(); }],
        ['stop', () => {
          audioPlayer.pause();
          audioPlayer.currentTime = 0;
          hideMiniPlayer();
          resetCurrentPlayingBtn();
        }],
        ['seekbackward', (details) => {
          const skip = details.seekOffset || 10;
          audioPlayer.currentTime = Math.max(audioPlayer.currentTime - skip, 0);
          updateMediaSessionPosition();
        }],
        ['seekforward', (details) => {
          const skip = details.seekOffset || 10;
          if (isFinite(audioPlayer.duration)) {
            audioPlayer.currentTime = Math.min(audioPlayer.currentTime + skip, audioPlayer.duration);
          } else {
            audioPlayer.currentTime += skip;
          }
          updateMediaSessionPosition();
        }],
        ['seekto', (details) => {
          if (details.seekTime != null && isFinite(details.seekTime)) {
            audioPlayer.currentTime = Math.min(Math.max(details.seekTime, 0), audioPlayer.duration || details.seekTime);
            updateMediaSessionPosition();
          }
        }],
        ['previoustrack', () => { playAdjacentTrack(-1); }],
        ['nexttrack', () => { playAdjacentTrack(1); }]
      ];

      for (const [action, handler] of handlers) {
        try {
          navigator.mediaSession.setActionHandler(action, handler);
        } catch (_) {}
      }
    }

    // ── Dynamic Audio-Reactive Ambient Glow Aura ────────────────

    class AmbientGlowVisualizer {
      constructor(miniPlayerEl, miniThumbEl, audioEl) {
        this.player = miniPlayerEl;
        this.thumb = miniThumbEl;
        this.audio = audioEl;
        this.audioCtx = null;
        this.analyser = null;
        this.source = null;
        this.dataArray = null;
        this.animId = null;
        this.isAudioCtxReady = false;

        this.smoothEnergy = 0;
        this.smoothBass = 0;
        this.decaying = false;
      }

      init() {
        this.resetStyles();
      }

      ensureContext() {
        if (this.isAudioCtxReady) return;
        try {
          const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
          if (!AudioCtxClass) return;
          this.audioCtx = new AudioCtxClass();
          this.analyser = this.audioCtx.createAnalyser();
          this.analyser.fftSize = 64;
          this.analyser.smoothingTimeConstant = 0.75;
          this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

          try {
            this.audio.crossOrigin = 'anonymous';
            this.source = this.audioCtx.createMediaElementSource(this.audio);
            this.source.connect(this.analyser);
            this.analyser.connect(this.audioCtx.destination);
          } catch (_) {}

          this.isAudioCtxReady = true;
        } catch (e) {
          console.warn('AudioContext init note:', e);
        }
      }

      start() {
        this.ensureContext();
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
          this.audioCtx.resume();
        }
        this.decaying = false;
        if (!this.animId) {
          this.loop();
        }
      }

      stop() {
        this.decaying = true;
      }

      resetStyles() {
        if (this.player) {
          this.player.style.boxShadow = '';
          this.player.style.borderColor = '';
        }
        if (this.thumb) {
          this.thumb.style.boxShadow = '';
          this.thumb.style.transform = '';
        }
      }

      loop() {
        const isPlaying = this.audio && !this.audio.paused;

        if (!isPlaying || this.decaying) {
          // Smooth decay to zero before stopping frame loop
          this.smoothEnergy *= 0.82;
          this.smoothBass *= 0.82;

          if (this.smoothEnergy < 0.02 && this.smoothBass < 0.02) {
            this.smoothEnergy = 0;
            this.smoothBass = 0;
            this.resetStyles();
            if (this.animId) {
              cancelAnimationFrame(this.animId);
              this.animId = null;
            }
            return;
          }
        } else {
          let hasRealData = false;
          if (this.analyser && this.dataArray) {
            this.analyser.getByteFrequencyData(this.dataArray);
            for (let i = 0; i < 16; i++) {
              if (this.dataArray[i] > 0) {
                hasRealData = true;
                break;
              }
            }
          }

          let targetEnergy = 0;
          let targetBass = 0;

          if (hasRealData) {
            // Bass frequencies (bins 1 to 4: kick drums and bassline)
            const b1 = this.dataArray[1] / 255;
            const b2 = this.dataArray[2] / 255;
            const b3 = this.dataArray[3] / 255;
            const b4 = this.dataArray[4] / 255;
            targetBass = Math.pow((b1 + b2 + b3 + b4) / 4, 1.3);

            // Total energy across spectrum
            let sum = 0;
            for (let i = 0; i < 16; i++) {
              sum += this.dataArray[i];
            }
            targetEnergy = sum / (16 * 255);
          } else {
            // Organic fallback rhythmic simulation
            const t = performance.now() * 0.0035;
            const kick = Math.pow(Math.sin(t * 2.3) * 0.5 + 0.5, 3.2);
            const body = Math.sin(t * 4.6) * 0.5 + 0.5;
            targetBass = kick * 0.8 + body * 0.2;
            targetEnergy = kick * 0.6 + body * 0.4;
          }

          // Smooth interpolation
          this.smoothEnergy += (targetEnergy - this.smoothEnergy) * 0.24;
          this.smoothBass += (targetBass - this.smoothBass) * 0.28;
        }

        const energy = Math.min(1, Math.max(0, this.smoothEnergy));
        const bass = Math.min(1, Math.max(0, this.smoothBass));

        if (this.player) {
          // Subtle, delicate glow contour ("tipis-tipis") that hugs the card
          const coreBlur = Math.round(10 + bass * 12);
          const ambientBlur = Math.round(18 + energy * 16);
          const innerAlpha = (0.10 + energy * 0.12).toFixed(3);
          const borderAlpha = (0.25 + energy * 0.20).toFixed(3);
          const coreAlpha = (0.18 + bass * 0.20).toFixed(3);
          const ambientAlpha = (0.10 + energy * 0.14).toFixed(3);

          let shadow = `0 18px 45px -10px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(233, 213, 255, ${innerAlpha}) inset, 0 0 ${coreBlur}px rgba(147, 51, 234, ${coreAlpha}), 0 0 ${ambientBlur}px rgba(192, 132, 252, ${ambientAlpha})`;

          if (bass > 0.65) {
            const magentaAlpha = ((bass - 0.65) * 0.35).toFixed(3);
            shadow += `, 0 0 16px rgba(244, 114, 182, ${magentaAlpha})`;
          }

          this.player.style.boxShadow = shadow;
          this.player.style.borderColor = `rgba(192, 132, 252, ${borderAlpha})`;
        }

        if (this.thumb) {
          const thumbBlur = Math.round(8 + bass * 8);
          const thumbAlpha = (0.20 + bass * 0.25).toFixed(3);
          const thumbScale = (1 + bass * 0.018).toFixed(4);
          this.thumb.style.boxShadow = `0 4px 14px rgba(0, 0, 0, 0.55), 0 0 ${thumbBlur}px rgba(168, 85, 247, ${thumbAlpha})`;
          this.thumb.style.transform = `scale(${thumbScale})`;
        }

        this.animId = requestAnimationFrame(() => this.loop());
      }
    }

    const ambientGlowVisualizer = new AmbientGlowVisualizer($miniPlayer, $miniThumb, audioPlayer);
    ambientGlowVisualizer.init();
    initMediaSession();

    function showMiniPlayer(title, artist, thumb, duration = '') {
      syncFooterHeight();
      $miniTitle.textContent = title || '—';
      $miniTitle.title = title || '';
      const cleanArt = (!artist || artist.trim().toLowerCase() === 'unknown' || artist.trim().toLowerCase() === 'unknown artist')
        ? (extractArtistFromTitle(title) || '')
        : artist;
      $miniArtist.textContent = cleanArt;
      $miniArtist.title = cleanArt || '';
      $miniThumb.src = thumb || '/static/logo.png';
      $miniThumb.onerror = () => { $miniThumb.src = '/static/logo.png'; };
      $miniSeek.value = 0;
      $miniSeek.style.background = 'rgba(255, 255, 255, 0.12)';
      if (isMiniLoading) {
        $miniCurrent.textContent = 'Buffering…';
        if ($miniPlayIcon) {
          $miniPlayIcon.classList.add('mini-spin-anim');
          $miniPlayIcon.innerHTML = MINI_ICON_SPIN;
        }
      } else {
        $miniCurrent.textContent = '0:00';
        setMiniIcon(audioPlayer.paused);
      }
      $miniDuration.textContent = duration || '0:00';
      $miniPlayer.classList.add('show');
      if (isMiniLoading) {
        $miniPlayer.classList.add('loading');
      }
      document.body.classList.add('player-open');

      updateMediaSessionMetadata(title, artist, thumb);
      ambientGlowVisualizer.start();
      updateMiniFavButton();
    }

    function hideMiniPlayer() {
      setMiniLoading(false);
      $miniPlayer.classList.remove('show');
      $miniPlayer.classList.remove('playing');
      document.body.classList.remove('player-open');
      ambientGlowVisualizer.stop();
      currentPlayingTrackId = null;
      currentPlayingTrackData = null;
      if ($favoritesList) {
        $favoritesList.querySelectorAll('.card').forEach(c => {
          c.classList.remove('is-playing', 'is-paused');
          const pBtn = c.querySelector('.btn-fav-play');
          if (pBtn) {
            pBtn.classList.remove('playing', 'paused', 'loading');
            const pIcon = pBtn.querySelector('.btn-play-icon');
            const pLabel = pBtn.querySelector('.btn-play-label');
            if (pIcon) pIcon.innerHTML = CARD_ICON_PLAY;
            if (pLabel) pLabel.textContent = 'Play';
          }
        });
      }
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'none';
      }
    }

    function setMiniIcon(isPaused) {
      if (isMiniLoading) return;
      $miniPlayIcon.classList.remove('mini-spin-anim');
      $miniPlayIcon.innerHTML = `<path d="${isPaused ? MINI_ICON_PLAY : MINI_ICON_PAUSE}"/>`;
    }

    // Volume slider & mute initialization
    const savedVol = localStorage.getItem('melodyxx_volume') || localStorage.getItem('listen_now_volume');
    if (savedVol !== null) {
      const parsed = parseFloat(savedVol);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
        if ($volumeSlider) $volumeSlider.value = parsed;
        if (parsed > 0.05) lastNonZeroVolume = parsed;
      }
    }
    audioPlayer.volume = $volumeSlider ? parseFloat($volumeSlider.value) : 1;
    updateVolumeUI(audioPlayer.volume);

    if ($volumeSlider) {
      $volumeSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        audioPlayer.volume = val;
        if (val > 0.05) lastNonZeroVolume = val;
        updateVolumeUI(val);
        localStorage.setItem('melodyxx_volume', String(val));
      });
    }

    if ($miniMuteBtn) {
      $miniMuteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (audioPlayer.volume > 0.001) {
          lastNonZeroVolume = audioPlayer.volume > 0.05 ? audioPlayer.volume : 1;
          audioPlayer.volume = 0;
          updateVolumeUI(0);
          localStorage.setItem('melodyxx_volume', '0');
        } else {
          const targetVol = lastNonZeroVolume > 0.05 ? lastNonZeroVolume : 0.7;
          audioPlayer.volume = targetVol;
          updateVolumeUI(targetVol);
          localStorage.setItem('melodyxx_volume', String(targetVol));
        }
      });
    }

    // ── Audio events ──────────────────────────────────────────

    audioPlayer.addEventListener('play', () => {
      syncAllPlaybackButtons(true);
      ambientGlowVisualizer.start();
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'playing';
      }
    });

    audioPlayer.addEventListener('waiting', () => {
      setMiniLoading(true, 'Buffering…');
      if (isTrackSwitching && currentPlayingBtn) {
        currentPlayingBtn.classList.add('loading');
        if (currentPlayingBtn.classList.contains('btn-track-play')) {
          currentPlayingBtn.innerHTML = TRACK_ICON_SPIN;
        } else if (currentPlayingBtn.classList.contains('btn-card-play')) {
          const iconSpan = currentPlayingBtn.querySelector('.btn-play-icon');
          const textSpan = currentPlayingBtn.querySelector('.btn-play-label');
          if (iconSpan) iconSpan.innerHTML = CARD_ICON_SPIN;
          if (textSpan) textSpan.textContent = 'Buffering…';
        }
      }
    });

    audioPlayer.addEventListener('canplay', () => {
      if (!audioPlayer.paused) {
        setMiniLoading(false);
        syncAllPlaybackButtons(true);
      }
    });

    audioPlayer.addEventListener('seeked', () => {
      isSeeking = false;
      setMiniLoading(false);
      syncAllPlaybackButtons(!audioPlayer.paused);
      if (!audioPlayer.paused) {
        ambientGlowVisualizer.start();
      }
      updateMediaSessionPosition();
    });

    audioPlayer.addEventListener('error', (e) => {
      isTrackSwitching = false;
      setMiniLoading(false);
      syncAllPlaybackButtons(false);
      console.error('Audio playback error:', e);
    });

    audioPlayer.addEventListener('playing', () => {
      isTrackSwitching = false;
      setMiniLoading(false);
      syncAllPlaybackButtons(true);
      ambientGlowVisualizer.start();
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'playing';
      }
      updateMediaSessionPosition();
    });

    audioPlayer.addEventListener('ended', () => {
      setMiniLoading(false);
      $miniPlayer.classList.remove('playing');
      ambientGlowVisualizer.stop();

      // Autoplay next track based on active playback context
      if (activePlaybackSource === 'favorites' && isFavoritesAutoplay && favoritesQueue.length > 0 && currentQueueIndex >= 0) {
        const nextIndex = currentQueueIndex + 1;
        if (nextIndex < favoritesQueue.length) {
          playFavoriteQueueTrack(nextIndex);
          return;
        } else {
          toast('info', t('toast_fav_playback_completed'));
          isFavoritesAutoplay = false;
          currentQueueIndex = -1;
        }
      } else if (activePlaybackSource === 'search' && allSearchResults.length > 0) {
        playAdjacentTrack(1);
        return;
      } else if (activePlaybackSource === 'artist') {
        playAdjacentTrack(1);
        return;
      }

      hideMiniPlayer();
      resetCurrentPlayingBtn();
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'none';
      }
    });

    audioPlayer.addEventListener('pause', () => {
      // If we are currently switching/buffering a track or seeking, ignore this pause event
      // because it was caused by stream repositioning or track initialization.
      if (isMiniLoading || isTrackSwitching || isSeeking || audioPlayer.seeking) return;

      setMiniLoading(false);
      syncAllPlaybackButtons(false);
      ambientGlowVisualizer.stop();
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused';
      }
    });

    // ── Seekbar & time display ────────────────────────────────

    let isSeeking = false;

    audioPlayer.addEventListener('timeupdate', () => {
      if (isSeeking) return;
      const { currentTime, duration } = audioPlayer;
      $miniCurrent.textContent = formatTime(currentTime);
      if (isFinite(duration) && duration > 0) {
        $miniDuration.textContent = formatTime(duration);
        $miniSeek.value = (currentTime / duration) * 100;
        // Update seekbar fill gradient
        $miniSeek.style.background = `linear-gradient(to right, var(--clr-accent) ${$miniSeek.value}%, rgba(255,255,255,0.1) ${$miniSeek.value}%)`;
      }
      updateMediaSessionPosition();
    });

    audioPlayer.addEventListener('loadedmetadata', () => {
      if (isFinite(audioPlayer.duration)) {
        $miniDuration.textContent = formatTime(audioPlayer.duration);
        updateMediaSessionPosition();
      }
    });

    $miniSeek.addEventListener('mousedown', () => { isSeeking = true; });
    $miniSeek.addEventListener('touchstart', () => { isSeeking = true; }, { passive: true });

    $miniSeek.addEventListener('input', () => {
      const pct = $miniSeek.value;
      $miniSeek.style.background = `linear-gradient(to right, var(--clr-accent) ${pct}%, rgba(255,255,255,0.1) ${pct}%)`;
      if (isFinite(audioPlayer.duration)) {
        $miniCurrent.textContent = formatTime(audioPlayer.duration * pct / 100);
      }
    });

    $miniSeek.addEventListener('change', () => {
      isSeeking = false;
      if (isFinite(audioPlayer.duration)) {
        audioPlayer.currentTime = audioPlayer.duration * $miniSeek.value / 100;
      }
      if (!audioPlayer.paused) {
        syncAllPlaybackButtons(true);
      }
    });

    window.addEventListener('mouseup', () => {
      if (isSeeking) {
        isSeeking = false;
        if (!audioPlayer.paused) syncAllPlaybackButtons(true);
      }
    });
    window.addEventListener('touchend', () => {
      if (isSeeking) {
        isSeeking = false;
        if (!audioPlayer.paused) syncAllPlaybackButtons(true);
      }
    }, { passive: true });

    // ── Mini player controls ──────────────────────────────────

    if ($miniPrev) {
      $miniPrev.addEventListener('click', (e) => {
        e.stopPropagation();
        playAdjacentTrack(-1);
      });
    }

    $miniPlayPause.addEventListener('click', () => {
      if (isMiniLoading) return;
      if (audioPlayer.paused) {
        audioPlayer.play();
      } else {
        audioPlayer.pause();
      }
    });

    if ($miniNext) {
      $miniNext.addEventListener('click', (e) => {
        e.stopPropagation();
        playAdjacentTrack(1);
      });
    }

    if ($miniFavBtn) {
      $miniFavBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        let track = currentPlayingTrackData;
        const activeId = currentPlayingTrackId || (track && (track.id || track.url));

        if (!track || !track.title) {
          const allFavs = getFavorites();
          track = allFavs.find(t => (t.id || t.url) === activeId) || track;
        }

        if (!track || !track.title) {
          const title = $miniTitle ? $miniTitle.textContent.trim() : '';
          let artist = $miniArtist ? $miniArtist.textContent.trim() : '';
          if (!artist || artist.toLowerCase() === 'unknown' || artist.toLowerCase() === 'unknown artist') {
            artist = extractArtistFromTitle(title) || 'Unknown Artist';
          }
          const thumb = $miniThumb ? $miniThumb.src : '';
          const duration = $miniDuration ? $miniDuration.textContent.trim() : '';
          if (title && title !== '—') {
            track = {
              id: activeId || title,
              url: (currentPlayingTrackData && currentPlayingTrackData.url) || '',
              title: title,
              artist: artist,
              thumbnail: thumb,
              duration: duration,
              preview_url: (currentPlayingTrackData && currentPlayingTrackData.preview_url) || ''
            };
          }
        }

        if (track && track.title && track.title !== '—') {
          toggleFavorite(track);
          if ($favoritesList && document.getElementById('tab-favorites') && document.getElementById('tab-favorites').classList.contains('active')) {
            renderFavorites();
          }
        }
      });
    }

    const $miniClose = document.getElementById('mini-close');
    if ($miniClose) {
      $miniClose.addEventListener('click', (e) => {
        e.stopPropagation();
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
        hideMiniPlayer();
        resetCurrentPlayingBtn();
        isFavoritesAutoplay = false;
        activePlaybackSource = null;
        activeSearchTrackIndex = -1;
      });
    }

    // ── Download (Zero-Disk Stream Piping, Cobalt-Style) ──────

    async function handleDownload(btn, item) {
      btn.classList.add('loading');

      const btnText = btn.querySelector('.btn-text');
      const progressFill = btn.querySelector('.progress-fill');
      const quality = btn.dataset.quality || currentPreferredQuality || '320';
      const label = quality === 'm4a' ? 'M4A' : 'MP3';

      btnText.innerHTML = `${ICON_SPIN} Connecting…`;
      progressFill.style.width = '35%';
      btn.setAttribute('aria-label', `Connecting stream for ${item.title}…`);
      $loadingText.textContent = `Downloading: ${item.title}`;

      try {
        // Fast URL stream resolution (~0.5s)
        const res = await fetch('/api/download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: item.url, title: item.title, quality }),
        });
        const data = await res.json();

        if (!res.ok) {
          if (res.status === 429) {
            throw new Error('Too many requests. Please wait a moment and try again.');
          }
          throw new Error(data.detail || `HTTP ${res.status}`);
        }

        // Trigger native browser download immediately
        progressFill.style.width = '100%';
        btnText.innerHTML = `${ICON_CHECK} Downloading…`;

        triggerDownload(data.download_url, data.filename);

        btn.classList.remove('loading');
        btn.classList.add('done');
        toast('success', t('toast_downloading_direct', { title: esc(item.title) }));

        if (Notification.permission === 'granted') {
          new Notification('Download Started!', {
            body: item.title,
            icon: item.thumbnail || '/static/logo.png',
            badge: '/static/logo.png',
            tag: 'melodyxx-download',
          });
        }

        setTimeout(() => {
          btn.classList.remove('done');
          progressFill.style.width = '0%';
          btnText.innerHTML = `${ICON_DOWNLOAD} ${label}`;
        }, 3000);

      } catch (err) {
        console.error('[Download Error]', err);

        btn.classList.remove('loading');
        btn.classList.add('error-state');
        progressFill.style.width = '0%';
        btnText.innerHTML = `${ICON_DOWNLOAD} Try Again`;
        btn.setAttribute('aria-label', `Retry download ${item.title}`);

        setTimeout(() => {
          btn.classList.remove('error-state');
          btnText.innerHTML = `${ICON_DOWNLOAD} ${label}`;
          btn.removeAttribute('disabled');
        }, 2500);

        toast('error', t('toast_download_failed', { error: err.message }));
      }
    }
    // ── Form submit ───────────────────────────────────────────

    // ── Live Autocomplete & Search Recommendations ─────────────
    const ICON_SUGGEST_SEARCH = `<svg class="suggestion-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`;
    const ICON_SUGGEST_ARTIST = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
    const ICON_SUGGEST_ARROW = `<svg class="suggestion-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>`;

    const suggestCache = new Map();
    let suggestAbortCtrl = null;
    let suggestDebounceTimer = null;
    let activeSuggestIndex = -1;

    function hideSearchSuggestions() {
      clearTimeout(suggestDebounceTimer);
      if (suggestAbortCtrl) {
        try {
          suggestAbortCtrl.abort();
        } catch (_) {}
        suggestAbortCtrl = null;
      }
      if (!$searchSuggestions) return;
      $searchSuggestions.style.display = 'none';
      $searchSuggestions.innerHTML = '';
      activeSuggestIndex = -1;
      if ($emptyState) {
        $emptyState.style.visibility = '';
      }
    }

    function highlightMatch(text, query) {
      if (!text) return '';
      if (!query || !query.trim()) return esc(text);
      const qClean = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${qClean})`, 'gi');
      const parts = text.split(regex);
      return parts.map(part => {
        if (part.toLowerCase() === query.trim().toLowerCase()) {
          return `<strong class="suggestion-match">${esc(part)}</strong>`;
        }
        return esc(part);
      }).join('');
    }

    function renderSearchSuggestions(data, typedQuery) {
      if (!$searchSuggestions || isSearching) return;

      // ── ARTISTS MODE: strictly render matching artists, never song titles ──
      if (searchMode === 'artists') {
        const artists = (data.artists && data.artists.length > 0)
          ? data.artists
          : (data.top_artist ? [data.top_artist] : []);

        if (artists.length === 0) {
          hideSearchSuggestions();
          return;
        }

        let html = '<div class="suggestion-queries-list">';
        html += artists.map(art => {
          const photoHtml = art.photo
            ? `<img src="${esc(art.photo)}" alt="${esc(art.name)}" class="suggestion-artist-photo" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" /><div class="suggestion-artist-avatar-fallback" style="display:none;">${ICON_SUGGEST_ARTIST}</div>`
            : `<div class="suggestion-artist-avatar-fallback">${ICON_SUGGEST_ARTIST}</div>`;

          const flagHtml = renderCountryFlagHtml(art.country_code || art.flag, art.country);
          const countryLabel = art.country
            ? `<span class="suggestion-artist-country" title="${esc(art.country)}">${flagHtml}${flagHtml ? ' ' : ''}${esc(art.country)}</span>`
            : (flagHtml ? `<span class="suggestion-artist-country">${flagHtml}</span>` : '');

          const metaItems = [];
          if (countryLabel) metaItems.push(countryLabel);
          metaItems.push(esc(art.genre || 'Artist'));

          return `
            <div class="suggestion-artist-item" data-type="artist" data-artist-id="${esc(art.artist_id || '')}" data-name="${esc(art.name)}" role="option" tabindex="-1">
              <div class="suggestion-artist-avatar" aria-hidden="true">
                ${photoHtml}
              </div>
              <div class="suggestion-artist-info">
                <span class="suggestion-artist-name">${highlightMatch(art.name, typedQuery)}</span>
                <div class="suggestion-artist-meta">
                  ${metaItems.join(' • ')}
                </div>
              </div>
              <span class="suggestion-artist-badge">Artist</span>
            </div>
          `;
        }).join('');
        html += '</div>';

        $searchSuggestions.innerHTML = html;
        $searchSuggestions.style.display = 'block';
        if ($emptyState) $emptyState.style.visibility = 'hidden';
        activeSuggestIndex = -1;

        $searchSuggestions.querySelectorAll('.suggestion-artist-item').forEach(el => {
          el.addEventListener('click', () => {
            const name = el.dataset.name;
            const artistId = el.dataset.artistId;
            $input.value = name;
            syncClearButtonVisibility();
            hideSearchSuggestions();
            if (artistId) {
              loadArtistDiscography(artistId);
            } else {
              performArtistSearch(name);
            }
          });
        });

        const allItems = Array.from($searchSuggestions.querySelectorAll('.suggestion-artist-item'));
        allItems.forEach((el, idx) => {
          el.addEventListener('mouseenter', () => {
            allItems.forEach(i => i.classList.remove('active'));
            el.classList.add('active');
            activeSuggestIndex = idx;
          });
        });
        return;
      }

      // ── SONGS MODE: render featured top artist (if matched) + YouTube query predictions ──
      const topArtist = data.top_artist;
      const suggestions = (data.suggestions || []).filter(s => s && s.trim().length > 0);

      if (!topArtist && suggestions.length === 0) {
        hideSearchSuggestions();
        return;
      }

      let html = '';

      // 1. Featured Top Artist Entity Recommendation
      if (topArtist && topArtist.name) {
        const photoHtml = topArtist.photo
          ? `<img src="${esc(topArtist.photo)}" alt="${esc(topArtist.name)}" class="suggestion-artist-photo" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" /><div class="suggestion-artist-avatar-fallback" style="display:none;">${ICON_SUGGEST_ARTIST}</div>`
          : `<div class="suggestion-artist-avatar-fallback">${ICON_SUGGEST_ARTIST}</div>`;

        const flagHtml = renderCountryFlagHtml(topArtist.country_code || topArtist.flag, topArtist.country);
        const countryLabel = topArtist.country
          ? `<span class="suggestion-artist-country" title="${esc(topArtist.country)}">${flagHtml}${flagHtml ? ' ' : ''}${esc(topArtist.country)}</span>`
          : (flagHtml ? `<span class="suggestion-artist-country">${flagHtml}</span>` : '');

        const metaItems = [];
        if (countryLabel) metaItems.push(countryLabel);
        metaItems.push(esc(topArtist.genre || 'Artist'));

        html += `
          <div class="suggestion-artist-item" data-type="artist" data-artist-id="${esc(topArtist.artist_id || '')}" data-name="${esc(topArtist.name)}" role="option" tabindex="-1">
            <div class="suggestion-artist-avatar" aria-hidden="true">
              ${photoHtml}
            </div>
            <div class="suggestion-artist-info">
              <span class="suggestion-artist-name">${highlightMatch(topArtist.name, typedQuery)}</span>
              <div class="suggestion-artist-meta">
                ${metaItems.join(' • ')}
              </div>
            </div>
            <span class="suggestion-artist-badge">Artist</span>
          </div>
        `;
      }

      // Divider if both artist and query predictions exist
      if (topArtist && suggestions.length > 0) {
        html += '<div class="suggestion-divider" aria-hidden="true"></div>';
      }

      // 2. Query Autocomplete Predictions
      if (suggestions.length > 0) {
        html += '<div class="suggestion-queries-list">';
        html += suggestions.map((sugg) => `
          <div class="suggestion-item" data-type="query" data-query="${esc(sugg)}" role="option" tabindex="-1">
            ${ICON_SUGGEST_SEARCH}
            <span class="suggestion-item-text">${highlightMatch(sugg, typedQuery)}</span>
            ${ICON_SUGGEST_ARROW}
          </div>
        `).join('');
        html += '</div>';
      }

      $searchSuggestions.innerHTML = html;
      $searchSuggestions.style.display = 'block';
      activeSuggestIndex = -1;

      $searchSuggestions.querySelectorAll('.suggestion-artist-item').forEach(el => {
        el.addEventListener('click', () => {
          const name = el.dataset.name;
          const artistId = el.dataset.artistId;
          $input.value = name;
          syncClearButtonVisibility();
          hideSearchSuggestions();
          if (artistId) {
            loadArtistDiscography(artistId);
          } else {
            performSearch(name);
          }
        });
      });

      $searchSuggestions.querySelectorAll('.suggestion-item').forEach(el => {
        el.addEventListener('click', () => {
          const q = el.dataset.query;
          $input.value = q;
          syncClearButtonVisibility();
          hideSearchSuggestions();
          performSearch(q);
        });
      });

      const allItems = Array.from($searchSuggestions.querySelectorAll('.suggestion-artist-item, .suggestion-item'));
      allItems.forEach((el, idx) => {
        el.addEventListener('mouseenter', () => {
          allItems.forEach(i => i.classList.remove('active'));
          el.classList.add('active');
          activeSuggestIndex = idx;
        });
      });
    }

    async function fetchSearchSuggestions(query) {
      if (isSearching) return;
      const q = query.trim();
      if (!q || q.startsWith('http://') || q.startsWith('https://')) {
        hideSearchSuggestions();
        return;
      }

      const cacheKey = `${searchMode}:${q.toLowerCase()}`;
      if (suggestCache.has(cacheKey)) {
        if (!isSearching) {
          renderSearchSuggestions(suggestCache.get(cacheKey), q);
        }
        return;
      }

      if (suggestAbortCtrl) {
        suggestAbortCtrl.abort();
      }
      suggestAbortCtrl = new AbortController();

      try {
        const res = await fetch(`/api/suggest?q=${encodeURIComponent(q)}&mode=${searchMode}`, {
          signal: suggestAbortCtrl.signal,
          headers: { 'Accept': 'application/json' }
        });
        if (!res.ok || isSearching) return;
        const data = await res.json();
        suggestCache.set(cacheKey, data);
        if (suggestCache.size > 200) {
          const firstKey = suggestCache.keys().next().value;
          suggestCache.delete(firstKey);
        }
        if (!isSearching && $input.value.trim().toLowerCase() === q.toLowerCase()) {
          renderSearchSuggestions(data, q);
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.debug('[Suggest Error]', err);
        }
      }
    }

    function syncClearButtonVisibility() {
      if (!$searchClearBtn) return;
      if ($input.value.trim().length > 0) {
        $searchClearBtn.style.display = 'inline-flex';
      } else {
        $searchClearBtn.style.display = 'none';
      }
    }

    $input.addEventListener('input', () => {
      syncClearButtonVisibility();
      if (searchMode === 'favorites') {
        renderFavorites($input.value.trim());
        hideSearchSuggestions();
        return;
      }
      clearTimeout(suggestDebounceTimer);
      const val = $input.value.trim();
      if (!val || val.startsWith('http://') || val.startsWith('https://')) {
        hideSearchSuggestions();
        return;
      }
      suggestDebounceTimer = setTimeout(() => {
        fetchSearchSuggestions(val);
      }, 90);
    });

    $input.addEventListener('blur', () => {
      setTimeout(() => {
        hideSearchSuggestions();
      }, 150);
    });

    // Dismiss suggestions when clicking anywhere outside search form
    document.addEventListener('click', (e) => {
      if ($form && !$form.contains(e.target)) {
        hideSearchSuggestions();
      }
    });

    if ($searchClearBtn) {
      $searchClearBtn.addEventListener('click', () => {
        $input.value = '';
        syncClearButtonVisibility();
        hideSearchSuggestions();
        if (searchMode === 'favorites') {
          renderFavorites('');
        }
        $input.focus();
      });
    }

    $form.addEventListener('submit', (e) => {
      e.preventDefault();
      hideSearchSuggestions();
      if ($input) $input.blur();
      const q = $input.value.trim();
      if (q) performSearch(q);
    });

    // Keyboard navigation (ArrowDown, ArrowUp, Enter, Escape)
    $input.addEventListener('keydown', (e) => {
      const isVisible = $searchSuggestions && $searchSuggestions.style.display === 'block';
      const items = isVisible ? Array.from($searchSuggestions.querySelectorAll('.suggestion-artist-item, .suggestion-item')) : [];

      if (e.key === 'ArrowDown') {
        if (!isVisible) {
          const val = $input.value.trim();
          if (val) fetchSearchSuggestions(val);
          return;
        }
        e.preventDefault();
        if (items.length > 0) {
          activeSuggestIndex = (activeSuggestIndex + 1) % items.length;
          items.forEach((it, idx) => {
            if (idx === activeSuggestIndex) {
              it.classList.add('active');
              it.scrollIntoView({ block: 'nearest' });
            } else {
              it.classList.remove('active');
            }
          });
        }
      } else if (e.key === 'ArrowUp') {
        if (isVisible && items.length > 0) {
          e.preventDefault();
          activeSuggestIndex = (activeSuggestIndex - 1 + items.length) % items.length;
          items.forEach((it, idx) => {
            if (idx === activeSuggestIndex) {
              it.classList.add('active');
              it.scrollIntoView({ block: 'nearest' });
            } else {
              it.classList.remove('active');
            }
          });
        }
      } else if (e.key === 'Enter') {
        if (isVisible && activeSuggestIndex >= 0 && items[activeSuggestIndex]) {
          e.preventDefault();
          e.stopPropagation();
          items[activeSuggestIndex].click();
        } else {
          hideSearchSuggestions();
          $form.dispatchEvent(new Event('submit'));
        }
      } else if (e.key === 'Escape') {
        if (isVisible) {
          e.preventDefault();
          e.stopPropagation();
          hideSearchSuggestions();
        } else {
          $input.value = '';
          syncClearButtonVisibility();
        }
      }
    });

    // Close suggestions on click outside
    document.addEventListener('pointerdown', (e) => {
      if ($form && !$form.contains(e.target)) {
        hideSearchSuggestions();
      }
    });

    // ── Keyboard Shortcuts ────────────────────────────────────
    let shortcutTipShown = false;
    document.addEventListener('keydown', (e) => {
      // Don't hijack shortcuts when typing in inputs, textareas, selects, or contenteditable
      const targetTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      if (['input', 'textarea', 'select'].includes(targetTag) || document.activeElement?.isContentEditable) {
        return;
      }
      // Don't trigger on modifier keys
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === ' ') {
        e.preventDefault();
        if (currentPlayingBtn) {
          if (audioPlayer.paused) {
            audioPlayer.play();
            updateCurrentPlayingBtn(true);
          } else {
            audioPlayer.pause();
          }
        }
      } else if (e.key === 'Escape') {
        resetCurrentPlayingBtn();
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
        hideMiniPlayer();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const currentV = $volumeSlider ? parseFloat($volumeSlider.value) : audioPlayer.volume;
        const newVol = Math.min(1, Math.round((currentV + 0.05) * 100) / 100);
        audioPlayer.volume = newVol;
        if (newVol > 0.05) lastNonZeroVolume = newVol;
        updateVolumeUI(newVol);
        localStorage.setItem('melodyxx_volume', String(newVol));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const currentV = $volumeSlider ? parseFloat($volumeSlider.value) : audioPlayer.volume;
        const newVol = Math.max(0, Math.round((currentV - 0.05) * 100) / 100);
        audioPlayer.volume = newVol;
        if (newVol > 0.05) lastNonZeroVolume = newVol;
        updateVolumeUI(newVol);
        localStorage.setItem('melodyxx_volume', String(newVol));
      }

      // Show keyboard tip on first use
      if (!shortcutTipShown && ['Space', 'ArrowUp', 'ArrowDown', 'Escape'].includes(e.code)) {
        shortcutTipShown = true;
      }
    });

    // ── Notification Permission Request ───────────────────────
    // Request after first search (avoids asking on page load which users dismiss)
    function requestNotificationPermission() {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }

    // ── In-App Update Notification System ──────────────────────
    const $updateBanner = document.getElementById('update-notification-banner');
    const $updateNewVersion = document.getElementById('update-new-version');
    const $btnUpdateReload = document.getElementById('btn-update-reload');
    const $btnUpdateDismiss = document.getElementById('btn-update-dismiss');

    let currentAppVersion = null;
    let latestNotifiedVersion = null;
    let dismissedVersion = null;
    let newWorkerWaiting = null;

    function showUpdateNotification(newVersion) {
      if (!newVersion) return;
      const formattedVer = newVersion.startsWith('v') ? newVersion : `v${newVersion}`;

      const isVersionBump = latestNotifiedVersion && latestNotifiedVersion !== formattedVer;
      latestNotifiedVersion = formattedVer;

      if ($updateNewVersion) {
        $updateNewVersion.textContent = formattedVer;
      }
      if ($updateBanner) {
        $updateBanner.style.display = 'flex';
        if (isVersionBump) {
          $updateBanner.classList.remove('banner-highlight');
          void $updateBanner.offsetWidth; // trigger reflow
          $updateBanner.classList.add('banner-highlight');
        }
      }

      if (isVersionBump) {
        toast('info', `Newer version available (${formattedVer})! Click Refresh to update.`);
      } else {
        toast('info', `New update available (${formattedVer})! Click Refresh to update.`);
      }

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then(reg => {
          reg?.update().catch(() => {});
        }).catch(() => {});
      }
    }

    function checkForUpdates() {
      fetch(`/api/version?_t=${Date.now()}`, { cache: 'no-store' })
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then(data => {
          const remoteVersion = (data && data.version) ? String(data.version).trim() : null;
          if (!remoteVersion) return;
          const formattedRemote = remoteVersion.startsWith('v') ? remoteVersion : `v${remoteVersion}`;

          if (!currentAppVersion) {
            currentAppVersion = formattedRemote;
            return;
          }

          if (formattedRemote !== currentAppVersion) {
            const isNewerNotice = !latestNotifiedVersion || formattedRemote !== latestNotifiedVersion;
            const isNewerThanDismissed = !dismissedVersion || formattedRemote !== dismissedVersion;

            if (isNewerNotice) {
              dismissedVersion = null; // New version supercedes previous dismiss
              showUpdateNotification(formattedRemote);
            } else if (isNewerThanDismissed && $updateBanner && $updateBanner.style.display === 'none') {
              showUpdateNotification(formattedRemote);
            } else if ($updateNewVersion && $updateNewVersion.textContent !== formattedRemote) {
              $updateNewVersion.textContent = formattedRemote;
            }
          } else {
            if ($updateBanner && $updateBanner.style.display !== 'none') {
              $updateBanner.style.display = 'none';
            }
            dismissedVersion = null;
          }
        })
        .catch(err => {
          console.debug('[Update Check] Silent failure:', err);
        });
    }

    if ($btnUpdateReload) {
      $btnUpdateReload.addEventListener('click', async () => {
        $btnUpdateReload.textContent = 'Updating…';
        $btnUpdateReload.disabled = true;

        const targetVer = $updateNewVersion ? $updateNewVersion.textContent.trim() : (latestNotifiedVersion || '');
        try {
          sessionStorage.setItem('melodyxx_just_updated', targetVer || 'true');
        } catch (_) {}

        if (newWorkerWaiting) {
          try {
            newWorkerWaiting.postMessage({ action: 'skipWaiting' });
          } catch (_) {}
        }

        // Clean out client-side cache storages before reload
        if ('caches' in window) {
          try {
            const keys = await caches.keys();
            await Promise.all(keys.map(k => caches.delete(k)));
          } catch (_) {}
        }

        setTimeout(() => {
          window.location.reload(true);
        }, 200);
      });
    }

    if ($btnUpdateDismiss) {
      $btnUpdateDismiss.addEventListener('click', () => {
        if ($updateBanner) {
          $updateBanner.style.display = 'none';
        }
        dismissedVersion = latestNotifiedVersion;
      });
    }

    // ── PWA / Service Worker Registration ─────────────────────
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/static/sw.js')
          .then((reg) => {
            console.log('[SW] Registered, scope:', reg.scope);

            // Check if there is already a waiting worker
            if (reg.waiting) {
              newWorkerWaiting = reg.waiting;
              checkForUpdates();
            }

            reg.addEventListener('updatefound', () => {
              const installingWorker = reg.installing;
              if (!installingWorker) return;
              installingWorker.addEventListener('statechange', () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  newWorkerWaiting = installingWorker;
                  checkForUpdates();
                }
              });
            });
          })
          .catch((err) => console.warn('[SW] Registration failed:', err));
      });
    }

    // Periodic check every 30s & on tab refocus
    setInterval(checkForUpdates, 30 * 1000);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        checkForUpdates();
      }
    });
    window.addEventListener('focus', checkForUpdates);

    // ── Focus search on load ──────────────────────────────────
    window.addEventListener('load', () => {
      $input.focus();
      // Request notification permission after a short delay
      setTimeout(requestNotificationPermission, 3000);
    });

    // ── Post-Update Success Feedback ──────────────────────────
    let hasCheckedPostUpdate = false;

    function checkPostUpdateFeedback(currentVer) {
      if (hasCheckedPostUpdate) return;
      hasCheckedPostUpdate = true;

      let justUpdated = null;
      try {
        justUpdated = sessionStorage.getItem('melodyxx_just_updated');
        if (justUpdated) {
          sessionStorage.removeItem('melodyxx_just_updated');
        }
      } catch (_) {}

      let lastSeenVer = null;
      try {
        lastSeenVer = localStorage.getItem('melodyxx_last_seen_ver');
        if (currentVer) {
          localStorage.setItem('melodyxx_last_seen_ver', currentVer);
        }
      } catch (_) {}

      // Show update celebration toast if explicitly reloaded from update banner OR version incremented
      if (justUpdated || (lastSeenVer && currentVer && lastSeenVer !== currentVer)) {
        setTimeout(() => {
          const displayVer = currentVer || (justUpdated && justUpdated !== 'true' ? justUpdated : '');
          const verLabel = displayVer ? ` to <strong>${esc(displayVer)}</strong>` : '';
          toast('success', `Update successful${verLabel}! Melodyxx is running the latest version.`, 5000);

          const $versionBadge = document.getElementById('version-badge');
          if ($versionBadge) {
            $versionBadge.classList.add('badge-highlight-pulse');
            setTimeout(() => $versionBadge.classList.remove('badge-highlight-pulse'), 6000);
          }
        }, 600);
      }

      // Check if reconnected after container restart / offline
      try {
        if (sessionStorage.getItem('melodyxx_just_reconnected') === 'true') {
          sessionStorage.removeItem('melodyxx_just_reconnected');
          const $reconnectBanner = document.getElementById('reconnect-banner');
          if ($reconnectBanner) {
            $reconnectBanner.style.display = 'flex';
            setTimeout(() => {
              $reconnectBanner.style.animation = 'slideDownUpdate 0.3s cubic-bezier(0.16, 1, 0.3, 1) reverse forwards';
              setTimeout(() => {
                $reconnectBanner.style.display = 'none';
                $reconnectBanner.style.animation = '';
              }, 300);
            }, 3500);
          } else {
            toast('success', `Connected! You're back online.`, 3500);
          }
        }
      } catch (_) {}
    }

    // ── Release Log & What's New Drawer ────────────────────────
    let cachedChangelog = null;
    let isReleaseLogClosing = false;
    let isChangelogRendered = false;
    let selectedReleaseType = 'all';
    let releaseSearchQuery = '';

    function checkReleaseLogBadge(latestVersion) {
      if (!$releaseLogBadge) return;
      try {
        const lastSeen = localStorage.getItem('melodyxx_last_seen_release');
        if (latestVersion && lastSeen !== latestVersion) {
          $releaseLogBadge.style.display = 'block';
        } else {
          $releaseLogBadge.style.display = 'none';
        }
      } catch (_) {}
    }

    function openReleaseLog() {
      if (!$releaseLogModal) return;
      $releaseLogModal.classList.remove('closing');
      $releaseLogModal.style.display = 'flex';
      document.body.style.overflow = 'hidden';

      if ($releaseLogBadge) {
        $releaseLogBadge.style.display = 'none';
      }

      const activeVer = currentAppVersion || 'v1.11.2';
      try {
        localStorage.setItem('melodyxx_last_seen_release', activeVer);
      } catch (_) {}

      if (!isChangelogRendered) {
        if (cachedChangelog) {
          setupReleaseVersionSelect(cachedChangelog);
          renderFilteredChangelog();
        } else {
          fetchChangelog();
        }
      }
    }

    function closeReleaseLog() {
      if (!$releaseLogModal || isReleaseLogClosing || $releaseLogModal.style.display === 'none') return;
      isReleaseLogClosing = true;
      $releaseLogModal.classList.add('closing');
      setTimeout(() => {
        $releaseLogModal.style.display = 'none';
        $releaseLogModal.classList.remove('closing');
        document.body.style.overflow = '';
        isReleaseLogClosing = false;
      }, 120);
    }

    async function fetchChangelog() {
      if (!$releaseModalBody) return;
      try {
        const res = await fetch(`/api/changelog?_t=${Date.now()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        cachedChangelog = data;
        setupReleaseVersionSelect(data);
        renderFilteredChangelog();
      } catch (err) {
        try {
          const fallbackRes = await fetch(`/static/changelog.json?_t=${Date.now()}`);
          const fallbackData = await fallbackRes.json();
          cachedChangelog = fallbackData;
          setupReleaseVersionSelect(fallbackData);
          renderFilteredChangelog();
        } catch (fbErr) {
          if (!isChangelogRendered) {
            $releaseModalBody.innerHTML = `
              <div class="release-loading-state">
                <span>Failed to load release history. Please try again.</span>
              </div>
            `;
          }
        }
      }
    }

    function setupReleaseVersionSelect(items) {
      if (!$releaseVersionSelect || !Array.isArray(items)) return;
      // Group versions: All releases + distinct Minor groups + Individual versions
      const options = ['<option value="all">All Releases (' + items.length + ')</option>'];

      // Distinct minor branches e.g. "v1.11.x Series", "v1.10.x Series", etc.
      const groups = {};
      items.forEach(item => {
        const m = (item.version || '').match(/^(v?\d+\.\d+)/);
        const groupKey = m ? m[1] : 'other';
        if (!groups[groupKey]) groups[groupKey] = [];
        groups[groupKey].push(item);
      });

      options.push('<optgroup label="Version Series">');
      Object.keys(groups).forEach(key => {
        const count = groups[key].length;
        const formattedKey = key.startsWith('v') ? key : `v${key}`;
        options.push(`<option value="group:${key}">${formattedKey}.x Series (${count})</option>`);
      });
      options.push('</optgroup>');

      options.push('<optgroup label="Specific Releases">');
      items.forEach(item => {
        options.push(`<option value="ver:${item.version}">${item.version} — ${esc(item.title.substring(0, 32))}${item.title.length > 32 ? '…' : ''}</option>`);
      });
      options.push('</optgroup>');

      $releaseVersionSelect.innerHTML = options.join('');
    }

    function renderFilteredChangelog() {
      if (!$releaseModalBody) return;
      if (!cachedChangelog || cachedChangelog.length === 0) {
        $releaseModalBody.innerHTML = `
          <div class="release-loading-state">
            <span>No release notes found.</span>
          </div>
        `;
        return;
      }

      const q = (releaseSearchQuery || '').trim().toLowerCase();
      const selectedVerVal = $releaseVersionSelect ? $releaseVersionSelect.value : 'all';

      function resolveReleaseType(item) {
        if (item.type) return item.type.toLowerCase();
        const t = (item.title || '').toLowerCase();
        if (t.startsWith('fix') || t.includes('bug') || t.includes('prevent') || t.includes('truncation')) {
          return 'fix';
        }
        if (t.startsWith('improve') || t.startsWith('clean') || t.startsWith('style') || t.startsWith('subtle') || t.startsWith('refine') || t.includes('redesign') || t.includes('overhaul') || t.includes('optimization') || t.includes('layout')) {
          return 'improvement';
        }
        return 'feature';
      }

      const filtered = cachedChangelog.filter(item => {
        const itemType = resolveReleaseType(item);

        // Filter by Type
        if (selectedReleaseType !== 'all') {
          if (itemType !== selectedReleaseType) return false;
        }

        // Filter by Version dropdown
        if (selectedVerVal && selectedVerVal !== 'all') {
          if (selectedVerVal.startsWith('group:')) {
            const prefix = selectedVerVal.replace('group:', '');
            if (!item.version.startsWith(prefix) && !item.version.startsWith('v' + prefix)) {
              return false;
            }
          } else if (selectedVerVal.startsWith('ver:')) {
            const exactVer = selectedVerVal.replace('ver:', '');
            if (item.version !== exactVer) {
              return false;
            }
          }
        }

        // Filter by Search Query
        if (q) {
          const matchVer = (item.version || '').toLowerCase().includes(q);
          const matchTitle = (item.title || '').toLowerCase().includes(q);
          const matchType = itemType.includes(q);
          const matchHighlights = (item.highlights || []).some(h => (h || '').toLowerCase().includes(q));
          if (!matchVer && !matchTitle && !matchType && !matchHighlights) {
            return false;
          }
        }

        return true;
      });

      if ($releaseFooterCount) {
        const total = cachedChangelog.length;
        if (filtered.length === total) {
          $releaseFooterCount.textContent = `${total} Releases • SemVer 2.0.0`;
        } else {
          $releaseFooterCount.textContent = `Showing ${filtered.length} of ${total} Releases`;
        }
      }

      if (filtered.length === 0) {
        $releaseModalBody.innerHTML = `
          <div class="release-empty-search">
            <svg class="release-empty-icon" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
            <div class="release-empty-text">No release notes matching your criteria</div>
            <div class="release-empty-hint">Try adjusting your search terms or clearing the version/type filter.</div>
          </div>
        `;
        isChangelogRendered = true;
        return;
      }

      $releaseModalBody.innerHTML = filtered.map((item, idx) => {
        const isLatest = idx === 0 && selectedReleaseType === 'all' && (!selectedVerVal || selectedVerVal === 'all') && !q;
        const type = resolveReleaseType(item);
        const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
        const highlightsHtml = (item.highlights || []).map(hl => `
          <li class="release-highlight-item">
            <span class="release-highlight-bullet" aria-hidden="true"></span>
            <span>${esc(hl)}</span>
          </li>
        `).join('');

        return `
          <article class="release-entry ${isLatest ? 'latest' : ''}" id="release-${esc(item.version.replace(/\./g, '-'))}">
            <div class="release-entry-header">
              <div class="release-entry-left">
                <span class="release-version-tag">${esc(item.version)}</span>
                <span class="release-type-badge ${esc(type)}">${esc(typeLabel)}</span>
              </div>
              <div class="release-timestamp">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                <span>${esc(item.date)} • ${esc(item.time || '')}</span>
              </div>
            </div>
            <div class="release-entry-title">${esc(item.title)}</div>
            <ul class="release-highlights">
              ${highlightsHtml}
            </ul>
          </article>
        `;
      }).join('');

      isChangelogRendered = true;
    }

    // Release Search & Filter Event Listeners
    if ($releaseSearchInput) {
      $releaseSearchInput.addEventListener('input', (e) => {
        releaseSearchQuery = e.target.value;
        if ($releaseSearchClear) {
          $releaseSearchClear.style.display = releaseSearchQuery ? 'flex' : 'none';
        }
        renderFilteredChangelog();
      });
    }

    if ($releaseSearchClear) {
      $releaseSearchClear.addEventListener('click', () => {
        if ($releaseSearchInput) {
          $releaseSearchInput.value = '';
          $releaseSearchInput.focus();
        }
        releaseSearchQuery = '';
        $releaseSearchClear.style.display = 'none';
        renderFilteredChangelog();
      });
    }

    if ($releaseVersionSelect) {
      $releaseVersionSelect.addEventListener('change', () => {
        const val = $releaseVersionSelect.value;
        // If selecting a specific version, we can either filter or scroll to it
        if (val.startsWith('ver:')) {
          const exactVer = val.replace('ver:', '');
          const targetEl = document.getElementById(`release-${exactVer.replace(/\./g, '-')}`);
          if (targetEl && selectedReleaseType === 'all' && !releaseSearchQuery) {
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            targetEl.classList.remove('jump-highlight');
            void targetEl.offsetWidth; // trigger reflow
            targetEl.classList.add('jump-highlight');
            return;
          }
        }
        renderFilteredChangelog();
        if ($releaseModalBody) $releaseModalBody.scrollTop = 0;
      });
    }

    if ($releaseTypeChips) {
      $releaseTypeChips.addEventListener('click', (e) => {
        const btn = e.target.closest('.release-type-chip');
        if (!btn) return;
        $releaseTypeChips.querySelectorAll('.release-type-chip').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedReleaseType = btn.dataset.type || 'all';
        renderFilteredChangelog();
        if ($releaseModalBody) $releaseModalBody.scrollTop = 0;
      });
    }

    // Scroll to top button in Release Modal
    if ($releaseModalBody && $btnReleaseScrollTop) {
      $releaseModalBody.addEventListener('scroll', () => {
        if ($releaseModalBody.scrollTop > 240) {
          $btnReleaseScrollTop.style.display = 'inline-flex';
        } else {
          $btnReleaseScrollTop.style.display = 'none';
        }
      });

      $btnReleaseScrollTop.addEventListener('click', () => {
        $releaseModalBody.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    if ($btnReleaseLog) {
      $btnReleaseLog.addEventListener('click', openReleaseLog);
    }
    if ($btnReleaseClose) {
      $btnReleaseClose.addEventListener('click', closeReleaseLog);
    }
    if ($releaseLogModal) {
      $releaseLogModal.addEventListener('click', (e) => {
        if (e.target === $releaseLogModal) closeReleaseLog();
      });
    }
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && $releaseLogModal && $releaseLogModal.style.display === 'flex') {
        closeReleaseLog();
      }
    });

    // ── Bug Reporter & User Feedback ───────────────────────────
    let selectedReportFile = null;
    let selectedReportPreviewUrl = null;
    let isReportModalClosing = false;
    let isReportSubmitting = false;
    let reportCooldownTimer = null;

    function formatFileSize(bytes) {
      if (!bytes || bytes === 0) return '0 B';
      if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
      return `${Math.round(bytes / 1024)} KB`;
    }

    function formatCooldownTime(totalSeconds) {
      const m = Math.floor(totalSeconds / 60);
      const s = totalSeconds % 60;
      if (m > 0) {
        return `${m}m ${s}s`;
      }
      return `${s}s`;
    }

    function getReportRemainingCooldownSec() {
      const lastSent = parseInt(localStorage.getItem('melodyxx_last_report_ts') || '0', 10);
      const now = Date.now();
      const cooldownMs = 5 * 60 * 1000; // 5 minutes
      const remainingSec = Math.ceil((cooldownMs - (now - lastSent)) / 1000);
      return remainingSec > 0 ? remainingSec : 0;
    }

    function syncReportCooldownUI() {
      const remainingSec = getReportRemainingCooldownSec();
      const submitText = $btnReportSubmit ? $btnReportSubmit.querySelector('.submit-text') : null;

      if (remainingSec > 0) {
        const timeStr = formatCooldownTime(remainingSec);
        if (submitText && !isReportSubmitting) {
          submitText.textContent = `Wait ${timeStr}`;
        }
        if ($btnReportSubmit && !isReportSubmitting) {
          $btnReportSubmit.title = `Cooldown active. Please wait ${timeStr}.`;
        }
        if (!reportCooldownTimer) {
          reportCooldownTimer = setInterval(syncReportCooldownUI, 1000);
        }
      } else {
        if (reportCooldownTimer) {
          clearInterval(reportCooldownTimer);
          reportCooldownTimer = null;
        }
        if (submitText && !isReportSubmitting) {
          submitText.textContent = 'Send Report';
        }
        if ($btnReportSubmit && !isReportSubmitting) {
          $btnReportSubmit.title = 'Send bug report or feedback';
        }
      }
    }

    let cachedPlatformSummary = '';

    async function getDetailedPlatformInfo() {
      if (cachedPlatformSummary) return cachedPlatformSummary;
      const ua = navigator.userAgent || '';
      let os = 'Unknown OS';
      let browser = 'Unknown Browser';

      // 1. Detect OS
      const hasUaData = Boolean(navigator.userAgentData && navigator.userAgentData.platform);
      const platformHint = hasUaData ? navigator.userAgentData.platform : (navigator.platform || '');

      if (/Windows/i.test(platformHint) || /Windows/i.test(ua)) {
        os = 'Windows';
        if (navigator.userAgentData?.getHighEntropyValues) {
          try {
            const hints = await navigator.userAgentData.getHighEntropyValues(['platformVersion']);
            const major = parseInt((hints.platformVersion || '').split('.')[0], 10);
            if (major >= 13) {
              os = 'Windows 11';
            } else if (major >= 1) {
              os = 'Windows 10';
            }
          } catch (_) {}
        }
        if (os === 'Windows') {
          if (/Windows NT 10\.0/i.test(ua)) {
            os = 'Windows 10/11';
          } else if (/Windows NT 6\.3/i.test(ua)) {
            os = 'Windows 8.1';
          } else if (/Windows NT 6\.2/i.test(ua)) {
            os = 'Windows 8';
          } else if (/Windows NT 6\.1/i.test(ua)) {
            os = 'Windows 7';
          } else if (/Windows NT 6\.0/i.test(ua)) {
            os = 'Windows Vista';
          } else if (/Windows NT 5\.1/i.test(ua)) {
            os = 'Windows XP';
          }
        }
      } else if (/Mac|iPhone|iPad|iPod/i.test(platformHint) || /Macintosh|iPhone|iPad|iPod/i.test(ua)) {
        if (/iPhone|iPad|iPod/i.test(ua)) {
          const match = ua.match(/OS (\d+[_\.]\d+)/i);
          os = match ? `iOS ${match[1].replace(/_/g, '.')}` : 'iOS';
        } else {
          const match = ua.match(/Mac OS X (\d+[_\.]\d+)/i);
          os = match ? `macOS ${match[1].replace(/_/g, '.')}` : 'macOS';
        }
      } else if (/Android/i.test(platformHint) || /Android/i.test(ua)) {
        const match = ua.match(/Android (\d+(\.\d+)?)/i);
        os = match ? `Android ${match[1]}` : 'Android';
      } else if (/Linux/i.test(platformHint) || /Linux/i.test(ua)) {
        os = 'Linux';
      } else if (platformHint) {
        os = platformHint;
      }

      // 2. Detect Browser
      let isBrave = false;
      if (navigator.brave && typeof navigator.brave.isBrave === 'function') {
        try {
          isBrave = await navigator.brave.isBrave();
        } catch (_) {}
      }

      if (isBrave) {
        const match = ua.match(/Chrome\/(\d+)/i);
        browser = match ? `Brave ${match[1]}` : 'Brave';
      } else if (/Edg(?:e|A|iOS)?\/(\d+)/i.test(ua)) {
        const match = ua.match(/Edg(?:e|A|iOS)?\/(\d+)/i);
        browser = `Edge ${match[1]}`;
      } else if (/OPR\/(\d+)/i.test(ua)) {
        const match = ua.match(/OPR\/(\d+)/i);
        browser = `Opera ${match[1]}`;
      } else if (/Vivaldi\/(\d+)/i.test(ua)) {
        const match = ua.match(/Vivaldi\/(\d+)/i);
        browser = `Vivaldi ${match[1]}`;
      } else if (/SamsungBrowser\/(\d+)/i.test(ua)) {
        const match = ua.match(/SamsungBrowser\/(\d+)/i);
        browser = `Samsung Internet ${match[1]}`;
      } else if (/Firefox\/(\d+)/i.test(ua) || /FxiOS\/(\d+)/i.test(ua)) {
        const match = ua.match(/(?:Firefox|FxiOS)\/(\d+)/i);
        browser = `Firefox ${match[1]}`;
      } else if (/Chrome\/(\d+)/i.test(ua) || /CriOS\/(\d+)/i.test(ua)) {
        const match = ua.match(/(?:Chrome|CriOS)\/(\d+)/i);
        browser = `Chrome ${match[1]}`;
      } else if (/Version\/(\d+).*Safari/i.test(ua)) {
        const match = ua.match(/Version\/(\d+).*Safari/i);
        browser = `Safari ${match[1]}`;
      } else if (navigator.userAgentData?.brands?.length) {
        const validBrand = navigator.userAgentData.brands.find(b => !/Not[\s_]?A|Chromium/i.test(b.brand));
        if (validBrand) {
          browser = `${validBrand.brand} ${validBrand.version}`;
        }
      }

      cachedPlatformSummary = `${os} • ${browser}`;
      return cachedPlatformSummary;
    }

    // Eagerly resolve platform diagnostics in background
    try {
      getDetailedPlatformInfo();
    } catch (_) {}

    function openBugReportModal() {
      if (!$bugReportModal) return;
      $bugReportModal.classList.remove('closing');
      $bugReportModal.setAttribute('aria-hidden', 'false');
      $bugReportModal.style.display = 'flex';
      document.body.style.overflow = 'hidden';

      // Populate diagnostics
      const activeVer = currentAppVersion || document.getElementById('app-version-badge')?.textContent || 'v1.26.10';
      if ($diagAppVersion) $diagAppVersion.textContent = activeVer;
      if ($diagScreen) $diagScreen.textContent = `${window.screen.width} × ${window.screen.height}`;
      if ($diagPage) $diagPage.textContent = window.location.href;

      if ($diagPlatform) {
        if (cachedPlatformSummary) {
          $diagPlatform.textContent = cachedPlatformSummary;
        } else {
          $diagPlatform.textContent = 'Detecting…';
          getDetailedPlatformInfo().then(summary => {
            if ($diagPlatform) $diagPlatform.textContent = summary;
          }).catch(() => {
            if ($diagPlatform) $diagPlatform.textContent = `${navigator.platform || 'Unknown'} • Browser`;
          });
        }
      }

      syncReportCooldownUI();

      setTimeout(() => {
        if ($reportName && !$reportName.value) {
          $reportName.focus();
        } else if ($reportDescription) {
          $reportDescription.focus();
        }
      }, 100);
    }

    function closeBugReportModal() {
      if (!$bugReportModal || isReportModalClosing || $bugReportModal.style.display === 'none') return;
      isReportModalClosing = true;
      $bugReportModal.classList.add('closing');
      if (reportCooldownTimer) {
        clearInterval(reportCooldownTimer);
        reportCooldownTimer = null;
      }
      setTimeout(() => {
        $bugReportModal.style.display = 'none';
        $bugReportModal.setAttribute('aria-hidden', 'true');
        $bugReportModal.classList.remove('closing');
        document.body.style.overflow = '';
        isReportModalClosing = false;
      }, 120);
    }

    // Support Modal Handlers
    let isSupportModalClosing = false;
    function openSupportModal() {
      if (!$supportModal) return;
      $supportModal.classList.remove('closing');
      $supportModal.setAttribute('aria-hidden', 'false');
      $supportModal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }

    function closeSupportModal() {
      if (!$supportModal || isSupportModalClosing || $supportModal.style.display === 'none') return;
      isSupportModalClosing = true;
      $supportModal.classList.add('closing');
      setTimeout(() => {
        $supportModal.style.display = 'none';
        $supportModal.setAttribute('aria-hidden', 'true');
        $supportModal.classList.remove('closing');
        document.body.style.overflow = '';
        isSupportModalClosing = false;
      }, 120);
    }

    function clearReportFile() {
      selectedReportFile = null;
      if (selectedReportPreviewUrl) {
        URL.revokeObjectURL(selectedReportPreviewUrl);
        selectedReportPreviewUrl = null;
      }
      if ($reportFileInput) $reportFileInput.value = '';
      if ($previewMediaWrap) $previewMediaWrap.innerHTML = '';
      if ($previewFilename) $previewFilename.textContent = '';
      if ($previewFilesize) $previewFilesize.textContent = '';
      if ($dropzonePreview) $dropzonePreview.style.display = 'none';
      if ($dropzoneIdle) $dropzoneIdle.style.display = 'flex';
    }

    function handleReportFileSelect(file) {
      if (!file) return;
      const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(file.name);
      const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov)$/i.test(file.name);

      if (!isImage && !isVideo) {
        toast('error', 'Only images (PNG, JPG, WEBP) or videos (MP4, WEBM) are supported.');
        clearReportFile();
        return;
      }

      if (isImage && file.size > 10 * 1024 * 1024) {
        toast('error', 'Image size exceeds 10 MB limit.');
        clearReportFile();
        return;
      }

      if (isVideo && file.size > 30 * 1024 * 1024) {
        toast('error', 'Video size exceeds 30 MB limit.');
        clearReportFile();
        return;
      }

      if (selectedReportPreviewUrl) {
        URL.revokeObjectURL(selectedReportPreviewUrl);
      }

      selectedReportFile = file;
      selectedReportPreviewUrl = URL.createObjectURL(file);

      if ($dropzoneIdle) $dropzoneIdle.style.display = 'none';
      if ($dropzonePreview) $dropzonePreview.style.display = 'flex';
      if ($previewFilename) $previewFilename.textContent = file.name;
      if ($previewFilesize) $previewFilesize.textContent = formatFileSize(file.size);

      if ($previewMediaWrap) {
        if (isImage) {
          $previewMediaWrap.innerHTML = `<img src="${selectedReportPreviewUrl}" alt="Preview thumbnail" />`;
        } else {
          $previewMediaWrap.innerHTML = `<video src="${selectedReportPreviewUrl}" muted playsinline></video>`;
        }
      }
    }

    if ($reportFileInput) {
      $reportFileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          handleReportFileSelect(e.target.files[0]);
        }
      });
    }

    if ($reportDropzone) {
      ['dragenter', 'dragover'].forEach(evtName => {
        $reportDropzone.addEventListener(evtName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          $reportDropzone.classList.add('dragover');
        });
      });

      ['dragleave', 'drop'].forEach(evtName => {
        $reportDropzone.addEventListener(evtName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          $reportDropzone.classList.remove('dragover');
        });
      });

      $reportDropzone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        if (dt && dt.files && dt.files[0]) {
          handleReportFileSelect(dt.files[0]);
        }
      });
    }

    if ($btnPreviewRemove) {
      $btnPreviewRemove.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        clearReportFile();
      });
    }

    function isValidEmail(str) {
      const emailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
      return emailRegex.test(str.trim());
    }

    if ($reportEmail) {
      const validateEmailInput = () => {
        const val = $reportEmail.value.trim();
        if (val.length > 0 && !isValidEmail(val)) {
          $reportEmail.classList.add('is-invalid');
          if ($reportEmailError) $reportEmailError.style.display = 'block';
        } else {
          $reportEmail.classList.remove('is-invalid');
          if ($reportEmailError) $reportEmailError.style.display = 'none';
        }
      };
      $reportEmail.addEventListener('input', validateEmailInput);
      $reportEmail.addEventListener('blur', () => {
        const val = $reportEmail.value.trim();
        if (!val || !isValidEmail(val)) {
          $reportEmail.classList.add('is-invalid');
          if ($reportEmailError) $reportEmailError.style.display = 'block';
        } else {
          $reportEmail.classList.remove('is-invalid');
          if ($reportEmailError) $reportEmailError.style.display = 'none';
        }
      });
    }

    if ($reportName) {
      $reportName.addEventListener('input', () => {
        if ($reportName.value.trim()) {
          $reportName.classList.remove('is-invalid');
          if ($reportNameError) $reportNameError.style.display = 'none';
        }
      });
      $reportName.addEventListener('blur', () => {
        if (!$reportName.value.trim()) {
          $reportName.classList.add('is-invalid');
          if ($reportNameError) $reportNameError.style.display = 'block';
        }
      });
    }

    if ($reportDescription && $reportCharCount) {
      $reportDescription.addEventListener('input', () => {
        const len = $reportDescription.value.length;
        $reportCharCount.textContent = `${len} / 1000`;
        if (len >= 950) {
          $reportCharCount.style.color = '#f43f5e';
        } else {
          $reportCharCount.style.color = '#64748b';
        }
      });
    }

    if ($reportForm) {
      $reportForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (isReportSubmitting) return;

        // Check local cooldown
        const remainingSec = getReportRemainingCooldownSec();
        if (remainingSec > 0) {
          const timeStr = formatCooldownTime(remainingSec);
          toast('info', t('toast_report_wait', { time: timeStr }));
          syncReportCooldownUI();
          return;
        }

        const name = ($reportName?.value || '').trim();
        if (!name) {
          $reportName?.classList.add('is-invalid');
          if ($reportNameError) $reportNameError.style.display = 'block';
          toast('error', t('toast_report_enter_name'));
          if ($reportName) $reportName.focus();
          return;
        }

        const email = ($reportEmail?.value || '').trim();
        if (!email || !isValidEmail(email)) {
          $reportEmail?.classList.add('is-invalid');
          if ($reportEmailError) $reportEmailError.style.display = 'block';
          toast('error', t('toast_report_enter_email'));
          if ($reportEmail) $reportEmail.focus();
          return;
        }

        const desc = ($reportDescription?.value || '').trim();
        if (desc.length < 8) {
          toast('error', t('toast_report_enter_desc'));
          if ($reportDescription) $reportDescription.focus();
          return;
        }

        isReportSubmitting = true;
        const submitIcon = $btnReportSubmit ? $btnReportSubmit.querySelector('.submit-icon') : null;
        const submitSpinner = $btnReportSubmit ? $btnReportSubmit.querySelector('.submit-spinner') : null;
        const submitText = $btnReportSubmit ? $btnReportSubmit.querySelector('.submit-text') : null;

        if ($btnReportSubmit) $btnReportSubmit.disabled = true;
        if (submitSpinner) submitSpinner.style.display = 'inline-block';
        if (submitIcon) submitIcon.style.display = 'none';
        if (submitText) submitText.textContent = 'Sending…';

        try {
          const formData = new FormData();
          formData.append('name', ($reportName?.value || '').trim());
          formData.append('email', ($reportEmail?.value || '').trim());
          formData.append('category', $reportCategory?.value || 'Bug / Error');
          formData.append('description', desc);
          formData.append('company_website', document.getElementById('report-hp-field')?.value || '');
          const platformInfo = cachedPlatformSummary || await getDetailedPlatformInfo().catch(() => `${navigator.platform || 'Unknown'} • Browser`);
          formData.append('platform_info', platformInfo);
          formData.append('screen_res', `${window.screen.width}x${window.screen.height}`);
          formData.append('current_url', window.location.href);
          formData.append('app_version', currentAppVersion || document.getElementById('app-version-badge')?.textContent || 'v1.26.10');

          if (selectedReportFile) {
            formData.append('media', selectedReportFile, selectedReportFile.name);
          }

          const res = await fetch('/api/report', {
            method: 'POST',
            body: formData,
          });

          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            throw new Error(data.detail || `Server returned error (${res.status})`);
          }

          toast('success', t('toast_report_success'));
          localStorage.setItem('melodyxx_last_report_ts', String(Date.now()));
          syncReportCooldownUI();

          // Reset form
          $reportForm.reset();
          if ($reportName) $reportName.classList.remove('is-invalid');
          if ($reportEmail) $reportEmail.classList.remove('is-invalid');
          if ($reportNameError) $reportNameError.style.display = 'none';
          if ($reportEmailError) $reportEmailError.style.display = 'none';
          if ($reportCharCount) $reportCharCount.textContent = '0 / 1000';
          clearReportFile();
          closeBugReportModal();

        } catch (err) {
          toast('error', err.message || t('toast_report_failed'));
        } finally {
          isReportSubmitting = false;
          if ($btnReportSubmit) $btnReportSubmit.disabled = false;
          if (submitSpinner) submitSpinner.style.display = 'none';
          if (submitIcon) submitIcon.style.display = 'inline-block';
          if (submitText) submitText.textContent = 'Send Report';
        }
      });
    }

    if ($btnOpenBugReport) {
      $btnOpenBugReport.addEventListener('click', openBugReportModal);
    }
    if ($btnReportClose) {
      $btnReportClose.addEventListener('click', closeBugReportModal);
    }
    if ($btnReportCancel) {
      $btnReportCancel.addEventListener('click', closeBugReportModal);
    }
    if ($bugReportModal) {
      $bugReportModal.addEventListener('click', (e) => {
        if (e.target === $bugReportModal) closeBugReportModal();
      });
    }

    // Support Modal Listeners
    if ($btnFloatingSupport) {
      $btnFloatingSupport.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openSupportModal();
      });
    }
    if ($btnSupportClose) {
      $btnSupportClose.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeSupportModal();
      });
    }
    if ($supportModal) {
      $supportModal.addEventListener('click', (e) => {
        if (e.target === $supportModal) closeSupportModal();
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if ($bugReportModal && $bugReportModal.style.display === 'flex') {
          closeBugReportModal();
        }
        if ($supportModal && $supportModal.style.display === 'flex') {
          closeSupportModal();
        }
      }
    });

    // ── Visitor heartbeat for live analytics ───────────────────
    function pingAnalytics(action = 'Online') {
      try {
        fetch(`/api/ping?action=${encodeURIComponent(action)}`, { method: 'POST', keepalive: true }).catch(() => {});
      } catch (_) {}
    }
    pingAnalytics('Browsing App');
    setInterval(() => pingAnalytics('Active in App'), 120000);

    // ── PWA Native Installation Prompt ────────────────────────
    let deferredInstallPrompt = null;
    const $btnInstallPwa = document.getElementById('btn-install-pwa');
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

    if (!isStandalone && $btnInstallPwa) {
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredInstallPrompt = e;
        $btnInstallPwa.style.display = 'inline-flex';
      });

      $btnInstallPwa.addEventListener('click', async () => {
        if (deferredInstallPrompt) {
          deferredInstallPrompt.prompt();
          const { outcome } = await deferredInstallPrompt.userChoice;
          if (outcome === 'accepted') {
            $btnInstallPwa.style.display = 'none';
          }
          deferredInstallPrompt = null;
        } else {
          const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
          if (isIOS) {
            toast('info', t('toast_pwa_ios'));
          } else {
            toast('info', t('toast_pwa_menu'));
          }
        }
      });

      window.addEventListener('appinstalled', () => {
        $btnInstallPwa.style.display = 'none';
        deferredInstallPrompt = null;
        toast('success', t('toast_pwa_success'));
      });
    }

    // ── Load and display version badge ─────────────────────────
    function loadVersion() {
      const $versionLink = document.getElementById('version-link') || document.getElementById('commit-link');
      if (!$versionLink) return;

      fetch(`/api/version?_t=${Date.now()}`, { cache: 'no-store' })
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then(data => {
          const version = (data && data.version) ? String(data.version).trim() : 'v1.26.11';
          const formatted = version.startsWith('v') ? version : `v${version}`;
          $versionLink.textContent = formatted;
          $versionLink.removeAttribute('href');
          $versionLink.style.cursor = 'pointer';
          $versionLink.setAttribute('role', 'button');
          $versionLink.title = `Melodyxx ${formatted} • Open Release Log`;
          $versionLink.onclick = (e) => {
            e.preventDefault();
            if (typeof openReleaseLogModal === 'function') openReleaseLogModal();
          };

          checkPostUpdateFeedback(formatted);
          checkReleaseLogBadge(formatted);
          fetchChangelog();

          if (!currentAppVersion) {
            currentAppVersion = formatted;
          } else if (formatted !== currentAppVersion) {
            showUpdateNotification(formatted);
          }
        })
        .catch(err => {
          console.debug('[Version] Could not fetch live version:', err);
        });
    }

    // ── Reactive Language Change Listener (i18n) ──────────────────
    window.addEventListener('melodyxx:langchange', () => {
      // 0. Re-align search mode glider & quality glider with new translated tab widths smoothly
      requestAnimationFrame(() => {
        if (typeof updateSearchModeGlider === 'function') {
          updateSearchModeGlider(false);
        }
        if (typeof updateQualityGlider === 'function') {
          updateQualityGlider(false);
        }
      });

      // 1. Update search placeholder
      if ($input) {
        if (searchMode === 'songs') $input.placeholder = t('search_placeholder_songs');
        else if (searchMode === 'artists') $input.placeholder = t('search_placeholder_artists');
        else if (searchMode === 'favorites') $input.placeholder = t('search_placeholder_favorites');
      }

      // 2. Refresh search results count & cards/pagination
      if (allSearchResults && allSearchResults.length > 0) {
        if ($count) $count.textContent = t('results_count', { count: allSearchResults.length });
        renderPage();
      }

      // 3. Refresh artist results count & load more label
      if (lastArtistSearchResults && lastArtistSearchResults.length > 0) {
        const total = lastArtistSearchResults.length;
        if (total > displayedArtistCount) {
          if ($artistResultsCount) $artistResultsCount.textContent = t('artists_showing_count', { displayed: displayedArtistCount, total });
          if ($btnLoadMoreArtistsLabel) {
            const remaining = total - displayedArtistCount;
            $btnLoadMoreArtistsLabel.textContent = t('load_more_artists', { count: Math.min(20, remaining) });
          }
        } else {
          if ($artistResultsCount) $artistResultsCount.textContent = t('artists_found_count', { count: total });
        }
      }

      // 4. Refresh discography stats & top songs header
      if (currentDiscography) {
        if ($topSongsSubtitle) {
          const visibleSongs = getVisibleTopSongs();
          $topSongsSubtitle.textContent = t('showing_popular_tracks', { visible: visibleSongs.length, total: (currentDiscography.top_songs || []).length });
        }
        updateSelectAllTopButton();
        if ($albumsGrid) {
          $albumsGrid.querySelectorAll('.btn-select-album').forEach(btn => {
            const albumId = btn.dataset.albumId;
            const albumObj = currentDiscography.albums?.find(a => a.album_id === albumId);
            const tracks = albumObj?.tracks || [];
            if (tracks.length > 0 && tracks.every(t => selectedTracks.has(t.track_id))) {
              btn.textContent = t('deselect_all');
            } else {
              btn.textContent = t('select_album');
            }
          });
        }
      }

      // 5. Refresh favorites
      if (searchMode === 'favorites') {
        renderFavorites();
      } else {
        updateFavoritesBadge();
      }

      // 6. Refresh batch action bar
      updateBatchActionBar();
    });

    updateFavoritesBadge();

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        updateFavoritesBadge();
        loadVersion();
      });
    } else {
      updateFavoritesBadge();
      loadVersion();
    }
    window.addEventListener('load', () => {
      updateFavoritesBadge();
      loadVersion();
    });
