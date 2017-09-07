Setup:
git clone
npm install

Commands:
node download -v http://www.youtube.com/watch?v=abcdefg (downloads a single video to mp3 format)
node download -p http://www.youtube.com/watch?v=abcdefg&list=123456 (downloads an entire playlist to mp3 format)

Notes:
Repository comes with its own 64-bit windows ffmpeg encoder. Linux and Mac users will need to get ffmeg on their own, and tweak download.js