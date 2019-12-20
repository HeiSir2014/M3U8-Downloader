"use strict";
exports.__esModule = true;
var _a = require('electron'), app = _a.app, BrowserWindow = _a.BrowserWindow, Tray = _a.Tray, ipcMain = _a.ipcMain, shell = _a.shell, Menu = _a.Menu;
var spawn = require('child_process').spawn;
var path = require('path');
var Parser = require('m3u8-parser').Parser;
var HTTPPlus = require('./HTTPPlus');
var fs = require('fs');
var queue = require('queue');
var dateFormat = require('dateformat');
var isdelts = true;
var mainWindow = null;
var playerWindow = null;
var tray = null;
var AppTitle = 'HLS Downloader';
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
        hasShadow: false
    });
    mainWindow.setMenu(null);
    // 加载index.html文件
    mainWindow.loadFile(path.join(__dirname, 'index.html'));
    // 当 window 被关闭，这个事件会被触发。
    mainWindow.on('closed', function () {
        // 取消引用 window 对象，如果你的应用支持多窗口的话，
        // 通常会把多个 window 对象存放在一个数组里面，
        // 与此同时，你应该删除相应的元素。
        mainWindow = null;
    });
    //mainWindow.webContents.openDevTools();
}
function createPlayerWindow(src) {
    if (playerWindow == null) {
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
            parent: mainWindow
        });
        playerWindow.setMenu(null);
        playerWindow.on('closed', function () {
            // 取消引用 window 对象，如果你的应用支持多窗口的话，
            // 通常会把多个 window 对象存放在一个数组里面，
            // 与此同时，你应该删除相应的元素。
            console.log('playerWindow close.');
            playerWindow = null;
        });
    }
    // 加载index.html文件
    playerWindow.loadFile(path.join(__dirname, 'player.html'), { search: "src=" + src });
}
app.on('ready', function () {
    createWindow();
    tray = new Tray(path.join(__dirname, 'icon/logo.png'));
    tray.setTitle(AppTitle);
    tray.on("double-click", function () {
        mainWindow.show();
    });
    tray.on("double-click", function () {
        mainWindow.show();
    });
    var contextMenu = Menu.buildFromTemplate([
        { label: '显示窗口', type: 'normal', click: function () {
                mainWindow.show();
            } },
        { label: '退出', type: 'normal', click: function () {
                if (playerWindow) {
                    playerWindow.close();
                }
                mainWindow.close();
                app.quit();
            } }
    ]);
    tray.setContextMenu(contextMenu);
    try {
        configVideos = JSON.parse(fs.readFileSync("config.data"));
    }
    catch (error) {
    }
});
// 当全部窗口关闭时退出。
app.on('window-all-closed', function () {
    // 在 macOS 上，除非用户用 Cmd + Q 确定地退出，
    // 否则绝大部分应用及其菜单栏会保持激活。
    if (process.platform !== 'darwin') {
        tray = null;
        app.quit();
    }
    ;
});
app.on('activate', function () {
    // 在macOS上，当单击dock图标并且没有其他窗口打开时，
    // 通常在应用程序中重新创建一个窗口。
    if (mainWindow === null) {
        createWindow();
    }
});
ipcMain.on('get-all-videos', function (event, arg) {
    event.sender.send('get-all-videos-reply', configVideos);
});
ipcMain.on('task-add', function (event, arg) {
    console.log(arg);
    var hlsSrc = arg;
    HTTPPlus.httpSend(hlsSrc, 'GET', null, null, function (data, error) {
        var info = '';
        var code = 0;
        code = -1;
        info = '解析资源失败！';
        if (data != null
            && data != '') {
            var parser = new Parser();
            parser.push(data);
            parser.end();
            var count_seg = parser.manifest.segments.length;
            if (count_seg > 0) {
                code = 0;
                if (parser.manifest.endList) {
                    var duration_1 = 0;
                    parser.manifest.segments.forEach(function (segment) {
                        duration_1 += segment.duration;
                    });
                    info = "\u70B9\u64AD\u8D44\u6E90\u89E3\u6790\u6210\u529F\uFF0C\u6709 " + count_seg + " \u4E2A\u7247\u6BB5\uFF0C\u65F6\u957F\uFF1A" + formatTime(duration_1) + "\uFF0C\u5373\u5C06\u5F00\u59CB\u7F13\u5B58...";
                }
                else {
                    info = "\u76F4\u64AD\u8D44\u6E90\u89E3\u6790\u6210\u529F\uFF0C\u5373\u5C06\u5F00\u59CB\u7F13\u5B58...";
                }
                startDownload(hlsSrc, parser);
            }
        }
        event.sender.send('task-add-reply', { code: code, message: info });
        //fs.writeFileSync('out.json', JSON.stringify(parser));
    });
});
function startDownload(url, parser) {
    var partent_uri = url.replace(/([^\/]*\?.*$)|([^\/]*$)/g, '');
    var id = new Date().getTime();
    var dir = path.join(app.getAppPath().replace(/resources\\app.asar$/g, ""), 'download/' + id);
    console.log(dir);
    var filesegments = [];
    fs.mkdirSync(dir, { recursive: true });
    var q = new queue();
    var count_seg = parser.manifest.segments.length;
    var count_downloaded = 0;
    var video = {
        id: id,
        url: url,
        dir: dir,
        segment_total: count_seg,
        segment_downloaded: count_downloaded,
        time: dateFormat(new Date(), "yyyy-MM-dd HH:mm:ss"),
        status: '初始化...',
        videopath: ''
    };
    mainWindow.webContents.send('task-notify-create', video);
    parser.manifest.segments.forEach(function (segment) {
        console.log("1 " + segment.uri);
        q.push(function (cb) {
            var uri_ts = '';
            if (/^http.*/.test(segment.uri)) {
                uri_ts = segment.uri;
            }
            else {
                uri_ts = partent_uri + segment.uri;
            }
            console.log("2 " + segment.uri);
            var filpath = path.join(dir, segment.uri.replace(/(^.*\/)|(\?.*$)/g, ''));
            HTTPPlus.downloadFileSync(uri_ts, filpath, 'GET', null, null, function (res_data, error) {
                console.log("3 " + segment.uri);
                count_downloaded = count_downloaded + 1;
                video.segment_downloaded = count_downloaded;
                video.status = "\u4E0B\u8F7D\u4E2D..." + count_downloaded + "/" + count_seg;
                mainWindow.webContents.send('task-notify-update', video);
                cb(error, res_data);
            });
        });
    });
    q.start(function () {
        console.log('download success');
        video.status = "已完成，合并中...";
        mainWindow.webContents.send('task-notify-end', video);
        var indexData = '';
        parser.manifest.segments.forEach(function (segment) {
            var filpath = path.join(dir, segment.uri.replace(/(^.*\/)|(\?.*$)/g, ''));
            indexData += "file '" + filpath + "'\r\n";
            filesegments.push(filpath);
        });
        fs.writeFileSync(path.join(dir, 'index.txt'), indexData);
        var p = spawn(path.join(app.getAppPath().replace(/resources\\app.asar$/g, ""), "ffmpeg.exe"), ["-f", "concat", "-safe", "0", "-i", "" + path.join(dir, 'index.txt'), "-c", "copy", "" + path.join(dir, id + '.mp4')]);
        p.on("close", function () {
            video.videopath = path.join(dir, id + '.mp4');
            video.status = "已完成";
            mainWindow.webContents.send('task-notify-end', video);
            if (isdelts) {
                fs.unlinkSync(path.join(dir, 'index.txt'));
                filesegments.forEach(function (fileseg) {
                    fs.unlinkSync(fileseg);
                });
            }
            configVideos.push(video);
            fs.writeFileSync("config.data", JSON.stringify(configVideos));
        });
    });
}
function formatTime(duration) {
    var sec = Math.floor(duration % 60).toLocaleString();
    var min = Math.floor(duration / 60 % 60).toLocaleString();
    var hour = Math.floor(duration / 3600 % 60).toLocaleString();
    if (sec.length != 2)
        sec = '0' + sec;
    if (min.length != 2)
        min = '0' + min;
    if (hour.length != 2)
        hour = '0' + hour;
    return hour + ":" + min + ":" + sec;
}
ipcMain.on('delvideo', function (event, id) {
    configVideos.forEach(function (Element) {
        if (Element.id == id) {
            try {
                if (fs.existsSync(Element.dir)) {
                    var files = fs.readdirSync(Element.dir);
                    files.forEach(function (e) {
                        fs.unlinkSync(path.join(Element.dir, e));
                    });
                    fs.rmdirSync(Element.dir, { recursive: true });
                }
                var nIdx = configVideos.indexOf(Element);
                if (nIdx > -1) {
                    configVideos.splice(nIdx, 1);
                    fs.writeFileSync("config.data", JSON.stringify(configVideos));
                }
                event.sender.send("delvideo-reply", Element);
            }
            catch (error) {
                console.log(error);
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
ipcMain.on('setting_isdelts', function (event, arg) {
    isdelts = arg;
});
