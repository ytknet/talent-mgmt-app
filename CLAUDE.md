# CLAUDE.md

このファイルは、リポジトリで作業する際に Claude Code (claude.ai/code) へ guidance を提供します。

## プロジェクト概要

静的HTMLの自己紹介ページ。サーバーやビルドツールは使用しておらず、ブラウザで `index.html` を直接開くだけで動作する。

## ファイル構成

- `index.html` — メインページ（自己紹介コンテンツ＋インラインCSS）
- `images/` — 画像ファイル用ディレクトリ
- `memo.txt` — メモ用ファイル

## スタイルについて

CSSは `index.html` の `<style>` タグ内にインラインで記述している。外部CSSファイルは使用していない。
