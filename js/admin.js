/* =========================================================
   和光祭 実施状況 更新画面（職員用）
   ---------------------------------------------------------
   ・スプレッドシート運用時は「シートを開く」案内を表示
     （静的ホスティングでは書き込みができないため）
   ・Genspark Table API 運用時は入力フォームで更新
   ========================================================= */
(function () {
  'use strict';

  var TABLE = 'status_updates';
  var SRC = window.WakousaiStatus;
  if (!SRC) { return; }

  var STATUS_DEF = SRC.DEF;

  // 定型文
  var PRESETS = {
    open: {
      headline: '予定どおり通常開催します',
      detail: '本日の和光祭は予定どおり開催します。\nステージイベント・飲食販売・こどもブースすべて実施します。\n皆さまのご来場をお待ちしております。駐車場はございませんので、公共交通機関でお越しください。'
    },
    stage_cancel: {
      headline: 'ステージイベントは中止／飲食販売は開催します',
      detail: '雨天のため、屋外ステージのイベントはすべて中止いたします。\n飲食販売・こどもブース・体験＆販売コーナーは予定どおり開催します。\n足元が滑りやすくなっておりますので、お気をつけてお越しください。'
    },
    cancel: {
      headline: '本日の和光祭は中止いたします',
      detail: '気象警報の発令により、本日の和光祭はすべて中止いたします。\n楽しみにしてくださっていた皆さまには申し訳ございませんが、安全確保のためご理解をお願いいたします。\nお問い合わせは和光祭実行委員会（075-575-2255）までお願いいたします。'
    },
    before: {
      headline: '現在、開催に向けて準備中です',
      detail: '当日の天候によりイベント内容が変更となる場合があります。\n最新の実施状況は当日の朝8時30分頃までにこのページでお知らせします。\nご来場前にぜひご確認ください。'
    },
    ended: {
      headline: '和光祭は終了しました',
      detail: 'たくさんのご来場、誠にありがとうございました。\nまた来年、皆さまにお会いできることを楽しみにしております。'
    }
  };

  var els = {
    // 共通（現在の表示プレビュー）
    card: document.getElementById('status-card'),
    label: document.getElementById('status-label'),
    cHeadline: document.getElementById('status-headline'),
    cDetail: document.getElementById('status-detail'),
    cMeta: document.getElementById('status-meta'),
    cUpdated: document.getElementById('status-updated'),
    reloadBtn: document.getElementById('reload-status-btn'),

    // GitHub（status.txt）運用時
    fileSection: document.getElementById('file-section'),
    openGithubBtn: document.getElementById('open-github-btn'),
    fileReloadBtn: document.getElementById('file-reload-btn'),

    // スプレッドシート運用時
    sheetSection: document.getElementById('sheet-section'),
    openSheetBtn: document.getElementById('open-sheet-btn'),
    sheetReloadBtn: document.getElementById('sheet-reload-btn'),

    // Table API 運用時
    updateSection: document.getElementById('update-section'),
    historySection: document.getElementById('history-section'),
    form: document.getElementById('status-form'),
    code: document.getElementById('status-code-select'),
    headline: document.getElementById('headline-input'),
    detail: document.getElementById('detail-input'),
    by: document.getElementById('updated-by-input'),
    submit: document.getElementById('submit-btn'),
    message: document.getElementById('admin-message'),
    presetArea: document.getElementById('preset-area'),
    history: document.getElementById('history-list')
  };

  var mode = SRC.mode();               // 'file' / 'sheet' / 'genspark'
  var readOnly = !SRC.canWriteInApp(); // 画面から書き込めない運用か

  function localIsoNow() {
    var d = new Date();
    var p = function (n) { return ('0' + n).slice(-2); };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) +
      'T' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
  }

  function timeOf(row) {
    var v = row.published_at || row.updated_at || row.created_at;
    if (typeof v === 'number') { return v; }
    var t = new Date(String(v || '').replace(' ', 'T')).getTime();
    return isNaN(t) ? 0 : t;
  }

  function renderDetail(container, text) {
    container.textContent = '';
    String(text || '').split(/\r?\n/).forEach(function (line) {
      if (line.trim() === '') { return; }
      var p = document.createElement('p');
      p.textContent = line;
      container.appendChild(p);
    });
  }

  function showMessage(text, ok) {
    if (!els.message) { return; }
    els.message.textContent = text;
    els.message.className = 'admin-message ' + (ok ? 'is-ok' : 'is-ng');
  }

  /** 「いま公開されている内容」を描画 */
  function renderPreview(row) {
    var code = (row && row.status_code) ? row.status_code : 'before';
    var def = STATUS_DEF[code] || STATUS_DEF.before;

    els.card.className = 'status-card ' + def.klass;
    els.label.textContent = def.label;
    els.cHeadline.textContent = (row && row.headline) ? row.headline : def.fallbackHeadline;
    renderDetail(els.cDetail, (row && row.detail) ? row.detail : def.fallbackDetail);
    els.cMeta.textContent = '発表：' + ((row && row.updated_by) ? row.updated_by : '和光祭実行委員会');

    var when = SRC.formatDateTime(row && (row.published_at || row.updated_at));
    els.cUpdated.textContent = when ? ('最終更新：' + when) : '最終更新：—';
  }

  function setReloadDisabled(flag) {
    if (els.reloadBtn) { els.reloadBtn.disabled = flag; }
    if (els.sheetReloadBtn) { els.sheetReloadBtn.disabled = flag; }
    if (els.fileReloadBtn) { els.fileReloadBtn.disabled = flag; }
  }

  /** 現在の状況（＋履歴）を読み込む */
  function loadStatus() {
    setReloadDisabled(true);

    if (readOnly) {
      SRC.loadLatest()
        .then(function (row) { renderPreview(row); })
        .catch(function (err) {
          console.error(err);
          els.cHeadline.textContent = '読み取りエラー';
          if (mode === 'file') {
            els.cUpdated.textContent = 'status.txt を読み取れませんでした';
            renderDetail(els.cDetail,
              'status.txt がサイトの一番上の階層に置かれているかご確認ください。');
          } else {
            els.cUpdated.textContent = 'スプレッドシートを読み取れませんでした';
            renderDetail(els.cDetail,
              'スプレッドシートの共有設定（リンクを知っている全員が閲覧可）と、js/config.js の設定をご確認ください。');
          }
        })
        .then(function () { setReloadDisabled(false); });
      return;
    }

    // --- Table API 運用（履歴付き） ---
    fetch('tables/' + TABLE + '?limit=100&sort=created_at', { cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) { throw new Error('HTTP ' + res.status); }
        return res.json();
      })
      .then(function (json) {
        var rows = ((json && json.data) ? json.data : []).filter(function (r) { return r && !r.deleted; });
        rows.sort(function (a, b) { return timeOf(b) - timeOf(a); });

        els.history.textContent = '';

        if (rows.length === 0) {
          els.cUpdated.textContent = 'まだ公開情報がありません';
          els.label.textContent = '未設定';
          els.cHeadline.textContent = '公開情報がありません';
          els.cDetail.textContent = '';
          els.cMeta.textContent = '';
          var li0 = document.createElement('li');
          li0.textContent = '履歴はまだありません。';
          els.history.appendChild(li0);
          return;
        }

        renderPreview(rows[0]);

        rows.slice(0, 10).forEach(function (row) {
          var d = STATUS_DEF[row.status_code] || {};
          var li = document.createElement('li');
          var time = document.createElement('span');
          time.className = 'history-time';
          time.textContent = SRC.formatDateTime(row.published_at || row.updated_at) + '　/　' + (row.updated_by || '');
          var body = document.createElement('span');
          body.textContent = '【' + (d.label || row.status_code) + '】' + (row.headline || '');
          li.appendChild(time);
          li.appendChild(body);
          els.history.appendChild(li);
        });
      })
      .catch(function (err) {
        console.error(err);
        els.cUpdated.textContent = '情報を取得できませんでした';
        els.history.textContent = '';
        var li = document.createElement('li');
        li.textContent = '履歴を取得できませんでした。';
        els.history.appendChild(li);
      })
      .then(function () { setReloadDisabled(false); });
  }

  /** 運用形態に応じて画面を切り替える */
  function setupMode() {
    if (readOnly) {
      // サイトからの書き込みはできないのでフォームを隠す
      if (els.updateSection) { els.updateSection.hidden = true; }
      if (els.historySection) { els.historySection.hidden = true; }

      if (mode === 'file') {
        if (els.fileSection) { els.fileSection.hidden = false; }
        if (els.sheetSection) { els.sheetSection.hidden = true; }

        var gh = SRC.githubEditUrl();
        if (els.openGithubBtn) {
          if (gh) {
            els.openGithubBtn.href = gh;
          } else {
            // URL未設定でも操作できるよう、GitHubのトップへ誘導する
            els.openGithubBtn.href = 'https://github.com/';
            els.openGithubBtn.textContent = 'GitHubを開く（status.txt を探して編集）';
            var hint = document.getElementById('github-url-hint');
            if (hint) { hint.hidden = false; }
          }
        }
        if (els.fileReloadBtn) {
          els.fileReloadBtn.addEventListener('click', loadStatus);
        }
        return;
      }

      // スプレッドシート運用
      if (els.fileSection) { els.fileSection.hidden = true; }
      if (els.sheetSection) { els.sheetSection.hidden = false; }

      var url = SRC.sheetUrl();
      if (els.openSheetBtn) {
        if (url) {
          els.openSheetBtn.href = url;
        } else {
          els.openSheetBtn.removeAttribute('href');
          els.openSheetBtn.textContent = 'スプレッドシートのURLが未設定です';
          els.openSheetBtn.classList.add('btn-outline');
        }
      }
      if (els.sheetReloadBtn) {
        els.sheetReloadBtn.addEventListener('click', loadStatus);
      }
      return;
    }

    // --- 以下は Genspark 運用（画面から書き込める）---
    if (els.fileSection) { els.fileSection.hidden = true; }
    if (els.sheetSection) { els.sheetSection.hidden = true; }

    // 定型文の適用
    els.presetArea.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-preset]');
      if (!btn) { return; }
      var preset = PRESETS[btn.getAttribute('data-preset')];
      if (!preset) { return; }
      els.code.value = btn.getAttribute('data-preset');
      els.headline.value = preset.headline;
      els.detail.value = preset.detail;
      showMessage('定型文を入力しました。内容を確認して「この内容で公開する」を押してください。', true);
      els.headline.focus();
    });

    // 区分を変えたら未入力なら定型文を補完
    els.code.addEventListener('change', function () {
      if (els.headline.value.trim() === '' && els.detail.value.trim() === '') {
        var preset = PRESETS[els.code.value];
        if (preset) {
          els.headline.value = preset.headline;
          els.detail.value = preset.detail;
        }
      }
    });

    // 送信
    els.form.addEventListener('submit', function (e) {
      e.preventDefault();

      var headline = els.headline.value.trim();
      if (headline === '') {
        showMessage('見出しを入力してください。', false);
        els.headline.focus();
        return;
      }

      var payload = {
        status_code: els.code.value,
        headline: headline,
        detail: els.detail.value.trim(),
        updated_by: els.by.value.trim() || '和光祭実行委員会',
        published_at: localIsoNow()
      };

      var confirmText = '「' + (STATUS_DEF[payload.status_code] || {}).label + '」として公開します。よろしいですか？';
      if (!window.confirm(confirmText)) { return; }

      els.submit.disabled = true;
      els.submit.textContent = '公開中…';

      fetch('tables/' + TABLE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (res) {
          if (!res.ok) { throw new Error('HTTP ' + res.status); }
          return res.json();
        })
        .then(function () {
          showMessage('公開しました。公開ページに最新の実施状況が表示されます。', true);
          loadStatus();
        })
        .catch(function (err) {
          console.error(err);
          showMessage('公開に失敗しました。通信状況を確認してもう一度お試しください。（' + err.message + '）', false);
        })
        .then(function () {
          els.submit.disabled = false;
          els.submit.textContent = 'この内容で公開する';
        });
    });
  }

  if (els.reloadBtn) { els.reloadBtn.addEventListener('click', loadStatus); }
  setupMode();

  // パスコード認証（js/auth.js）が解除されてから読み込む
  if (window.WAKOUSAI_ADMIN_UNLOCKED) {
    loadStatus();
  } else {
    document.addEventListener('admin:unlocked', loadStatus);
  }
})();
