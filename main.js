"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var _a = require('electron'), app = _a.app, BrowserWindow = _a.BrowserWindow, Tray = _a.Tray, ipcMain = _a.ipcMain, shell = _a.shell, Menu = _a.Menu;
var spawn = require('child_process').spawn;
var path = require('path');
var Parser = require('m3u8-parser').Parser;
var HTTPPlus = require('./HTTPPlus');
var fs = require('fs');
var async = require('async');
var dateFormat = require('dateformat');
var download = require('download');
var AES = require("crypto-js/aes");
var crypto = require('crypto');
var isdelts = true;
var mainWindow = null;
var playerWindow = null;
var tray = null;
var AppTitle = 'HLS Downloader';
var firstHide = true;
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
    //mainWindow.openDevTools();
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
    tray.setToolTip(AppTitle);
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
ipcMain.on("hide-windows", function () {
    if (mainWindow != null) {
        mainWindow.hide();
        if (firstHide && tray) {
            tray.displayBalloon({
                iconType: 'info',
                title: "温馨提示",
                content: "我隐藏到这里了哦，双击我显示主窗口！"
            });
            firstHide = false;
        }
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
var QueueObject = /** @class */ (function () {
    function QueueObject() {
        this.then = this["catch"] = null;
    }
    QueueObject.prototype.callback = function (_callback) {
        return __awaiter(this, void 0, void 0, function () {
            var partent_uri, segment, uri_ts, filename, filpath, _loop_1, this_1, index, state_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        partent_uri = this.url.replace(/([^\/]*\?.*$)|([^\/]*$)/g, '');
                        segment = this.segment;
                        uri_ts = '';
                        if (/^http.*/.test(segment.uri)) {
                            uri_ts = segment.uri;
                        }
                        else {
                            uri_ts = partent_uri + segment.uri;
                        }
                        filename = ((this.idx + 1) + '').padStart(6, '0') + ".ts";
                        filpath = path.join(this.dir, filename);
                        console.log("2 " + segment.uri, "" + filename);
                        _loop_1 = function (index) {
                            var that_1;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        if (!!fs.existsSync(filpath)) return [3 /*break*/, 2];
                                        that_1 = this_1;
                                        return [4 /*yield*/, download(uri_ts, that_1.dir, { filename: filename + ".dl" }).then(function () { return __awaiter(_this, void 0, void 0, function () {
                                                var key_uri;
                                                return __generator(this, function (_a) {
                                                    switch (_a.label) {
                                                        case 0:
                                                            if (!(segment.key != null && segment.key.method != null)) return [3 /*break*/, 2];
                                                            key_uri = segment.key.uri;
                                                            if (!/^http.*/.test(segment.key.uri)) {
                                                                key_uri = partent_uri + segment.key.uri;
                                                            }
                                                            return [4 /*yield*/, download(key_uri, that_1.dir, { filename: "aes.key" }).then(function () {
                                                                    var key_ = fs.readFileSync(path.join(that_1.dir, "aes.key"));
                                                                    var iv_ = Buffer.from(segment.key.iv.buffer);
                                                                    var cipher = crypto.createCipheriv((segment.key.method + "-cbc").toLowerCase(), key_, iv_);
                                                                    var input = fs.createReadStream(path.join(that_1.dir, filename + ".dl"));
                                                                    var output = fs.createWriteStream(path.join(that_1.dir, filename));
                                                                    input.pipe(cipher).pipe(output);
                                                                })["catch"](function (err_) {
                                                                    console.error(err_);
                                                                    console.log('download key error');
                                                                })];
                                                        case 1:
                                                            _a.sent();
                                                            fs.unlinkSync(filpath + ".dl");
                                                            return [3 /*break*/, 3];
                                                        case 2:
                                                            fs.renameSync(filpath + ".dl", filpath);
                                                            _a.label = 3;
                                                        case 3: return [2 /*return*/];
                                                    }
                                                });
                                            }); })["catch"](function () {
                                                try {
                                                    fs.unlinkSync(filpath + ".dl");
                                                }
                                                catch (derror) {
                                                    console.log(derror);
                                                }
                                            })];
                                    case 1:
                                        _a.sent();
                                        _a.label = 2;
                                    case 2:
                                        if (fs.existsSync(filpath)) {
                                            return [2 /*return*/, "break"];
                                        }
                                        return [2 /*return*/];
                                }
                            });
                        };
                        this_1 = this;
                        index = 0;
                        _a.label = 1;
                    case 1:
                        if (!(index < 3)) return [3 /*break*/, 4];
                        return [5 /*yield**/, _loop_1(index)];
                    case 2:
                        state_1 = _a.sent();
                        if (state_1 === "break")
                            return [3 /*break*/, 4];
                        _a.label = 3;
                    case 3:
                        index++;
                        return [3 /*break*/, 1];
                    case 4:
                        if (fs.existsSync(filpath)) {
                            this.then && this.then();
                        }
                        else {
                            this["catch"] && this["catch"]();
                        }
                        _callback();
                        return [2 /*return*/];
                }
            });
        });
    };
    return QueueObject;
}());
function queue_callback(that, callback) {
    that.callback(callback);
}
function startDownload(url, parser) {
    var id = new Date().getTime();
    var dir = path.join(app.getAppPath().replace(/resources\\app.asar$/g, ""), 'download/' + id);
    console.log(dir);
    var filesegments = [];
    fs.mkdirSync(dir, { recursive: true });
    //并发 3 个线程下载
    var tsQueues = async.queue(queue_callback, 3);
    var count_seg = parser.manifest.segments.length;
    var count_downloaded = 0;
    var video = {
        id: id,
        url: url,
        dir: dir,
        segment_total: count_seg,
        segment_downloaded: count_downloaded,
        time: dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"),
        status: '初始化...',
        videopath: ''
    };
    mainWindow.webContents.send('task-notify-create', video);
    var segments = parser.manifest.segments;
    for (var iSeg = 0; iSeg < segments.length; iSeg++) {
        var qo = new QueueObject();
        qo.dir = dir;
        qo.idx = iSeg;
        qo.url = url;
        qo.segment = segments[iSeg];
        qo.then = function () {
            count_downloaded = count_downloaded + 1;
            video.segment_downloaded = count_downloaded;
            video.status = "\u4E0B\u8F7D\u4E2D..." + count_downloaded + "/" + count_seg;
            mainWindow.webContents.send('task-notify-update', video);
        };
        tsQueues.push(qo);
    }
    tsQueues.drain(function () {
        console.log('download success');
        video.status = "已完成，合并中...";
        mainWindow.webContents.send('task-notify-end', video);
        var indexData = '';
        for (var iSeg = 0; iSeg < segments.length; iSeg++) {
            var filpath = path.join(dir, ((iSeg + 1) + '').padStart(6, '0') + ".ts");
            indexData += "file '" + filpath + "'\r\n";
            filesegments.push(filpath);
        }
        fs.writeFileSync(path.join(dir, 'index.txt'), indexData);
        var outPathMP4 = path.join(dir, id + '.mp4');
        var ffmpegBin = path.join(app.getAppPath().replace(/resources\\app.asar$/g, ""), "ffmpeg.exe");
        if (!fs.existsSync(ffmpegBin)) {
            ffmpegBin = path.join(app.getAppPath().replace(/resources\\app.asar$/g, ""), "ffmpeg");
        }
        if (fs.existsSync(ffmpegBin)) {
            var p = spawn(ffmpegBin, ["-f", "concat", "-safe", "0", "-i", "" + path.join(dir, 'index.txt'), "-c", "copy", "" + outPathMP4]);
            p.on("close", function () {
                if (fs.existsSync(outPathMP4)) {
                    video.videopath = outPathMP4;
                    video.status = "已完成";
                    mainWindow.webContents.send('task-notify-end', video);
                    if (isdelts) {
                        var index_path = path.join(dir, 'index.txt');
                        if (fs.existsSync(index_path)) {
                            fs.unlinkSync(index_path);
                        }
                        filesegments.forEach(function (fileseg) {
                            if (fs.existsSync(fileseg)) {
                                fs.unlinkSync(fileseg);
                            }
                        });
                    }
                }
                else {
                    video.videopath = outPathMP4;
                    video.status = "合成失败，可能是非标准加密视频源，暂不支持。";
                    mainWindow.webContents.send('task-notify-end', video);
                }
                configVideos.push(video);
                fs.writeFileSync("config.data", JSON.stringify(configVideos));
            });
        }
        else {
            video.videopath = outPathMP4;
            video.status = "已完成，未发现本地FFMPEG，不进行合成。";
            mainWindow.webContents.send('task-notify-end', video);
        }
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
