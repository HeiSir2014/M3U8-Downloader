const {ipcRenderer} = require('electron');
const {shell} = require('electron').remote;

var btnClose = document.querySelector('.heisir .header .close');
var ahome = document.querySelector('.heisir .header .home');
var aqqgroup = document.querySelector('.heisir .header .qqgroup');
btnClose.onclick = function(){
    ipcRenderer.send('hide-windows');
};

aqqgroup.onclick = ahome.onclick = function(e){
    e.preventDefault();
    let href=this.href;
    shell.openExternal(href);
}

var input_url = document.querySelector('.heisir .main .addTask input[type=text]');
var btnAddTask = document.querySelector('.heisir .main .addTask input[type=button]');
var info = document.querySelector('.heisir .main .addTask .info');
var info = document.querySelector('.heisir .main .addTask .info');

btnAddTask.onclick = function(){
    if(input_url.value != '')
    {
        ipcRenderer.send('task-add',input_url.value);
    }
}

ipcRenderer.on('get-all-videos-reply',function(event,data){
    data.forEach(element => {
        addVideo(element)
    });
});

ipcRenderer.on('task-add-reply',function(event,data){
    info.innerHTML = `<span class="${data.code == 0 ?'success':'fail'}">${data.message}</span>`;

});


ipcRenderer.on('task-notify-create',function(event,data){
    addVideo(data)
});

function addVideo(data)
{
    var taskList = document.querySelector('.TaskList');
    var item = document.querySelector('.TaskList .item.template');
    var newItem = item.cloneNode(true);
    newItem.className = "item";
    newItem.style.display = '';
    newItem.id = "_" + data.id;
    newItem.querySelector('.link').innerHTML = data.url;
    newItem.querySelector('.time .value').innerHTML = data.time;
    newItem.querySelector('.status .value').innerHTML = data.status;
    newItem.querySelector('.opendir').setAttribute('dir',data.dir);
    newItem.querySelector('.opendir').onclick = opendir;
    newItem.querySelector('.del').setAttribute('data',data.id);
    newItem.querySelector('.del').onclick = delvideo;
    if(data.status != "已完成")
    {
        newItem.querySelector('.del').style.display='none';
        newItem.querySelector('.play').style.display='none';
    }
    else
    {
        newItem.querySelector('.play').setAttribute('videopath',data.videopath);
        newItem.querySelector('.play').onclick = playvideo;
    }

    taskList.insertBefore(newItem,null);
    
    var empty = document.querySelector('.TaskList .empty');
    empty.style.display="none";
}


ipcRenderer.on('task-notify-update',function(event,data){
    var newItem = document.querySelector('#_'+data.id);
    newItem.querySelector('.status .value').innerHTML = data.status;
});

ipcRenderer.on('task-notify-end',function(event,data){
    var newItem = document.querySelector('#_'+data.id);
    
    newItem.querySelector('.play').setAttribute('videopath',data.videopath);
    newItem.querySelector('.status .value').innerHTML = data.status;
    newItem.querySelector('.play').onclick = playvideo;
    newItem.querySelector('.del').style.display='';
    newItem.querySelector('.play').style.display='';
});


ipcRenderer.on('delvideo-reply',function(event,data){
    var newItem = document.querySelector('#_'+data.id);
    newItem.remove();

    
    var taskList = document.querySelector('.TaskList');
    if(taskList.children.length <= 2)
    {
        var empty = document.querySelector('.TaskList .empty');
        empty.style.display="table";
    }
});

document.body.onload = function(){
    ipcRenderer.send('get-all-videos');
    return;
    var TaskList = document.querySelector('.TaskList');
    var TaskItem = document.querySelector('.TaskList .item');
    for (let index = 0; index < 10; index++) {

        TaskList.innerHTML = TaskList.innerHTML +TaskItem.outerHTML;
    }
};

function opendir(dir)
{
    ipcRenderer.send('opendir',this.getAttribute('dir'));
}

function delvideo()
{
    ipcRenderer.send('delvideo',this.getAttribute('data'));
}
function playvideo()
{
    ipcRenderer.send('playvideo',this.getAttribute('videopath'));
}

function setting_isdelts(){
    var ele = document.querySelector(".setting_isdelts");
    ipcRenderer.send('setting_isdelts',ele.checked);
}