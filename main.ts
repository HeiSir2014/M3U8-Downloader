import { resolve } from "dns";
import { rejects } from "assert";

const { app, BrowserWindow, Tray, ipcMain, shell,Menu } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const { Parser } = require('m3u8-parser');
const fs = require('fs');
var async = require('async');
const dateFormat = require('dateformat');
const download = require('download');
const crypto = require('crypto');
const got = require('got');
const { Readable} = require('stream');
const ffmpeg = require('fluent-ffmpeg');

let isdelts = true;
let mainWindow = null;
let playerWindow = null;
let tray = null;
let AppTitle = 'HLS Downloader'
let firstHide = true;

var configVideos = [];
let globalCond ={};

function createWindow() {
	// 创建浏览器窗口
	mainWindow = new BrowserWindow({
		width: 1024,
		height: 600,
		skipTaskbar: false,
		transparent: false, frame: false, resizable: true,
		webPreferences: {
			nodeIntegration: true
		},
		icon: path.join(__dirname, 'icon/logo.png'),
		alwaysOnTop: false,
		hasShadow: false,
	});
	mainWindow.setMenu(null)
	// 加载index.html文件
	mainWindow.loadFile(path.join(__dirname, 'index.html'));
	//mainWindow.openDevTools();
	// 当 window 被关闭，这个事件会被触发。
	mainWindow.on('closed', () => {
		// 取消引用 window 对象，如果你的应用支持多窗口的话，
		// 通常会把多个 window 对象存放在一个数组里面，
		// 与此同时，你应该删除相应的元素。
		mainWindow = null;

	})

	//mainWindow.webContents.openDevTools();
}
function createPlayerWindow(src:string) {
	if(playerWindow == null)
	{
		// 创建浏览器窗口
		playerWindow = new BrowserWindow({
			width: 1024,
			height: 600,
			skipTaskbar: false,
			transparent: false, frame: false, resizable: true,
			webPreferences: {
				nodeIntegration: true
			},
			icon: path.join(__dirname, 'icon/logo.png'),
			alwaysOnTop: false,
			hasShadow: false,
			parent:mainWindow
		});
		playerWindow.setMenu(null)
		playerWindow.on('closed', () => {
			// 取消引用 window 对象，如果你的应用支持多窗口的话，
			// 通常会把多个 window 对象存放在一个数组里面，
			// 与此同时，你应该删除相应的元素。
			console.log('playerWindow close.')
			playerWindow = null;
		})
	}
	// 加载index.html文件
	playerWindow.loadFile(path.join(__dirname, 'player.html'),{search:"src="+src});
}


app.on('ready', () => {
	createWindow();
	tray = new Tray(path.join(__dirname, 'icon/logo.png'))
	tray.setTitle(AppTitle);
	tray.setToolTip(AppTitle);
	tray.on("double-click",()=>{
		mainWindow.show();
	});
	
	tray.on("double-click",()=>{
		mainWindow.show();
	});
	const contextMenu = Menu.buildFromTemplate([
		{ label: '显示窗口', type: 'normal',click:()=>{
			mainWindow.show();
		}},
		{ label: '退出', type: 'normal' ,click:()=>{
			if(playerWindow)
			{
				playerWindow.close();
			}
			mainWindow.close();
			app.quit()
	}}
	  ])
	tray.setContextMenu(contextMenu);
    try {
        configVideos = JSON.parse(fs.readFileSync("config.data"));
    } catch (error) {
        
	}
	
	
});

// 当全部窗口关闭时退出。
app.on('window-all-closed', () => {
	// 在 macOS 上，除非用户用 Cmd + Q 确定地退出，
	// 否则绝大部分应用及其菜单栏会保持激活。
	if (process.platform !== 'darwin') {
		tray = null;
		app.quit();
	};
})

app.on('activate', () => {
	// 在macOS上，当单击dock图标并且没有其他窗口打开时，
	// 通常在应用程序中重新创建一个窗口。
	if (mainWindow === null) {
		createWindow()
	}
})

ipcMain.on("hide-windows",function(){
	if (mainWindow != null) {
		mainWindow.hide();

		if(firstHide && tray)
		{
			tray.displayBalloon({
				iconType :'info',
				title :"温馨提示",
				content :"我隐藏到这里了哦，双击我显示主窗口！"
			})
			firstHide = false;
		}
	}
});

ipcMain.on('get-all-videos', function (event, arg) {

    event.sender.send('get-all-videos-reply', configVideos);
});

ipcMain.on('task-add', async function (event, arg:string) {
	console.log(arg);
	let hlsSrc = arg;

	const response = await got(hlsSrc).catch(console.log);
	{
		let info = '';
		let code = 0;
		code = -1;
		info = '解析资源失败！';
		if (response && response.body != null
			&& response.body != '')
		{
			let parser = new Parser();
			parser.push(response.body);
			parser.end();
			let count_seg = parser.manifest.segments.length;
			if (count_seg > 0) {
				code = 0;
				if (parser.manifest.endList) {
					let duration = 0;
					parser.manifest.segments.forEach(segment => {
						duration += segment.duration;
					});
					info = `点播资源解析成功，有 ${count_seg} 个片段，时长：${formatTime(duration)}，即将开始缓存...`;
					startDownload(hlsSrc);
				}
				else {
					info = `直播资源解析成功，即将开始缓存...`;
					startDownloadLive(hlsSrc);
				}
			}
		}
		event.sender.send('task-add-reply', { code: code, message: info });
	}
});

class QueueObject {
	constructor() {
		this.then = this.catch = null;
	}
	public segment: any;
	public url: string;
	public id: number;
	public idx: number;
	public dir: string;
	public then: Function;
	public catch: Function;
	public async callback( _callback: Function ) {

		if(!globalCond[this.id])
		{
			_callback();
			return;
		}

		let partent_uri = this.url.replace(/([^\/]*\?.*$)|([^\/]*$)/g, '');
		let segment = this.segment;
		let uri_ts = '';
		if (/^http.*/.test(segment.uri)) {
			uri_ts = segment.uri;
		}
		else if(/^\/.*/.test(segment.uri))
		{
			let mes = this.url.match(/^https?:\/\/[^/]*/);
			if(mes && mes.length >= 1)
			{
				uri_ts = mes[0] + segment.uri;
			}
			else
			{
				uri_ts = partent_uri + segment.uri;
			}
		}
		else
		{
			uri_ts = partent_uri + segment.uri;
		}
		let filename = `${ ((this.idx + 1) +'').padStart(6,'0')}.ts`;
		let filpath = path.join(this.dir, filename);
		let filpath_dl = path.join(this.dir, filename+".dl");

		console.log(`2 ${segment.uri}`,`${filename}`);
		//检测文件是否存在
		for (let index = 0; index < 3; index++) {
			if(!fs.existsSync(filpath))
			{
				// 下载的时候使用.dl后缀的文件名，下载完成后重命名
				let that = this;
				await download (uri_ts, that.dir, {filename: filename + ".dl",timeout:30000}).catch((err)=>{
					console.log(err);
					if(fs.existsSync(filpath_dl))
							fs.unlinkSync( filpath_dl);
				});
				if( fs.existsSync(filpath_dl) )
				{
					let stat = fs.statSync(filpath_dl);
					if(stat.size > 0)
					{
						//标准解密TS流
						if(segment.key != null && segment.key.method != null)
						{
							let aes_path = path.join(this.dir, "aes.key" );
							if(!fs.existsSync(aes_path))
							{
								let key_uri = segment.key.uri;
								if (! /^http.*/.test(segment.key.uri)) {
									key_uri = partent_uri + segment.key.uri;
								}
								await download (key_uri, that.dir, { filename: "aes.key" }).catch(console.error);
							}
							if(fs.existsSync(aes_path ))
							{
								try {
									let key_ = fs.readFileSync( aes_path );
									let iv_ = segment.key.iv != null ? Buffer.from(segment.key.iv.buffer)
									:Buffer.from(that.idx.toString(16).padStart(32,'0') ,'hex' );
									let cipher = crypto.createDecipheriv((segment.key.method+"-cbc").toLowerCase(), key_, iv_);
									cipher.on('error', console.error);
									let inputData = fs.readFileSync( filpath_dl );
									let outputData =Buffer.concat([cipher.update(inputData),cipher.final()]);
									fs.writeFileSync(filpath,outputData);
									
									fs.unlinkSync(filpath_dl);
									
									that.then && that.then();
									_callback();
									return;
								} catch (error) {
									console.error(error);
									fs.unlinkSync(filpath_dl);
								}
							}
						}
						else
						{
							fs.renameSync(filpath_dl,filpath);
						}
					}
					else{
						fs.unlinkSync(filpath_dl);
					}
				}
			}
			if(fs.existsSync(filpath))
			{
				break;
			}
		}
		if(fs.existsSync(filpath))
		{
			this.then && this.then();
		}
		else
		{
			this.catch && this.catch();
		}
		_callback();
	}
}

function queue_callback(that:QueueObject,callback:Function)
{
	that.callback(callback);
}

async function startDownload(url:string, nId:number = null) {
	let id = nId == null ? new Date().getTime():nId;

	let dir = path.join(app.getAppPath().replace(/resources\\app.asar$/g,""), 'download/'+id);
	console.log(dir);
	let filesegments = [];

	if(!fs.existsSync(dir))
	{
		fs.mkdirSync(dir, { recursive: true });
	}

	const response = await got(url).catch(console.log);
	if(response == null || response.body == null || response.body == '')
	{
		return;
	}
	let parser = new Parser();
	parser.push(response.body);
	parser.end();

	//并发 6 个线程下载
	var tsQueues = async.queue(queue_callback, 6 );

	let count_seg = parser.manifest.segments.length;
	let count_downloaded = 0;
	var video = {
		id:id,
		url:url,
		dir:dir,
		segment_total:count_seg,
		segment_downloaded:count_downloaded,
		time: dateFormat(new Date(),"yyyy-mm-dd HH:MM:ss"),
		status:'初始化...',
		isLiving:false,
		videopath:''
	};
	if(nId == null)
	{
		mainWindow.webContents.send('task-notify-create',video);
	}

	let segments = parser.manifest.segments;
	for (let iSeg = 0; iSeg < segments.length; iSeg++) {
		let qo = new QueueObject();
		qo.dir = dir;
		qo.idx = iSeg;
		qo.id = id;
		qo.url = url;
		qo.segment = segments[iSeg];
		qo.then = function(){
			count_downloaded = count_downloaded + 1
			video.segment_downloaded = count_downloaded;
			video.status = `下载中...${count_downloaded}/${count_seg}`
			mainWindow.webContents.send('task-notify-update',video);
		};
		tsQueues.push(qo);
	}
	tsQueues.drain(()=>{
		console.log('download success');
		video.status = "已完成，合并中..."
		mainWindow.webContents.send('task-notify-end',video);
		let indexData = '';
		
		for (let iSeg = 0; iSeg < segments.length; iSeg++) {
			let filpath = path.join(dir, `${ ((iSeg + 1) +'').padStart(6,'0') }.ts`);
			indexData += `file '${filpath}'\r\n`;
			filesegments.push(filpath);
		}
		fs.writeFileSync(path.join(dir,'index.txt'),indexData);
		let outPathMP4 = path.join(dir,id+'.mp4');
		let ffmpegBin = path.join(app.getAppPath().replace(/resources\\app.asar$/g,""),"ffmpeg.exe");
		if(!fs.existsSync(ffmpegBin))
		{
			ffmpegBin = path.join(app.getAppPath().replace(/resources\\app.asar$/g,""),"ffmpeg");
		}
		if(fs.existsSync(ffmpegBin))
		{
			var p = spawn(ffmpegBin,["-f","concat","-safe","0","-i",`${path.join(dir,'index.txt')}`,"-c","copy","-f","mp4",`${outPathMP4}`]);
			p.on("close",()=>{
				if(fs.existsSync(outPathMP4))
				{
					video.videopath = outPathMP4;
					video.status = "已完成"
					mainWindow.webContents.send('task-notify-end',video);

					if(isdelts)
					{
						let index_path = path.join(dir,'index.txt');
						if(fs.existsSync(index_path))
						{
							fs.unlinkSync(index_path);
						}
						filesegments.forEach(fileseg=>{
							if(fs.existsSync(fileseg))
							{
								fs.unlinkSync(fileseg);
							}
						});
					}
				}
				else
				{
					video.videopath = outPathMP4;
					video.status = "合成失败，可能是非标准加密视频源，暂不支持。"
					mainWindow.webContents.send('task-notify-end',video);
				}
				configVideos.push(video);
				fs.writeFileSync("config.data",JSON.stringify(configVideos));
			});
			p.on("data",console.log);
		}
		else{
			video.videopath = outPathMP4;
			video.status = "已完成，未发现本地FFMPEG，不进行合成。"
			mainWindow.webContents.send('task-notify-end',video);
		}
	});
	console.log("drain over");
}

function sleep(ms:number) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

class FFmpegStreamReadable extends Readable {
	constructor(opt:any) {
	  super(opt);
	}
	_read() {}
}

async function startDownloadLive(url:string,nId:number = null) {
	let id = nId == null ? new Date().getTime() : nId;

	let dir = path.join(app.getAppPath().replace(/resources\\app.asar$/g,""), 'download/'+id);
	console.log(dir);
	if(!fs.existsSync(dir))
	{
		fs.mkdirSync(dir, { recursive: true });
	}

	let count_downloaded = 0;
	let count_seg = 100;
	var video = {
		id:id,
		url:url,
		dir:dir,
		segment_total:count_seg,
		segment_downloaded:count_downloaded,
		time: dateFormat(new Date(),"yyyy-mm-dd HH:MM:ss"),
		status:'初始化...',
		isLiving:true,
		videopath:''
	};
	
	configVideos.push(video);
	fs.writeFileSync("config.data",JSON.stringify(configVideos));

	if(nId == null)
	{
		mainWindow.webContents.send('task-notify-create',video);
	}

	let partent_uri = url.replace(/([^\/]*\?.*$)|([^\/]*$)/g, '');
	let segmentSet = new Set();
	let ffmpegInputStream = null;
	let ffmpegObj = null;
	globalCond[id] = true;
	while (globalCond[id]) {

		try {
			const response = await got(url).catch(console.log);
			if(response == null || response.body == null || response.body == '')
			{
				break;
			}
			let parser = new Parser();
			parser.push(response.body);
			parser.end();
			
			let count_seg = parser.manifest.segments.length;
			let segments = parser.manifest.segments;
			console.log(`解析到 ${count_seg} 片段`)
			if (count_seg > 0) {
				let find = false;
				//开始下载片段的时间，下载完毕后，需要计算下次请求的时间
				let _startTime = new Date();
				let _videoDuration = 0;
				for (let iSeg = 0; iSeg < segments.length; iSeg++) {
					let segment = segments[iSeg];
					if(find == false && segmentSet.has(segment.uri))
					{
						continue;
					}
					else if(find == false)
					{
						find = true;
					}
					if(!globalCond[id])
					{
						break;
					}
					segmentSet.add(segment.uri);
					_videoDuration = _videoDuration + segment.duration*1000;
					let uri_ts = '';
					if (/^http.*/.test(segment.uri)) {
						uri_ts = segment.uri;
					}
					else if(/^\/.*/.test(segment.uri))
					{
						let mes = url.match(/^https?:\/\/[^/]*/);
						if(mes && mes.length >= 1)
						{
							uri_ts = mes[0] + segment.uri;
						}
						else
						{
							uri_ts = partent_uri + segment.uri;
						}
					}
					else
					{
						uri_ts = partent_uri + segment.uri;
					}
					
					let filename = `${ ((count_downloaded + 1) +'').padStart(6,'0') }.ts`;
					let filpath = path.join(dir, filename);
					let filpath_dl = path.join(dir, filename+".dl");

					for (let index = 0; index < 3; index++) {
						if(!globalCond[id])
						{
							break;
						}
						await download (uri_ts, dir, { filename: filename + ".dl", timeout:30000 }).catch((err:any)=>{
							console.log(err);
							if(fs.existsSync( filpath_dl ))
							{
								fs.unlinkSync( filpath_dl );
							}
						});
						if( fs.existsSync(filpath_dl) )
						{
							let stat = fs.statSync(filpath_dl);
							if(stat.size > 0)
							{
								fs.renameSync(filpath_dl,filpath);
							}
							else
							{
								fs.unlinkSync( filpath_dl);
							}
						}
						if( fs.existsSync(filpath) )
						{
							if(ffmpegObj == null)
							{
								let outPathMP4 = path.join(dir,id+'.mp4');
								let newid = id;
								//不要覆盖之前下载的直播内容
								while(fs.existsSync(outPathMP4))
								{
									outPathMP4  = path.join(dir,newid+'.mp4');
									newid = newid + 1;
								}
								let ffmpegBin = path.join(app.getAppPath().replace(/resources\\app.asar$/g,""),"ffmpeg.exe");
								if(!fs.existsSync(ffmpegBin))
								{
									ffmpegBin = path.join(app.getAppPath().replace(/resources\\app.asar$/g,""),"ffmpeg");
								}
								if(fs.existsSync(ffmpegBin))
								{
									ffmpegInputStream = new FFmpegStreamReadable(null);

									ffmpegObj = new ffmpeg(ffmpegInputStream)
									.setFfmpegPath(ffmpegBin)
									.videoCodec('copy')
									.audioCodec('copy')
									.save(outPathMP4)
									.on('error', console.log)
									.on('end', function(){
										video.videopath = outPathMP4;
										video.status = "已完成";
										mainWindow.webContents.send('task-notify-end',video);
										fs.writeFileSync("config.data",JSON.stringify(configVideos));
									})
									.on('progress', console.log);
								}
								else{
									video.videopath = outPathMP4;
									video.status = "已完成，未发现本地FFMPEG，不进行合成。"
									mainWindow.webContents.send('task-notify-update',video);
								}
							}

							if(ffmpegInputStream)
							{
								ffmpegInputStream.push(fs.readFileSync(filpath));
								fs.unlinkSync( filpath );
							}

							//fs.appendFileSync(path.join(dir,'index.txt'),`file '${filpath}'\r\n`);
							count_downloaded = count_downloaded + 1;
							video.segment_downloaded = count_downloaded;
							video.status = `直播中... [${count_downloaded}]`;
							mainWindow.webContents.send('task-notify-update',video);
							break;
						}
					}
				}
				if(globalCond[id])
				{
					//使下次下载M3U8时间提前1秒钟。
					_videoDuration = _videoDuration - 1000;
					let _downloadTime = (new Date().getTime() - _startTime.getTime());
					if(_downloadTime < _videoDuration)
					{
						await sleep(_videoDuration - _downloadTime);
					}
				}
			}
			else
			{
				break;
			}
			parser = null;
		}
		catch (error)
		{
			console.log(error.response.body);
		}
	}
	if(ffmpegInputStream)
	{
		ffmpegInputStream.push(null);
	}

	if(count_downloaded <= 0)
	{
		video.videopath = '';
		video.status = "已完成，下载失败"
		mainWindow.webContents.send('task-notify-end',video);
		return;
	}
}


function formatTime(duration: number) {
	let sec = Math.floor(duration % 60).toLocaleString();
	let min = Math.floor(duration / 60 % 60).toLocaleString();
	let hour = Math.floor(duration / 3600 % 60).toLocaleString();
	if (sec.length != 2) sec = '0' + sec;
	if (min.length != 2) min = '0' + min;
	if (hour.length != 2) hour = '0' + hour;
	return hour + ":" + min + ":" + sec;
}


ipcMain.on('delvideo', function (event, id:string) {
	configVideos.forEach(Element=>{
		if(Element.id==id)
		{
			try {
				if(fs.existsSync(Element.dir)) {
					var files = fs.readdirSync(Element.dir)
					files.forEach(e=>{
						fs.unlinkSync(path.join(Element.dir,e) );
					})
					fs.rmdirSync(Element.dir,{recursive :true})
				} 
				var nIdx = configVideos.indexOf(Element);
				if( nIdx > -1)
				{
					configVideos.splice(nIdx,1);
					fs.writeFileSync("config.data",JSON.stringify(configVideos));
				}
				event.sender.send("delvideo-reply",Element);
			} catch (error) {
				console.log(error)
			}
		}
	});
});

ipcMain.on('opendir', function (event, arg:string) {
	shell.openExternal(arg);
});

ipcMain.on('playvideo', function (event, arg:string) {
	createPlayerWindow(arg);
});
ipcMain.on('StartOrStop', function (event, arg:string) {
	console.log(arg);
	
	let id = Number.parseInt(arg);
	if(globalCond[id] == null)
	{
		console.log("不存在此任务")
		return;
	}
	globalCond[id] = !globalCond[ id];
	if(globalCond[ id] == true)
	{
		configVideos.forEach(Element=>{
			if(Element.id==id)
			{
				if(Element.isLiving == true)
				{
					startDownloadLive(Element.url, id);
				}
				else
				{
					startDownload(Element.url, id);
				}
			}
		});
	}
});

ipcMain.on('setting_isdelts', function (event, arg:boolean) {
	isdelts = arg;
});