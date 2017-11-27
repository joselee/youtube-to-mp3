const fs = require("fs");
const os = require("os");
const util = require("util");
const EventEmitter = require("events").EventEmitter;
const ffmpeg = require("fluent-ffmpeg");
const ytdl = require("ytdl-core");
const async = require("async");
const progress = require("progress-stream");

function Downloader(options) {
    let self = this;
    self.youtubeBaseUrl = "http://www.youtube.com/watch?v=";
    self.outputPath = options.outputPath || (os.platform() === "win32" ? "C:/Windows/Temp" : "/tmp");
    self.queueParallelism = options.queueParallelism || 5;
    self.illegalChars = [
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

    ffmpeg.setFfmpegPath(options.ffmpegPath);

    //Async download/transcode queue
    self.downloadQueue = async.queue(function (videoInfo, callback) {
        self.emit("queueSize", self.downloadQueue.running() + self.downloadQueue.length());
        self.performDownload(videoInfo, function (err, result) {
            callback(err, result);
        });
    }, self.queueParallelism);
}

util.inherits(Downloader, EventEmitter);

Downloader.prototype.cleanFileName = function (fileName) {
    let self = this;
    self.illegalChars.forEach(c => fileName = fileName.split(c.original).join(c.replacement));
    return fileName;
};

Downloader.prototype.download = function (videoInfo) {
    let self = this;
    self.downloadQueue.push(videoInfo, function (err, data) {
        let emitMsg = err ? "error" : "finished";
        self.emit("queueSize", self.downloadQueue.running() + self.downloadQueue.length());
        self.emit(emitMsg, err, data);
    });
};

Downloader.prototype.performDownload = function (videoInfo, callback) {
    let self = this;
    let videoUrl = self.youtubeBaseUrl + videoInfo.videoId;
    let resultObj = { videoId: videoInfo.videoId };

    ytdl.getInfo(videoUrl, { quality: self.youtubeVideoQuality }, function (err, info) {
        if (err) {
            callback(err.message, resultObj);
        } else {
            let videoTitle = self.cleanFileName(info.title);
            let fileName = `${self.outputPath}/${videoTitle}.mp3`;
            resultObj.videoTitle = videoTitle;

            //Stream setup
            let stream = ytdl.downloadFromInfo(info, {
                quality: "highest",
                requestOptions: { maxRedirects: 5 }
            });

            stream.on("response", (httpResponse) => {
                //Setup of progress module
                let str = progress({
                    length: parseInt(httpResponse.headers["content-length"]),
                    time: 1000
                });

                //Add progress event listener
                str.on("progress", (progress) => {
                    self.emit("progress", { videoId: videoInfo.videoId, progress: progress })
                });

                //Start encoding
                let encoding = new ffmpeg({ source: stream.pipe(str)});
                encoding.audioBitrate(info.formats[0].audioBitrate);
                encoding.withAudioCodec("libmp3lame");
                encoding.toFormat("mp3");
                encoding.outputOptions("-id3v2_version", "3");
                encoding.outputOptions("-metadata", "title=" + videoTitle);
                if (videoInfo.index) {
                    encoding.outputOptions("-metadata", "track=" + videoInfo.index);
                }
                encoding.on("error", (err) => callback(err.message, null));
                encoding.on("end", () => callback(null, resultObj));
                encoding.saveToFile(fileName);
            });
        }
    });
};
module.exports = Downloader;
