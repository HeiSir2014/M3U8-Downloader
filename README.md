# M3U8-Downloader
M3U8-Downloader是基于Electron框架开发的一款可以下载、播放HLS视频流的APP，功能特点如下：

| 功能 | 支持 |
| :-- | --: |
| HLS协议点播源 | ✓ |
| HLS协议直播源 | ✓ |
| 标准 AES-128-CBC加密 | ✓ |
| 标准 AES-196-CBC加密 | ✓ |
| 标准 AES-256-CBC加密 | ✓ |
| 非标准 AES-*-CBC加密 | ㄨ(可定制) |


<div align="center">
	<br>
	<img width="739" src="https://github.com/HeiSir2014/M3U8-Downloader/blob/master/resource/M3U82.0.png?raw=true" alt="M3U8-Downloader">
	<br>
</div>

# 流程原理图

---

<div align="center">
	<br>
	<img width="1024" src="https://github.com/HeiSir2014/M3U8-Downloader/raw/master/resource/flowchart.png" alt="M3U8-Downloader">
	<br>
</div>

---

# 官网
[M3U8-Downloader 官网](https://tools.heisir.cn/HLSDownload)

QQ交流群：341972319

[点我加QQ交流群](https://jq.qq.com/?_wv=1027&k=nhFrZBS0)

# 获取M3U8视频地址

在chrome浏览器打开视频网页，按下F12,页签点击到Network页面，在Filter框里输入"m3u8",然后按F5刷新页面，如果网页里的视频使用的是HLS源，就可以在这里捕获到视频流地址，然后选中右键 Copy -> Copy Link Address.
提供m3u8源地址，下载并无损转码Mp4文件

[自定义头添加-视频教程](https://player.bilibili.com/player.html?aid=498666070&bvid=BV1QK411n7VJ&cid=206827525&page=1)

# 下载

目前仅编译了Windows x64版本，期待其他大神编译其他平台版本。

Windows x64 下载地址：[Release](https://github.com/HeiSir2014/M3U8-Downloader/releases)

# 运行源码
### 1.NodeJS开发环境搭建

安装NodeJs最新版，[NodeJs Download](http://nodejs.cn/download/)

### 2.Clone 代码

在任意文件夹下新建一个文件夹存放代码，并执行以下命令
```
cd newdir

git clone https://github.com/HeiSir2014/M3U8-Downloader.git .
```

### 3.环境初始化

```
npm install
```

### 4.运行M3U8-Downloader

```
npm run start
```

### 5.Enjoy it
