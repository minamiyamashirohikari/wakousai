/* =========================================================
   印刷物用の正式QRコードを、そのまま表示・保存する
   ---------------------------------------------------------
   重要: QRコードと読み取り先URLは印刷物用の固定資産です。
   URL・画像・ファイル名を変更したり、QRコードを再生成したり
   しないでください。詳細: docs/QR-CODE-LOCK.md
   ========================================================= */
(function () {
  'use strict';

  var LOCKED_PUBLIC_URL = 'https://minamiyamashiro-wakousai.pages.dev/';
  var LOCKED_QR_IMAGE = 'images/minamiyamashiro-wakousai-qr.png';

  var wrap = document.getElementById('qr-canvas-wrap');
  var urlText = document.getElementById('qr-url');
  var msg = document.getElementById('qr-message');
  var dlBtn = document.getElementById('qr-download-btn');
  var copyBtn = document.getElementById('qr-copy-btn');

  if (!wrap) { return; }

  if (urlText) { urlText.textContent = LOCKED_PUBLIC_URL; }
  wrap.title = LOCKED_PUBLIC_URL;

  var image = wrap.querySelector('img');
  if (!image || image.getAttribute('src') !== LOCKED_QR_IMAGE) {
    if (msg) { msg.textContent = '固定QRコード画像の設定を確認できませんでした。管理者へご連絡ください。'; }
    return;
  }
  image.addEventListener('error', function () {
    if (msg) { msg.textContent = '固定QRコード画像を読み込めませんでした。管理者へご連絡ください。'; }
  });

  if (dlBtn) {
    dlBtn.addEventListener('click', function () {
      var a = document.createElement('a');
      a.href = LOCKED_QR_IMAGE;
      a.download = 'minamiyamashiro-wakousai-qr.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      if (msg) { msg.textContent = '印刷物用の固定QRコード画像を保存しました。'; }
    });
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(LOCKED_PUBLIC_URL).then(function () {
          if (msg) { msg.textContent = '固定URLをコピーしました。'; }
        }).catch(function () {
          if (msg) { msg.textContent = 'コピーできませんでした。表示中のURLを選択してコピーしてください。'; }
        });
        return;
      }
      if (msg) { msg.textContent = '表示中のURLを選択してコピーしてください。'; }
    });
  }
})();
