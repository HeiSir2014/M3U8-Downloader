const { ipcRenderer } = require('electron');
const { shell } = require('electron');

const _app = new Vue({
    el: '#app',
    data: function() {
        return { 
            version:'',
            m3u8_url: '',
            m3u8_urls: '',
            ts_dir:'',
            ts_urls:[],
            m3u8_url_prefix:'',
            dlg_header_visible: false,
            dlg_newtask_visible: false,
            config_save_dir:'',
            config_ffmpeg:'',
            config_proxy:'',
            headers:'',
            myKeyIV:'',
            myLocalKeyIV:'',
            taskName:'',
            taskIsDelTs:true,
            allVideos:[],
            tabPane:'',
            tsMergeType:'speed',
            tsMergeProgress:0,
            tsMergeStatus:'',
            tsMergeMp4Path:'',
            tsMergeMp4Dir:'',
            tsTaskName:'',
            downSpeed:'0 MB/s',
            playlists:[],
            playlistUri:'',
            addTaskMessage:''
        }
    },
    methods:{
        installEvent:function(e){
            let that = this;
            ipcRenderer.on('get-version-reply',function(event,data){
                that.version = data;
            });
        
            ipcRenderer.on('notify-download-speed',function(event,data){
                that.downSpeed = data;
            });

            ipcRenderer.on('get-all-videos-reply',function(event,data){
                that.allVideos = data;
            });
            
            ipcRenderer.on('get-config-dir-reply',function(event,data){
                that.config_save_dir = data.config_save_dir;
                that.config_ffmpeg = data.config_ffmpeg;
                data.config_proxy && (that.config_proxy = data.config_proxy);
            });
            ipcRenderer.on('open-select-m3u8-reply',function(event,data){
                that.m3u8_url = data;
            });
            ipcRenderer.on('open-select-ts-dir-reply',function(event,data){
                that.ts_dir = data;
            });
            ipcRenderer.on('open-select-ts-select-reply',function(event,data){
                that.ts_urls = data;
                that.ts_dir = `选择了 [${that.ts_urls.length}] 个视频`;
            });

            ipcRenderer.on('task-add-reply',function(event,data){
                if(data.code != 1)
                {
                    that.dlg_newtask_visible = false;
                    that.taskName = '';
                    that.m3u8_url = '';
                    that.m3u8UrlChange();
                    that.notifyTaskStatus(data.code,data.message);
                    return;
                }
                that.playlists = data.playlists;
                that.playlistUri = that.playlists[0].uri;
                that.addTaskMessage = "请选择一种画质";
            });
            ipcRenderer.on('task-notify-create',function(event,data){
                that.allVideos.splice(0,0,data);
            });
            ipcRenderer.on('task-notify-update',function(event,data){
                for (let idx = 0; idx < that.allVideos.length; idx++) {
                    let e = that.allVideos[idx];
                    if(e.id == data.id)
                    {
                        Vue.set(that.allVideos,idx,data);
                        return;
                    }
                }
            });

            ipcRenderer.on('task-notify-end',function(event,data){
                for (let idx = 0; idx < that.allVideos.length; idx++) {
                    let e = that.allVideos[idx];
                    if(e.id == data.id)
                    {
                        Vue.set(that.allVideos,idx,data);
                        return;
                    }
                }
            });
            ipcRenderer.on('start-merge-ts-status',function(event,msg){

                if(msg.progress != -1)  that.tsMergeProgress = msg.progress;
                if(msg.status) that.tsMergeStatus = msg.status;
                if(msg.code == 1){
                    that.tsMergeMp4Dir = msg.dir;
                    that.tsMergeMp4Path = msg.path;
                } 
            });
            
            ipcRenderer.on('delvideo-reply',function(event,data){
                for (let idx = 0; idx < that.allVideos.length; idx++) {
                    let e = that.allVideos[idx];
                    if(e.id == data.id)
                    {
                        that.allVideos.splice(idx, 1);
                        return;
                    }
                }
            });

            ipcRenderer.send('get-version');
            ipcRenderer.send('get-all-videos');
            ipcRenderer.send('get-config-dir');
        },
        clickAClick: function(e){
            e.preventDefault();
            console.log(e.target.href);
            shell.openExternal(e.target.href);
        },
        clickStartHookUrl:function(e){
            ipcRenderer.send('new-hook-url-window');
        },
        clickClose:function(e){
            ipcRenderer.send('hide-windows');
        },
        clickNewTask:function(e){
            if(!this.config_save_dir)
            {
                this.tabPane = "setting";
                this.$message({title: '提示',type: 'error',message: "请先设置存储路径，再开始下载视频",offset:100,duration:1000});
                return;
            }
            this.dlg_newtask_visible = true;
            this.taskName = '';
            this.m3u8_url = '';
            this.m3u8UrlChange();
        },
        clickNewTaskOK:function(e){
            if( this.m3u8_url != '')
            {
                let m3u8_url = this.m3u8_url;
                if(this.playlistUri != '')
                {
                    const uri = this.playlistUri;
                    m3u8_url = uri[0]=='/'?(m3u8_url.substr(0,m3u8_url.indexOf('/',10))+uri):uri;
                }

                ipcRenderer.send('task-add', { url: m3u8_url,
                     headers: this.headers,
                     myKeyIV: this.myKeyIV,
                     taskName: this.taskName,
                     taskIsDelTs:this.taskIsDelTs,
                     url_prefix:this.m3u8_url_prefix
                });

                this.addTaskMessage = "正在检查链接..."
            }
            else
            {
                this.$message({title: '提示',type: 'error',message: "请输入正确的M3U8-URL或者导入(.m3u8)文件",offset:100,duration:1000});
            }
        },
        clickClearTask:function(e){
            ipcRenderer.send('task-clear');
            this.allVideos = [];
        },
        clickNewTaskMuti:function(e){
            if(!this.config_save_dir)
            {
                this.tabPane = "setting";
                this.$message({title: '提示',type: 'error',message: "请先设置存储路径，再开始下载视频",offset:100,duration:1000});
                return;
            }
            if( this.m3u8_urls != '')
            {
                ipcRenderer.send('task-add-muti', { m3u8_urls: this.m3u8_urls,
                     headers: this.headers,
                     taskIsDelTs:this.taskIsDelTs,
                     myKeyIV:'',
                     taskName:''
                });
                this.dlg_newtask_visible = false;
                this.taskName = '';
            }
            else
            {
                this.$message({title: '提示',type: 'error',message: "请输入正确的M3U8-URL",offset:100,duration:1000});
            }
        },
        clickOpenConfigDir:function(e){
            ipcRenderer.send("open-config-dir");
        },
        clickItemOptData:function(e){
            let that = e.target;
            var opt = that.getAttribute('opt');
            if(opt == "StartOrStop")
            {
                that.value = that.value == "停止"?"重新开始":"停止";
            }
            ipcRenderer.send(that.getAttribute('opt'),that.getAttribute('data'));
        },
        getPlaylistLabel:function(playlist){
            if(!playlist || !playlist.attributes) return '';
            const attr = playlist.attributes;
            if(attr.BANDWIDTH)
            {
                return `码率 - ${attr.BANDWIDTH}`;
            }
            if(attr.bandwidth)
            {
                return `码率 - ${attr.bandwidth}`;
            }
            if(attr.RESOLUTION)
            {
                return `分辨率 - ${attr.RESOLUTION.width}x${attr.RESOLUTION.height}`;
            }
            if(attr.resolution)
            {
                return `分辨率 - ${attr.resolution.width}x${attr.resolution.height}`;
            }
            return '链接 - ' + playlist.uri;
        },
        proxyChange:function(){
            ipcRenderer.send('set-config',{key:'config_proxy',value:this.config_proxy});
        },
        m3u8UrlChange:function(){
            this.playlists = [];
            this.playlistUri = '';
            this.addTaskMessage = "请输入M3U8视频源";
        },
        notifyTaskStatus:function(code,message){
            this.$notify({title: '提示',type: (code == 0? 'success':'error'),message: message,showClose: true,duration:3000,position:'bottom-right'});
        },
        clickOpenLogDir:function(e){
            ipcRenderer.send('open-log-dir');
        },
        clickSelectM3U8:function(e){
            ipcRenderer.send('open-select-m3u8');
        },
        clickSelectTSDir:function(e){
            ipcRenderer.send('open-select-ts-dir');
        },
        clickStartMergeTS:function(e){
            this.tsMergeMp4Dir = '';
            this.tsMergeMp4Path = '';
            this.tsMergeProgress = 0;
            this.tsMergeStatus = '';
            if(!this.config_save_dir)
            {
                this.tabPane = "setting";
                this.$message({title: '提示',type: 'error',message: "请先设置存储路径，再开始下载视频",offset:100,duration:1000});
                return;
            }
            ipcRenderer.send('start-merge-ts',{
                ts_files:this.ts_urls,
                mergeType:this.tsMergeType,
                name:this.tsTaskName
            });
        },
        clickClearMergeTS:function(e){
            this.ts_dir = '';
            this.ts_urls = [];
            this.tsTaskName = '';
            this.tsMergeMp4Dir = '';
            this.tsMergeMp4Path = '';
            this.tsMergeProgress = 0;
            this.tsMergeStatus = '';
        },
        clickOpenMergeTSDir:function(e){
            ipcRenderer.send('opendir',this.tsMergeMp4Dir);
        },
        clickPlayMergeMp4:function(e){
            ipcRenderer.send('playvideo',this.tsMergeMp4Path);
        },
        dropM3U8File:function(e){
            e.preventDefault();

            if(!e.dataTransfer || 
                !e.dataTransfer.files || 
                e.dataTransfer.files.length == 0)
            {
                return;
            }
            let p = e.dataTransfer.files[0].path;
            this.m3u8_url = `file:///${p}`;
        },
        dropTSFiles:function(e){
            e.preventDefault();

            if(!e.dataTransfer || 
                !e.dataTransfer.files || 
                e.dataTransfer.files.length == 0)
            {
                return;
            }
            let _filePath = [];
            for (let index = 0; index < e.dataTransfer.files.length; index++) {
                const f = e.dataTransfer.files[index];
                if(f.path.endsWith('.ts') || f.path.endsWith('.TS'))
                { 
                    _filePath.push(f.path);
                }
            }
            if(_filePath.length)
            {
                this.ts_urls = _filePath;
                this.ts_dir = `选择了 [${_filePath.length}] 个视频`;

            }else if(e.dataTransfer.files.length == 1)
            {
                this.ts_dir = e.dataTransfer.files[0].path;
                ipcRenderer.send('open-select-ts-dir',e.dataTransfer.files[0].path);
            }
        },
        clickRefreshComment:function(e){
            var GUEST_INFO = ['nick','mail','link'];
            var guest_info = 'nick'.split(',').filter(function(item){
                return GUEST_INFO.indexOf(item) > -1
            });
            console.log(guest_info)
            var notify = 'false' == true;
            var verify = 'false' == true;
            new Valine({
                el: '.vcomment',
                notify: notify,
                verify: verify,
                appId: "dYhmAWg45dtYACWfTUVR2msp-gzGzoHsz",
                appKey: "SbuBYWY21MPOSVUCTHdVlXnx",
                placeholder: "可以在这里进行咨询交流",
                pageSize:'100',
                avatar:'mm',
                lang:'zh-cn',
                meta:guest_info,
                recordIP:true,
                path:'/m3u8-downloader'
            });
        }
    },
    mounted:function(){
        this.installEvent();
    }
});

console.log(_app);
