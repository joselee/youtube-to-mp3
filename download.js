const fs = require("fs");
const path = require("path");
const url = require("url");
const ytpl = require("ytpl");
const Downloader = require("./Downloader");
const argv = require("yargs")
    .option('playlist', { alias: 'p' })
    .option('video', { alias: 'v' })
    .option('title', { alias: 't' })
    .option('index', { alias: 'i' }).argv;

const outputPath = path.resolve(__dirname, "tracks");
if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath);
}

const downloader = new Downloader({
    ffmpegPath: path.resolve(__dirname, "ffmpeg", "ffmpeg.exe"),
    outputPath: outputPath
});

downloader.on("progress", data => { });
downloader.on("error", error => console.log(error));
downloader.on("finished", (err, data) => console.log(`Finished (${data.videoId}) ${data.videoTitle}`));

if (argv.playlist) {
    const playlistId = url.parse(argv.playlist, true).query.list;
    ytpl(playlistId, (err, playlist) => {
        if (err) throw err;

        for (let [index, video] of playlist.items.entries()) {
            downloader.download({videoId: video.id, index: index + 1});
        }
    });
}

if (argv.video) {
    let videoInfo = {};
    videoInfo.videoId = url.parse(argv.video, true).query.v;
    if (argv.title) {
        videoInfo.title = argv.title;
    }
    if (argv.index) {
        videoInfo.index = argv.index;
    }
    downloader.download(videoInfo);
}