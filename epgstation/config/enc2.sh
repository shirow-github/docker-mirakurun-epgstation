#!/bin/bash

## ジャンルによる、画質のチューニング等
genre="その他"
tune="fastdecode,zerolatency"

if [ "$GENRE1" = 0 ]; then
    genre="ニュース・報道"
fi

if [ "$GENRE1" = 1 ]; then
    genre="スポーツ"
fi

if [ "$GENRE1" = 2 ]; then
    genre="情報・ワイドショー"
fi

if [ "$GENRE1" = 3 ]; then
    genre="ドラマ"
fi

if [ "$GENRE1" = 4 ]; then
    genre="音楽"
fi

if [ "$GENRE1" = 5 ]; then
    genre="バラエティ"
fi

if [ "$GENRE1" = 6 ]; then
    genre="映画"
    tune="film"
fi

if [ "$GENRE1" = 7 ]; then
    genre="アニメ・特撮"
    tune="animation"
fi

if [ "$GENRE1" = 8 ]; then
    genre="ドキュメンタリー・教養"
fi

if [ "$GENRE1" = 9 ]; then    
    genre="劇場・公演"
fi

if [ "$GENRE1" = 10 ]; then
    genre="趣味・教育"
fi

if [ "$GENRE1" = 11 ]; then
    genre="福祉"
fi

# 解像度により、エンコードを分ける
mode=$1

# 720p - エンコード
if [ "$mode" = "720p" ]; then
    scale="-2:720"
    bv="2500k"
    ar="48000"
    ba="192k"
fi

# 270p - エンコード
if [ "$mode" = "270p" ]; then
    scale="-2:270"
    bv="350k"
    ar="44100"
    ba="128k"
fi

eval `$FFMPEG -analyzeduration 10M -probesize 32M -dual_mono_mode main -fix_sub_duration \
-i "$INPUT" -threads 0 -vf yadif,scale="$scale" -preset veryfast \
-tune "$tune" -movflags +faststart \
-c:v libx264 -crf 20 -b:v "$bv" -f mp4 \
-c:a aac -ar "$ar" -b:a "$ba" -ac 2 \
-metadata title="$NAME -$mode" -metadata comment="$DESCRIPTION" -metadata genre="$genre" \
"$OUTPUT"`
