/* =========================================================
   和光祭 職員用ページ 簡易パスコード認証
   ---------------------------------------------------------
   ※これはクライアント側の簡易ロックです。
     悪意ある第三者に対する強固な保護ではありません。
     （関係者以外の誤操作を防ぐことを目的としています）
   パスコードを変更する場合は下の PASSCODE を書き換えてください。
   ========================================================= */
(function () {
  'use strict';

  var PASSCODE = '1456';          // ← 4桁のパスコード
  var STORAGE_KEY = 'wakousai_admin_unlocked';
  var MAX_ATTEMPTS = 5;           // 連続失敗の上限
  var LOCKOUT_MS = 60 * 1000;     // 上限到達後の待機時間（1分）

  var lockScreen = document.getElementById('lock-screen');
  var adminMain = document.getElementById('admin-main');
  var lockForm = document.getElementById('lock-form');
  var input = document.getElementById('passcode-input');
  var remember = document.getElementById('remember-check');
  var message = document.getElementById('lock-message');
  var unlockBtn = document.getElementById('unlock-btn');
  var lockAgainBtn = document.getElementById('lock-again-btn');

  var attempts = 0;
  var lockedUntil = 0;

  /** 認証済みかどうか（セッション中／端末記憶） */
  function isUnlocked() {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === '1' ||
             localStorage.getItem(STORAGE_KEY) === '1';
    } catch (e) {
      return false;
    }
  }

  function saveUnlocked(persist) {
    try {
      sessionStorage.setItem(STORAGE_KEY, '1');
      if (persist) { localStorage.setItem(STORAGE_KEY, '1'); }
    } catch (e) { /* ストレージ利用不可でも続行 */ }
  }

  function clearUnlocked() {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) { /* noop */ }
  }

  function showMessage(text, ok) {
    message.textContent = text;
    message.className = 'admin-message ' + (ok ? 'is-ok' : 'is-ng');
  }

  /** 管理画面を表示する */
  function unlock() {
    lockScreen.hidden = true;
    adminMain.hidden = false;
    // admin.js が後から読み込まれる場合はこのフラグで判定する
    window.WAKOUSAI_ADMIN_UNLOCKED = true;
    document.dispatchEvent(new CustomEvent('admin:unlocked'));
  }

  /** ロック画面へ戻す */
  function lock() {
    clearUnlocked();
    window.WAKOUSAI_ADMIN_UNLOCKED = false;
    adminMain.hidden = true;
    lockScreen.hidden = false;
    input.value = '';
    message.textContent = '';
    message.className = 'admin-message';
    input.focus();
  }

  // ---- 初期判定 ----
  if (isUnlocked()) {
    unlock();
  } else {
    lockScreen.hidden = false;
    adminMain.hidden = true;
  }

  // 数字以外は入力させない
  input.addEventListener('input', function () {
    var cleaned = input.value.replace(/[^0-9]/g, '').slice(0, 4);
    if (input.value !== cleaned) { input.value = cleaned; }
  });

  lockForm.addEventListener('submit', function (e) {
    e.preventDefault();

    var now = Date.now();
    if (now < lockedUntil) {
      var wait = Math.ceil((lockedUntil - now) / 1000);
      showMessage('入力を続けて間違えたため、' + wait + '秒後にもう一度お試しください。', false);
      return;
    }

    var value = input.value.trim();

    if (value.length !== 4) {
      showMessage('4桁の数字を入力してください。', false);
      input.focus();
      return;
    }

    if (value === PASSCODE) {
      attempts = 0;
      saveUnlocked(remember.checked);
      input.value = '';
      showMessage('', true);
      message.className = 'admin-message';
      unlock();
      return;
    }

    attempts += 1;
    input.value = '';
    input.focus();

    if (attempts >= MAX_ATTEMPTS) {
      lockedUntil = Date.now() + LOCKOUT_MS;
      attempts = 0;
      showMessage('パスコードが正しくありません。1分後にもう一度お試しください。', false);
    } else {
      showMessage('パスコードが正しくありません。（残り ' + (MAX_ATTEMPTS - attempts) + ' 回）', false);
    }
  });

  if (lockAgainBtn) {
    lockAgainBtn.addEventListener('click', function () {
      if (window.confirm('ロックして入力画面に戻ります。よろしいですか？')) {
        lock();
      }
    });
  }

  // 未認証時はパスコード欄にフォーカス
  if (!isUnlocked()) { input.focus(); }
})();
