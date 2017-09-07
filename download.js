const fs = require("fs");
const path = require("path");
const url = require("url");
const ytpl = require("ytpl");
const YoutubeMp3Downloader = require("youtube-mp3-downloader");
const argv = require("yargs")
    .option('playlist', { alias: 'p' })
    .option('video', { alias: 'v' }).argv;

const ffmpegPath = path.resolve(__dirname, "ffmpeg", "ffmpeg.exe");
const outputPath = path.resolve(__dirname, "tracks");
if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath);
}

const YD = new YoutubeMp3Downloader({
    "ffmpegPath": ffmpegPath,
    "outputPath": outputPath,
    "youtubeVideoQuality": "highest",
    "queueParallelism": 5,
    "progressTimeout": 5000
});

YD.on("progress", data => {});
YD.on("error", error => console.log(error));
YD.on("finished", (err, data) => console.log(`Finished (${data.videoId}) ${data.videoTitle}`));

const download = (id) => {
    console.log(`Starting download: ${id}`);
    YD.download(id);
};

if(argv.playlist) {
    const playlistId = url.parse(argv.playlist, true).query.list;
    ytpl(playlistId, (err, playlist) => {
        if (err) throw err;

        for(const video of playlist.items) {
            download(video.id);
        }
    });
}

if(argv.video){
    const videoId = url.parse(argv.video, true).query.v;
    download(videoId);
}