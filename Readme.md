# docker-mirakurun-epgstation

[Mirakurun](https://github.com/Chinachu/Mirakurun) + [EPGStation](https://github.com/l3tnun/EPGStation) の Docker コンテナ

## 前提条件

- Docker, Docker Compose v2 (`docker compose` コマンド) の導入が必須
- ホスト上の pcscd は停止する
- チューナーのドライバが適切にインストールされていること

## インストール手順

```sh
curl -sf https://raw.githubusercontent.com/l3tnun/docker-mirakurun-epgstation/v3/setup.sh | sh -s
cd docker-mirakurun-epgstation

#チャンネル設定
vim mirakurun/conf/channels.yml

#コメントアウトされている restart や user の設定を適宜変更する
vim docker-compose.yml
```

## 起動

```sh
sudo docker compose up -d
```

## チャンネルスキャン地上波のみ(取得漏れが出る場合もあるので注意)

```sh
curl -X PUT "http://localhost:40772/api/config/channels/scan"
```

mirakurun の EPG 更新を待ってからブラウザで http://DockerHostIP:8888 へアクセスし動作を確認する

## 停止

```sh
sudo docker compose down
```

## 更新

```sh
# mirakurunとdbを更新
sudo docker compose pull
# epgstationを更新
sudo docker compose build --pull
# 最新のイメージを元に起動
sudo docker compose up -d
```

## 設定

### Mirakurun

* ポート番号: 40772

### EPGStation

* ポート番号: 8888
* ポート番号: 8889

### 各種ファイル保存先

* 録画データ

```./recorded```

* サムネイル

```./epgstation/thumbnail```

* 予約情報と HLS 配信時の一時ファイル

```./epgstation/data```

* EPGStation 設定ファイル

```./epgstation/config```

* EPGStation のログ

```./epgstation/logs```

## v2 からの移行について

EPGStation v3 のイメージは linux/amd64 と linux/arm64 のみ対応しており、32bit ARM 環境では利用できません。

v2 からの更新には、次のような手作業が必要です。

- DB のバックアップ(DB イメージを更新する際は、ダンプして復元することを推奨)
- `enc.js` の書き換え(v3 は `enc.js` を ES module として読み込むため、v2 の `require(...)` を使ったものは動作しない)
- `docker-compose.yml` の DB イメージとオプションの変更

手順は [docs/migration.md](docs/migration.md) の「v2 から v3 への移行」を参照してください。

## v1 からの移行について

[docs/migration.md](docs/migration.md) の「v1 から v2 への移行」を参照
