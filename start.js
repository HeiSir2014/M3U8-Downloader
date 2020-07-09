const { ipcRenderer } = require('electron');
const { shell } = require('electron').remote;

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
            tsTaskName:''
        }
    },
    methods:{
        installEvent:function(e){
            let that = this;
            ipcRenderer.on('get-version-reply',function(event,data){
                that.version = data;
            });
            
            ipcRenderer.on('get-all-videos-reply',function(event,data){
                that.allVideos = data;
            });
            
            ipcRenderer.on('get-config-dir-reply',function(event,data){
                that.config_save_dir = data.config_save_dir;
                that.config_ffmpeg = data.config_ffmpeg;
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
                that.notifyTaskStatus(data.code,data.message);
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

            if( this.m3u8_url != '')
            {
                this.dlg_newtask_visible = true;
            }
            else
            {
                this.$message({title: '提示',type: 'error',message: "请输入正确的M3U8 URL",offset:100,duration:1000});
            }
        },
        clickNewTaskOK:function(e){
            if( this.m3u8_url != '')
            {
                ipcRenderer.send('task-add', { url: this.m3u8_url,
                     headers: this.headers,
                     myKeyIV: this.myKeyIV,
                     taskName: this.taskName,
                     taskIsDelTs:this.taskIsDelTs,
                     url_prefix:this.m3u8_url_prefix
                });
                this.dlg_newtask_visible = false;
                this.taskName = '';
            }
            else
            {
                this.$message({title: '提示',type: 'error',message: "请输入正确的M3U8-URL或者导入(.m3u8)文件",offset:100,duration:1000});
            }
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
        }
    },
    mounted:function(){
        this.installEvent();
    }
});

console.log(_app);
