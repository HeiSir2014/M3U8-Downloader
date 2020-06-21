"use strict";
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const { Readable} = require('stream');
const path = require('path');
const got = require('got');



(async () => {
    const { headers } = await got("https://www.aoxx69.com/video/video-play?id=MIAA-203&type=1&autoplay=0&poster=");
    console.log(headers);
    let cookies = '';
    if(headers['set-cookie'])
    {
        headers['set-cookie'].forEach(cookie => {
            let mes = cookie.match(/^(.*?)=(.*?);/i)
            mes && (cookies += mes[0]);
        });
        console.log(cookies);
    }
    const h = {
        'Origin':'https://www.aoxx69.com',
        'Referer':'https://www.aoxx69.com',
        'cookie':cookies,
    };
    const { body } = await got('https://ssa.aoxx69.com/MIAA-203/MIAA-203.m3u8',{ headers : h });

    //console.log(body);

    //const r  = await got('https://ssa.aoxx69.com/MIAA-203/ts/MIAA-203-2.ts',{ headers:h});

    //console.log(r);
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