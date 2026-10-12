# v2 から v3 への移行

## 1. バックアップ

作業前に次をバックアップしてください。

- DB(`mysql-db` ボリューム。下記のとおりダンプも取ってください)
- `epgstation/config`
- `epgstation/data`

```sh
docker compose up -d mysql
docker compose exec mysql sh -c 'exec mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" --databases epgstation' > epgstation-backup.sql
docker compose down
cp -a epgstation/config epgstation/config.bak
cp -a epgstation/data epgstation/data.bak
```

(MariaDB 11 以降のイメージでは `mysqldump` の代わりに `mariadb-dump` を使ってください。)

## 2. ブランチを v3 に切り替える

```sh
git fetch
git switch v3
```

フォーク等で独自の変更を加えている場合は、v3 ブランチを自分のブランチにマージしてください。

## 3. docker-compose.yml を更新する

`docker-compose-sample.yml` と見比べて `docker-compose.yml` を更新してください。主な変更点は次のとおりです。

- 先頭の `version:` を削除(Docker Compose v2 では不要)
- DB イメージ: `mariadb:10.5` → `mariadb:12.3`、`mysql:8.0` → `mysql:9.7`
- `command:` から `--default-authentication-plugin=mysql_native_password`(MySQL 8.4 以降で廃止)を削除
- `--expire_logs_days=1` を `--binlog_expire_logs_seconds=86400` に置換(MySQL 8.4 以降では `expire_logs_days` が廃止)

### DB の更新について

既存の DB ボリュームのまま DB イメージのメジャーバージョンだけを上げることは推奨しません。

- MySQL は、LTS やバグ修正シリーズを飛ばしたアップグレードができません。8.0 から 9.7 へは直接上げられず、8.0 → 8.4 → 9.x と段階を踏む必要があります。詳細は [MySQL の Upgrade Paths](https://dev.mysql.com/doc/refman/9.7/en/upgrade-paths.html) を参照してください。
- MariaDB 10.5 から 12.3 への更新は、[MariaDB のアップグレードガイド](https://mariadb.com/docs/server/server-management/install-and-upgrade-mariadb/upgrading/)の手順に従ってください。

そのため、手順 1 で取ったダンプから新しいボリュームへ復元する方法を推奨します。

```sh
docker compose down
docker volume ls   # mysql-db ボリューム(<ディレクトリ名>_mysql-db)を確認する
docker volume rm <ディレクトリ名>_mysql-db   # バックアップ済みであることを確認してから実行する
docker compose up -d mysql
# 起動後、ダンプを復元する
docker compose exec -T mysql sh -c 'exec mysql -uroot -p"$MYSQL_ROOT_PASSWORD"' < epgstation-backup.sql
```

(MariaDB 11 以降のイメージでは `mysql` の代わりに `mariadb` を使ってください。)

## 4. enc.js を更新する

v3 は `enc.js` を ES module として読み込みます。v2 の `require(...)` を使ったままの `epgstation/config/enc.js` では、次のエラーになります。

```
require is not defined
```

新しいテンプレートに置き換えてください。

```sh
cp epgstation/config/enc.js epgstation/config/enc.js.v2.bak
cp epgstation/config/enc.js.template epgstation/config/enc.js
```

カスタマイズしている場合は、先頭の `require` を `import` に書き換えても使えます。

```js
// v2
const spawn = require('child_process').spawn;
const execFile = require('child_process').execFile;
// v3
import { execFile, spawn } from 'child_process';
```

新しいテンプレートは ffmpeg 7 以降の進捗表示(`KiB`)にも対応しています。

## 5. config.yml を見直す

`epgstation/config/config.yml.template` と見比べて `epgstation/config/config.yml` を確認してください。v3 で追加された設定はすべて省略可能です。

## 6. イメージをビルドして起動する

```sh
docker compose build --pull
docker compose up -d
```

---

# v1 から v2 への移行

```sh
# DBをマイグレーションするのでいったん終了
docker compose kill epgstation && docker compose rm -f epgstation
# DBを更新するためコンテナに入る
docker compose run --rm --entrypoint sh epgstation
# gitをインストール
apt-get update && apt-get install git
# gitを操作可能にするために設定を変更する
vi .git/config
# [http "https://github.com/"]と書いてある行と次の行を削除
# 最新のv1にして起動するその後起動完了したらCtrl + Cで終了
git pull && git checkout v1 && npm install --no-save && npm run build && npm start
# 下記コマンドでバックアップファイルを作成する
npm run backup config/backup
# コンテナを抜ける
exit
# 別途フォーク等して利用している方に自分のブランチに本リポジトリをマージしてください。
git pull
# ファイルを最新のサンプルファイルと見比べて適宜更新してください。
vim docker-compose.yml
# イメージを更新
docker compose build --pull --no-cache 
# 各種設定を最新のものに追従させて古いjsonは削除する
cp epgstation/config/config.yml.template epgstation/config/config.yml
vim epgstation/config/config.yml
cp epgstation/config/operatorLogConfig.sample.yml epgstation/config/operatorLogConfig.yml
vim epgstation/config/operatorLogConfig.yml
cp epgstation/config/serviceLogConfig.sample.yml epgstation/config/serviceLogConfig.yml
vim epgstation/config/serviceLogConfig.yml
rm -f epgstation/config/*.json
cp epgstation/config/epgUpdaterLogConfig.sample.yml epgstation/config/epgUpdaterLogConfig.yml
# v1の頃のDBのデータを削除
docker compose down -v && docker compose up -d mirakurun mysql
# v1からデータをマイグレーション
docker compose run --rm --entrypoint sh epgstation -c "npm run v1migrate config/backup"
# 起動
docker compose up -d
```
