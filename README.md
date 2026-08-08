# たまフィット スタッフカレンダー

スタッフが月間・週間・日別の予約を確認し、予約を追加・編集できるモバイル向けPWAです。

## 現在の段階

- 公開版はGoogleカレンダーを正本として、予約の一覧・追加・編集・削除を行う設計です。
- `preview.html` は見た目確認用で、Googleカレンダーを変更しないローカルのテスト予定を表示します。
- `live-preview.html` は実際のGoogleカレンダーを読む確認版です。予約の追加・編集・削除は実データへ反映されます。
- 連携には専用Apps Scriptを一度だけデプロイする必要があります。

## Googleカレンダー連携の初回設定

既存の公開予約用GASとは別に、スタッフカレンダー専用のApps Scriptを作ります。これにより、公開予約・通知・会員台帳の処理へ影響させず、同じGoogleカレンダーだけを操作できます。

1. Google Apps Scriptで新しいプロジェクトを作成します。
2. [gas/Code.gs](gas/Code.gs) の内容をすべて貼り付けます。
3. 右上の「デプロイ」から「新しいデプロイ」を選び、「ウェブアプリ」としてデプロイします。
4. 実行ユーザーは自分、アクセスできるユーザーは匿名アクセスを許可する選択肢（`Anyone` 等）を選びます。初回だけGoogleカレンダーへのアクセスを許可します。
5. 発行された `/exec` URL を [src/config.js](src/config.js) の `GOOGLE_APPS_SCRIPT_URL` に貼り付けます。
6. `npm run build:preview` と `npm test` を実行します。

このスタッフアプリはログインなしで使う仕様です。URLを知る人は予定を読んだり変更したりできるため、スタッフ以外に共有しないでください。`noindex` は検索表示を抑えるだけで、アクセス制限にはなりません。

## サーバー不要のローカル確認

`preview.html` をダブルクリックすると、そのままブラウザで操作確認できます。

実際のGoogleカレンダーを読み込む確認は `live-preview.html` をダブルクリックします。こちらは予約操作も実際のカレンダーへ反映されます。

ソースを変更した場合は、確認版を更新します。

```powershell
npm run build:preview
```

## PWAとしてのローカル起動

ES ModulesとService Workerを使用するため、ファイルを直接開かずHTTPサーバーから起動します。

```powershell
python -m http.server 4173
```

その後、`http://localhost:4173/`を開きます。

## テスト

```powershell
npm test
```

## 公開URL

https://tamafit.github.io/staff-calendar/
