const fs = require("fs");
const path = require("path");
const url = require("url");
const ytpl = require("ytpl");
const ytInfo = require("youtube-info");
const YoutubeMp3Downloader = require("youtube-mp3-downloader");
const argv = require("yargs")
    .option('playlist', { alias: 'p' })
    .option('video', { alias: 'v' })
    .option('index', { alias: 'i' }).argv;

const ffmpegPath = path.resolve(__dirname, "ffmpeg", "ffmpeg.exe");
const outputPath = path.resolve(__dirname, "tracks");
if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath);
}

const illegalChars = [
    { original: `\\`, replacement: `.` },
    { original: `/`, replacement: `.` },
    { original: `*`, replacement: `'` },
    { original: `:`, replacement: `-` },
    { original: `?`, replacement: ` ` },
    { original: `"`, replacement: `'` },
    { original: `<`, replacement: `(` },
    { original: `>`, replacement: `)` },
    { original: `|`, replacement: `-` }
];

const YD = new YoutubeMp3Downloader({
    "ffmpegPath": ffmpegPath,
    "outputPath": outputPath,
    "youtubeVideoQuality": "highest",
    "queueParallelism": 5,
    "progressTimeout": 5000
});

YD.on("progress", data => { });
YD.on("error", error => console.log(error));
YD.on("finished", (err, data) => console.log(`Finished (${data.videoId}) ${data.videoTitle}`));

const download = (video, index) => {
    if (index && index < 10) {
        index = `0${index}`;
    }

    let title = index ? `${index} - ${video.title}.mp3` : `${video.title}.mp3`;
    illegalChars.forEach(c => title = title.split(c.original).join(c.replacement));
    YD.download(video.id, title);
};

if (argv.playlist) {
    const playlistId = url.parse(argv.playlist, true).query.list;
    ytpl(playlistId, (err, playlist) => {
        if (err) throw err;

        for (const [index, video] of playlist.items.entries()) {
            download(video.id, index);
        }
    });
}

if (argv.video) {
    const videoId = url.parse(argv.video, true).query.v;
    ytInfo(videoId.toString()).then(v => download({ id: videoId, title: v.title }, argv.index));
}