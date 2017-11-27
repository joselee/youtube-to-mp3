const os = require("os");
const EventEmitter = require("events").EventEmitter;
const ffmpeg = require("fluent-ffmpeg");
const ytdl = require("ytdl-core");
const async = require("async");
const progress = require("progress-stream");

class Downloader extends EventEmitter {
    constructor(options) {
        super();
        this.outputPath = options.outputPath || (os.platform() === "win32" ? "C:/Windows/Temp" : "/tmp");
        this.youtubeBaseUrl = "http://www.youtube.com/watch?v=";
        this.illegalChars = [
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

        this.downloadQueue = async.queue((videoInfo, callback) => {
            this.emit("queueSize", this.downloadQueue.running() + this.downloadQueue.length());
            this.fetchAndEncode(videoInfo, (err, result) => callback(err, result));
        }, (options.queueParallelism || 5));
    }


    download(videoInfo) {
        this.downloadQueue.push(videoInfo, (err, data) => {
            let emitMsg = err ? "error" : "finished";
            this.emit("queueSize", this.downloadQueue.running() + this.downloadQueue.length());
            this.emit(emitMsg, err, data);
        });
    }

    cleanFileName(fileName) {
        this.illegalChars.forEach(c => fileName = fileName.split(c.original).join(c.replacement));
        return fileName;
    }

    fetchAndEncode(videoInfo, callback) {
        const videoUrl = this.youtubeBaseUrl + videoInfo.videoId;
        let resultObj = { videoId: videoInfo.videoId };

        ytdl.getInfo(videoUrl, { quality: this.youtubeVideoQuality }, (err, info) => {
            if (err) {
                callback(err.message, resultObj); return;
            }

            const videoTitle = this.cleanFileName(info.title);
            const fileName = `${this.outputPath}/${videoTitle}.mp3`;
            resultObj.videoTitle = videoTitle;

            //Stream setup
            const stream = ytdl.downloadFromInfo(info, {
                quality: "highest",
                requestOptions: { maxRedirects: 5 }
            });

            stream.on("response", (httpResponse) => {
                //Setup of progress module
                const str = progress({
                    length: parseInt(httpResponse.headers["content-length"]),
                    time: 1000
                });

                //Add progress event listener
                str.on("progress", (progress) => {
                    this.emit("progress", { videoId: videoInfo.videoId, progress: progress })
                });

                //Start encoding
                let encoding = new ffmpeg({ source: stream.pipe(str) });
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
        });
    }
}

module.exports = Downloader;
