const spawn = require('child_process').spawn;
const execFile = require('child_process').execFile;
const ffmpeg = process.env.FFMPEG;
const ffprobe = process.env.FFPROBE;

const input = process.env.INPUT;
const output = process.env.OUTPUT;
const isDualMono = parseInt(process.env.AUDIOCOMPONENTTYPE, 10) == 2;
const args = ['-y'];

const name = process.env.HALF_WIDTH_NAME;
const desc = process.env.HALF_WIDTH_DESCRIPTION;
const genre1 = process.env.GENRE1;

// ジャンルによる、画質のチューニング等
let genre = 'その他';
let tune = 'fastdecode,zerolatency';

if (genre1 == 0) {
    genre = 'ニュース・報道';
}

if (genre1 == 1) {
    genre = 'スポーツ';
}

if (genre1 == 2) {
    genre = '情報・ワイドショー';
}

if (genre1 == 3) {
    genre = 'ドラマ';
}

if (genre1 == 4) {
    genre = '音楽';
}

if (genre1 == 5) {
    genre = 'バラエティ';
}

if (genre1 == 6) {
    genre = '映画';
    tune = 'film';
}

if (genre1 == 7) {
    genre = 'アニメ・特撮';
    tune = 'animation';
}

if (genre1 == 8) {
    genre = 'ドキュメンタリー・教養';
}

if (genre1 == 9) {
    genre = '劇場・公演';
}

if (genre1 == 10) {
    genre = '趣味・教育';
}

if (genre1 == 11) {
    genre = '福祉';
}

/**
 * 動画長取得関数
 * @param {string} filePath ファイルパス
 * @return number 動画長を返す (秒)
 */
const getDuration = filePath => {
    return new Promise((resolve, reject) => {
        execFile(ffprobe, ['-v', '0', '-show_format', '-of', 'json', filePath], (err, stdout) => {
            if (err) {
                reject(err);

                return;
            }

            try {
                const result = JSON.parse(stdout);
                resolve(parseFloat(result.format.duration));
            } catch (err) {
                reject(err);
            }
        });
    });
};

// 字幕用
Array.prototype.push.apply(args, ['-fix_sub_duration']);

// input 設定
Array.prototype.push.apply(args, ['-i', input]);

// ビデオストリーム設定
Array.prototype.push.apply(args, ['-map', '0:v', '-c:v', 'libx265']);

// オーディオストリーム設定
if (isDualMono) {
    Array.prototype.push.apply(args, [
	'-filter_complex',
	'channelsplit[FL][FR]',
	'-map', '[FL]',
	'-map', '[FR]',
	'-metadata:s:a:0', 'language=jpn',
	'-metadata:s:a:1', 'language=eng'
    ]);
    Array.prototype.push.apply(args, [
	'-c:a', 'aac',
	'-ar', '48000',
	'-b:a', '192k',
	'-ac', '2'
    ]);
} else {
    Array.prototype.push.apply(args, [
	'-map', '0:a',
	'-metadata:s:a:0', 'language=jpn',
	'-metadata:s:a:1', 'language=eng',
	'-c:a', 'aac',
	'-ar', '48000',
	'-b:a', '192k',
	'-ac', '2'
    ]);
}

// 字幕ストリーム設定
Array.prototype.push.apply(args, [
	'-map', '0:s?',
	'-c:s', 'mov_text',
	'-metadata:s:s:0', 'language=jpn'
]);

// 品質設定
Array.prototype.push.apply(args, [
        '-threads', '0',
        '-vf', 'yadif,scale=-2:720',
        '-preset', 'veryfast',
        '-movflags', '+faststart',
        '-crf', '21',
        '-b:v', '1500k',
        '-f', 'mp4',
        '-metadata', 'title=' + name,
        '-metadata', 'comment=' + desc,
        '-metadata', 'genre=' + genre
]);

// 出力ファイル
Array.prototype.push.apply(args, [output]);

(async () => {
    // 進捗計算のために動画の長さを取得
    const duration = await getDuration(input);

    const child = spawn(ffmpeg, args);

    /**
     * エンコード進捗表示用に標準出力に進捗情報を吐き出す
     * 出力する JSON
     * {"type":"progress","percent": 0.8, "log": "view log" }
     */
    child.stderr.on('data', data => {
        let strbyline = String(data).split('\n');
        for (let i = 0; i < strbyline.length; i++) {
            let str = strbyline[i];
            // console.log(strbyline[i]);
            if (str.startsWith('frame')) {
                // 想定log
                // frame= 5159 fps= 11 q=29.0 size=  122624kB time=00:02:51.84 bitrate=5845.8kbits/s dup=19 drop=0 speed=0.372x
                const progress = {};
                const ffmpeg_reg = /frame=\s*(?<frame>\d+)\sfps=\s*(?<fps>\d+(?:\.\d+)?)\sq=\s*(?<q>[+-]?\d+(?:\.\d+)?)\sL?size=\s*(?<size>\d+(?:\.\d+)?)kB\stime=\s*(?<time>\d+[:\.\d+]*)\sbitrate=\s*(?<bitrate>\d+(?:\.\d+)?)kbits\/s(?:\sdup=\s*(?<dup>\d+))?(?:\sdrop=\s*(?<drop>\d+))?\sspeed=\s*(?<speed>\d+(?:\.\d+)?)x/;
                let ffmatch =str.match(ffmpeg_reg);
                /**
                 * match結果
                 * [
                 *   'frame= 5159 fps= 11 q=29.0 size=  122624kB time=00:02:51.84 bitrate=5845.8kbits/s dup=19 drop=0 speed=0.372x',
                 *   '5159',
                 *   '11',
                 *   '29.0',
                 *   '122624',
                 *   '00:02:51.84',
                 *   '5845.8',
                 *   '19',
                 *   '0',
                 *   '0.372',
                 *   index: 0,
                 *   input: 'frame= 5159 fps= 11 q=29.0 size=  122624kB time=00:02:51.84 bitrate=5845.8kbits/s dup=19 drop=0 speed=0.372x    \r',
                 *   groups: [Object: null prototype] {
                 *     frame: '5159',
                 *     fps: '11',
                 *     q: '29.0',
                 *     size: '122624',
                 *     time: '00:02:51.84',
                 *     bitrate: '5845.8',
                 *     dup: '19',
                 *     drop: '0',
                 *     speed: '0.372'
                 *   }
                 * ]
                 */

                // console.log(ffmatch);
                if (ffmatch === null) continue;

                progress['frame'] = parseInt(ffmatch.groups.frame);
                progress['fps'] = parseFloat(ffmatch.groups.fps);
                progress['q'] = parseFloat(ffmatch.groups.q);
                progress['size'] = parseInt(ffmatch.groups.size);
                progress['time'] = ffmatch.groups.time;
                progress['bitrate'] = parseFloat(ffmatch.groups.bitrate);
                progress['dup'] = ffmatch.groups.dup == null ? 0 : parseInt(ffmatch.groups.dup);
                progress['drop'] = ffmatch.groups.drop == null ? 0 : parseInt(ffmatch.groups.drop);
                progress['speed'] = parseFloat(ffmatch.groups.speed);

                let current = 0;
                const times = progress.time.split(':');
                for (let i = 0; i < times.length; i++) {
                    if (i == 0) {
                        current += parseFloat(times[i]) * 3600;
                    } else if (i == 1) {
                        current += parseFloat(times[i]) * 60;
                    } else if (i == 2) {
                        current += parseFloat(times[i]);
                    }
                }

                // 進捗率 1.0 で 100%
                const percent = current / duration;
                const log =
                    'frame= ' +
                    progress.frame +
                    ' fps=' +
                    progress.fps +
                    ' size=' +
                    progress.size +
                    ' time=' +
                    progress.time +
                    ' bitrate=' +
                    progress.bitrate +
                    ' drop=' +
                    progress.drop +
                    ' speed=' +
                    progress.speed;

                console.log(JSON.stringify({ type: 'progress', percent: percent, log: log }));
            }
        }
    });

    child.on('error', err => {
        console.error(err);
        throw new Error(err);
    });

    process.on('SIGINT', () => {
        child.kill('SIGINT');
    });
})();
