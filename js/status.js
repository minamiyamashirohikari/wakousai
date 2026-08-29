/* =========================================================
   和光祭 開催状況 表示スクリプト（公開ページ）
   取得元は js/status-source.js が自動判定します
   ・スプレッドシート運用（Cloudflare Pages / GitHub Pages）
   ・Genspark Table API 運用
   ========================================================= */
(function () {
  'use strict';

  var SRC = window.WakousaiStatus;
  if (!SRC) { return; }

  var STATUS_DEF = SRC.DEF;

  var els = {
    card: document.getElementById('status-card'),
    label: document.getElementById('status-label'),
    headline: document.getElementById('status-headline'),
    detail: document.getElementById('status-detail'),
    meta: document.getElementById('status-meta'),
    updated: document.getElementById('status-updated'),
    reloadBtn: document.getElementById('reload-status-btn'),
    sticky: document.getElementById('sticky-cta'),
    stickyText: document.getElementById('sticky-cta-text'),
    stickySub: document.getElementById('sticky-cta-sub')
  };

  /** テキストを段落に分割して安全に挿入 */
  function renderDetail(container, text) {
    container.textContent = '';
    var lines = String(text || '').split(/\r?\n/);
    lines.forEach(function (line) {
      if (line.trim() === '') { return; }
      var p = document.createElement('p');
      p.textContent = line;
      container.appendChild(p);
    });
  }

  /** 画面に状況を反映 */
  function applyStatus(row) {
    var code = (row && row.status_code) ? row.status_code : 'before';
    var def = STATUS_DEF[code] || STATUS_DEF.before;

    els.card.className = 'status-card ' + def.klass;
    els.label.textContent = def.label;
    els.headline.textContent = (row && row.headline) ? row.headline : def.fallbackHeadline;
    renderDetail(els.detail, (row && row.detail) ? row.detail : def.fallbackDetail);

    var when = SRC.formatDateTime(row && (row.published_at || row.updated_at));
    els.updated.textContent = when ? ('最終更新：' + when) : '最終更新：—';

    var by = (row && row.updated_by) ? row.updated_by : '和光祭実行委員会';
    els.meta.textContent = '発表：' + by;

    els.stickyText.firstChild.nodeValue = def.sticky;
    els.stickySub.textContent = def.stickySub;
    els.sticky.classList.add('is-visible');
    document.body.classList.add('has-sticky');
  }

  /** 最新の状況を取得 */
  function loadStatus() {
    els.reloadBtn.disabled = true;
    els.reloadBtn.textContent = '読み込み中…';

    SRC.loadLatest()
      .then(function (row) {
        applyStatus(row);
      })
      .catch(function (err) {
        console.warn('開催状況の取得に失敗しました:', err);
        applyStatus(null);
        els.updated.textContent = '最終更新：情報を取得できませんでした';
      })
      .then(function () {
        els.reloadBtn.disabled = false;
        els.reloadBtn.textContent = '最新の状況を再読み込み';
      });
  }

  els.reloadBtn.addEventListener('click', loadStatus);

  // 初回読み込み＋5分ごとに自動更新
  loadStatus();
  setInterval(loadStatus, 5 * 60 * 1000);

  // タブに戻ってきたときも更新
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) { loadStatus(); }
  });
})();
