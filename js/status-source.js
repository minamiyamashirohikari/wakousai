/* =========================================================
   開催状況の取得元を切り替える共通モジュール
   ---------------------------------------------------------
   ・js/config.js の SHEET_ID が設定されていれば
     → Googleスプレッドシートから読み取る（Cloudflare Pages 等）
   ・空欄なら
     → Genspark の Table API から読み取る（従来どおり）
   ========================================================= */
(function () {
  'use strict';

  var cfg = window.WAKOUSAI_CONFIG || {};

  /* 状況コードごとの表示定義（全ページ共通） */
  var STATUS_DEF = {
    before: {
      label: '開催前・準備中',
      klass: 'is-before',
      fallbackHeadline: '現在、開催に向けて準備中です',
      fallbackDetail: '当日の天候により内容が変更となる場合があります。最新の実施状況はこのページでお知らせします。',
      sticky: '開催前',
      stickySub: '当日はここで実施状況をお知らせします'
    },
    open: {
      label: '通常開催',
      klass: 'is-open',
      fallbackHeadline: '予定どおり通常開催します',
      fallbackDetail: 'すべてのプログラムを予定どおり実施します。お気をつけてお越しください。',
      sticky: '通常開催しています',
      stickySub: 'すべてのプログラムを実施中'
    },
    stage_cancel: {
      label: '雨天時（飲食ブースのみ開催）',
      klass: 'is-stage_cancel',
      fallbackHeadline: '雨天のため飲食ブースのみ開催します',
      fallbackDetail: '雨天のため、飲食ブースのみ実施します。ステージイベントは中止いたします。足元にお気をつけてお越しください。',
      sticky: '雨天・飲食ブースのみ開催',
      stickySub: 'ステージイベントは中止です'
    },
    cancel: {
      label: '全体中止',
      klass: 'is-cancel',
      fallbackHeadline: '本日の和光祭は中止いたします',
      fallbackDetail: '気象警報の発令等により、本日の和光祭はすべて中止いたします。楽しみにしてくださっていた皆さまには申し訳ございませんが、安全確保のためご理解をお願いいたします。',
      sticky: '本日は中止です',
      stickySub: '警報発令等により全体中止'
    },
    ended: {
      label: '終了しました',
      klass: 'is-ended',
      fallbackHeadline: '和光祭は終了しました',
      fallbackDetail: 'たくさんのご来場、誠にありがとうございました。またのお越しをお待ちしております。',
      sticky: '和光祭は終了しました',
      stickySub: 'ご来場ありがとうございました'
    }
  };

  /* スプレッドシートに書く日本語 → 内部コードの対応表
     ※判定は上から順に行うため、より限定的な語を先に置いている
       （例：「開催前」を「開催」より先に判定する）           */
  var WORD_TO_CODE = [
    { code: 'stage_cancel', words: ['ステージ中止', 'ステージイベント中止', 'ステージのみ中止', '飲食のみ', '飲食販売のみ', '飲食ブースのみ'] },
    { code: 'before', words: ['開催前', '準備中', '準備'] },
    { code: 'ended', words: ['終了', '閉幕'] },
    { code: 'cancel', words: ['全体中止', '全面中止', '中止', '警報'] },
    { code: 'open', words: ['通常開催', '予定どおり', '通常', '開催'] }
  ];

  /** 入力文字列から状況コードを判定する */
  function toStatusCode(raw) {
    var v = String(raw || '').trim();
    if (v === '') { return 'before'; }

    // 内部コードがそのまま書かれている場合
    if (STATUS_DEF[v]) { return v; }

    // 日本語の表記から判定（より具体的な語を先に判定する）
    for (var i = 0; i < WORD_TO_CODE.length; i++) {
      var entry = WORD_TO_CODE[i];
      for (var j = 0; j < entry.words.length; j++) {
        if (v.indexOf(entry.words[j]) !== -1) { return entry.code; }
      }
    }
    return 'before';
  }

  /** CSV文字列を二次元配列へ（引用符・改行込みのセルに対応） */
  function parseCsv(text) {
    var rows = [];
    var row = [];
    var field = '';
    var inQuotes = false;
    var i = 0;

    // 先頭のBOMを除去
    if (text.charCodeAt(0) === 0xFEFF) { text = text.slice(1); }

    while (i < text.length) {
      var ch = text.charAt(i);

      if (inQuotes) {
        if (ch === '"') {
          if (text.charAt(i + 1) === '"') { field += '"'; i += 2; continue; }
          inQuotes = false; i++; continue;
        }
        field += ch; i++; continue;
      }

      if (ch === '"') { inQuotes = true; i++; continue; }
      if (ch === ',') { row.push(field); field = ''; i++; continue; }
      if (ch === '\r') { i++; continue; }
      if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; i++; continue; }

      field += ch; i++;
    }

    row.push(field);
    rows.push(row);
    return rows;
  }

  /** スプレッドシートのCSV取得先URLを作る */
  function buildSheetUrl() {
    if (cfg.CSV_URL) { return cfg.CSV_URL; }
    if (!cfg.SHEET_ID) { return ''; }
    var url = 'https://docs.google.com/spreadsheets/d/' + cfg.SHEET_ID + '/gviz/tq?tqx=out:csv';
    if (cfg.SHEET_NAME) { url += '&sheet=' + encodeURIComponent(cfg.SHEET_NAME); }
    return url;
  }

  /* 項目名の別名（表記ゆれを吸収する） */
  var KEY_ALIASES = {
    status_code: ['区分', '状況', '開催状況', '実施状況', 'status', 'status_code'],
    headline: ['見出し', 'タイトル', 'headline'],
    detail: ['本文', '案内', '詳細', 'detail', '説明'],
    updated_by: ['担当者', '担当', '発表者', 'updated_by'],
    published_at: ['更新日時', '日時', '更新', 'published_at']
  };

  function matchKey(label) {
    var v = String(label || '').trim();
    var keys = Object.keys(KEY_ALIASES);
    for (var i = 0; i < keys.length; i++) {
      var aliases = KEY_ALIASES[keys[i]];
      for (var j = 0; j < aliases.length; j++) {
        if (v === aliases[j] || v.indexOf(aliases[j]) !== -1) { return keys[i]; }
      }
    }
    return '';
  }

  /**
   * CSVの内容を1件のレコードに変換する。
   * 「縦型（A列=項目名 / B列=内容）」と「横型（1行目=見出し / 2行目=内容）」の
   * どちらの書き方でも読み取れるようにしている。
   */
  function rowsToRecord(rows) {
    var rec = {};
    var i;

    // --- 縦型として解釈を試みる ---
    var verticalHits = 0;
    for (i = 0; i < rows.length; i++) {
      if (rows[i].length < 2) { continue; }
      var key = matchKey(rows[i][0]);
      if (key && rec[key] === undefined) {
        rec[key] = String(rows[i][1] || '').trim();
        verticalHits++;
      }
    }
    if (verticalHits >= 2) { return rec; }

    // --- 横型として解釈する ---
    if (rows.length >= 2) {
      var header = rows[0];
      var body = rows[1];
      var hits = 0;
      rec = {};
      for (i = 0; i < header.length; i++) {
        var k = matchKey(header[i]);
        if (k && rec[k] === undefined) {
          rec[k] = String(body[i] || '').trim();
          hits++;
        }
      }
      if (hits >= 2) { return rec; }
    }

    return verticalHits > 0 ? rec : null;
  }

  /** スプレッドシートから取得 */
  function loadFromSheet() {
    var url = buildSheetUrl();
    return fetch(url, { cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) { throw new Error('スプレッドシートを読み取れません（HTTP ' + res.status + '）'); }
        return res.text();
      })
      .then(function (text) {
        var rec = rowsToRecord(parseCsv(text));
        if (!rec) { throw new Error('スプレッドシートの項目名を読み取れませんでした'); }
        return {
          status_code: toStatusCode(rec.status_code),
          headline: rec.headline || '',
          detail: rec.detail || '',
          updated_by: rec.updated_by || '',
          published_at: rec.published_at || ''
        };
      });
  }

  /**
   * status.txt （GitHub運用）から取得
   * 「項目名: 内容」形式のテキストファイルを読み取る。
   * # で始まる行はすべてコメントとして無視する。
   */
  function loadFromFile() {
    var path = cfg.STATUS_FILE || 'status.txt';
    // キャッシュ除け（GitHub/CDNの古い内容を拾わないように）
    var url = path + (path.indexOf('?') === -1 ? '?' : '&') + 't=' + Date.now();

    return fetch(url, { cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) { throw new Error('status.txt を読み取れません（HTTP ' + res.status + '）'); }
        return res.text();
      })
      .then(function (text) {
        var rec = parseStatusFile(text);
        if (!rec) { throw new Error('status.txt の内容を読み取れませんでした'); }
        return rec;
      });
  }

  /** 「項目名: 内容」形式のテキストを解析 */
  function parseStatusFile(text) {
    if (text.charCodeAt(0) === 0xFEFF) { text = text.slice(1); }

    var rec = {};
    var hits = 0;
    var lines = text.split(/\r?\n/);

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];

      // コメント行・空行は飛ばす
      if (line.trim() === '' || line.trim().charAt(0) === '#') { continue; }

      // 全角コロン「：」でも区切れるようにする
      var sep = line.search(/[:：]/);
      if (sep === -1) { continue; }

      var rawKey = line.slice(0, sep);
      var rawVal = line.slice(sep + 1).trim();
      var key = matchKey(rawKey);
      if (!key || rec[key] !== undefined) { continue; }

      rec[key] = rawVal;
      hits++;
    }

    if (hits === 0) { return null; }

    return {
      status_code: toStatusCode(rec.status_code),
      headline: rec.headline || '',
      detail: rec.detail || '',
      updated_by: rec.updated_by || '',
      published_at: rec.published_at || ''
    };
  }

  /** Genspark の Table API から取得 */
  function loadFromTable() {
    return fetch('tables/status_updates?limit=100&sort=created_at', { cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) { throw new Error('HTTP ' + res.status); }
        return res.json();
      })
      .then(function (json) {
        var rows = ((json && json.data) ? json.data : []).filter(function (r) { return r && !r.deleted; });
        if (rows.length === 0) { return null; }
        rows.sort(function (a, b) { return timeOf(b) - timeOf(a); });
        return rows[0];
      });
  }

  function timeOf(row) {
    var v = row.published_at || row.updated_at || row.created_at;
    if (typeof v === 'number') { return v; }
    var t = new Date(String(v || '').replace(' ', 'T')).getTime();
    return isNaN(t) ? 0 : t;
  }

  /**
   * 現在の運用モードを返す
   *  'file'     … status.txt を読む（GitHub / Cloudflare Pages 運用）
   *  'sheet'    … スプレッドシートを読む
   *  'genspark' … Table API を読む
   *
   * MODE が 'auto'（初期値）のときは、サイトの置き場所から自動判定する。
   * これにより、設定ファイルを書き換えずに移行できる。
   */
  function mode() {
    var m = String(cfg.MODE || '').toLowerCase();

    // 明示指定があればそれに従う
    if (m === 'file' || m === 'sheet' || m === 'genspark') { return m; }

    // スプレッドシートの設定があればシート運用と判断
    if (cfg.SHEET_ID || cfg.CSV_URL) { return 'sheet'; }

    // --- 自動判定 ---
    var host = location.hostname;

    // Genspark のプレビュー / 公開ドメインでは Table API が使える
    if (/(^|\.)gensparksite\.com$/.test(host) ||
        /(^|\.)gensparkspace\.com$/.test(host) ||
        /(^|\.)genspark\.ai$/.test(host)) {
      return 'genspark';
    }

    // それ以外（Cloudflare Pages / GitHub Pages / 独自ドメイン / ローカル）は
    // データベースが無いので status.txt を読む
    return 'file';
  }

  /** スプレッドシート運用かどうか */
  function isSheetMode() {
    return mode() === 'sheet';
  }

  /** GitHub（status.txt）運用かどうか */
  function isFileMode() {
    return mode() === 'file';
  }

  /** 管理画面から書き込める運用かどうか */
  function canWriteInApp() {
    return mode() === 'genspark';
  }

  /**
   * GitHub の status.txt 編集画面のURLを返す。
   * config.js に設定があればそれを使い、無ければ
   * GitHub Pages のURLから推測する（例：user.github.io/wakousai）。
   * 推測できない場合は空文字を返す。
   */
  function githubEditUrl() {
    if (cfg.GITHUB_EDIT_URL) { return cfg.GITHUB_EDIT_URL; }

    var host = location.hostname;
    var m = host.match(/^([^.]+)\.github\.io$/);
    if (m) {
      var user = m[1];
      var seg = location.pathname.split('/').filter(function (s) { return s !== ''; });
      // 末尾がファイル名なら除外する
      if (seg.length && /\.[a-zA-Z0-9]+$/.test(seg[seg.length - 1])) { seg.pop(); }
      var repo = seg.length ? seg[0] : (user + '.github.io');
      return 'https://github.com/' + user + '/' + repo + '/edit/main/status.txt';
    }
    return '';
  }

  /** 最新の状況を1件取得する（取得元は設定に従う） */
  function loadLatest() {
    var m = mode();
    if (m === 'file') { return loadFromFile(); }
    if (m === 'sheet') { return loadFromSheet(); }
    return loadFromTable();
  }

  /** 日時表示を整える */
  function formatDateTime(value) {
    if (!value) { return ''; }
    if (typeof value === 'string') {
      var s = value.trim();
      if (s === '') { return ''; }

      // 「2026/10/17 8:30」「2026-10-17 8:30」「2026/10/17」などを解釈
      var m = s.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})(?:[T\s]+(\d{1,2}):(\d{2}))?/);
      if (m) {
        var d2 = new Date(
          Number(m[1]), Number(m[2]) - 1, Number(m[3]),
          m[4] ? Number(m[4]) : 0, m[5] ? Number(m[5]) : 0
        );
        if (!isNaN(d2.getTime())) { return jp(d2); }
      }

      // 解釈できない場合は入力された文字をそのまま表示する
      return s;
    }
    var d = (typeof value === 'number') ? new Date(value) : new Date(value);
    return isNaN(d.getTime()) ? '' : jp(d);
  }

  function jp(d) {
    var dow = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()];
    return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日(' + dow + ') ' +
      d.getHours() + ':' + ('0' + d.getMinutes()).slice(-2);
  }

  // 外部公開
  window.WakousaiStatus = {
    DEF: STATUS_DEF,
    loadLatest: loadLatest,
    mode: mode,
    isSheetMode: isSheetMode,
    isFileMode: isFileMode,
    canWriteInApp: canWriteInApp,
    formatDateTime: formatDateTime,
    toStatusCode: toStatusCode,
    parseStatusFile: parseStatusFile,
    sheetUrl: function () { return cfg.SHEET_URL || ''; },
    githubEditUrl: githubEditUrl,
    statusFile: function () { return cfg.STATUS_FILE || 'status.txt'; }
  };
})();
