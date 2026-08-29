# 和光祭LP 引き継ぎメモ

最終確認日: 2026-08-29（Asia/Tokyo）

## 1. 引き継ぎ元

- Genspark共有タスク: `e61e21b1-a544-4200-8d70-ff3564089186`
- 現在の公開サイト: https://minamiyamashiro-wakousai.pages.dev/
- QRコード表示ページ: https://minamiyamashiro-wakousai.pages.dev/#qr-section
- 職員用画面: https://minamiyamashiro-wakousai.pages.dev/admin

このフォルダのファイルは、共有タスクの履歴と現在の公開サイトから回収した現行版です。Genspark上の元プロジェクトにあった移行資料は公開物に含まれていなかったため、`docs/`内の手順書は現行コードに合わせて再作成しました。

## 2. 現在の公開状態

- 来場者向けLPはCloudflare Pagesで公開済みで、表示・チラシ画像・QRコード生成に問題なし。
- Genspark公開環境では、開催状況をTable API / Cloudflare D1の`status_updates`から取得する。
- 公開データは1件で、区分は`before`（開催前・準備中）。データの控えは`data/status_updates.snapshot.json`。
- GitHubリポジトリ`minamiyamashirohikari/wakousai`を作成済み。
- Cloudflare Pagesプロジェクト`minamiyamashiro-wakousai`をGitHubの`main`ブランチへ接続済み。プッシュ時に自動デプロイされる。

## 3. 決定済み事項

- GitHubリポジトリ名: `wakousai`
- Cloudflare Pagesプロジェクト名: `minamiyamashiro-wakousai`
- GitHubアカウント: `minamiyamashirohikari`
- 正式公開URL: `https://minamiyamashiro-wakousai.pages.dev/`
- QRコード表示ページ: `https://minamiyamashiro-wakousai.pages.dev/#qr-section`
- `js/config.js`のGitHub編集URLは上記リポジトリ名で設定済み。

今後、編集・公開・更新の作業報告では、毎回「公開URL」と「QRコード表示ページ」をセットで提示する。

## 4. 実装構成

- `index.html`: 来場者向けLP。
- `admin.html`: 職員用の開催状況更新画面。
- `js/status-source.js`: ホスト名からデータ取得方式を自動選択する。
- `js/status.js`: 公開ページの開催状況カードと追従バナーを更新する。
- `js/admin.js`: Genspark環境で履歴表示と新規ステータス投稿を行う。静的環境では編集先案内を表示する。
- `js/auth.js`: 職員用画面の簡易ロック。
- `js/qr.js`: `js/config.js`に設定した正式公開URLからQRコードを生成する。
- `status.txt`: GitHub / Cloudflare Pages運用時の開催状況データ。

`js/config.js`の`MODE`は`auto`。自動判定は次のとおり。

| 公開場所 | モード | 読み取り先 | 更新方法 |
| --- | --- | --- | --- |
| `*.gensparksite.com`等 | `genspark` | `tables/status_updates` | 公開サイトの`admin.html` |
| Cloudflare Pages / GitHub Pages / 独自ドメイン / ローカル | `file` | `status.txt` | GitHub上で`status.txt`を編集 |
| `SHEET_ID`または`CSV_URL`設定時 | `sheet` | GoogleスプレッドシートCSV | スプレッドシートを編集 |

## 5. 検証済み

- 公開サイトの本文と現在の開催状況を確認。
- 現行ファイル一式をローカルHTTPサーバーで読み込み、公開ページと`status.txt`の反映を確認。
- QRコードのCanvas/PNG生成を確認。
- 職員用ページの読み込みとGitHub編集リンクを確認。
- 全JavaScriptファイルに対して`node --check`を実行し、構文エラーなし。
- ブラウザコンソールにJavaScriptエラーなし。
- Cloudflare Pagesの本番デプロイ成功、GitHub連携、`main`ブランチ、自動デプロイ有効を確認。
- 本番URLで公開ページ、QRコード、チラシ画像、職員用画面を確認。

## 6. 必ず確認する事項

1. **掲載内容は仮情報を含む。** 第11回（2025年）のチラシを基に、第12回・2026年10月3日として作られている。開催日、時間、出演者、出店者、料金、連絡先を正式資料と突合すること。
2. **公開先ごとに開催状況データが別。** 現在のGenspark版を更新しても`status.txt`は変わらず、Pages版の`status.txt`を更新してもGenspark版D1は変わらない。QR配布後は更新先を一本化すること。
3. **職員用ロックは簡易方式。** 4桁コードはブラウザ側JavaScriptで判定するため、強固な認証ではない。誤操作防止用と考える。
4. **正式運用はCloudflare Pagesへ一本化する。** Genspark版は旧環境として扱い、QRコードや配布物にはCloudflare PagesのURLのみを使用する。
5. **公開更新はGitHub経由。** ローカル変更を`main`へプッシュすると自動デプロイされる。開催状況だけを変える場合はGitHub上の`status.txt`を編集する。

## 7. 次に進める順番

1. 2026年の正式な開催資料とLP本文を突合して修正する。
2. 来場者・職員の運用先をCloudflare Pagesの正式URLへ一本化する。
3. 配布する最終URLでQRコードを保存し、印刷前に実機で読み取る。
4. 開催前に「通常開催」「ステージ中止」「全体中止」「開催前」を切り替えるリハーサルを行う。
