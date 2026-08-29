# GitHub + Cloudflare Pages 移行手順

この手順は、現在のGenspark公開版を`https://minamiyamashiro-wakousai.pages.dev`へ移すためのものです。コードは静的ホスティングに対応済みで、`js/config.js`の`MODE`は`auto`のまま使用します。

## 1. GitHubリポジトリを作る

1. GitHubアカウント`minamiyamashirohikari`で新しいリポジトリを作成する。
2. Repository nameは`wakousai`にする。
3. Cloudflare Pagesから取得できる公開範囲に設定する。
4. このフォルダの内容を、フォルダ構成を保ったままリポジトリ直下へ登録する。

リポジトリ直下に`index.html`、`admin.html`、`status.txt`、`css/`、`js/`、`images/`が見える状態にします。これらをさらに別のフォルダで包まないでください。

## 2. Cloudflare Pagesへ接続する

1. CloudflareのPages作成画面からGitHub連携を選ぶ。
2. `minamiyamashirohikari/wakousai`を選ぶ。
3. プロジェクト名を`minamiyamashiro-wakousai`にする。
4. 本番ブランチを`main`にする。
5. フレームワークは静的サイト相当を選び、ビルドコマンドは設定しない。
6. 出力先はリポジトリ直下を使う。
7. デプロイ後、発行されたURLを開く。

Cloudflareの画面名称は更新されることがあります。重要なのは「ビルド不要の静的サイトとして、リポジトリ直下を公開する」ことです。

## 3. 動作確認

次を確認します。

- `https://minamiyamashiro-wakousai.pages.dev/`でLPが表示される。
- チラシ画像が表示される。
- 開催状況が`status.txt`の内容になる。
- ページ下部にQRコードが生成される。
- `https://minamiyamashiro-wakousai.pages.dev/admin.html`を開ける。
- 職員用ページからGitHubの`status.txt`編集画面へ移動できる。

## 4. 開催状況を更新する

リポジトリ直下の`status.txt`で、先頭の`区分:`だけを書き換えます。

```text
区分: 通常開催
見出し:
本文:
担当者: 和光祭実行委員会
更新日時:
```

使用できる区分は`開催前`、`通常開催`、`ステージ中止`、`全体中止`、`終了`です。`見出し`と`本文`を空欄にすると定型文を表示します。保存後、Cloudflareのデプロイ完了を待って公開ページで確認してください。

## 5. 切り替え時の注意

- QRコードは、最終的に使うURLで作り直す。
- Genspark版D1とPages版`status.txt`は連動しない。
- QR配布後は、職員が更新するサイトと来場者が見るサイトをPages版に統一する。
- `minamiyamashiro-wakousai.pages.dev`が取得できない場合は、Cloudflareで取得できたプロジェクト名に合わせて案内URLを変更する。ただしGitHubリポジトリ名は`wakousai`のままでよい。
