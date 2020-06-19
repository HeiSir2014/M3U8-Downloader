"use strict";
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const { Readable} = require('stream');
const path = require('path');
const got = require('got');



(async () => {
    const { body } = await got('http://v.ytsjk.cn/38df87dc4b70456aa2eadde6e713fa38/6a2a090b523d4c9491277a41bb6a2567-dcb98c29eb2d3f032c85e7a6cf2c5b83-sd.m3u8',{headers:{
        'Origin':'http://www.ytsjk.cn',
        'Referer':'http://www.ytsjk.cn',
    }});
    console.log(body);
})();


/*

const dir = 'E:\\Project\\my_project\\M3U8-Downloader\\source\\download\\1592447619950\\';
let inputStream = new Readable();
let _ffmpeg = ffmpeg(inputStream)
.setFfmpegPath('E:\\Project\\my_project\\M3U8-Downloader\\source\\ffmpeg.exe')
.videoCodec('copy')
.audioCodec('copy')
.save("E:\\Project\\my_project\\M3U8-Downloader\\source\\download\\1592447619950\\output.mp4")
.on('progress', function(info) {
    console.log(info);
})
.on('end', function() {
    console.log('done processing input stream');
})
.on('error', function(err) {
    console.log('an error happened: ' + err.message);
});

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

fs.readdir(dir,function(err,files){
    for (let index = 0; index < files.length; index++) {
        const file = files[index];
        if(file.endsWith(".ts"))
        {
            inputStream.push( fs.readFileSync(path.join(dir,file)) );
            //console.log(`file : ${index}`);
        }
    }
    inputStream.push(null);
});

*/