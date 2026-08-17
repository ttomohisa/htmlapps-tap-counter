# Tap Counter

[![GitHub Pages](https://github.com/ttomohisa/htmlapps-tap-counter/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/ttomohisa/htmlapps-tap-counter/actions/workflows/deploy-pages.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Single HTML](https://img.shields.io/badge/distribution-single%20HTML-0ea5e9)](https://ttomohisa.github.io/htmlapps-tap-counter/)

[English README](README.md)

人数、在庫、周回、反復回数などを、スマートフォンで素早く数えるためのインストール不要・単一HTMLのタリーカウンターです。複数項目を同時に管理でき、集中モードでは画面の大部分をタップ領域として使えます。

## 🚀 デモ

### [GitHub PagesでTap Counterを開く](https://ttomohisa.github.io/htmlapps-tap-counter/)

インストールやアカウント登録は不要です。カウンター名・数値・設定はブラウザー内に保存され、アプリからサーバーへ送信されません。

[![Tap Counterの画面](assets/screenshot.png)](https://ttomohisa.github.io/htmlapps-tap-counter/)

スマートフォンでは、1つのカウンターに集中して画面の大部分をタップ領域にできます。

[![Tap Counterの集中モード](assets/screenshot-mobile.png)](https://ttomohisa.github.io/htmlapps-tap-counter/)

## 主な機能

- 名前付きカウンターを最大12個まで作成
- カウンターカードの大きな領域をタップして `+1`
- 1つの項目だけを大きく表示する集中モード
- 集中モードでは画面の大部分を `+1` のタップ領域として使用
- `-1` と直前操作のUndo
- カウント、追加、名前変更、リセット、削除などをUndo可能
- 誤操作を防ぐロック
- リセット・削除・全リセット時の確認ダイアログ
- 合計値とカウンター数を常時表示
- 集計結果をコピー、対応ブラウザーでは共有シートを利用
- 対応端末では振動フィードバック
- 対応環境では集中モード中の画面スリープ防止
- LocalStorageへ自動保存
- 1つのHTML内で日本語・英語を切り替え
- PC・スマートフォンの両方に最適化
- 外部ライブラリなし
- SVG faviconをHTML内に埋め込み

## すぐに使う

### Webで使う

[デモを開く](https://ttomohisa.github.io/htmlapps-tap-counter/)だけで利用できます。初回から「カウンター 1」が用意されているため、すぐに数え始められます。

### ダウンロードして使う

1. このリポジトリの [`dist/index.html`](https://github.com/ttomohisa/htmlapps-tap-counter/blob/main/dist/index.html) をダウンロードします。
2. ブラウザーでHTMLを開きます。
3. 基本的なカウント、保存、集中モードはローカルHTMLでも利用できます。

振動や画面スリープ防止はブラウザー・端末の対応状況に依存します。Screen Wake LockはHTTPS環境が必要になる場合があります。

### 自己展開版を使う

`dist/index.self-extract.html` も生成されます。単一HTMLとして配布し、ブラウザー上で通常版を復元できる形式です。

## 使い方

1. カウンターカードの大きな領域をタップすると1増えます。
2. **追加**から「大人」「子供」「車」など別のカウンターを作れます。
3. カードの **集中** を押すと、その項目専用の集中モードになります。
4. 集中モードでは画面中央の大きな領域をタップして数えます。
5. 押し間違えた場合は **元に戻す** を押します。
6. 必要に応じてロックし、持ち運び中などの誤操作を防げます。
7. 終了後は **共有** から集計結果を共有またはコピーできます。

### カウンターの管理

各カード右上のメニューから、名前変更・リセット・削除を行えます。リセットと削除は確認ダイアログを表示し、実行後もUndoで戻せます。

カウンターは最大12個です。最後の1個を削除した場合は、新しい空のカウンターが自動的に用意されます。

### 集中モード

集中モードでは設定や他のカウンターを隠し、スマートフォンを物理的なタリーカウンターのように使えます。

- 画面中央をタップ: `+1`
- **-1**: 1減らす
- **元に戻す**: 直前操作を取り消す
- **ロック**: カウント変更を一時的に無効化
- 左上の戻るボタン: 集中モードを終了

対応環境では、集中モード中にScreen Wake Lockを利用して画面のスリープを防止できます。

### キーボード操作

集中モードでは次のキーボード操作も利用できます。

| キー | 操作 |
| --- | --- |
| `Space` / `Enter` | +1 |
| `-` | -1 |
| `U` | 元に戻す |
| `L` | ロック / ロック解除 |
| `Esc` | 集中モードを終了 |

## GitHub Pagesで公開する

このリポジトリには、単一HTMLをビルド・検証してGitHub Pagesへ自動公開するワークフローが含まれています。

1. リポジトリ名を `htmlapps-tap-counter` としてGitHubへプッシュします。
2. **Settings → Pages → Build and deployment → Source** で **GitHub Actions** を選択します。
3. `main` ブランチへプッシュするか、Actions画面から **Deploy GitHub Pages** を手動実行します。
4. ビルド成功後、`https://ttomohisa.github.io/htmlapps-tap-counter/` で公開されます。

`main` へのプッシュ時には `scripts/check-repository.ps1` が実行され、`dist/index.html` と自己展開版を再生成してから公開します。

## 開発とビルド

```text
.
├─ src/index.template.html          # アプリ本体のテンプレート
├─ app.config.json                  # アプリ名・バージョン・ビルド設定
├─ dependencies.json                # 依存ライブラリ定義（現在は0件）
├─ build-standalone.bat             # Windows用ビルド入口
├─ build-standalone.ps1             # 単一HTML生成
├─ scripts/
│  ├─ check-repository.ps1          # リポジトリ全体の検証
│  ├─ verify-standalone.ps1         # 通常版の検証
│  └─ verify-self-extract.ps1       # 自己展開版の検証
├─ dist/
│  ├─ index.html                    # 通常の単一HTML
│  └─ index.self-extract.html       # 自己展開版
└─ .github/workflows/
   ├─ build-standalone.yml          # Push / Pull Request時のビルド検証
   └─ deploy-pages.yml              # mainからPagesへ自動公開
```

Windowsでは次を実行します。

```bat
build-standalone.bat
```

リポジトリ全体の検証は次のコマンドです。

```powershell
.\scripts\check-repository.ps1
```

ビルド処理は以下を自動で行います。

- `src/index.template.html` から `dist/index.html` を生成
- アプリ設定とビルドマニフェストをHTMLへ埋め込み
- 未置換プレースホルダーを検査
- 外部ランタイムリソース参照がないことを検査
- CSPに `connect-src 'none'` が含まれることを検査
- `dist/index.self-extract.html` を生成
- 自己展開後のHTMLが通常版と一致することを検証

Python、Node.js、npmパッケージは不要です。

## プライバシーと通信防止

Tap Counterはカウント処理をブラウザー内だけで行います。

- カウンター名・数値・設定をLocalStorageへ保存
- アカウント登録なし
- 解析・広告SDK・テレメトリなし
- サーバー側へのカウンターデータ保存なし
- ランタイムの外部通信をCSP `connect-src 'none'` で禁止
- 共有・コピーはユーザーが明示的に操作した場合のみ実行

GitHub Pages版では最初のHTMLを取得する通信は発生しますが、カウンターの内容をアプリが外部へ送信することはありません。

## 制限事項

- LocalStorageを削除すると保存済みのカウンターも消えます。
- プライベートブラウジングなどでは、保存内容が通常より早く削除される場合があります。
- 振動フィードバックはブラウザー・OS・端末によって利用できない場合があります。
- Screen Wake Lockは対応ブラウザーのみ利用でき、HTTPSが必要になる場合があります。
- Web Shareやクリップボードへのコピーはブラウザーの対応状況や権限制限の影響を受けます。
- カウンターは最大12個です。
- Tap Counterは記録値を端末間で同期しません。

## 使用ライブラリ

外部ライブラリは使用していません。HTML、CSS、JavaScriptとブラウザー標準APIだけで実装しています。

利用している主なWeb APIはLocalStorage、Web Share / Clipboard、Vibration、Screen Wake Lockです。各APIは対応している環境でのみ段階的に使用します。

詳細は [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) を確認してください。

## コントリビューション

バグ報告や機能提案はIssueからお願いします。開発への参加方法は [CONTRIBUTING.md](CONTRIBUTING.md) を確認してください。

## ライセンス

Copyright © 2026 ttomohisa

このプロジェクトは [MIT License](LICENSE) で公開されています。
