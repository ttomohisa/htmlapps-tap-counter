# Tap Counter

[![GitHub Pages](https://github.com/ttomohisa/htmlapps-tap-counter/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/ttomohisa/htmlapps-tap-counter/actions/workflows/deploy-pages.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Single HTML](https://img.shields.io/badge/distribution-single%20HTML-0ea5e9)](https://ttomohisa.github.io/htmlapps-tap-counter/)

[English README](README.md)

スマートフォンで素早く数えるための、インストール不要・単一HTMLのタリーカウンターです。複数項目を同時に管理でき、集中モードでは画面の大部分をタップ領域として使えます。

## 主な機能

- 名前付きカウンターを最大12個
- 大きなカードをタップして +1
- 1つの項目に集中できる全画面風の集中モード
- -1 と直前操作のUndo
- 誤操作を防ぐロック
- リセット・削除時の確認
- 集計結果のコピー、対応ブラウザーでは共有
- 対応端末では振動フィードバック
- 対応環境では集中モード中の画面スリープ防止
- アカウント不要、端末内に自動保存
- 日本語 / English 切替

## すぐに使う

`dist/index.html` を開くか、GitHub Pagesで公開して使えます。初回から「カウンター 1」が用意されているので、すぐに数え始められます。

1. カウンターカードをタップすると1増えます。
2. 「カウンターを追加」で「大人」「子供」「車」など項目を分けられます。
3. 「集中」を開くと、スマホ画面の大部分が +1 のタップ領域になります。
4. 押し間違えたら「元に戻す」で直前の操作を戻せます。
5. 終了後は集計結果をコピーまたは共有できます。

## プライバシー

カウンター名・数値・設定はブラウザー内だけに保存されます。解析、アカウント、サーバー保存、ランタイム通信はありません。コピーや共有はユーザーが明示的に操作したときだけ行われます。

## ブラウザー上の注意

基本的なカウント機能に特別な権限は不要です。振動はブラウザーや端末によって利用できない場合があります。画面スリープ防止は追加機能で、対応ブラウザーではHTTPSが必要になる場合があります。

## ビルド

Windowsで次を実行します。

```bat
build-standalone.bat
```

検証は次のコマンドです。

```powershell
.\scripts\check-repository.ps1
```

生成物：

- `dist/index.html`
- `dist/index.self-extract.html`

## ライセンス

Copyright © 2026 ttomohisa

このプロジェクトは [MIT License](LICENSE) で公開されています。
