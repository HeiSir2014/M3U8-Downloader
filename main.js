const os = require('os')
const { app, BrowserWindow, Tray, ipcMain, shell,Menu,dialog } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const { Parser } = require('m3u8-parser');
const fs = require('fs');
const async = require('async');
const dateFormat = require('dateformat');
const download = require('download');
const crypto = require('crypto');
const got = require('got');
const { Readable} = require('stream');
const ffmpeg = require('fluent-ffmpeg');
const package_self = require('./package.json');
const appInfo = package_self;
const winston = require('winston');
const nconf = require('nconf');
const { dir } = require('console');

let isdelts = true;
let mainWindow = null;
let playerWindow = null;
let tray = null;
let AppTitle = 'HLS Downloader'
let firstHide = true;

var configVideos = [];
let globalCond ={};
const globalConfigDir = app.getPath('userData');
const globalConfigPath = path.join(globalConfigDir,'config.json');
const globalConfigVideoPath = path.join(globalConfigDir,'config_videos.json');

const httpTimeout = {socket: 300000, request: 300000, response:300000};

const referer = `https://tools.heisir.cn/M3U8Soft-Client?v=${package_self.version}`;

const logger = winston.createLogger({
	level: 'debug',
	format: winston.format.simple(),
	transports: [
		new winston.transports.Console(),
		new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
		new winston.transports.File({ filename: 'logs/combined.log' }),
	],
});

if(!fs.existsSync(globalConfigDir))
{
	fs.mkdirSync(globalConfigDir, { recursive: true });
}

nconf.argv().env()
try {
	nconf.file({ file: globalConfigPath })
} catch (error) {
	logger.error('Please correct the mistakes in your configuration file: [%s].\n' + error, configFilePath)
}


process.on('uncaughtException',logger.error);
process.on('unhandledRejection',logger.error);

logger.info(`\n\n----- ${appInfo.name} | v${appInfo.version} | ${os.platform()} -----\n\n`)

function createWindow() {
	// 创建浏览器窗口
	mainWindow = new BrowserWindow({
		width: 1024,
		height: 600,
		skipTaskbar: false,
		transparent: false, frame: false, resizable: true,
		webPreferences: {
			nodeIntegration: true,
			spellcheck: false
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
function createPlayerWindow(src) {
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
			logger.info('playerWindow close.')
			playerWindow = null;
		})
	}
	// 加载index.html文件
	playerWindow.loadFile(path.join(__dirname, 'player.html'),{search:"src="+src});
}

async function checkUpdate(){
	//const { body } =await got("https://raw.githubusercontent.com/HeiSir2014/M3U8-Downloader/master/package.json").catch(logger.error);
	
	const { body } =await got("https://tools.heisir.cn/HLSDownload/package.json").catch(logger.error);
	if(body != '')
	{
		try {
			let _package = JSON.parse(body);
			if(_package.version != package_self.version)
			{
				if(dialog.showMessageBoxSync(mainWindow,{type:'question',buttons:["Yes","No"],message:`检测到新版本(${_package.version})，是否要打开升级页面，下载最新版`}) == 0)
				{
					shell.openExternal("https://tools.heisir.cn/HLSDownload/");
					
					return;
				}
			}
		} catch (error) {
			logger.error(error);
		}
	}
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
        configVideos = JSON.parse(fs.readFileSync(globalConfigVideoPath));
    } catch (error) {
		logger.error(error);
	}

	//百度统计代码
	(async ()=>{

		try {

			checkUpdate();

			setInterval(checkUpdate,600000);

			let HMACCOUNT = nconf.get('HMACCOUNT');
			if(!HMACCOUNT) HMACCOUNT = '';
			const {headers} = await got("http://hm.baidu.com/hm.js?300991eff395036b1ba22ae155143ff3",{headers:{"Referer": referer,"Cookie":"HMACCOUNT="+HMACCOUNT}});
			try {
				HMACCOUNT = headers['set-cookie'] && headers['set-cookie'][0].match(/HMACCOUNT=(.*?);/i)[1];
				if(HMACCOUNT)
				{
					nconf.set('HMACCOUNT',HMACCOUNT);
					nconf.save(logger.error);
				}
				// fs.writeFileSync('tongji.ini',HMACCOUNT,{encoding:"utf-8",flag:"w"})
			} catch (error_) {
				logger.error(error_)
			}
			logger.info(HMACCOUNT);
			await got(`http://hm.baidu.com/hm.gif?hca=${HMACCOUNT}&cc=1&ck=1&cl=24-bit&ds=1920x1080&vl=977&ep=6621%2C1598&et=3&ja=0&ln=zh-cn&lo=0&lt=${(new Date().getTime()/1000)}&rnd=0&si=300991eff395036b1ba22ae155143ff3&v=1.2.74&lv=3&sn=0&r=0&ww=1920&u=${encodeURIComponent(referer)}`,{headers:{"Referer": referer,"Cookie":"HMACCOUNT="+HMACCOUNT}});
			await got(`http://hm.baidu.com/hm.gif?cc=1&ck=1&cl=24-bit&ds=1920x1080&vl=977&et=0&ja=0&ln=zh-cn&lo=0&rnd=0&si=300991eff395036b1ba22ae155143ff3&v=1.2.74&lv=1&sn=0&r=0&ww=1920&ct=!!&tt=M3U8Soft-Client`,{headers:{"Referer": referer,"Cookie":"HMACCOUNT="+HMACCOUNT}});
			
			logger.info("call baidu-tong-ji end.");
		} catch (error) {
			logger.error(error)
		}
	
	})();
});

// 当全部窗口关闭时退出。
app.on('window-all-closed', async () => {

	let HMACCOUNT = nconf.get('HMACCOUNT');
	// if(fs.existsSync('tongji.ini'))
	// {
	// 	HMACCOUNT = fs.readFileSync('tongji.ini',{encoding:"utf-8",flag:"r"});
	// }
	await got(`http://hm.baidu.com/hm.gif?cc=1&ck=1&cl=24-bit&ds=1920x1080&vl=977&et=0&ja=0&ln=zh-cn&lo=0&rnd=0&si=300991eff395036b1ba22ae155143ff3&v=1.2.74&lv=1&sn=0&r=0&ww=1920&ct=!!&tt=M3U8Soft-Client`,{headers:{"Referer": referer,"Cookie":"HMACCOUNT="+HMACCOUNT}});
	
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
				iconType :null,
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

ipcMain.on('task-add', async function (event, arg, headers) {
	logger.info(arg);
	let hlsSrc = arg;
	let _headers = {};
	if(headers != '')
	{
		let __ = headers.match(/(.*?): ?(.*?)(\n|\r|$)/g);
		__ && __.forEach((_)=>{
			let ___ = _.match(/(.*?): ?(.*?)(\n|\r|$)/i);
			___ && (_headers[___[1]] = ___[2]);
		});
	}

	let mes = hlsSrc.match(/^https?:\/\/[^/]*/);
	let _hosts = '';
	if(mes && mes.length >= 1)
	{
		_hosts = mes[0];
	}

	if(_headers['Origin'] == null && _headers['origin'] == null)
	{
		_headers['Origin'] = _hosts;
	}
	if(_headers['Referer'] == null && _headers['referer'] == null)
	{
		_headers['Referer'] = _hosts;
	}

	const response = await got(hlsSrc,{headers:_headers,timeout:httpTimeout}).catch(logger.error);
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
					startDownload(hlsSrc,_headers);
				}
				else {
					info = `直播资源解析成功，即将开始缓存...`;
					startDownloadLive(hlsSrc,_headers);
				}
			}
		}
		event.sender.send('task-add-reply', { code: code, message: info });
	}
});

class QueueObject {
	constructor() {
		this.segment = null;
		this.url = '';
		this.headers = '';
		this.id = 0;
		this.idx = 0;
		this.dir = '';
		this.then = this.catch = null;
	}
	async callback( _callback ) {
		try{
			if(!globalCond[this.id])
			{
				
				logger.debug(`globalCond[this.id] is not exsited.`);
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

			logger.debug(`2 ${segment.uri}`,`${filename}`);

			//检测文件是否存在
			for (let index = 0; index < 3 && !fs.existsSync(filpath); index++) {
				// 下载的时候使用.dl后缀的文件名，下载完成后重命名
				let that = this;
				await download (uri_ts, that.dir, {filename:filename + ".dl",timeout:httpTimeout,headers:that.headers}).catch((err)=>{
					logger.error(err)
					if(fs.existsSync(filpath_dl)) fs.unlinkSync( filpath_dl);
				});

				if(!fs.existsSync(filpath_dl)) continue;
				if( fs.statSync(filpath_dl).size <= 0 )
				{
					fs.unlinkSync(filpath_dl);
				}

				if(segment.key != null && segment.key.method != null)
				{
					//标准解密TS流
					let aes_path = path.join(this.dir, "aes.key" );
					if(!fs.existsSync( aes_path ))
					{
						let key_uri = segment.key.uri;
						if (! /^http.*/.test(segment.key.uri)) {
							key_uri = partent_uri + segment.key.uri;
						}
						else if(/^\/.*/.test(key_uri))
						{
							let mes = this.url.match(/^https?:\/\/[^/]*/);
							if(mes && mes.length >= 1)
							{
								key_uri = mes[0] + segment.key.uri;
							}
							else
							{
								key_uri = partent_uri + segment.key.uri;
							}
						}

						await download (key_uri, that.dir, { filename: "aes.key" ,headers:that.headers,timeout:httpTimeout}).catch(console.error);
					}
					if(fs.existsSync( aes_path ))
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
							
							if(fs.existsSync(filpath_dl))
								fs.unlinkSync(filpath_dl);
							
							that.then && that.then();
						} catch (error) {
							logger.error(error)
							if(fs.existsSync( filpath_dl ))
								fs.unlinkSync(filpath_dl);
						}
						return;
					}
				}
				else
				{
					fs.renameSync(filpath_dl , filpath);
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
		}
		catch(e)
		{
			logger.error(e);
		}
		finally
		{
			_callback();
		}
	}
}

function queue_callback(that,callback)
{
	that.callback(callback);
}

async function startDownload(url, headers = null ,nId = null) {
	let id = nId == null ? new Date().getTime():nId;

	let dir = path.join(app.getAppPath().replace(/resources\\app.asar$/g,""), 'download/'+id);
	logger.info(dir);
	let filesegments = [];

	if(!fs.existsSync(dir))
	{
		fs.mkdirSync(dir, { recursive: true });
	}

	const response = await got(url,{headers:headers,timeout:httpTimeout}).catch(logger.error);
	if(response == null || response.body == null || response.body == '')
	{
		return;
	}
	let parser = new Parser();
	parser.push(response.body);
	parser.end();

	//并发 2 个线程下载
	var tsQueues = async.queue(queue_callback, 2 );

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
		headers:headers,
		videopath:''
	};
	if(nId == null)
	{
		mainWindow.webContents.send('task-notify-create',video);
	}
	globalCond[id] = true;
	let segments = parser.manifest.segments;
	for (let iSeg = 0; iSeg < segments.length; iSeg++) {
		let qo = new QueueObject();
		qo.dir = dir;
		qo.idx = iSeg;
		qo.id = id;
		qo.url = url;
		qo.headers = headers;
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
		logger.info('download success');
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
					video.status = "合成失败，可能是非标准加密视频源，请联系客服定制。"
					mainWindow.webContents.send('task-notify-end',video);
				}
				configVideos.push(video);
				fs.writeFileSync(globalConfigVideoPath,JSON.stringify(configVideos));
			});
			p.on("data",logger.info);
		}
		else{
			video.videopath = outPathMP4;
			video.status = "已完成，未发现本地FFMPEG，不进行合成。"
			mainWindow.webContents.send('task-notify-end',video);
		}
	});
	logger.info("drain over");
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

class FFmpegStreamReadable extends Readable {
	constructor(opt) {
	  super(opt);
	}
	_read() {}
}

async function startDownloadLive(url,headers = null,nId = null) {
	let id = nId == null ? new Date().getTime() : nId;

	let dir = path.join(app.getAppPath().replace(/resources\\app.asar$/g,""), 'download/'+id);
	logger.info(dir);
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
		headers:headers,
		videopath:''
	};
	
	configVideos.push(video);
	fs.writeFileSync(globalConfigVideoPath,JSON.stringify(configVideos));

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
			const response = await got(url,{headers:headers,timeout:httpTimeout}).catch(logger.error);
			if(response == null || response.body == null || response.body == '')
			{
				break;
			}
			let parser = new Parser();
			parser.push(response.body);
			parser.end();
			
			let count_seg = parser.manifest.segments.length;
			let segments = parser.manifest.segments;
			logger.info(`解析到 ${count_seg} 片段`)
			if (count_seg > 0) {
				//开始下载片段的时间，下载完毕后，需要计算下次请求的时间
				let _startTime = new Date();
				let _videoDuration = 0;
				for (let iSeg = 0; iSeg < segments.length; iSeg++) {
					let segment = segments[iSeg];
					if(segmentSet.has(segment.uri))
					{
						continue;
					}
					if(!globalCond[id])
					{
						break;
					}
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

						//let tsStream = await got.get(uri_ts, {responseType:'buffer', timeout:httpTimeout ,headers:headers}).catch(logger.error).body();

						await download (uri_ts, dir, { filename: filename + ".dl", timeout:httpTimeout ,headers:headers}).catch((err)=>{
							logger.error(err)
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
							segmentSet.add(segment.uri);
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
									.on('error', logger.info)
									.on('end', function(){
										video.videopath = outPathMP4;
										video.status = "已完成";
										mainWindow.webContents.send('task-notify-end',video);
										fs.writeFileSync(globalConfigVideoPath,JSON.stringify(configVideos));
									})
									.on('progress', logger.info);
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
			logger.info(error.response.body);
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


function formatTime(duration) {
	let sec = Math.floor(duration % 60).toLocaleString();
	let min = Math.floor(duration / 60 % 60).toLocaleString();
	let hour = Math.floor(duration / 3600 % 60).toLocaleString();
	if (sec.length != 2) sec = '0' + sec;
	if (min.length != 2) min = '0' + min;
	if (hour.length != 2) hour = '0' + hour;
	return hour + ":" + min + ":" + sec;
}


ipcMain.on('delvideo', function (event, id) {
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
					fs.writeFileSync(globalConfigVideoPath,JSON.stringify(configVideos));
				}
				event.sender.send("delvideo-reply",Element);
			} catch (error) {
				logger.error(error)
			}
		}
	});
});

ipcMain.on('opendir', function (event, arg) {
	shell.openExternal(arg);
});

ipcMain.on('playvideo', function (event, arg) {
	createPlayerWindow(arg);
});
ipcMain.on('StartOrStop', function (event, arg) {
	logger.info(arg);
	
	let id = Number.parseInt(arg);
	if(globalCond[id] == null)
	{
		logger.info("不存在此任务")
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
					startDownloadLive(Element.url, Element.headers,id);
				}
				else
				{
					startDownload(Element.url, Element.headers, id);
				}
			}
		});
	}
});

ipcMain.on('setting_isdelts', function (event, arg) {
	isdelts = arg;
});