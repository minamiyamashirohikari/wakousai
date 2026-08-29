/* =========================================================
   このページのURLからQRコードを生成する
   （チラシ・掲示物へ貼り付けて使えるよう保存も可能）
   ライブラリ: js/lib/qrcode.min.js（qrcodejs / ローカル同梱）
   ========================================================= */
(function () {
  'use strict';

  var wrap = document.getElementById('qr-canvas-wrap');
  var urlText = document.getElementById('qr-url');
  var msg = document.getElementById('qr-message');
  var dlBtn = document.getElementById('qr-download-btn');
  var copyBtn = document.getElementById('qr-copy-btn');

  if (!wrap) { return; }

  // 正式URLが設定されていれば常にそのURLを使う。
  // 未設定時だけ、ハッシュやクエリを除いた現在のページURLを使う。
  var cfg = window.WAKOUSAI_CONFIG || {};
  var configuredUrl = String(cfg.PUBLIC_URL || '').trim();
  var pageUrl = configuredUrl || (location.origin + location.pathname);
  if (urlText) { urlText.textContent = pageUrl; }

  if (typeof QRCode === 'undefined') {
    if (msg) { msg.textContent = 'QRコードの生成に失敗しました。ページを再読み込みしてください。'; }
    return;
  }

  // QRコード生成（緑：南山城学園イメージカラー）
  try {
    new QRCode(wrap, {
      text: pageUrl,
      width: 220,
      height: 220,
      colorDark: '#2f9b90',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M
    });
  } catch (e) {
    console.error(e);
    if (msg) { msg.textContent = 'QRコードを生成できませんでした。'; }
    return;
  }

  /** canvas / img いずれで描画されてもPNGデータを取り出す */
  function getImageDataUrl() {
    var canvas = wrap.querySelector('canvas');
    if (canvas) {
      try { return canvas.toDataURL('image/png'); } catch (e) { /* noop */ }
    }
    var img = wrap.querySelector('img');
    if (img && img.src) { return img.src; }
    return '';
  }

  if (dlBtn) {
    dlBtn.addEventListener('click', function () {
      var data = getImageDataUrl();
      if (!data) {
        msg.textContent = 'QRコード画像を取得できませんでした。画像を長押しして保存してください。';
        return;
      }
      var a = document.createElement('a');
      a.href = data;
      a.download = 'minamiyamashiro-wakousai-qr.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      msg.textContent = 'QRコード画像を保存しました（minamiyamashiro-wakousai-qr.png）。';
    });
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(pageUrl).then(function () {
          msg.textContent = 'URLをコピーしました。';
        }).catch(function () {
          msg.textContent = 'コピーできませんでした。URLを手動で選択してください。';
        });
      } else {
        msg.textContent = 'このブラウザでは自動コピーに対応していません。URLを手動で選択してください。';
      }
    });
  }
})();
