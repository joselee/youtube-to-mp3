## Setup:
* git clone
* npm install


## Usage:

#### Download single video to mp3
node download -v "*videoUrl*"

*--or--*

node download --video "*videoUrl*"

#### Download entire playlist to mp3s
node download -p "*playlistUrl*"

*--or--*

node download -playlist "*playlistUrl*"


## Notes:
* Repository comes with its own 64-bit windows ffmpeg encoder. Linux and Mac users will need to get ffmeg on their own, and tweak download.js
* quote marks are necessary for the URL

## License:
MIT