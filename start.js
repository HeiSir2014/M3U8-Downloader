const { ipcRenderer } = require('electron');
const { shell } = require('electron').remote;

const _app = new Vue({
    el: '#app',
    data: function() {
        return { 
            version:'',
            m3u8_url: '',
            m3u8_urls: '',
            m3u8_url_prefix:'',
            dlg_header_visible: false,
            dlg_newtask_visible: false,
            config_save_dir:'',
            headers:'',
            myKeyIV:'',
            myLocalKeyIV:'',
            taskName:'',
            taskIsDelTs:true,
            allVideos:[],
            tabPane:''
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
                that.config_save_dir = data;
            });
            ipcRenderer.on('open-select-m3u8-reply',function(event,data){
                that.m3u8_url = data;
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
                     taskIsDelTs:this.taskIsDelTs
                     });
                this.dlg_newtask_visible = false;
                this.taskName = '';
            }
            else
            {
                this.$message({title: '提示',type: 'error',message: "请输入正确的M3U8-URL或者导入(.m3u8)文件",offset:100,duration:1000});
            }
        },
        clickNewLocalTask:function(e){

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
        }
    },
    mounted:function(){
        this.installEvent();
    }
});

console.log(_app);
