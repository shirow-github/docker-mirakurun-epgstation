const spawn = require('child_process').spawn;
const execFile = require('child_process').execFile;
const ffmpeg = process.env.FFMPEG;
const ffprobe = process.env.FFPROBE;

const input = process.env.INPUT;
const output = process.env.OUTPUT;
const videoHeight = parseInt(process.env.VIDEORESOLUTION, 10);
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

// input 設定
Array.prototype.push.apply(args, ['-i', input]);

// 二ヶ国語放送
if (name.indexOf('[二]') != -1) {
    if (isDualMono) {
	Array.prototype.push.apply(args, [
            '-filter_complex',
            'channelsplit[FL][FR]',
            '-map', '0:v',
            '-map', '[FL]',
            '-map', '[FR]',
            '-metadata:s:a:0', 'language=jpn',
            '-metadata:s:a:1', 'language=eng'
	]);
    } else {
	Array.prototype.push.apply(args, [
	    '-map', '0:0',
	    '-map', '0:1',
	    '-map', '0:2',
	    '-metadata:s:a:0', 'language=jpn',
	    '-metadata:s:a:1', 'language=eng'
	]);
    }
}

// audio dataをコピー
Array.prototype.push.apply(args, ['-c:a', 'aac', '-ar', '48000', '-b:a', '192k', '-ac', '2']);

Array.prototype.push.apply(args, ['-ignore_unknown']);

// その他設定
Array.prototype.push.apply(args, [
	'-threads', '0',
	'-vf', 'yadif,scale=-2:720',
	'-preset', 'veryfast',
	'-tune', tune,
	'-movflags', '+faststart',
	'-c:v', 'libx264',
	'-crf', '20',
	'-b:v', '2500k',
	'-f', 'mp4',
	'-metadata', 'title=' + name,
	'-metadata', 'comment=' + desc,
	'-metadata', 'genre=' + genre,
	output
]);

let str = '';
for (let i of args) {
    str += ` ${i}`;
}
// console.error(str);

(async () => {
    // 進捗計算のために動画の長さを取得
    const duration = await getDuration(input);

    const child = spawn(ffmpeg, args);

    let inputfileinfo = false;
    let outputfileinfo = false;
    let fileinfolog = '';

    /**
     * エンコード進捗表示用に標準出力に進捗情報を吐き出す
     * 出力する JSON
     * {"type":"progress","percent": 0.8, "log": "view log" }
     */
    child.stderr.on('data', data => {
        let strbyline = String(data).split('\n');
        for (let i = 0; i < strbyline.length; i++) {
            let str = strbyline[i].replace(/ \(\[.+?\)/, '');
            // console.log(strbyline[i]);
            if (str.startsWith('frame')) {
                // frame= 2847 fps=0.0 q=-1.0 Lsize=  216432kB time=00:01:35.64 bitrate=18537.1kbits/s speed= 222x
                const progress = {};
                let tmp = (str + ' ').match(/[A-z]*=[A-z,0-9,\s,.,\/,:,-]* /g);
                if (tmp === null) continue;
                for (let j = 0; j < tmp.length; j++) {
                    progress[tmp[j].split('=')[0]] = tmp[j].split('=')[1].replace(/\r/g, '').trim();
                }
                progress['frame'] = parseInt(progress['frame']);
                progress['fps'] = parseFloat(progress['fps']);
                progress['q'] = parseFloat(progress['q']);

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
