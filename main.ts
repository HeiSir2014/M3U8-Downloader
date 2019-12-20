import { resolve } from "dns";
import { rejects } from "assert";

const { app, BrowserWindow, Tray, ipcMain, shell,Menu } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const { Parser } = require('m3u8-parser');
const HTTPPlus = require('./HTTPPlus');
const fs = require('fs');
const queue = require('queue');
const dateFormat = require('dateformat');

let isdelts = true;
let mainWindow = null;
let playerWindow = null;
let tray = null;
let AppTitle = 'HLS Downloader'

var configVideos = [];

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

ipcMain.on('get-all-videos', function (event, arg) {

    event.sender.send('get-all-videos-reply', configVideos);
});

ipcMain.on('task-add', function (event, arg:string) {
	console.log(arg);
	let hlsSrc = arg;

	HTTPPlus.httpSend(hlsSrc, 'GET', null, null, function (data, error) {
		let info = '';
		let code = 0;
		code = -1;
		info = '解析资源失败！';
		if (data != null
			&& data != '') {
			let parser = new Parser();
			parser.push(data);
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
				}
				else {
					info = `直播资源解析成功，即将开始缓存...`;
				}
				startDownload(hlsSrc, parser);
			}
		}
		event.sender.send('task-add-reply', { code: code, message: info });

		//fs.writeFileSync('out.json', JSON.stringify(parser));
	});

});



function startDownload(url:string, parser:any) {
	let partent_uri = url.replace(/([^\/]*\?.*$)|([^\/]*$)/g, '');
	let id = new Date().getTime();
	let dir = path.join(app.getAppPath().replace(/resources\\app.asar$/g,""), 'download/'+id);
	console.log(dir);
	let filesegments = [];
	fs.mkdirSync(dir, { recursive: true });
	var q = new queue();
	let count_seg = parser.manifest.segments.length;
	let count_downloaded = 0;
	var video = {
		id:id,
		url:url,
		dir:dir,
		segment_total:count_seg,
		segment_downloaded:count_downloaded,
		time: dateFormat(new Date(),"yyyy-MM-dd HH:mm:ss"),
		status:'初始化...',
		videopath:''
	};
	mainWindow.webContents.send('task-notify-create',video);
	parser.manifest.segments.forEach(segment => {
		console.log(`1 ${segment.uri}`);
		q.push((cb) => {
			let uri_ts = '';
			if (/^http.*/.test(segment.uri)) {
				uri_ts = segment.uri;
			}
			else {
				uri_ts = partent_uri + segment.uri;
			}
			console.log(`2 ${segment.uri}`);
			let filpath = path.join(dir, segment.uri.replace(/(^.*\/)|(\?.*$)/g, ''));
			HTTPPlus.downloadFileSync(uri_ts, filpath, 'GET', null, null, (res_data,error) => {
				console.log(`3 ${segment.uri}`);
				count_downloaded = count_downloaded + 1
				video.segment_downloaded = count_downloaded;
				video.status = `下载中...${count_downloaded}/${count_seg}`
				mainWindow.webContents.send('task-notify-update',video);

				cb(error,res_data);
			});
		});
	});
	q.start(()=>{
		console.log('download success');
		video.status = "已完成，合并中..."
		mainWindow.webContents.send('task-notify-end',video);
		let indexData = '';
		parser.manifest.segments.forEach(segment => {
			let filpath = path.join(dir, segment.uri.replace(/(^.*\/)|(\?.*$)/g, ''));
			indexData += `file '${filpath}'\r\n`;
			filesegments.push(filpath);
		});
		fs.writeFileSync(path.join(dir,'index.txt'),indexData);

		var p = spawn(path.join(app.getAppPath().replace(/resources\\app.asar$/g,""),"ffmpeg"),["-f","concat","-safe","0","-i",`${path.join(dir,'index.txt')}`,"-c","copy",`${path.join(dir,id+'.mp4')}`]);
		p.on("close",()=>{
			video.videopath = path.join(dir,id+'.mp4');
			video.status = "已完成"
			mainWindow.webContents.send('task-notify-end',video);

			if(isdelts)
			{
				fs.unlinkSync(path.join(dir,'index.txt'));
				filesegments.forEach(fileseg=>{
					fs.unlinkSync(fileseg);
				});
			}

			configVideos.push(video);
			fs.writeFileSync("config.data",JSON.stringify(configVideos));
		});
	});
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

ipcMain.on('setting_isdelts', function (event, arg:boolean) {
	isdelts = arg;
});