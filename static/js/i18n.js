/**
 * Melodyxx — Internationalization (i18n) Engine
 * Dual Language Support: English (EN) & Bahasa Indonesia (ID)
 */

(function () {
  'use strict';

  const TRANSLATIONS = {
    en: {
      // App & Header
      app_title: "Melodyxx",
      app_tagline: "Free YouTube to MP3 Downloader & Discography Browser with official Apple Music artwork.",
      install_app: "Install App",
      install_app_title: "Install Melodyxx App",

      // Updates & Connection
      update_available_title: "Update Available!",
      update_ready_desc: "Melodyxx {version} is ready. Refresh to update.",
      update_refresh: "Refresh",
      connected_toast: "Connected! You're back online.",

      // Search Tabs
      tab_songs: "Songs",
      tab_artists: "Artists",
      tab_favorites: "Favorites",

      // Search Bar
      search_placeholder_songs: "Search songs, artists, or paste a YouTube URL...",
      search_placeholder_artists: "Type artist or band name (e.g. Coldplay, Red Velvet, Alan Walker)…",
      search_placeholder_favorites: "Search within your favorite songs...",
      search_btn: "Search",
      search_clear_title: "Clear search input",
      search_aria_label: "Search keyword",

      // States
      searching_songs: "Searching for songs…",
      searching_artists: "Searching for artists…",
      loading_discography: "Loading discography & popular tracks…",
      start_searching_title: "Start searching",
      start_searching_desc: "Type a song title, artist name, or lyrics in the search box above.",
      search_failed_title: "Search failed",
      search_failed_desc: "An error occurred. Please try again.",
      no_results_title: "No results found",
      no_results_desc: "Try a different keyword.",

      // Results
      search_results_title: "Search Results",
      results_count: "{count} results",
      download_quality_label: "Download Quality:",
      show_per_page: "Show:",
      per_page_option: "{count} per page",

      // Cards
      play: "Play",
      pause: "Pause",
      resume: "Resume",
      buffering: "Buffering…",
      download_mp3: "MP3",
      play_preview_title: "Play preview",
      add_to_favorites: "Add to favorites",
      remove_from_favorites: "Remove from favorites",
      download_as_kbps: "Download as {quality}kbps MP3",
      views_million: "{count}M views",
      views_thousand: "{count}K views",
      views_count: "{count} views",
      duration_label: "Duration {duration}",

      // Pagination
      page_first: "« First",
      page_prev: "Previous",
      page_info: "Page {current} of {total}",
      page_next: "Next »",
      page_last: "Last »",

      // Artists Search & Discography
      artists_found_title: "Artists Found",
      artists_found_count: "{count} artists found",
      artists_showing_count: "Showing {displayed} of {total} artists found",
      did_you_mean: "Did you mean:",
      load_more_artists: "Load More Artists (+{count})",
      back_to_artists: "Back to Search Results",
      popular_tracks_tab: "Popular Songs",
      all_albums_tab: "All Albums & EPs",
      most_popular_subtitle: "Most popular songs",
      showing_popular_tracks: "Showing {visible} of {total} popular tracks",
      songs_option_count: "{count} songs",
      all_songs_option: "All songs",
      select_all_popular: "Select All Popular Songs",
      deselect_all: "Deselect All",
      select_album: "Select Album",
      career_span_label: "Career Span",
      latest_album_label: "Latest Album",
      total_music_label: "Total Music",
      est_size_label: "Est. Size",
      popular_tracks_and_albums: "{songs} Popular Tracks • {albums} Albums & EPs",
      tracks_count: "{count} Tracks",
      loading_tracklist: "Loading tracklist...",

      // Favorites
      favorites_title: "My Favorites",
      favorites_subtitle: "Stored locally in your browser. Autoplay sequentially or batch download all.",
      favorites_count: "{count} songs",
      fav_play_all: "Play All",
      fav_play_all_title: "Play all favorite songs in sequence",
      fav_shuffle: "Shuffle",
      fav_shuffle_title: "Shuffle play favorites",
      fav_download_all: "Download All",
      fav_download_all_title: "Download all favorite songs",
      fav_export: "Export",
      fav_export_title: "Export favorites backup as JSON file",
      fav_import: "Import",
      fav_import_title: "Import favorites from JSON file",
      fav_clear: "Clear",
      fav_clear_title: "Clear all favorites",
      fav_empty_title: "Your Favorites is Empty",
      fav_empty_desc: "Search for songs or browse artist discographies and click the star button on any track to add it to your collection, or import a saved playlist.",
      fav_discover_music: "Discover Music",
      fav_import_playlist: "Import Playlist",
      fav_no_matches: 'No favorites match "{query}"',

      // Mini Player
      player_prev_title: "Previous track",
      player_play_pause_title: "Play / Pause",
      player_next_title: "Next track",
      player_mute_title: "Mute / Unmute",
      player_close_title: "Close player",

      // Batch Bar & Drawer
      tracks_selected: "tracks selected",
      download_selected: "Download Selected ({count})",
      downloading_batch: "Downloading Batch...",
      downloading_progress: "Downloading ({current}/{total})",
      preparing_queue: "Preparing queue...",
      sequential_download: "Sequential download",
      batch_cancel_title: "Cancel Queue",
      batch_completed: "Completed!",
      batch_all_downloaded: "All {count} tracks downloaded successfully.",
      batch_support_server: "Support Server",
      batch_incomplete: "Batch Incomplete",
      batch_summary_failed: "{success} downloaded, {failed} failed.",
      batch_retry_btn: "Retry Failed Tracks ({count})",
      batch_dismiss: "Dismiss",
      batch_stream_dispatched: "Stream dispatched!",
      batch_rate_limit: "Rate limit hit, waiting 5s before retry…",
      batch_retrying: "Retrying…",
      batch_failed: "Failed",
      batch_pacing: "Pacing next download (3s)…",

      // Modals - Confirmation
      confirm_clear_fav_title: "Clear All Favorites?",
      confirm_clear_fav_subtitle: "Permanent action",
      confirm_clear_fav_message: "Are you sure you want to remove all <strong>{count}</strong> songs from your Favorites collection? This action cannot be undone.",
      confirm_btn_clear_all: "Clear All",
      confirm_btn_cancel: "Cancel",

      // Modals - Release Log
      release_log_title: "Release Log",
      release_whats_new: "What's New",
      release_subtitle: "Changelog and version history across Melodyxx releases.",
      release_search_placeholder: "Search changelog, features, fixes...",
      release_jump_to: "Jump to:",
      release_all_releases: "All Releases",
      release_filter_all: "All",
      release_filter_feature: "Features",
      release_filter_improvement: "Improvements",
      release_filter_fix: "Fixes",
      release_loading: "Loading release notes…",
      release_footer_count: "{count} Releases • SemVer 2.0.0",
      release_scroll_top: "Top",
      release_github: "GitHub Releases",

      // Modals - Support
      support_title: "Support Melodyxx",
      support_subtitle: "Keep Melodyxx 100% free, ad-free, and high-speed for everyone.",
      support_intro: "Melodyxx is an open-source project with zero ads and zero trackers. Every contribution helps cover ongoing server bandwidth, high-performance transcoding CPU, and domain maintenance!",
      support_saweria_action: "Support on Saweria",
      support_kofi_action: "Support on Ko-fi",
      support_kofi_desc: "Credit/Debit Card, PayPal, Apple Pay",
      support_thanks_strong: "Thank you for keeping Melodyxx alive!",
      support_thanks_span: "All funds are 100% reinvested into server bandwidth and open-source updates.",

      // Modals - Bug Report
      report_title: "Report an Issue or Feedback",
      report_subtitle: "Found a bug or have a suggestion? Let us know below.",
      report_name_label: "Your Name",
      report_email_label: "Your Email",
      report_category_label: "Category",
      report_category_bug: "Bug / Something isn't working",
      report_category_audio: "Audio Stream / Download Issue",
      report_category_metadata: "Metadata / Artwork Incorrect",
      report_category_ui: "UI / Design Glitch",
      report_category_feature: "Feature Request",
      report_category_other: "Other Feedback",
      report_desc_label: "Description",
      report_desc_placeholder: "Describe what happened, steps to reproduce, or what you expected to see...",
      report_dropzone_label: "Screenshot / Screen Recording",
      report_dropzone_optional: "(Optional, max 10MB image / 30MB video)",
      report_dropzone_prompt: "Drag & drop an image or video, or",
      report_dropzone_browse: "browse",
      report_dropzone_hint: "Supports PNG, JPG, WEBP, MP4, WEBM",
      report_diagnostics_summary: "Included Diagnostics (Auto-collected)",
      report_diag_app_ver: "App Version:",
      report_diag_browser_os: "Browser & OS:",
      report_diag_screen: "Screen:",
      report_diag_page: "Current Page:",
      report_btn_cancel: "Cancel",
      report_btn_submit: "Send Report",

      // SEO & Feature Highlights
      seo_zero_disk_title: "Zero-Disk Fast Streaming",
      seo_zero_disk_desc: "Direct in-memory transcode piping. Audio streams straight to your device with 0 MB server disk storage and zero pre-download waiting time.",
      seo_art_title: "Official Apple Music Art",
      seo_art_desc: "Say goodbye to blurry YouTube thumbnails. Every track is embedded with official 800x800 HD square album art and clean ID3v2 metadata.",
      seo_disco_title: "Full Artist Discographies",
      seo_disco_desc: "Search any singer or band to explore their complete catalog of popular songs, albums, and EPs with one-click sequential batch downloading.",
      seo_free_title: "100% Free & Ad-Free",
      seo_free_desc: "No deceptive popup ads, no redirect loops, and no account registration. Fast, secure, and clean audio conversions for desktop and mobile.",
      seo_batch_title: "Sequential Batch Queue",
      seo_batch_desc: "Effortlessly select multiple songs or entire albums to download in order with real-time progress indicators and automatic retry resilience.",
      seo_bitrate_title: "HD Bitrate Selection",
      seo_bitrate_desc: "Choose between 320kbps studio-grade fidelity, 192kbps balanced clarity, or 128kbps compact data saving tailored to your listening needs.",

      // FAQ
      faq_badge: "FAQ",
      faq_title: "Frequently Asked Questions",
      faq_subtitle: "Everything you need to know about downloading music with Melodyxx.",
      faq_q1: "How do I convert and download YouTube to MP3?",
      faq_a1: "Type a song title or artist into the search box above, or paste any YouTube video link. Pick your desired audio quality (128k, 192k, or 320k), then click Download. Melodyxx instantly pipes the converted MP3 file directly to your browser.",
      faq_q2: "Are album covers and ID3 tags embedded in the audio?",
      faq_a2: "Yes. Melodyxx automatically queries Apple Music to match track titles and embed official 800x800 square cover artwork, song title, artist, album name, and release year directly into the ID3v2 metadata frames.",
      faq_q3: "Can I download multiple songs or entire albums at once?",
      faq_a3: 'Yes. Click the "Artists" search tab to explore discographies. Check the boxes next to the songs you want—or click "Select All"—then hit "Download Selected" to sequentially download the entire batch.',
      faq_q4: "What is the highest audio quality bitrate available?",
      faq_a4: "Melodyxx offers 320kbps (best high-definition fidelity), 192kbps (optimal balance of size and quality), and 128kbps (lightweight data saving). You can easily switch quality using the global toggle at the top of the search results.",

      // Footer
      footer_built_by: "Built by",
      footer_release_log: "Release Log",
      footer_report_bug: "Report Bug",
      footer_github: "GitHub",
      floating_support_text: "Support Me !",

      // Toasts
      toast_storage_full: "Storage full or inaccessible.",
      toast_removed_fav: 'Removed "{title}" from Favorites.',
      toast_saved_fav: 'Saved "{title}" to Favorites.',
      toast_preview_unavailable: "Preview unavailable for this video.",
      toast_no_more_results: "No more search results available.",
      toast_loaded_more_songs: "Loaded {count} more songs.",
      toast_no_more_new_results: "No more new search results found.",
      toast_fetching_more: "Fetching additional songs…",
      toast_failed_load_more: "Failed to load more results.",
      toast_audio_preview_failed: "Audio preview could not be loaded.",
      toast_downloading_track: "Downloading <strong>{artist} - {title}</strong>",
      toast_download_failed: "Download failed: {error}",
      toast_full_stream_unavailable: "Full track streaming unavailable; playing preview snippet.",
      toast_could_not_play: 'Could not play "{title}". Auto-skipping to next...',
      toast_fav_empty: "Your Favorites list is empty.",
      toast_playing_all_fav: "Playing all {count} favorite songs.",
      toast_shuffled_fav: "Shuffled and playing {count} favorite songs.",
      toast_no_fav_export: "No favorite songs to export.",
      toast_exported_fav: "Exported {count} favorites to JSON.",
      toast_imported_fav: "Imported {count} song{plural} into Favorites.",
      toast_import_invalid: "Failed to import JSON: invalid playlist format.",
      toast_all_fav_cleared: "All favorites cleared.",
      toast_batch_in_progress: "Batch download is already in progress!",
      toast_batch_cancelled: "Batch download cancelled.",
      toast_finished_download_all: "Finished downloading all {count} tracks!",
      toast_batch_some_failed: "{count} track{plural} failed. Click Retry to re-download.",
      toast_fav_playback_completed: "Favorites playlist playback completed.",
      toast_downloading_direct: "Downloading <strong>{title}</strong> directly to your device!",
      toast_report_wait: "Please wait <strong>{time}</strong> before submitting another report.",
      toast_report_enter_name: "Please enter your name.",
      toast_report_enter_email: "Please enter a valid email address (e.g. name@example.com).",
      toast_report_enter_desc: "Please provide a description of at least 8 characters.",
      toast_report_success: "Thank you! Your report has been submitted.",
      toast_report_failed: "Failed to submit report. Please try again.",
      toast_pwa_ios: 'To install Melodyxx on iOS: Tap Share and select "Add to Home Screen".',
      toast_pwa_menu: 'Open your browser menu (⋮) and select "Install app" or "Add to Home screen".',
      toast_pwa_success: "Melodyxx installed successfully! You can launch it anytime from your home screen."
    },

    id: {
      // App & Header
      app_title: "Melodyxx",
      app_tagline: "Pengunduh YouTube ke MP3 Cepat & Penjelajah Diskografi Musik dengan Artwork Resmi Apple Music.",
      install_app: "Pasang Aplikasi",
      install_app_title: "Pasang Aplikasi Melodyxx",

      // Updates & Connection
      update_available_title: "Pembaruan Tersedia!",
      update_ready_desc: "Melodyxx {version} telah siap. Muat ulang untuk memperbarui.",
      update_refresh: "Perbarui",
      connected_toast: "Terhubung! Anda kembali online.",

      // Search Tabs
      tab_songs: "Lagu",
      tab_artists: "Artis",
      tab_favorites: "Favorit",

      // Search Bar
      search_placeholder_songs: "Cari lagu, nama artis, atau tempel URL YouTube...",
      search_placeholder_artists: "Ketik nama artis atau band (contoh: Coldplay, Sheila On 7, Alan Walker)…",
      search_placeholder_favorites: "Cari di dalam daftar lagu favorit Anda...",
      search_btn: "Cari",
      search_clear_title: "Bersihkan input pencarian",
      search_aria_label: "Kata kunci pencarian",

      // States
      searching_songs: "Mencari lagu…",
      searching_artists: "Mencari artis…",
      loading_discography: "Memuat diskografi & lagu populer…",
      start_searching_title: "Mulai Pencarian",
      start_searching_desc: "Ketik judul lagu, nama artis, atau lirik pada kotak pencarian di atas.",
      search_failed_title: "Pencarian Gagal",
      search_failed_desc: "Terjadi kesalahan. Silakan coba beberapa saat lagi.",
      no_results_title: "Tidak Ada Hasil Ditemukan",
      no_results_desc: "Coba gunakan kata kunci pencarian yang lain.",

      // Results
      search_results_title: "Hasil Pencarian",
      results_count: "{count} hasil",
      download_quality_label: "Kualitas Unduhan:",
      show_per_page: "Tampilkan:",
      per_page_option: "{count} per halaman",

      // Cards
      play: "Putar",
      pause: "Jeda",
      resume: "Lanjutkan",
      buffering: "Memuat…",
      download_mp3: "MP3",
      play_preview_title: "Putar cuplikan lagu",
      add_to_favorites: "Tambah ke favorit",
      remove_from_favorites: "Hapus dari favorit",
      download_as_kbps: "Unduh sebagai MP3 {quality}kbps",
      views_million: "{count} jt tayangan",
      views_thousand: "{count} rb tayangan",
      views_count: "{count} tayangan",
      duration_label: "Durasi {duration}",

      // Pagination
      page_first: "« Awal",
      page_prev: "Sebelumnya",
      page_info: "Halaman {current} dari {total}",
      page_next: "Berikutnya »",
      page_last: "Akhir »",

      // Artists Search & Discography
      artists_found_title: "Artis Ditemukan",
      artists_found_count: "{count} artis ditemukan",
      artists_showing_count: "Menampilkan {displayed} dari {total} artis ditemukan",
      did_you_mean: "Mungkin maksud Anda:",
      load_more_artists: "Muat Lebih Banyak Artis (+{count})",
      back_to_artists: "Kembali ke Hasil Pencarian",
      popular_tracks_tab: "Lagu Populer",
      all_albums_tab: "Semua Album & EP",
      most_popular_subtitle: "Lagu-lagu paling populer",
      showing_popular_tracks: "Menampilkan {visible} dari {total} lagu populer",
      songs_option_count: "{count} lagu",
      all_songs_option: "Semua lagu",
      select_all_popular: "Pilih Semua Lagu Populer",
      deselect_all: "Batalkan Pilihan",
      select_album: "Pilih Album",
      career_span_label: "Rentang Karir",
      latest_album_label: "Album Terbaru",
      total_music_label: "Total Durasi",
      est_size_label: "Est. Ukuran",
      popular_tracks_and_albums: "{songs} Lagu Populer • {albums} Album & EP",
      tracks_count: "{count} Lagu",
      loading_tracklist: "Memuat daftar lagu...",

      // Favorites
      favorites_title: "Favorit Saya",
      favorites_subtitle: "Tersimpan aman di browser Anda. Putar berurutan atau unduh massal semua lagu.",
      favorites_count: "{count} lagu",
      fav_play_all: "Putar Semua",
      fav_play_all_title: "Putar semua lagu favorit secara berurutan",
      fav_shuffle: "Acak",
      fav_shuffle_title: "Putar acak lagu favorit",
      fav_download_all: "Unduh Semua",
      fav_download_all_title: "Unduh semua lagu favorit",
      fav_export: "Ekspor",
      fav_export_title: "Ekspor cadangan lagu favorit ke file JSON",
      fav_import: "Impor",
      fav_import_title: "Impor lagu favorit dari file JSON",
      fav_clear: "Hapus Semua",
      fav_clear_title: "Hapus semua daftar lagu favorit",
      fav_empty_title: "Daftar Favorit Anda Kosong",
      fav_empty_desc: "Cari lagu atau jelajahi diskografi artis lalu klik ikon bintang pada lagu untuk menyimpannya, atau impor playlist yang sudah ada.",
      fav_discover_music: "Jelajahi Musik",
      fav_import_playlist: "Impor Playlist",
      fav_no_matches: 'Tidak ada favorit yang cocok dengan "{query}"',

      // Mini Player
      player_prev_title: "Lagu sebelumnya",
      player_play_pause_title: "Putar / Jeda",
      player_next_title: "Lagu berikutnya",
      player_mute_title: "Bisukan / Bunyikan suara",
      player_close_title: "Tutup pemutar",

      // Batch Bar & Drawer
      tracks_selected: "lagu terpilih",
      download_selected: "Unduh Terpilih ({count})",
      downloading_batch: "Mengunduh Massal...",
      downloading_progress: "Mengunduh ({current}/{total})",
      preparing_queue: "Menyiapkan antrean...",
      sequential_download: "Unduhan berurutan",
      batch_cancel_title: "Batalkan Antrean",
      batch_completed: "Selesai!",
      batch_all_downloaded: "Semua {count} lagu berhasil diunduh.",
      batch_support_server: "Donasi Server",
      batch_incomplete: "Unduhan Belum Lengkap",
      batch_summary_failed: "{success} terunduh, {failed} gagal.",
      batch_retry_btn: "Coba Ulang Lagu Gagal ({count})",
      batch_dismiss: "Tutup",
      batch_stream_dispatched: "Aliran unduhan dikirim!",
      batch_rate_limit: "Batas frekuensi tercapai, menunggu 5 dtk sebelum mencoba lagi…",
      batch_retrying: "Mencoba ulang…",
      batch_failed: "Gagal",
      batch_pacing: "Memberi jeda unduhan berikutnya (3 dtk)…",

      // Modals - Confirmation
      confirm_clear_fav_title: "Hapus Semua Favorit?",
      confirm_clear_fav_subtitle: "Tindakan permanen",
      confirm_clear_fav_message: "Apakah Anda yakin ingin menghapus semua <strong>{count}</strong> lagu dari koleksi Favorit Anda? Tindakan ini tidak dapat dibatalkan.",
      confirm_btn_clear_all: "Ya, Hapus Semua",
      confirm_btn_cancel: "Batal",

      // Modals - Release Log
      release_log_title: "Catatan Rilis",
      release_whats_new: "Fitur Terbaru",
      release_subtitle: "Riwayat perubahan dan pembaruan versi di Melodyxx.",
      release_search_placeholder: "Cari riwayat pembaruan, fitur, perbaikan bug...",
      release_jump_to: "Lompat ke:",
      release_all_releases: "Semua Rilis",
      release_filter_all: "Semua",
      release_filter_feature: "Fitur Baru",
      release_filter_improvement: "Peningkatan",
      release_filter_fix: "Perbaikan Bug",
      release_loading: "Memuat catatan rilis…",
      release_footer_count: "{count} Rilis • SemVer 2.0.0",
      release_scroll_top: "Ke Atas",
      release_github: "Rilis GitHub",

      // Modals - Support
      support_title: "Dukung Melodyxx",
      support_subtitle: "Bantu agar Melodyxx tetap 100% gratis, tanpa iklan, dan berkecepatan tinggi.",
      support_intro: "Melodyxx adalah proyek sumber terbuka (open-source) tanpa iklan dan tanpa pelacak. Setiap donasi sangat membantu biaya sewa bandwidth server, CPU transcoding berkecepatan tinggi, dan pemeliharaan domain!",
      support_saweria_action: "Dukung via Saweria",
      support_kofi_action: "Dukung via Ko-fi",
      support_kofi_desc: "Kartu Kredit/Debit, PayPal, Apple Pay",
      support_thanks_strong: "Terima kasih telah menjaga Melodyxx tetap hidup!",
      support_thanks_span: "Semua dana 100% dialokasikan kembali untuk kapasitas server dan pembaruan aplikasi.",

      // Modals - Bug Report
      report_title: "Laporkan Masalah atau Saran",
      report_subtitle: "Menemukan bug atau memiliki ide perbaikan? Beritahu kami di bawah.",
      report_name_label: "Nama Anda",
      report_email_label: "Email Anda",
      report_category_label: "Kategori",
      report_category_bug: "Bug / Ada yang tidak berjalan",
      report_category_audio: "Masalah Audio Stream / Unduhan",
      report_category_metadata: "Metadata / Gambar Cover Tidak Tepat",
      report_category_ui: "Masalah Tampilan / Desain UI",
      report_category_feature: "Permintaan Fitur Baru",
      report_category_other: "Saran & Masukan Lainnya",
      report_desc_label: "Deskripsi",
      report_desc_placeholder: "Jelaskan apa yang terjadi, langkah untuk mereproduksi masalah, atau apa yang Anda harapkan...",
      report_dropzone_label: "Tangkapan Layar / Rekaman Video",
      report_dropzone_optional: "(Opsional, maks gambar 10MB / video 30MB)",
      report_dropzone_prompt: "Tarik & letakkan gambar atau video, atau",
      report_dropzone_browse: "pilih berkas",
      report_dropzone_hint: "Mendukung format PNG, JPG, WEBP, MP4, WEBM",
      report_diagnostics_summary: "Diagnostik Terlampir (Otomatis Dikumpulkan)",
      report_diag_app_ver: "Versi Aplikasi:",
      report_diag_browser_os: "Browser & Sistem Operasi:",
      report_diag_screen: "Resolusi Layar:",
      report_diag_page: "Halaman Saat Ini:",
      report_btn_cancel: "Batal",
      report_btn_submit: "Kirim Laporan",

      // SEO & Feature Highlights
      seo_zero_disk_title: "Streaming Cepat Tanpa Disk",
      seo_zero_disk_desc: "Piping konversi langsung di memori RAM. Audio dialirkan langsung ke perangkat Anda dengan penyimpanan disk server 0 MB tanpa waktu tunggu unduh awal.",
      seo_art_title: "Cover Resmi Apple Music",
      seo_art_desc: "Tidak ada lagi thumbnail YouTube buram. Setiap lagu disematkan cover resmi HD 800x800 pixel persegi dan metadata ID3v2 yang rapi.",
      seo_disco_title: "Diskografi Artis Lengkap",
      seo_disco_desc: "Cari musisi atau band manapun untuk menjelajahi katalog lengkap lagu populer, album, dan EP dengan pengunduhan massal sekali klik.",
      seo_free_title: "100% Gratis & Bebas Iklan",
      seo_free_desc: "Bebas dari iklan pop-up jebakan, tautan pengalihan, maupun pendaftaran akun. Konversi audio yang cepat, aman, dan bersih untuk desktop dan ponsel.",
      seo_batch_title: "Antrean Unduh Massal Berurutan",
      seo_batch_desc: "Pilih banyak lagu atau seluruh album dengan mudah untuk diunduh secara berurutan dengan indikator kemajuan real-time dan perlindungan coba ulang otomatis.",
      seo_bitrate_title: "Pilihan Bitrate Kualitas Tinggi",
      seo_bitrate_desc: "Pilih antara kualitas studio 320kbps, kejernihan seimbang 192kbps, atau hemat kuota 128kbps yang disesuaikan dengan kebutuhan Anda.",

      // FAQ
      faq_badge: "FAQ",
      faq_title: "Pertanyaan yang Sering Diajukan",
      faq_subtitle: "Semua hal yang perlu Anda ketahui tentang mengunduh musik di Melodyxx.",
      faq_q1: "Bagaimana cara mengubah dan mengunduh YouTube ke MP3?",
      faq_a1: "Ketik judul lagu atau nama artis pada kotak pencarian di atas, atau tempel tautan video YouTube apa pun. Pilih kualitas audio yang diinginkan (128k, 192k, atau 320k), lalu klik Unduh. Melodyxx langsung mengalirkan file MP3 hasil konversi ke peramban Anda.",
      faq_q2: "Apakah cover album dan tag ID3 disematkan ke dalam audio?",
      faq_a2: "Ya. Melodyxx secara otomatis mencocokkan judul lagu ke Apple Music untuk menyematkan cover album HD 800x800 resmi, judul lagu, artis, nama album, dan tahun rilis langsung ke dalam metadata ID3v2.",
      faq_q3: "Bisakah saya mengunduh banyak lagu atau seluruh album sekaligus?",
      faq_a3: 'Bisa. Klik tab pencarian "Artis" untuk membuka diskografi. Centang kotak lagu yang diinginkan—atau klik "Pilih Semua"—lalu klik "Unduh Terpilih" untuk mengunduh seluruh antrean secara berurutan.',
      faq_q4: "Berapa bitrate kualitas audio tertinggi yang tersedia?",
      faq_a4: "Melodyxx menyediakan opsi 320kbps (kualitas definisi tinggi terbaik), 192kbps (keseimbangan optimal ukuran & kualitas), dan 128kbps (hemat kuota data). Anda dapat memilih kualitas dengan mudah melalui tombol toggle di bagian atas hasil pencarian.",

      // Footer
      footer_built_by: "Dibuat oleh",
      footer_release_log: "Catatan Rilis",
      footer_report_bug: "Lapor Masalah",
      footer_github: "GitHub",
      floating_support_text: "Dukung Saya !",

      // Toasts
      toast_storage_full: "Memori penyimpanan penuh atau tidak dapat diakses.",
      toast_removed_fav: 'Menghapus "{title}" dari Favorit.',
      toast_saved_fav: 'Menyimpan "{title}" ke Favorit.',
      toast_preview_unavailable: "Cuplikan tidak tersedia untuk video ini.",
      toast_no_more_results: "Tidak ada hasil pencarian lagi yang tersedia.",
      toast_loaded_more_songs: "Memuat {count} lagu tambahan.",
      toast_no_more_new_results: "Tidak ada lagu baru lagi yang ditemukan.",
      toast_fetching_more: "Mengambil lagu tambahan…",
      toast_failed_load_more: "Gagal memuat hasil tambahan.",
      toast_audio_preview_failed: "Cuplikan audio tidak dapat diputar.",
      toast_downloading_track: "Mengunduh <strong>{artist} - {title}</strong>",
      toast_download_failed: "Unduhan gagal: {error}",
      toast_full_stream_unavailable: "Aliran lagu penuh tidak tersedia; memutar cuplikan pendek.",
      toast_could_not_play: 'Gagal memutar "{title}". Melewati ke lagu berikutnya...',
      toast_fav_empty: "Daftar Favorit Anda masih kosong.",
      toast_playing_all_fav: "Memutar semua {count} lagu favorit.",
      toast_shuffled_fav: "Memutar acak {count} lagu favorit.",
      toast_no_fav_export: "Tidak ada lagu favorit untuk diekspor.",
      toast_exported_fav: "Berhasil mengekspor {count} lagu favorit ke JSON.",
      toast_imported_fav: "Berhasil mengimpor {count} lagu ke Favorit.",
      toast_import_invalid: "Gagal mengimpor JSON: format playlist tidak valid.",
      toast_all_fav_cleared: "Semua lagu favorit telah dibersihkan.",
      toast_batch_in_progress: "Unduhan massal sedang berlangsung!",
      toast_batch_cancelled: "Unduhan massal dibatalkan.",
      toast_finished_download_all: "Selesai mengunduh seluruh {count} lagu!",
      toast_batch_some_failed: "{count} lagu gagal diunduh. Klik Coba Ulang untuk mengunduh kembali.",
      toast_fav_playback_completed: "Pemutaran seluruh lagu favorit selesai.",
      toast_downloading_direct: "Mengunduh <strong>{title}</strong> langsung ke perangkat Anda!",
      toast_report_wait: "Harap tunggu <strong>{time}</strong> sebelum mengirim laporan lain.",
      toast_report_enter_name: "Silakan masukkan nama Anda.",
      toast_report_enter_email: "Silakan masukkan alamat email yang valid (contoh: nama@domain.com).",
      toast_report_enter_desc: "Harap tuliskan deskripsi minimal 8 karakter.",
      toast_report_success: "Terima kasih! Laporan Anda telah berhasil terkirim.",
      toast_report_failed: "Gagal mengirim laporan. Silakan coba lagi.",
      toast_pwa_ios: 'Cara memasang di iOS: Ketuk tombol Bagikan lalu pilih "Tambah ke Layar Utama".',
      toast_pwa_menu: 'Buka menu browser (⋮) lalu pilih "Instal aplikasi" atau "Tambah ke Layar Utama".',
      toast_pwa_success: "Melodyxx berhasil dipasang! Anda dapat membukanya kapan saja dari layar utama."
    }
  };

  let currentLang = 'en';
  try {
    const saved = localStorage.getItem('melodyxx_lang');
    if (saved === 'id' || saved === 'en') {
      currentLang = saved;
    }
  } catch (_) {}

  /**
   * Translate a key with optional dynamic parameter replacements
   * e.g. t('results_count', { count: 12 }) -> "12 results"
   */
  function t(key, params = {}) {
    const langObj = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    let text = langObj[key];
    if (text === undefined) {
      text = TRANSLATIONS.en[key] !== undefined ? TRANSLATIONS.en[key] : key;
    }

    if (typeof text !== 'string') return text;

    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    }
    return text;
  }

  /**
   * Set and apply application display language
   */
  function setLanguage(lang) {
    currentLang = (lang === 'id') ? 'id' : 'en';
    try {
      localStorage.setItem('melodyxx_lang', currentLang);
    } catch (_) {}

    document.documentElement.lang = currentLang;

    // 1. Update Switcher Buttons
    const btnEn = document.getElementById('lang-btn-en');
    const btnId = document.getElementById('lang-btn-id');
    if (btnEn) {
      btnEn.classList.toggle('active', currentLang === 'en');
      btnEn.setAttribute('aria-pressed', currentLang === 'en' ? 'true' : 'false');
    }
    if (btnId) {
      btnId.classList.toggle('active', currentLang === 'id');
      btnId.setAttribute('aria-pressed', currentLang === 'id' ? 'true' : 'false');
    }

    updateLangGlider();

    // 2. Translate Text Elements ([data-i18n])
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const val = t(key);
      if (val && val !== key) {
        el.textContent = val;
      }
    });

    // 3. Translate HTML Elements ([data-i18n-html])
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.getAttribute('data-i18n-html');
      const val = t(key);
      if (val && val !== key) {
        el.innerHTML = val;
      }
    });

    // 4. Translate Placeholders ([data-i18n-placeholder])
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const val = t(key);
      if (val && val !== key) {
        el.setAttribute('placeholder', val);
      }
    });

    // 5. Translate Titles / Tooltips ([data-i18n-title])
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      const val = t(key);
      if (val && val !== key) {
        el.setAttribute('title', val);
      }
    });

    // 6. Translate Aria Labels ([data-i18n-aria])
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
      const key = el.getAttribute('data-i18n-aria');
      const val = t(key);
      if (val && val !== key) {
        el.setAttribute('aria-label', val);
      }
    });

    // 7. Dispatch Event for runtime reactive components in app.js
    window.dispatchEvent(new CustomEvent('melodyxx:langchange', {
      detail: { lang: currentLang, t }
    }));
  }

  function updateLangGlider(instant = false) {
    const glider = document.getElementById('lang-switch-glider');
    const wrap = document.getElementById('lang-switch-wrap');
    if (!glider || !wrap) return;

    const activeBtn = wrap.querySelector('.lang-btn.active') || document.getElementById('lang-btn-en');
    if (!activeBtn) return;

    const wrapRect = wrap.getBoundingClientRect();
    const btnRect = activeBtn.getBoundingClientRect();

    if (wrapRect.width === 0 || btnRect.width === 0) return;

    const left = btnRect.left - wrapRect.left;
    const width = btnRect.width;

    if (instant) {
      glider.style.transition = 'none';
    } else {
      glider.style.transition = '';
    }

    glider.style.width = `${width}px`;
    glider.style.transform = `translateX(${left}px)`;
    glider.classList.add('ready');
    wrap.classList.add('glider-ready');

    if (instant) {
      void glider.offsetWidth;
      glider.style.transition = '';
    }
  }

  function getLanguage() {
    return currentLang;
  }

  // Expose global methods
  window.i18n = {
    t,
    setLanguage,
    getLanguage,
    updateLangGlider,
    translations: TRANSLATIONS
  };
  window.t = t;

  // Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    // Bind click events on switcher buttons
    const btnEn = document.getElementById('lang-btn-en');
    const btnId = document.getElementById('lang-btn-id');
    if (btnEn) {
      btnEn.addEventListener('click', () => setLanguage('en'));
    }
    if (btnId) {
      btnId.addEventListener('click', () => setLanguage('id'));
    }

    // Apply initial language
    setLanguage(currentLang);
    updateLangGlider(true);

    // Keep glider aligned on resize and container changes
    window.addEventListener('resize', () => updateLangGlider(true), { passive: true });
    if ('ResizeObserver' in window) {
      const wrap = document.getElementById('lang-switch-wrap');
      if (wrap) {
        new ResizeObserver(() => updateLangGlider(true)).observe(wrap);
      }
    }
  });
})();
