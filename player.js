function getParameterByName(url,name) {
    name = name.replace(/[\[]/, '\\\[').replace(/[\]]/, '\\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)'),
        results = regex.exec(url);
    return results === null ? '' : decodeURIComponent(results[1].replace(
        /\+/g, ' '));
}

document.body.onload = function(){
    var videosrc = getParameterByName(location.href,"src");

    var videoObject = {
        container: '#player', //容器的ID或className
        variable: 'player', //播放函数名称
        //loop: true, //播放结束是否循环播放
        autoplay: true,//是否自动播放,
        video:videosrc
    };
    new ckplayer(videoObject);

    var title = videosrc.replace(/.*\//g,'').replace(/.*\\/g,'');
    document.head.title = title;
    document.querySelector(".player .title").innerHTML = `[ ${title} ] 正在播放...`;
};


var btnClose = document.querySelector('.heisir .header .close');
btnClose.onclick = function(){
    window.close();
};