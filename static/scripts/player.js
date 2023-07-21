const { ipcRenderer } = require('electron');

function getParameterByName(url,name) {
    name = name.replace(/[\[]/, '\\\[').replace(/[\]]/, '\\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)'),
        results = regex.exec(url);
    return results === null ? '' : decodeURIComponent(results[1].replace(
        /\+/g, ' '));
}

ipcRenderer.on('message',(_,{platform,playsrc})=>{
    if(platform && platform == "darwin")
    {
        let player = document.querySelector('.header.player');
        player.style.display = "none";
    }
    if(playsrc)
    {
        var videoObject = {
            container: '#player', //容器的ID或className
            variable: 'player', //播放函数名称
            //loop: true, //播放结束是否循环播放
            autoplay: true,//是否自动播放,
            video:playsrc
        };
        new ckplayer(videoObject);
    }
});

var btnClose = document.querySelector('.heisir .header .close');
btnClose.onclick = function(){
    window.close();
};