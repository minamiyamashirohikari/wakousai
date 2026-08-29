# 印刷物用QRコード 固定記録

このQRコードは紙媒体のチラシに使用する正式版です。2026年8月29日以降、通常の更新作業では一切変更しません。

## 固定値

- 読み取り先URL: `https://minamiyamashiro-wakousai.pages.dev/`
- QRコード画像: `images/minamiyamashiro-wakousai-qr.png`
- SHA-256: `66818F4DE92FB8A1658C743C522686A1C608DA7FE0A37C9D3BA054597378C4E9`
- QRコード表示ページ: `https://minamiyamashiro-wakousai.pages.dev/#qr-section`

## 変更禁止事項

- Cloudflare Pagesプロジェクト`minamiyamashiro-wakousai`を改名・削除しない。
- 正式公開URLを別URLへ切り替えない。
- QRコード画像を再生成・上書き・加工・色変更・リサイズしない。
- `js/qr.js`の固定URLと固定画像パスを変更しない。
- 年度更新、チラシ差し替え、本文修正、開催状況更新ではQRコード関連ファイルに触れない。

例外は、紙媒体への影響を確認したうえで利用者本人から明示的な変更指示があった場合のみです。

## 確認方法

更新前後に次を実行し、固定値が維持されていることを確認します。

```powershell
node scripts/verify-qr-lock.mjs
```

GitHub Actionsでも同じ検証スクリプトを自動実行します。固定値に差異がある場合は検証が失敗し、変更を検知できます。
