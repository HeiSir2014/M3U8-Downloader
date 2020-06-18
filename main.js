"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var fs = require('fs');
var async = require('async');
var dateFormat = require('dateformat');
var download = require('download');
var crypto = require('crypto');
var got = require('got');
var Readable = require('stream').Readable;
var ffmpeg = require('fluent-ffmpeg');
var isdelts = true;
var mainWindow = null;
var playerWindow = null;
var tray = null;
var AppTitle = 'HLS Downloader';
var firstHide = true;
var configVideos = [];
var globalCond = {};
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
    return __awaiter(this, void 0, void 0, function () {
        var hlsSrc, response, info, code, parser, count_seg, duration_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log(arg);
                    hlsSrc = arg;
                    return [4 /*yield*/, got(hlsSrc)["catch"](console.log)];
                case 1:
                    response = _a.sent();
                    {
                        info = '';
                        code = 0;
                        code = -1;
                        info = '解析资源失败！';
                        if (response && response.body != null
                            && response.body != '') {
                            parser = new Parser();
                            parser.push(response.body);
                            parser.end();
                            count_seg = parser.manifest.segments.length;
                            if (count_seg > 0) {
                                code = 0;
                                if (parser.manifest.endList) {
                                    duration_1 = 0;
                                    parser.manifest.segments.forEach(function (segment) {
                                        duration_1 += segment.duration;
                                    });
                                    info = "\u70B9\u64AD\u8D44\u6E90\u89E3\u6790\u6210\u529F\uFF0C\u6709 " + count_seg + " \u4E2A\u7247\u6BB5\uFF0C\u65F6\u957F\uFF1A" + formatTime(duration_1) + "\uFF0C\u5373\u5C06\u5F00\u59CB\u7F13\u5B58...";
                                    startDownload(hlsSrc);
                                }
                                else {
                                    info = "\u76F4\u64AD\u8D44\u6E90\u89E3\u6790\u6210\u529F\uFF0C\u5373\u5C06\u5F00\u59CB\u7F13\u5B58...";
                                    startDownloadLive(hlsSrc);
                                }
                            }
                        }
                        event.sender.send('task-add-reply', { code: code, message: info });
                    }
                    return [2 /*return*/];
            }
        });
    });
});
var QueueObject = /** @class */ (function () {
    function QueueObject() {
        this.then = this["catch"] = null;
    }
    QueueObject.prototype.callback = function (_callback) {
        return __awaiter(this, void 0, void 0, function () {
            var partent_uri, segment, uri_ts, mes, filename, filpath, filpath_dl, index, that, stat, aes_path, key_uri, key_, iv_, cipher, inputData, outputData;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!globalCond[this.id]) {
                            _callback();
                            return [2 /*return*/];
                        }
                        partent_uri = this.url.replace(/([^\/]*\?.*$)|([^\/]*$)/g, '');
                        segment = this.segment;
                        uri_ts = '';
                        if (/^http.*/.test(segment.uri)) {
                            uri_ts = segment.uri;
                        }
                        else if (/^\/.*/.test(segment.uri)) {
                            mes = this.url.match(/^https?:\/\/[^/]*/);
                            if (mes && mes.length >= 1) {
                                uri_ts = mes[0] + segment.uri;
                            }
                            else {
                                uri_ts = partent_uri + segment.uri;
                            }
                        }
                        else {
                            uri_ts = partent_uri + segment.uri;
                        }
                        filename = ((this.idx + 1) + '').padStart(6, '0') + ".ts";
                        filpath = path.join(this.dir, filename);
                        filpath_dl = path.join(this.dir, filename + ".dl");
                        console.log("2 " + segment.uri, "" + filename);
                        index = 0;
                        _a.label = 1;
                    case 1:
                        if (!(index < 3)) return [3 /*break*/, 10];
                        if (!!fs.existsSync(filpath)) return [3 /*break*/, 8];
                        that = this;
                        return [4 /*yield*/, download(uri_ts, that.dir, { filename: filename + ".dl", timeout: 30000 })["catch"](function (err) {
                                console.log(err);
                                if (fs.existsSync(filpath_dl))
                                    fs.unlinkSync(filpath_dl);
                            })];
                    case 2:
                        _a.sent();
                        if (!fs.existsSync(filpath_dl)) return [3 /*break*/, 8];
                        stat = fs.statSync(filpath_dl);
                        if (!(stat.size > 0)) return [3 /*break*/, 7];
                        if (!(segment.key != null && segment.key.method != null)) return [3 /*break*/, 5];
                        aes_path = path.join(this.dir, "aes.key");
                        if (!!fs.existsSync(aes_path)) return [3 /*break*/, 4];
                        key_uri = segment.key.uri;
                        if (!/^http.*/.test(segment.key.uri)) {
                            key_uri = partent_uri + segment.key.uri;
                        }
                        return [4 /*yield*/, download(key_uri, that.dir, { filename: "aes.key" })["catch"](console.error)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        if (fs.existsSync(aes_path)) {
                            try {
                                key_ = fs.readFileSync(aes_path);
                                iv_ = segment.key.iv != null ? Buffer.from(segment.key.iv.buffer)
                                    : Buffer.from(that.idx.toString(16).padStart(32, '0'), 'hex');
                                cipher = crypto.createDecipheriv((segment.key.method + "-cbc").toLowerCase(), key_, iv_);
                                cipher.on('error', console.error);
                                inputData = fs.readFileSync(filpath_dl);
                                outputData = Buffer.concat([cipher.update(inputData), cipher.final()]);
                                fs.writeFileSync(filpath, outputData);
                                fs.unlinkSync(filpath_dl);
                                that.then && that.then();
                                _callback();
                                return [2 /*return*/];
                            }
                            catch (error) {
                                console.error(error);
                                fs.unlinkSync(filpath_dl);
                            }
                        }
                        return [3 /*break*/, 6];
                    case 5:
                        fs.renameSync(filpath_dl, filpath);
                        _a.label = 6;
                    case 6: return [3 /*break*/, 8];
                    case 7:
                        fs.unlinkSync(filpath_dl);
                        _a.label = 8;
                    case 8:
                        if (fs.existsSync(filpath)) {
                            return [3 /*break*/, 10];
                        }
                        _a.label = 9;
                    case 9:
                        index++;
                        return [3 /*break*/, 1];
                    case 10:
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
function startDownload(url, nId) {
    if (nId === void 0) { nId = null; }
    return __awaiter(this, void 0, void 0, function () {
        var id, dir, filesegments, response, parser, tsQueues, count_seg, count_downloaded, video, segments, iSeg, qo;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    id = nId == null ? new Date().getTime() : nId;
                    dir = path.join(app.getAppPath().replace(/resources\\app.asar$/g, ""), 'download/' + id);
                    console.log(dir);
                    filesegments = [];
                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir, { recursive: true });
                    }
                    return [4 /*yield*/, got(url)["catch"](console.log)];
                case 1:
                    response = _a.sent();
                    if (response == null || response.body == null || response.body == '') {
                        return [2 /*return*/];
                    }
                    parser = new Parser();
                    parser.push(response.body);
                    parser.end();
                    tsQueues = async.queue(queue_callback, 6);
                    count_seg = parser.manifest.segments.length;
                    count_downloaded = 0;
                    video = {
                        id: id,
                        url: url,
                        dir: dir,
                        segment_total: count_seg,
                        segment_downloaded: count_downloaded,
                        time: dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"),
                        status: '初始化...',
                        isLiving: false,
                        videopath: ''
                    };
                    if (nId == null) {
                        mainWindow.webContents.send('task-notify-create', video);
                    }
                    segments = parser.manifest.segments;
                    for (iSeg = 0; iSeg < segments.length; iSeg++) {
                        qo = new QueueObject();
                        qo.dir = dir;
                        qo.idx = iSeg;
                        qo.id = id;
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
                            var p = spawn(ffmpegBin, ["-f", "concat", "-safe", "0", "-i", "" + path.join(dir, 'index.txt'), "-c", "copy", "-f", "mp4", "" + outPathMP4]);
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
                            p.on("data", console.log);
                        }
                        else {
                            video.videopath = outPathMP4;
                            video.status = "已完成，未发现本地FFMPEG，不进行合成。";
                            mainWindow.webContents.send('task-notify-end', video);
                        }
                    });
                    console.log("drain over");
                    return [2 /*return*/];
            }
        });
    });
}
function sleep(ms) {
    return new Promise(function (resolve) { return setTimeout(resolve, ms); });
}
var FFmpegStreamReadable = /** @class */ (function (_super) {
    __extends(FFmpegStreamReadable, _super);
    function FFmpegStreamReadable(opt) {
        return _super.call(this, opt) || this;
    }
    FFmpegStreamReadable.prototype._read = function () { };
    return FFmpegStreamReadable;
}(Readable));
function startDownloadLive(url, nId) {
    if (nId === void 0) { nId = null; }
    return __awaiter(this, void 0, void 0, function () {
        var id, dir, count_downloaded, count_seg, video, partent_uri, segmentSet, ffmpegInputStream, ffmpegObj, response, parser, count_seg_1, segments, find, _startTime, _videoDuration, _loop_1, iSeg, state_1, _downloadTime, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    id = nId == null ? new Date().getTime() : nId;
                    dir = path.join(app.getAppPath().replace(/resources\\app.asar$/g, ""), 'download/' + id);
                    console.log(dir);
                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir, { recursive: true });
                    }
                    count_downloaded = 0;
                    count_seg = 100;
                    video = {
                        id: id,
                        url: url,
                        dir: dir,
                        segment_total: count_seg,
                        segment_downloaded: count_downloaded,
                        time: dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"),
                        status: '初始化...',
                        isLiving: true,
                        videopath: ''
                    };
                    configVideos.push(video);
                    fs.writeFileSync("config.data", JSON.stringify(configVideos));
                    if (nId == null) {
                        mainWindow.webContents.send('task-notify-create', video);
                    }
                    partent_uri = url.replace(/([^\/]*\?.*$)|([^\/]*$)/g, '');
                    segmentSet = new Set();
                    ffmpegInputStream = null;
                    ffmpegObj = null;
                    globalCond[id] = true;
                    _a.label = 1;
                case 1:
                    if (!globalCond[id]) return [3 /*break*/, 14];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 12, , 13]);
                    return [4 /*yield*/, got(url)["catch"](console.log)];
                case 3:
                    response = _a.sent();
                    if (response == null || response.body == null || response.body == '') {
                        return [3 /*break*/, 14];
                    }
                    parser = new Parser();
                    parser.push(response.body);
                    parser.end();
                    count_seg_1 = parser.manifest.segments.length;
                    segments = parser.manifest.segments;
                    console.log("\u89E3\u6790\u5230 " + count_seg_1 + " \u7247\u6BB5");
                    if (!(count_seg_1 > 0)) return [3 /*break*/, 10];
                    find = false;
                    _startTime = new Date();
                    _videoDuration = 0;
                    _loop_1 = function (iSeg) {
                        var segment, uri_ts, mes, filename, filpath, filpath_dl, _loop_2, index, state_2;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    segment = segments[iSeg];
                                    if (find == false && segmentSet.has(segment.uri)) {
                                        return [2 /*return*/, "continue"];
                                    }
                                    else if (find == false) {
                                        find = true;
                                    }
                                    if (!globalCond[id]) {
                                        return [2 /*return*/, "break"];
                                    }
                                    segmentSet.add(segment.uri);
                                    _videoDuration = _videoDuration + segment.duration * 1000;
                                    uri_ts = '';
                                    if (/^http.*/.test(segment.uri)) {
                                        uri_ts = segment.uri;
                                    }
                                    else if (/^\/.*/.test(segment.uri)) {
                                        mes = url.match(/^https?:\/\/[^/]*/);
                                        if (mes && mes.length >= 1) {
                                            uri_ts = mes[0] + segment.uri;
                                        }
                                        else {
                                            uri_ts = partent_uri + segment.uri;
                                        }
                                    }
                                    else {
                                        uri_ts = partent_uri + segment.uri;
                                    }
                                    filename = ((count_downloaded + 1) + '').padStart(6, '0') + ".ts";
                                    filpath = path.join(dir, filename);
                                    filpath_dl = path.join(dir, filename + ".dl");
                                    _loop_2 = function (index) {
                                        var stat, outPathMP4_1, newid, ffmpegBin;
                                        return __generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0:
                                                    if (!globalCond[id]) {
                                                        return [2 /*return*/, "break"];
                                                    }
                                                    return [4 /*yield*/, download(uri_ts, dir, { filename: filename + ".dl", timeout: 30000 })["catch"](function (err) {
                                                            console.log(err);
                                                            if (fs.existsSync(filpath_dl)) {
                                                                fs.unlinkSync(filpath_dl);
                                                            }
                                                        })];
                                                case 1:
                                                    _a.sent();
                                                    if (fs.existsSync(filpath_dl)) {
                                                        stat = fs.statSync(filpath_dl);
                                                        if (stat.size > 0) {
                                                            fs.renameSync(filpath_dl, filpath);
                                                        }
                                                        else {
                                                            fs.unlinkSync(filpath_dl);
                                                        }
                                                    }
                                                    if (fs.existsSync(filpath)) {
                                                        if (ffmpegObj == null) {
                                                            outPathMP4_1 = path.join(dir, id + '.mp4');
                                                            newid = id;
                                                            //不要覆盖之前下载的直播内容
                                                            while (fs.existsSync(outPathMP4_1)) {
                                                                outPathMP4_1 = path.join(dir, newid + '.mp4');
                                                                newid = newid + 1;
                                                            }
                                                            ffmpegBin = path.join(app.getAppPath().replace(/resources\\app.asar$/g, ""), "ffmpeg.exe");
                                                            if (!fs.existsSync(ffmpegBin)) {
                                                                ffmpegBin = path.join(app.getAppPath().replace(/resources\\app.asar$/g, ""), "ffmpeg");
                                                            }
                                                            if (fs.existsSync(ffmpegBin)) {
                                                                ffmpegInputStream = new FFmpegStreamReadable(null);
                                                                ffmpegObj = new ffmpeg(ffmpegInputStream)
                                                                    .setFfmpegPath(ffmpegBin)
                                                                    .videoCodec('copy')
                                                                    .audioCodec('copy')
                                                                    .save(outPathMP4_1)
                                                                    .on('error', console.log)
                                                                    .on('end', function () {
                                                                    video.videopath = outPathMP4_1;
                                                                    video.status = "已完成";
                                                                    mainWindow.webContents.send('task-notify-end', video);
                                                                    fs.writeFileSync("config.data", JSON.stringify(configVideos));
                                                                })
                                                                    .on('progress', console.log);
                                                            }
                                                            else {
                                                                video.videopath = outPathMP4_1;
                                                                video.status = "已完成，未发现本地FFMPEG，不进行合成。";
                                                                mainWindow.webContents.send('task-notify-update', video);
                                                            }
                                                        }
                                                        if (ffmpegInputStream) {
                                                            ffmpegInputStream.push(fs.readFileSync(filpath));
                                                            fs.unlinkSync(filpath);
                                                        }
                                                        //fs.appendFileSync(path.join(dir,'index.txt'),`file '${filpath}'\r\n`);
                                                        count_downloaded = count_downloaded + 1;
                                                        video.segment_downloaded = count_downloaded;
                                                        video.status = "\u76F4\u64AD\u4E2D... [" + count_downloaded + "]";
                                                        mainWindow.webContents.send('task-notify-update', video);
                                                        return [2 /*return*/, "break"];
                                                    }
                                                    return [2 /*return*/];
                                            }
                                        });
                                    };
                                    index = 0;
                                    _a.label = 1;
                                case 1:
                                    if (!(index < 3)) return [3 /*break*/, 4];
                                    return [5 /*yield**/, _loop_2(index)];
                                case 2:
                                    state_2 = _a.sent();
                                    if (state_2 === "break")
                                        return [3 /*break*/, 4];
                                    _a.label = 3;
                                case 3:
                                    index++;
                                    return [3 /*break*/, 1];
                                case 4: return [2 /*return*/];
                            }
                        });
                    };
                    iSeg = 0;
                    _a.label = 4;
                case 4:
                    if (!(iSeg < segments.length)) return [3 /*break*/, 7];
                    return [5 /*yield**/, _loop_1(iSeg)];
                case 5:
                    state_1 = _a.sent();
                    if (state_1 === "break")
                        return [3 /*break*/, 7];
                    _a.label = 6;
                case 6:
                    iSeg++;
                    return [3 /*break*/, 4];
                case 7:
                    if (!globalCond[id]) return [3 /*break*/, 9];
                    //使下次下载M3U8时间提前1秒钟。
                    _videoDuration = _videoDuration - 1000;
                    _downloadTime = (new Date().getTime() - _startTime.getTime());
                    if (!(_downloadTime < _videoDuration)) return [3 /*break*/, 9];
                    return [4 /*yield*/, sleep(_videoDuration - _downloadTime)];
                case 8:
                    _a.sent();
                    _a.label = 9;
                case 9: return [3 /*break*/, 11];
                case 10: return [3 /*break*/, 14];
                case 11:
                    parser = null;
                    return [3 /*break*/, 13];
                case 12:
                    error_1 = _a.sent();
                    console.log(error_1.response.body);
                    return [3 /*break*/, 13];
                case 13: return [3 /*break*/, 1];
                case 14:
                    if (ffmpegInputStream) {
                        ffmpegInputStream.push(null);
                    }
                    if (count_downloaded <= 0) {
                        video.videopath = '';
                        video.status = "已完成，下载失败";
                        mainWindow.webContents.send('task-notify-end', video);
                        return [2 /*return*/];
                    }
                    return [2 /*return*/];
            }
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
ipcMain.on('StartOrStop', function (event, arg) {
    console.log(arg);
    var id = Number.parseInt(arg);
    if (globalCond[id] == null) {
        console.log("不存在此任务");
        return;
    }
    globalCond[id] = !globalCond[id];
    if (globalCond[id] == true) {
        configVideos.forEach(function (Element) {
            if (Element.id == id) {
                if (Element.isLiving == true) {
                    startDownloadLive(Element.url, id);
                }
                else {
                    startDownload(Element.url, id);
                }
            }
        });
    }
});
ipcMain.on('setting_isdelts', function (event, arg) {
    isdelts = arg;
});
