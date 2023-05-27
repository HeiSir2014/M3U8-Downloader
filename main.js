const os = require('os')
const {
    app,
    BrowserWindow,
    Tray,
    ipcMain,
    shell,
    Menu,
    dialog,
    screen,
    session,
    nativeImage
} = require('electron');
const isDev = require('electron-is-dev');
const {
    spawn
} = require('child_process');
const path = require('path');
const {
    Parser
} = require('m3u8-parser');
const fs = require('fs');
const async = require('async');
const download = require('download');
const crypto = require('crypto');
const got = require('got');
const {
    Readable
} = require('stream');
const ffmpeg = require('fluent-ffmpeg');
const package_self = require('./package.json');
const appInfo = package_self;
const winston = require('winston');
const nconf = require('nconf');
const ffmpegPath = require('ffmpeg-static').replace(/app.asar[\/\\]{1,2}/g, '');
const contextMenu = require('electron-context-menu');
const Aria2 = require('aria2');
const forever = require('forever-monitor');
const filenamify = require('filenamify');
const {
    HttpProxyAgent,
    HttpsProxyAgent
} = require('hpagent');

contextMenu({
    showCopyImage: false,
    showCopyImageAddress: false,
    showInspectElement: false,
    showServices: false,
    showSearchWithGoogle: false
});

const formatFilename = (url) => {
    var m3u8_filename_matcher = /([^/]+.m3u8)[\?|$]/.exec(url);
    if (m3u8_filename_matcher && m3u8_filename_matcher[1]) {
        return m3u8_filename_matcher[1];
    }
}

const dateFormat = (dt) => {
    return new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().replace(/T|(\.\d+Z)/g, ' ').trim()
}

let isdelts = true;
let mainWindow = null;
let playerWindow = null;
let tray = null;
let AppTitle = 'M3U8-Downloader'
let firstHide = true;

let videoDatas = [];
let globalCond = {};
const pathConfigDir = app.getPath('userData');
const pathConfigFile = path.join(pathConfigDir, 'config.json');
const pathVideoDB = path.join(pathConfigDir, 'config_videos.json');
const aria2Dir = path.join(app.getAppPath(), "static", "aria2", process.platform);
const aria2_app = path.join(aria2Dir, "aria2c.exe");
const aria2_config = path.join(aria2Dir, "aria2.conf");
let aria2Client = null;
let aria2Server = null;
let proxy_agent = null;
let pathDownloadDir;

const httpTimeout = {
    socket: 30000,
    request: 30000,
    response: 60000
};

const referer = `https://tools.heisir.cn/M3U8Soft-Client?v=${package_self.version}`;

function transformConfig(config) {
    const result = []
    for (const [k, v] of Object.entries(config)) {
        if (v !== '') {
            result.push(`--${k}=${v}`)
        }
    }
    return result
}


const logger = winston.createLogger({
    level: 'debug',
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}` + (info.splat !== undefined ? `${info.splat}` : " "))
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({
            filename: path.join(pathConfigDir, 'logs/error.log'),
            level: 'error'
        }),
        new winston.transports.File({
            filename: path.join(pathConfigDir, 'logs/all.log')
        }),
    ],
});

if (!fs.existsSync(pathConfigDir)) {
    fs.mkdirSync(pathConfigDir, {
        recursive: true
    });
}

nconf.argv().env()
try {
    nconf.file({
        file: pathConfigFile
    })
} catch (error) {
    logger.error('Please correct the mistakes in your configuration file: [%s].\n' + error, configFilePath)
}


process.on('uncaughtException', (err, origin) => {
    logger.error(`uncaughtException: ${err} | ${origin}`)
});
process.on('unhandledRejection', (reason, promise) => {
    logger.error(`unhandledRejection: ${promise} | ${reason}`)
});

console.log(`\n\n----- ${appInfo.name} | v${appInfo.version} | ${os.platform()} -----\n\n`)

function createWindow() {
    // 创建浏览器窗口
    let _workAreaSize = screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).workAreaSize;
    mainWindow = new BrowserWindow({
        width: _workAreaSize.width * 0.6,
        height: _workAreaSize.height * 0.7,
        minWidth: 954,
        minHeight: 600,
        center: true,
        frame: (process.platform == 'darwin'),
        resizable: true,
        webPreferences: {
            nodeIntegration: true,
            spellcheck: false,
            contextIsolation: false,
            webviewTag: true
        },
        icon: path.join(__dirname, 'static', 'icon', 'logo.png'),
        alwaysOnTop: false,
        hasShadow: false,
        title: `${AppTitle} ${package_self.version}`
    });
    mainWindow.setMenu(null);
    mainWindow.loadFile(path.join(__dirname, 'static', 'mainFrm.html'));
    isDev && mainWindow.openDevTools();
    mainWindow.on('closed', () => mainWindow = null);
    mainWindow.webContents.on('dom-ready', (e) => {
        e.sender.send('message', {
            version: package_self.version,
            config_save_dir: pathDownloadDir,
            config_ffmpeg: ffmpegPath,
            config_proxy: nconf.get('config_proxy'),
            videoDatas,
            platform: process.platform
        });
        e.sender.setTitle(`${AppTitle} ${package_self.version}`)
    })
    mainWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url);
        return { action: 'deny' };
    });
}

function createPlayerWindow(src) {
    if (playerWindow == null) {
        // 创建浏览器窗口
        let _workAreaSize = screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).workAreaSize;
        playerWindow = new BrowserWindow({
            width: _workAreaSize.width * 0.6,
            height: _workAreaSize.height * 0.7,
            skipTaskbar: false,
            transparent: false,
            frame: (process.platform == 'darwin'),
            resizable: true,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            },
            icon: path.join(__dirname, 'static', 'icon', 'logo.png'),
            alwaysOnTop: false,
            hasShadow: false,
            parent: mainWindow
        });
        playerWindow.setMenu(null)
        playerWindow.on('closed', () => playerWindow = null);
        playerWindow.loadFile(path.join(__dirname, 'static', 'player.html'));
        playerWindow.webContents.on('dom-ready', (e) => {
            e.sender.send('message', {
                platform: process.platform, playsrc: src
            });
        });
        isDev && playerWindow.openDevTools();
        return;
    }
    playerWindow.webContents.send('message', {
        playsrc: src
    });
}

// 9999.9999.9999 > 1.1.1 最高支持4位版本对比。  1.2.1 > 1.2.0   1.3 > 1.2.9999
function str2float(v) {
    let va = v.split('.', 4);
    if (!va) return -1;
    let _r = 0;
    let base = 100000000.0;
    va.forEach(k => _r += (base * k), base /= 10000);
    return _r;
}

let _updateInterval;
async function checkUpdate() {
    const {
        body
    } = await got("https://tools.heisir.cn/HLSDownload/package.json").catch(logger.error);
    if (!body) return;
    try {
        let _package = JSON.parse(body);
        if (str2float(_package.version) <= str2float(package_self.version))
            return;

        _updateInterval && (clearInterval(_updateInterval), _updateInterval = null);

        if (dialog.showMessageBoxSync(mainWindow, {
            type: 'question',
            buttons: ["Yes", "No"],
            message: `检测到新版本(${_package.version})，是否要打开升级页面，下载最新版`
        }) == 0) {
            shell.openExternal("https://tools.heisir.cn/HLSDownload/download.html");
            return;
        }
    } catch (error) {
        logger.error(error);
    }
}

function webRequestReq(details, callback) {
    if (!details.webContentsId || details.webContentsId == mainWindow.webContents.id) {
        callback({ cancel: false }); return
    }
    const id = details.webContentsId;
    if (/http.*\.((mp4)|(m3u8)|(flv)|(mp3)|(mpd)|(wav))(\?|$)/.test(details.url)) {
        let [_null, _type] = details.url.match(/http.*\.((mp4)|(m3u8)|(flv)|(mp3)|(mpd)|(wav))(\?|$)/);

        console.log(details);
        let _item = {
            type: _type.toUpperCase(),
            url: details.url,
            headers: JSON.stringify(details.requestHeaders)
        }
        mainWindow && mainWindow.webContents.send('message', { browserVideoItem: _item })
    }

    callback({ cancel: false });
};

function webRequestRsp(details) {
    if (!details.webContentsId || details.webContentsId == mainWindow.webContents.id) {
        return
    }
    const id = details.webContentsId;
    /http.*\.((mp4)|(m3u8)|(flv)|(mp3)|(mpd)|(wav))(\?|$)/.test(details.url) &&
        console.log("rsp\t" + details.url);
}


app.on('ready', () => {

    // 单例应用程序
    if (!app.requestSingleInstanceLock()) {
        app.quit();
        return
    }
    app.on('second-instance', (event, argv, cwd) => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) {
                mainWindow.restore()
            } else if (mainWindow.isVisible()) {
                mainWindow.focus()
            } else {
                mainWindow.show()
                mainWindow.focus()
            }
        } else {
            app.quit();
        }
    });
    createWindow();
    let iconImg = nativeImage.createFromPath(path.join(__dirname, 'static', 'icon', 'logo.png'));
    tray = new Tray(iconImg.resize({ width: 20, height: 20 }));
    tray.setToolTip(AppTitle);
    tray.on("double-click", () => {
        mainWindow && mainWindow.show();
    });

    const contextMenu = Menu.buildFromTemplate([{
        label: '显示窗口',
        type: 'normal',
        click: () => {
            mainWindow.show();
        }
    },
    {
        type: 'separator'
    },
    {
        label: '退出',
        type: 'normal',
        click: () => {
            aria2Server && aria2Server.stop();
            playerWindow && playerWindow.close();
            mainWindow && mainWindow.close();
            setTimeout(app.quit.bind(app), 1000);
        }
    }
    ]);
    tray.setContextMenu(contextMenu);
    try {
        videoDatas = JSON.parse(fs.readFileSync(pathVideoDB));
    } catch (error) {
        logger.error(error);
    }

    pathDownloadDir = nconf.get('SaveVideoDir');

    const config_proxy = nconf.get('config_proxy');
    let httpProxy = new HttpProxyAgent({
        keepAlive: true,
        keepAliveMsecs: 1000,
        maxSockets: 256,
        maxFreeSockets: 256,
        scheduling: 'lifo',
        proxy: config_proxy
    });
    proxy_agent = config_proxy ? {
        http: httpProxy,
        https: httpProxy
    } : null;

    //session.defaultSession.webRequest.onBeforeRequest(webRequestReq);
    session.defaultSession.webRequest.onBeforeSendHeaders(webRequestReq);
    session.defaultSession.webRequest.onResponseStarted(webRequestRsp);

    //百度统计代码
    false && (async () => {
        try {
            checkUpdate();
            _updateInterval = setInterval(checkUpdate, 600000);

            let HMACCOUNT = nconf.get('HMACCOUNT');
            if (!HMACCOUNT) HMACCOUNT = '';
            const {
                headers
            } = await got("http://hm.baidu.com/hm.js?300991eff395036b1ba22ae155143ff3", {
                headers: {
                    "Referer": referer,
                    "Cookie": "HMACCOUNT=" + HMACCOUNT
                }
            });
            try {
                HMACCOUNT = headers['set-cookie'] && headers['set-cookie'][0].match(/HMACCOUNT=(.*?);/i)[1];
                if (HMACCOUNT) {
                    nconf.set('HMACCOUNT', HMACCOUNT);
                    nconf.save();
                }
            } catch (error_) {
                logger.error(error_)
            }
            await got(`http://hm.baidu.com/hm.gif?hca=${HMACCOUNT}&cc=1&ck=1&cl=24-bit&ds=1920x1080&vl=977&ep=6621%2C1598&et=3&ja=0&ln=zh-cn&lo=0&lt=${(new Date().getTime() / 1000)}&rnd=0&si=300991eff395036b1ba22ae155143ff3&v=1.2.74&lv=3&sn=0&r=0&ww=1920&u=${encodeURIComponent(referer)}`, {
                headers: {
                    "Referer": referer,
                    "Cookie": "HMACCOUNT=" + HMACCOUNT
                }
            });
            await got(`http://hm.baidu.com/hm.gif?cc=1&ck=1&cl=24-bit&ds=1920x1080&vl=977&et=0&ja=0&ln=zh-cn&lo=0&rnd=0&si=300991eff395036b1ba22ae155143ff3&v=1.2.74&lv=1&sn=0&r=0&ww=1920&ct=!!&tt=M3U8Soft-Client`, {
                headers: {
                    "Referer": referer,
                    "Cookie": "HMACCOUNT=" + HMACCOUNT
                }
            });
            logger.info("call baidu-tong-ji end.");
        } catch (error) {
            logger.error(error)
        }
    })();
    return;

    const EMPTY_STRING = '';
    const systemConfig = {
        'all-proxy': EMPTY_STRING,
        'allow-overwrite': false,
        'auto-file-renaming': true,
        'check-certificate': false,
        'continue': false,
        'dir': app.getPath('downloads'),
        'max-concurrent-downloads': 120,
        'max-connection-per-server': 5,
        'max-download-limit': 0,
        'max-overall-download-limit': 0,
        'max-overall-upload-limit': '256K',
        'min-split-size': '1M',
        'no-proxy': EMPTY_STRING,
        'pause': true,
        'rpc-listen-port': 16801,
        'rpc-secret': EMPTY_STRING,
        'seed-ratio': 1,
        'seed-time': 60,
        'split': 10,
        'user-agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.61 Safari/537.36Transmission/2.94'
    }

    let cmds = [aria2_app, `--conf-path=${aria2_config}`];
    cmds = [...cmds, ...transformConfig(systemConfig)];
    logger.debug(cmds.join(' '));

    let instance = forever.start(cmds, {
        max: 10,
        parser: function (command, args) {
            logger.debug(command, args);
            return {
                command: command,
                args: args
            }
        },
        silent: false
    });
    instance.on('start', function (process, data) {
        let aria2 = new Aria2({
            port: 16801
        });
        aria2.open();
        aria2.on('close', (e) => {
            console.log('----aria2 connect close----');
            setTimeout(() => aria2.open(), 100);
        });
        aria2.on("onDownloadComplete", downloadComplete);
        aria2Client = aria2;

        setInterval(() => {
            aria2Client.call('getGlobalStat').then((result) => {
                if (result && result['downloadSpeed']) {
                    var _speed = '';
                    var speed = parseInt(result['downloadSpeed']);
                    _speed = (speed < 1024 * 1024) ? Math.round(speed / 1024) + ' KB/s' : (speed / 1024 / 1024).toFixed(2) + ' MiB/s'
                    mainWindow.webContents.send('message', { downloadSpeed: _speed });
                }
            });
        }, 1500);
    });
    aria2Server = instance;
});

function downloadComplete(e) {
    console.log('---- aria2 downloadComplete ----');
    var gid = e[0]['gid'];

    console.log(gid);
}

// 当全部窗口关闭时退出。
app.on('window-all-closed', async () => {

    console.log('window-all-closed')
    let HMACCOUNT = nconf.get('HMACCOUNT');
    HMACCOUNT && await got(`http://hm.baidu.com/hm.gif?cc=1&ck=1&cl=24-bit&ds=1920x1080&vl=977&et=0&ja=0&ln=zh-cn&lo=0&rnd=0&si=300991eff395036b1ba22ae155143ff3&v=1.2.74&lv=1&sn=0&r=0&ww=1920&ct=!!&tt=M3U8Soft-Client`, {
        headers: {
            "Referer": referer,
            "Cookie": "HMACCOUNT=" + HMACCOUNT
        }
    });

    // 在 macOS 上，除非用户用 Cmd + Q 确定地退出，
    // 否则绝大部分应用及其菜单栏会保持激活。
    if (process.platform !== 'darwin') {
        tray && tray.destroy();
        tray = null;
        app.quit();
    };
})

app.on('activate', () => {
    // 在macOS上，当单击dock图标并且没有其他窗口打开时，
    // 通常在应用程序中重新创建一个窗口。
    if (mainWindow === null) {
        createWindow()
    } else {
        mainWindow.show();
    }
})

ipcMain.on("hide-windows", function () {
    mainWindow && mainWindow.hide(), (firstHide && tray && (tray.displayBalloon({
        icon: path.join(__dirname, 'static', 'icon', 'logo-512.png'),
        title: "提示",
        content: "我隐藏到这里了哦，双击我显示主窗口！"
    }), firstHide = false));
});

ipcMain.on('open-log-dir', function (event, arg) {
    showDirInExploer(path.join(pathConfigDir, 'logs'))
});

ipcMain.on('task-clear', async function (event, object) {
    videoDatas.forEach((video) => {
        globalCond[video.id] = false;
    })
    videoDatas = [];
    fs.writeFileSync(pathVideoDB, JSON.stringify(videoDatas));
});

ipcMain.on('task-add', async function (event, object) {
    logger.info(object);
    let hlsSrc = object.url;
    let _headers = {};
    if (object.headers) {
        let __ = object.headers.match(/(.*?): ?(.*?)(\n|\r|$)/g);
        __ && __.forEach((_) => {
            let ___ = _.match(/(.*?): ?(.*?)(\n|\r|$)/i);
            ___ && (_headers[___[1]] = ___[2]);
        });
    }

    let mes = hlsSrc.match(/^https?:\/\/[^/]*/);
    let _hosts = '';
    if (mes && mes.length >= 1) {
        _hosts = mes[0];

        if (_headers['Origin'] == null && _headers['origin'] == null) {
            _headers['Origin'] = _hosts;
        }
        if (_headers['Referer'] == null && _headers['referer'] == null) {
            _headers['Referer'] = _hosts;
        }
    }

    object.headers = _headers;

    let info = '解析资源失败！';
    let code = -1;

    let parser = new Parser();
    if (/^file:\/\/\//g.test(hlsSrc)) {
        parser.push(fs.readFileSync(hlsSrc.replace(/^file:\/\/\//g, '')));
        parser.end();
    } else {
        for (let index = 0; index < 3; index++) {
            let response = await got(hlsSrc, {
                headers: _headers,
                timeout: httpTimeout,
                agent: proxy_agent
            }).catch(logger.error); {
                if (response && response.body != null &&
                    response.body != '') {
                    parser.push(response.body);
                    parser.end();

                    if (parser.manifest.segments.length == 0 && parser.manifest.playlists && parser.manifest.playlists.length && parser.manifest.playlists.length == 1) {
                        let uri = parser.manifest.playlists[0].uri;
                        if (!uri.startsWith('http')) {
                            hlsSrc = uri[0] == '/' ? (hlsSrc.substr(0, hlsSrc.indexOf('/', 10)) + uri) :
                                (hlsSrc.replace(/\/[^\/]*((\?.*)|$)/, '/') + uri);
                        }
                        else {
                            hlsSrc = uri;
                        }
                        object.url = hlsSrc;
                        parser = new Parser();
                        continue;
                    }
                    break;
                }
            }
        }
    }

    let count_seg = parser.manifest.segments.length;
    if (count_seg > 0) {
        code = 0;
        if (parser.manifest.endList) {
            let duration = 0;
            parser.manifest.segments.forEach(segment => {
                duration += segment.duration;
            });
            info = `点播资源解析成功，有 ${count_seg} 个片段，时长：${formatTime(duration)}，即将开始缓存...`;
            startDownload(object);
        } else {
            info = `直播资源解析成功，即将开始缓存...`;
            startDownloadLive(object);
        }
    } else if (parser.manifest.playlists && parser.manifest.playlists.length && parser.manifest.playlists.length >= 1) {
        code = 1;
        event.sender.send('task-add-reply', {
            code: code,
            message: '',
            playlists: parser.manifest.playlists
        });
        return;
    }
    event.sender.send('task-add-reply', {
        code: code,
        message: info
    });
});


ipcMain.on('task-add-muti', async function (event, object) {
    logger.info(object);
    let m3u8_urls = object.m3u8_urls;
    let _headers = {};
    if (object.headers) {
        let __ = object.headers.match(/(.*?): ?(.*?)(\n|\r|$)/g);
        __ && __.forEach((_) => {
            let ___ = _.match(/(.*?): ?(.*?)(\n|\r|$)/i);
            ___ && (_headers[___[1]] = ___[2]);
        });
    }

    let info = '解析资源失败！';
    let code = -1;
    let iidx = 0;
    m3u8_urls.split(/\r|\n/g).forEach(urls => {
        if (urls != '') {
            let _obj = {
                url: '',
                headers: object.headers,
                myKeyIV: '',
                taskName: '',
                taskIsDelTs: object.taskIsDelTs,
                url_prefix: ''
            };
            if (/-{4}/.test(urls)) {
                let __ = urls.split('----');
                if (__ && __.length >= 2) {
                    if (__[0]) {
                        _obj.url = __[0];
                        if (__[1]) {
                            _obj.taskName = __[1];
                        }
                    }
                }
            } else {
                _obj.url = urls;
            }

            if (_obj.url) {

                let mes = _obj.url.match(/^https?:\/\/[^/]*/);
                let _hosts = '';
                if (mes && mes.length >= 1) {
                    _hosts = mes[0];

                    if (_headers['Origin'] == null && _headers['origin'] == null) {
                        _headers['Origin'] = _hosts;
                    }
                    if (_headers['Referer'] == null && _headers['referer'] == null) {
                        _headers['Referer'] = _hosts;
                    }
                }

                _obj.headers = _headers;

                startDownload(_obj, iidx);
                iidx = iidx + 1;
            }
        }
    })
    info = `批量添加成功，正在下载...`;
    event.sender.send('task-add-reply', {
        code: 0,
        message: info
    });
});

class QueueObject {
    constructor() {
        this.segment = null;
        this.url = '';
        this.url_prefix = '';
        this.headers = '';
        this.myKeyIV = '';
        this.id = 0;
        this.idx = 0;
        this.dir = '';
        this.then = this.catch = null;
        this.retry = 0;
    }
    async callback(_callback) {
        try {
            this.retry = this.retry + 1;
            if (this.retry > 5) {
                this.catch && this.catch();
                return;
            }
            if (!globalCond[this.id]) {
                logger.debug(`globalCond[this.id] is not exsited.`);
                return;
            }

            let partent_uri = this.url.replace(/([^\/]*\?.*$)|([^\/]*$)/g, '');
            let segment = this.segment;
            let uri_ts = '';
            if (/^http.*/.test(segment.uri)) {
                uri_ts = segment.uri;
            } else if (/^http/.test(this.url) && /^\/.*/.test(segment.uri)) {
                let mes = this.url.match(/^https?:\/\/[^/]*/);
                if (mes && mes.length >= 1) {
                    uri_ts = mes[0] + segment.uri;
                } else {
                    uri_ts = partent_uri + (partent_uri.endsWith('/') || segment.uri.startWith('/') ? '' : "/") + segment.uri;
                }
            } else if (/^http.*/.test(this.url)) {
                uri_ts = partent_uri + (partent_uri.endsWith('/') || segment.uri.startWith('/') ? '' : "/") + segment.uri;
            } else if (/^file:\/\/\//.test(this.url) && !this.url_prefix) {
                let fileDir = this.url.replace('file:///', '').replace(/[^\\/]{1,}$/, '');
                uri_ts = path.join(fileDir, segment.uri);
                if (!fs.existsSync(uri_ts)) {
                    var me = segment.uri.match(/[^\\\/\?]{1,}\?|$/i);
                    if (me && me.length > 1) {
                        uri_ts = path.join(fileDir, me[0].replace(/\?$/, ''));
                    }
                    if (!fs.existsSync(uri_ts)) {
                        globalCond[this.id] = false;
                        this.catch && this.catch();
                        return;
                    }
                }
                uri_ts = "file:///" + uri_ts
            } else if (/^file:\/\/\//.test(this.url) && this.url_prefix) {
                uri_ts = this.url_prefix + (this.url_prefix.endsWith('/') || segment.uri.startWith('/') ? '' : "/") + segment.uri;
            }

            let filename = `${((this.idx + 1) + '').padStart(6, '0')}.ts`;
            let filpath = path.join(this.dir, filename);
            let filpath_dl = path.join(this.dir, filename + ".dl");

            logger.debug(`2 ${segment.uri}`, `${filename}`);

            //检测文件是否存在
            for (let index = 0; index < 3 && !fs.existsSync(filpath); index++) {
                // 下载的时候使用.dl后缀的文件名，下载完成后重命名
                let that = this;

                if (/^file:\/\/\//.test(uri_ts)) {
                    fs.copyFileSync(uri_ts.replace(/^file:\/\/\//, ''), filpath_dl);
                } else {

                    var _headers = [];
                    if (that.headers) {
                        for (var _key in that.headers) {
                            _headers.push(_key + ": " + that.headers[_key])
                        }
                    }
                    //aria2Client && aria2Client.call("addUri", [uri_ts], { dir:that.dir, out: filename + ".dl", split: "16", header: _headers});
                    //break;
                    await download(uri_ts, that.dir, {
                        filename: filename + ".dl",
                        timeout: httpTimeout,
                        headers: that.headers,
                        agent: proxy_agent
                    }).catch((err) => {
                        logger.error(err)
                        fs.existsSync(filpath_dl) && fs.unlinkSync(filpath_dl);
                    });
                }
                if (!fs.existsSync(filpath_dl)) continue;

                fs.statSync(filpath_dl).size <= 0 && fs.unlinkSync(filpath_dl);

                if (segment.key != null && segment.key.method != null) {
                    //标准解密TS流
                    let aes_path = path.join(this.dir, "aes.key");
                    if (!this.myKeyIV && !fs.existsSync(aes_path)) {
                        let key_uri = segment.key.uri;
                        if (/^http/.test(this.url) && !/^http.*/.test(key_uri) && !/^\/.*/.test(key_uri)) {
                            key_uri = partent_uri + key_uri;
                        } else if (/^http/.test(this.url) && /^\/.*/.test(key_uri)) {
                            let mes = this.url.match(/^https?:\/\/[^/]*/);
                            if (mes && mes.length >= 1) {
                                key_uri = mes[0] + key_uri;
                            } else {
                                key_uri = partent_uri + key_uri;
                            }
                        } else if (/^file:\/\/\//.test(this.url) && !this.url_prefix && !/^http.*/.test(key_uri)) {
                            let fileDir = this.url.replace('file:///', '').replace(/[^\\/]{1,}$/, '');
                            let key_uri_ = path.join(fileDir, key_uri);
                            if (!fs.existsSync(key_uri_)) {
                                var me = key_uri.match(/([^\\\/\?]{1,})(\?|$)/i);
                                if (me && me.length > 1) {
                                    key_uri_ = path.join(fileDir, me[1]);
                                }
                                if (!fs.existsSync(key_uri_)) {
                                    globalCond[this.id] = false;
                                    this.catch && this.catch();
                                    return;
                                }
                            }
                            key_uri = "file:///" + key_uri_;
                        } else if (/^file:\/\/\//.test(this.url) && this.url_prefix && !/^http.*/.test(key_uri)) {
                            key_uri = this.url_prefix + (this.url_prefix.endsWith('/') || key_uri.startWith('/') ? '' : "/") + key_uri;
                        }

                        if (/^http/.test(key_uri)) {
                            await download(key_uri, that.dir, {
                                filename: "aes.key",
                                headers: that.headers,
                                timeout: httpTimeout,
                                agent: proxy_agent
                            }).catch(console.error);
                        } else if (/^file:\/\/\//.test(key_uri)) {
                            key_uri = key_uri.replace('file:///', '')
                            if (fs.existsSync(key_uri)) {
                                fs.copyFileSync(key_uri, aes_path);
                            } else {
                                globalCond[this.id] = false;
                                this.catch && this.catch();
                                return;
                            }
                        }
                    }
                    if (this.myKeyIV || fs.existsSync(aes_path)) {
                        try {
                            let key_ = null;
                            let iv_ = null;
                            if (!this.myKeyIV) {
                                key_ = fs.readFileSync(aes_path);
                                if (key_.length == 32) {
                                    key_ = Buffer.from(fs.readFileSync(aes_path, {
                                        encoding: 'utf8'
                                    }), 'hex');
                                }
                                iv_ = segment.key.iv != null ? Buffer.from(segment.key.iv.buffer) :
                                    Buffer.from(that.idx.toString(16).padStart(32, '0'), 'hex');
                            } else {

                                key_ = Buffer.from(this.myKeyIV.substr(0, 32), 'hex');
                                if (this.myKeyIV.length >= 64) {
                                    iv_ = Buffer.from(this.myKeyIV.substr(this.myKeyIV.length - 32, 32), 'hex');
                                } else {
                                    iv_ = Buffer.from(that.idx.toString(16).padStart(32, '0'), 'hex')
                                }
                            }
                            logger.debug(`key:${key_.toString('hex')} | iv:${iv_.toString('hex')}`)
                            let cipher = crypto.createDecipheriv((segment.key.method + "-cbc").toLowerCase(), key_, iv_);
                            cipher.on('error', console.error);
                            let inputData = fs.readFileSync(filpath_dl);
                            let outputData = Buffer.concat([cipher.update(inputData), cipher.final()]);
                            fs.writeFileSync(filpath, outputData);

                            if (fs.existsSync(filpath_dl))
                                fs.unlinkSync(filpath_dl);

                            that.then && that.then();
                        } catch (error) {
                            logger.error(error)
                            if (fs.existsSync(filpath_dl))
                                fs.unlinkSync(filpath_dl);
                        }
                        return;
                    }
                } else {
                    fs.renameSync(filpath_dl, filpath);
                    break;
                }
            }
            if (fs.existsSync(filpath)) {
                this.then && this.then();
            } else {
                this.catch && this.catch();
            }
        } catch (e) {
            logger.error(e);
        } finally {
            _callback();
        }
    }
}

function queue_callback(that, callback) {
    that.callback(callback);
}

async function startDownload(object, iidx) {
    let id = !object.id ? (iidx != null ? (new Date().getTime() + iidx) : new Date().getTime()) : object.id;
    let headers = object.headers;
    let url_prefix = object.url_prefix;
    let taskName = object.taskName;
    let myKeyIV = object.myKeyIV;
    let url = object.url;
    let taskIsDelTs = object.taskIsDelTs;
    if (!taskName) {
        taskName = formatFilename(url) || `${id}`;
    }

    let dir = path.join(pathDownloadDir, filenamify(taskName.trim(), { replacement: '_' }));

    logger.info(dir);

    !fs.existsSync(dir) && fs.mkdirSync(dir, { recursive: true });

    let parser = new Parser();
    if (/^file:\/\/\//g.test(url)) {
        parser.push(fs.readFileSync(url.replace(/^file:\/\/\//, ''), { encoding: 'utf-8' }));
        parser.end();
    } else {
        for (let index = 0; index < 3; index++) {
            let response = await got(url, {
                headers: headers,
                timeout: httpTimeout,
                agent: proxy_agent
            }).catch(logger.error); {
                if (response && response.body != null &&
                    response.body != '') {
                    parser.push(response.body);
                    parser.end();
                    if (parser.manifest.segments.length == 0 && parser.manifest.playlists && parser.manifest.playlists.length && parser.manifest.playlists.length >= 1) {
                        let uri = parser.manifest.playlists[0].uri;
                        if (!uri.startsWith('http')) {
                            url = uri[0] == '/' ? (url.substr(0, url.indexOf('/', 10)) + uri) :
                                (url.replace(/\/[^\/]*((\?.*)|$)/, '/') + uri);
                        }
                        else {
                            url = uri;
                        }
                        parser = new Parser();
                        continue;
                    }
                    break;
                }
            }
        }
    }


    //并发 2 个线程下载
    var tsQueues = async.queue(queue_callback, 5);

    let count_seg = parser.manifest.segments.length;
    let count_downloaded = 0;
    var video = {
        id: id,
        url: url,
        url_prefix: url_prefix,
        dir: dir,
        segment_total: count_seg,
        segment_downloaded: count_downloaded,
        time: dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"),
        status: '初始化...',
        isLiving: false,
        headers: headers,
        taskName: taskName,
        myKeyIV: myKeyIV,
        taskIsDelTs: taskIsDelTs,
        success: true,
        videopath: ''
    };

    videoDatas.splice(0, 0, video);
    fs.writeFileSync(pathVideoDB, JSON.stringify(videoDatas));

    if (!object.id) {
        mainWindow && mainWindow.webContents.send('task-notify-create', video);
    }
    globalCond[id] = true;
    let segments = parser.manifest.segments;
    for (let iSeg = 0; iSeg < segments.length; iSeg++) {
        let qo = new QueueObject();
        qo.dir = dir;
        qo.idx = iSeg;
        qo.id = id;
        qo.url = url;
        qo.url_prefix = url_prefix;
        qo.headers = headers;
        qo.myKeyIV = myKeyIV;
        qo.segment = segments[iSeg];
        qo.then = function () {
            count_downloaded = count_downloaded + 1
            video.segment_downloaded = count_downloaded;
            video.status = `下载中...${count_downloaded}/${count_seg}`
            if (video.success) {
                mainWindow.webContents.send('task-notify-update', video);
            }
        };
        qo.catch = function () {
            if (this.retry < 5) {
                tsQueues.push(this);
            } else {
                globalCond[id] = false;
                video.success = false;

                logger.info(`URL:${video.url} | ${this.segment.uri} download failed`);
                video.status = "多次尝试，下载片段失败";
                mainWindow.webContents.send('task-notify-end', video);

                fs.writeFileSync(pathVideoDB, JSON.stringify(videoDatas));
            }
        }
        tsQueues.push(qo);
    }
    tsQueues.drain(async () => {
        if (!video.success) {
            return;
        }

        logger.info('download success');
        video.status = "已完成，合并中...";
        mainWindow.webContents.send('task-notify-end', video);
        let fileSegments = [];
        for (let iSeg = 0; iSeg < segments.length; iSeg++) {
            let filpath = path.join(dir, `${((iSeg + 1) + '').padStart(6, '0')}.ts`);
            if (fs.existsSync(filpath)) {
                fileSegments.push(filpath);
            }
        }
        if (!fileSegments.length) {
            video.status = "下载失败，请检查链接有效性";
            mainWindow.webContents.send('task-notify-end', video);
            logger.error(`[${url}] 下载失败，请检查链接有效性`);
            return;
        }
        let outPathMP4 = path.join(dir, Date.now() + ".mp4");
        let outPathMP4_ = path.join(pathDownloadDir, filenamify(taskName.trim(), { replacement: '_' }) + '.mp4');
        if (fs.existsSync(ffmpegPath)) {
            let ffmpegInputStream = new FFmpegStreamReadable(null);
            new ffmpeg(ffmpegInputStream)
                .setFfmpegPath(ffmpegPath)
                .videoCodec('copy')
                .audioCodec('copy')
                .format('mp4')
                .save(outPathMP4)
                .on('error', (error) => {
                    logger.error(error)
                    video.videopath = "";
                    video.status = "合并出错，请尝试手动合并";
                    mainWindow.webContents.send('task-notify-end', video);

                    fs.writeFileSync(pathVideoDB, JSON.stringify(videoDatas));
                })
                .on('end', function () {
                    logger.info(`${outPathMP4} merge finished.`)
                    video.videopath = "";
                    fs.existsSync(outPathMP4) && (fs.renameSync(outPathMP4, outPathMP4_), video.videopath = outPathMP4_);
                    video.status = "已完成"
                    mainWindow.webContents.send('task-notify-end', video);
                    if (video.taskIsDelTs) {
                        let index_path = path.join(dir, 'index.txt');
                        fs.existsSync(index_path) && fs.unlinkSync(index_path);
                        fileSegments.forEach(item => fs.existsSync(item) && fs.unlinkSync(item));
                        let aesKey_path = path.join(dir, 'aes.key');
                        fs.existsSync(aesKey_path) && fs.unlinkSync(aesKey_path);
                        fs.rmdirSync(dir);
                    }
                    fs.writeFileSync(pathVideoDB, JSON.stringify(videoDatas));
                })
                .on('progress', (info) => {
                    logger.info(JSON.stringify(info));
                });

            for (let i = 0; i < fileSegments.length; i++) {
                let percent = Number.parseInt((i + 1) * 100 / fileSegments.length);
                video.status = `合并中[${percent}%]`;
                mainWindow.webContents.send('task-notify-end', video);
                let filePath = fileSegments[i];
                fs.existsSync(filePath) && ffmpegInputStream.push(fs.readFileSync(filePath));
                while (ffmpegInputStream._readableState.length > 0) {
                    await sleep(100);
                }
                console.log("push " + percent);
            }
            console.log("push(null) end");
            ffmpegInputStream.push(null);
        } else {
            video.videopath = outPathMP4;
            video.status = "已完成，未发现本地FFMPEG，不进行合成。"
            mainWindow.webContents.send('task-notify-end', video);
        }
    });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

class FFmpegStreamReadable extends Readable {
    constructor(opt) {
        super(opt);
    }
    _read() { }
}

async function startDownloadLive(object) {

    let id = !object.id ? new Date().getTime() : object.id;
    let headers = object.headers;
    let taskName = object.taskName;
    let myKeyIV = object.myKeyIV;
    let url = object.url;
    if (!taskName) {
        taskName = formatFilename(url) || `${id}`;
    }
    let dir = path.join(pathDownloadDir, filenamify(taskName.trim(), { replacement: '_' }));

    logger.info(dir);

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, {
            recursive: true
        });
    }

    let count_downloaded = 0;
    let count_seg = 100;
    var video = {
        id: id,
        url: url,
        dir: dir,
        segment_total: count_seg,
        segment_downloaded: count_downloaded,
        time: dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"),
        status: '初始化...',
        isLiving: true,
        myKeyIV: myKeyIV,
        taskName: taskName,
        headers: headers,
        videopath: ''
    };

    videoDatas.splice(0, 0, video);
    fs.writeFileSync(pathVideoDB, JSON.stringify(videoDatas));

    if (!object.id) {
        mainWindow.webContents.send('task-notify-create', video);
    }

    let partent_uri = url.replace(/([^\/]*\?.*$)|([^\/]*$)/g, '');
    let segmentSet = new Set();
    let ffmpegInputStream = null;
    let ffmpegObj = null;
    globalCond[id] = true;
    while (globalCond[id]) {

        try {
            const response = await got(url, {
                headers: headers,
                timeout: httpTimeout,
                agent: proxy_agent
            }).catch(logger.error);
            if (response == null || response.body == null || response.body == '') {
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
                    if (segmentSet.has(segment.uri)) {
                        continue;
                    }
                    if (!globalCond[id]) {
                        break;
                    }
                    _videoDuration = _videoDuration + segment.duration * 1000;
                    let uri_ts = '';
                    if (/^http.*/.test(segment.uri)) {
                        uri_ts = segment.uri;
                    } else if (/^\/.*/.test(segment.uri)) {
                        let mes = url.match(/^https?:\/\/[^/]*/);
                        if (mes && mes.length >= 1) {
                            uri_ts = mes[0] + segment.uri;
                        } else {
                            uri_ts = partent_uri + segment.uri;
                        }
                    } else {
                        uri_ts = partent_uri + segment.uri;
                    }

                    let filename = `${((count_downloaded + 1) + '').padStart(6, '0')}.ts`;
                    let filpath = path.join(dir, filename);
                    let filpath_dl = path.join(dir, filename + ".dl");

                    for (let index = 0; index < 3; index++) {
                        if (!globalCond[id]) {
                            break;
                        }

                        //let tsStream = await got.get(uri_ts, {responseType:'buffer', timeout:httpTimeout ,headers:headers}).catch(logger.error).body();

                        await download(uri_ts, dir, {
                            filename: filename + ".dl",
                            timeout: httpTimeout,
                            headers: headers,
                            agent: proxy_agent
                        }).catch((err) => {
                            logger.error(err)
                            if (fs.existsSync(filpath_dl)) {
                                fs.unlinkSync(filpath_dl);
                            }
                        });
                        if (fs.existsSync(filpath_dl)) {
                            let stat = fs.statSync(filpath_dl);
                            if (stat.size > 0) {
                                fs.renameSync(filpath_dl, filpath);
                            } else {
                                fs.unlinkSync(filpath_dl);
                            }
                        }
                        if (fs.existsSync(filpath)) {
                            segmentSet.add(segment.uri);
                            if (ffmpegObj == null) {
                                let outPathMP4 = path.join(dir, id + '.mp4');
                                let newid = id;
                                //不要覆盖之前下载的直播内容
                                while (fs.existsSync(outPathMP4)) {
                                    outPathMP4 = path.join(dir, newid + '.mp4');
                                    newid = newid + 1;
                                }
                                if (fs.existsSync(ffmpegPath)) {
                                    ffmpegInputStream = new FFmpegStreamReadable(null);

                                    ffmpegObj = new ffmpeg(ffmpegInputStream)
                                        .setFfmpegPath(ffmpegPath)
                                        .videoCodec('copy')
                                        .audioCodec('copy')
                                        .save(outPathMP4)
                                        .on('error', logger.info)
                                        .on('end', function () {
                                            video.videopath = outPathMP4;
                                            video.status = "已完成";
                                            mainWindow.webContents.send('task-notify-end', video);

                                            fs.writeFileSync(pathVideoDB, JSON.stringify(videoDatas));
                                        })
                                        .on('progress', logger.info);
                                } else {
                                    video.videopath = outPathMP4;
                                    video.status = "已完成，未发现本地FFMPEG，不进行合成。"
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
                            video.status = `直播中... [${count_downloaded}]`;
                            mainWindow.webContents.send('task-notify-update', video);
                            break;
                        }
                    }
                }
                if (globalCond[id]) {
                    //使下次下载M3U8时间提前1秒钟。
                    _videoDuration = _videoDuration - 1000;
                    let _downloadTime = (new Date().getTime() - _startTime.getTime());
                    if (_downloadTime < _videoDuration) {
                        await sleep(_videoDuration - _downloadTime);
                    }
                }
            } else {
                break;
            }
            parser = null;
        } catch (error) {
            logger.info(error.response.body);
        }
    }
    if (ffmpegInputStream) {
        ffmpegInputStream.push(null);
    }

    if (count_downloaded <= 0) {
        video.videopath = '';
        video.status = "已完成，下载失败"
        mainWindow.webContents.send('task-notify-end', video);
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
    videoDatas.forEach(Element => {
        if (Element.id == id) {
            try {
                if (false && fs.existsSync(Element.dir)) {
                    var files = fs.readdirSync(Element.dir)
                    files.forEach(e => {
                        //fs.unlinkSync(path.join(Element.dir,e));
                        shell.moveItemToTrash(path.join(Element.dir, e))
                    })
                    //fs.rmdirSync(Element.dir,{recursive :true})
                    shell.moveItemToTrash(Element.dir)
                }
                var nIdx = videoDatas.indexOf(Element);
                if (nIdx > -1) {
                    videoDatas.splice(nIdx, 1);
                    fs.writeFileSync(pathVideoDB, JSON.stringify(videoDatas));
                }
                event.sender.send("delvideo-reply", Element);
            } catch (error) {
                logger.error(error)
            }
        }
    });
});

function showDirInExploer(dir) {
    shell.openExternal(dir).catch((reason) => {
        logger.error(`openExternal Error:${dir} ${reason}`);

        let files = fs.readdirSync(dir);
        if (files && files.length > 0) {
            shell.showItemInFolder(path.join(dir, files[0]));
        } else {
            shell.showItemInFolder(dir);
        }
    });
}

ipcMain.on('opendir', function (event, arg, path) {
    fs.existsSync(arg) && showDirInExploer(arg);
    !fs.existsSync(arg) && fs.existsSync(path) && showDirInExploer(path);
});

ipcMain.on('playvideo', function (event, arg) {
    fs.existsSync(arg) && createPlayerWindow(arg);
});
ipcMain.on('StartOrStop', function (event, arg) {
    logger.info(arg);

    let id = Number.parseInt(arg);
    if (globalCond[id] == null) {
        logger.info("不存在此任务")
        return;
    }
    globalCond[id] = !globalCond[id];
    if (globalCond[id] == true) {
        videoDatas.forEach(Element => {
            if (Element.id == id) {
                if (Element.isLiving == true) {
                    startDownloadLive(Element);
                } else {
                    startDownload(Element);
                }
            }
        });
    }
});

ipcMain.on('setting_isdelts', function (event, arg) {
    isdelts = arg;
});

ipcMain.on('set-config', function (event, data) {
    nconf.set(data.key, data.value);
    nconf.save();

    if (data.key == 'config_proxy') {
        const config_proxy = nconf.get('config_proxy');
        proxy_agent = config_proxy ? {
            http: new HttpProxyAgent({
                keepAlive: true,
                keepAliveMsecs: 1000,
                maxSockets: 256,
                maxFreeSockets: 256,
                scheduling: 'lifo',
                proxy: config_proxy
            }),
            https: new HttpsProxyAgent({
                keepAlive: true,
                keepAliveMsecs: 1000,
                maxSockets: 256,
                maxFreeSockets: 256,
                scheduling: 'lifo',
                proxy: config_proxy
            })
        } : null;
    }
})

ipcMain.on('open-config-dir', function (event, arg) {
    let SaveDir = pathDownloadDir;
    logger.debug(`初始目录 ${SaveDir}`);
    dialog.showOpenDialog(mainWindow, {
        title: "请选择文件夹",
        defaultPath: SaveDir ? SaveDir : '',
        properties: ['openDirectory', 'createDirectory'],
    }).then(result => {
        if (!result.canceled && result.filePaths.length == 1) {
            logger.debug(`选择目录 ${result.filePaths}`);
            pathDownloadDir = result.filePaths[0];
            nconf.set('SaveVideoDir', pathDownloadDir);
            nconf.save();
            event.sender.send("message", {
                config_save_dir: pathDownloadDir,
                config_ffmpeg: ffmpegPath
            });
        }
    }).catch(err => {
        logger.error(`showOpenDialog ${err}`)
    });
});

ipcMain.on('open-select-m3u8', function (event, arg) {
    dialog.showOpenDialog(mainWindow, {
        title: "请选择一个M3U8文件",
        properties: ['openFile'],
    }).then(result => {
        if (!result.canceled && result.filePaths.length == 1) {
            event.sender.send("open-select-m3u8-reply", `file:///${result.filePaths[0]}`);
        }
    }).catch(err => {
        logger.error(`showOpenDialog ${err}`)
    });
});

ipcMain.on('open-select-ts-dir', function (event, arg) {
    if (arg) {
        let files = [];
        try {
            files = fs.readdirSync(result.filePaths[0])
        } catch (error) {

        }
        if (files && files.length > 0) {
            let _files = files.filter((f) => {
                return f.endsWith('.ts') || f.endsWith('.TS')
            });
            if (_files.length) {
                event.sender.send("open-select-ts-select-reply", _files);
                return;
            }
        }
        return;
    }
    dialog.showOpenDialog(mainWindow, {
        title: "请选择欲合并的TS文件",
        properties: ['openFile', 'multiSelections'],
        filters: [{
            name: '视频片段',
            extensions: ['ts']
        }, {
            name: '所有文件',
            extensions: ['*']
        }]
    }).then(result => {
        if (!result.canceled && result.filePaths.length >= 1) {
            if (result.filePaths.length == 1) {
                event.sender.send("open-select-ts-dir-reply", result.filePaths[0]);

                let files = [];
                try {
                    files = fs.readdirSync(result.filePaths[0])
                } catch (error) {

                }
                if (files && files.length > 0) {
                    let _files = files.filter((f) => {
                        return f.endsWith('.ts') || f.endsWith('.TS')
                    });
                    if (_files && _files.length) {
                        event.sender.send("open-select-ts-select-reply", _files);
                        return;
                    } else {
                        event.sender.send("open-select-ts-select-reply", files);
                        return;
                    }
                }
            }
            let _files = result.filePaths.filter((f) => {
                return f.endsWith('.ts') || f.endsWith('.TS')
            });
            if (_files && _files.length) {
                event.sender.send("open-select-ts-select-reply", _files);
            } else {
                event.sender.send("open-select-ts-select-reply", result.filePaths);
            }
        }
    }).catch(err => {
        logger.error(`showOpenDialog ${err}`)
    });
});

ipcMain.on('start-merge-ts', async function (event, task) {
    if (!task) return
    let name = task.name ? task.name : (new Date().getTime() + '');

    let dir = path.join(pathDownloadDir, name);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, {
            recursive: true
        });
    }
    let outPathMP4 = path.join(dir, `${new Date().getTime()}.mp4`);

    if (fs.existsSync(ffmpegPath)) {
        mainWindow.webContents.send('start-merge-ts-status', {
            code: 0,
            progress: 1,
            status: '开始合并...'
        });
        ffmpegInputStream = new FFmpegStreamReadable(null);

        let ffmpegObj = new ffmpeg(ffmpegInputStream)
            .setFfmpegPath(ffmpegPath)
            .videoCodec(task.mergeType == 'speed' ? 'copy' : 'libx264')
            .audioCodec(task.mergeType == 'speed' ? 'copy' : 'aac')
            .format('mp4')
            .save(outPathMP4)
            .on('error', (error) => {
                logger.error(error)
                mainWindow.webContents.send('start-merge-ts-status', {
                    code: -2,
                    progress: 100,
                    status: '合并出错|' + error
                });
            })
            .on('end', function () {
                logger.info(`${outPathMP4} merge finished.`)
                mainWindow.webContents.send('start-merge-ts-status', {
                    code: 1,
                    progress: 100,
                    status: 'success',
                    dir: dir,
                    path: outPathMP4
                });
            })
            .on('progress', (info) => {
                logger.info(JSON.stringify(info));
                mainWindow.webContents.send('start-merge-ts-status', {
                    code: 0,
                    progress: -1,
                    status: JSON.stringify(info)
                });
            });
        let count = task.ts_files.length
        let _last = '';
        for (let index = 0; index < count; index++) {
            const file = task.ts_files[index];
            ffmpegInputStream.push(fs.readFileSync(file));
            while (ffmpegInputStream._readableState.length > 0) {
                await sleep(200);
            }
            let precent = Number.parseInt((index + 1) * 100 / count);
            mainWindow.webContents.send('start-merge-ts-status', {
                code: 0,
                progress: precent,
                status: `合并中...[${precent}%]`
            });
        }
        ffmpegInputStream.push(null);
    } else {
        mainWindow.webContents.send('start-merge-ts-status', {
            code: -1,
            progress: 100,
            status: '未检测到FFMPEG,不进行合并操作。'
        });
    }
});