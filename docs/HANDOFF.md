# 和光祭LP 引き継ぎメモ

最終確認日: 2026-09-09（Asia/Tokyo）

## 1. 引き継ぎ元

- Genspark共有タスク: `e61e21b1-a544-4200-8d70-ff3564089186`
- 現在の公開サイト: https://minamiyamashiro-wakousai.pages.dev/
- QRコード表示ページ: https://minamiyamashiro-wakousai.pages.dev/#qr-section
- 職員用画面: https://minamiyamashiro-wakousai.pages.dev/admin

このフォルダのファイルは、共有タスクの履歴と現在の公開サイトから回収した現行版です。Genspark上の元プロジェクトにあった移行資料は公開物に含まれていなかったため、`docs/`内の手順書は現行コードに合わせて再作成しました。

## 2. 現在の公開状態

- 来場者向けLPはCloudflare Pagesで公開済み。今年度チラシ表裏の内容へ更新し、固定QRコードは維持している。
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
- 印刷物用QRコード: `images/minamiyamashiro-wakousai-qr.png`（変更禁止。詳細は`docs/QR-CODE-LOCK.md`）
- `js/config.js`のGitHub編集URLは上記リポジトリ名で設定済み。

今後、編集・公開・更新の作業報告では、毎回「公開URL」と「QRコード表示ページ」をセットで提示する。

## 4. 実装構成

- `index.html`: 来場者向けLP。
- `admin.html`: 職員用の開催状況更新画面。
- `js/status-source.js`: ホスト名からデータ取得方式を自動選択する。
- `js/status.js`: 公開ページの開催状況カードと追従バナーを更新する。
- `js/admin.js`: Genspark環境で履歴表示と新規ステータス投稿を行う。静的環境では編集先案内を表示する。
- `js/auth.js`: 職員用画面の簡易ロック。
- `js/qr.js`: 印刷物用の固定QRコードPNGをそのまま表示・保存する。動的生成は行わない。
- `status.txt`: GitHub / Cloudflare Pages運用時の開催状況データ。
- `assets/flyer/`: 今年度チラシ表面・裏面のPDF（LPから閲覧可能）。

`js/config.js`の`MODE`は`auto`。自動判定は次のとおり。

| 公開場所 | モード | 読み取り先 | 更新方法 |
| --- | --- | --- | --- |
| `*.gensparksite.com`等 | `genspark` | `tables/status_updates` | 公開サイトの`admin.html` |
| Cloudflare Pages / GitHub Pages / 独自ドメイン / ローカル | `file` | `status.txt` | GitHub上で`status.txt`を編集 |
| `SHEET_ID`または`CSV_URL`設定時 | `sheet` | GoogleスプレッドシートCSV | スプレッドシートを編集 |

## 5. 検証済み

- 公開サイトの本文と現在の開催状況を確認。
- 現行ファイル一式をローカルHTTPサーバーで読み込み、公開ページと`status.txt`の反映を確認。
- 固定QRコードPNGの表示・ダウンロードを確認。
- 職員用ページの読み込みとGitHub編集リンクを確認。
- 全JavaScriptファイルに対して`node --check`を実行し、構文エラーなし。
- ブラウザコンソールにJavaScriptエラーなし。
- Cloudflare Pagesの本番デプロイ成功、GitHub連携、`main`ブランチ、自動デプロイ有効を確認。
- GitHub Actionsで`scripts/verify-qr-lock.mjs`を自動実行し、固定QRコードの変更を検知する。
- 開催状況カードに`status.txt`の`更新日時`を表示する。区分変更時は更新日時も必ず書き換える。
- モバイルでは横スクロール式のページ内ナビゲーションを表示し、固定の開催状況バーを小型化している。
- 会場アクセスには地下鉄石田駅2番出口から徒歩約10分、京阪バス日野西川頬停留所すぐを掲載している。
- 第11回、開催日は2026年10月17日（土）、開催時間は11:00〜15:30で今年度チラシの確定情報を反映している。
- 出演者・出店者・多目的ホール企画・雨天時の案内を、2026年9月完成の今年度チラシ表裏と照合済み。
- 今年度チラシ内のQRパターンは、固定QR PNGと33×33モジュール全1,089セルが一致している。
- 会場マップ案内は開催状況の直後・ステージイベントの直前に配置し、上部ナビからも移動できる。`assets/maps/wakousai-venue-map.pdf`から開ける。現在のPDFは昨年度参考版で、今年度版完成後もリンクを変えず同名ファイルへ差し替える。
- 本番URLで公開ページ、QRコード、チラシ画像、職員用画面を確認。

## 6. 必ず確認する事項

1. **今年度チラシの内容を反映済み。** 第11回・2026年10月17日、11:00〜15:30、出演者、出店者、多目的ホール企画、雨天時案内、連絡先を表裏PDFと照合している。出店・イベント内容は変更になる可能性があるため、追加の正式連絡があれば更新すること。
2. **公開先ごとに開催状況データが別。** 現在のGenspark版を更新しても`status.txt`は変わらず、Pages版の`status.txt`を更新してもGenspark版D1は変わらない。QR配布後は更新先を一本化すること。
3. **職員用ロックは簡易方式。** 4桁コードはブラウザ側JavaScriptで判定するため、強固な認証ではない。誤操作防止用と考える。
4. **正式運用はCloudflare Pagesへ一本化する。** Genspark版は旧環境として扱い、QRコードや配布物にはCloudflare PagesのURLのみを使用する。
5. **公開更新はGitHub経由。** ローカル変更を`main`へプッシュすると自動デプロイされる。開催状況だけを変える場合はGitHub上の`status.txt`を編集する。
6. **印刷物用QRコードは永久固定。** `docs/QR-CODE-LOCK.md`に記載したURL・PNG・SHA-256を、年度更新を含む通常作業で変更しない。Cloudflare Pagesプロジェクトも改名・削除しない。

## 7. 次に進める順番

1. 今年度版の会場マップ完成後、`assets/maps/wakousai-venue-map.pdf`を同名で差し替える。
2. 来場者・職員の運用先をCloudflare Pagesの正式URLへ一本化する。
3. `images/minamiyamashiro-wakousai-qr.png`を印刷物に使用し、印刷前に実機で読み取る（再生成しない）。
4. 開催前に「通常開催」「雨天・飲食のみ」「全体中止」「開催前」を切り替えるリハーサルを行う。
