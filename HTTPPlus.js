var http = require('http'),
    https = require('https'),
    fs = require('fs'),
    url = require('url');

function url_to_option(urlstr,method,postData,headerSend) {
    // body...
    if (urlstr === null) {
        urlstr = '';
    }
    var Url = url.parse(urlstr);
    var retOpt = {hostname:Url.hostname,port:Url.port,path:Url.path,method:(method === null ? 'GET':method)};
    if ( method === 'POST' ) {
        var header = retOpt['headers'];
        if ( typeof(header) === 'undefined' ) {
            header = {};
        }
        header['Content-Type'] = 'application/x-www-form-urlencoded';
        header['Content-Length'] = Buffer.byteLength(postData);

        retOpt['headers'] = header;
    }
    if ( headerSend != null ) {
        if( typeof(retOpt['headers']) === 'undefined' ){
            retOpt['headers'] = {};
        }
        for (var key in headerSend) {
            if ('host' != key) {
                retOpt['headers'][key] = headerSend[key];
            }
        }
    }

    return retOpt;
}

function httpSend(urlstr,method,postData,header,callback) {
    // body...
    var http__ = http;
    if(urlstr.indexOf('https') == 0)
    {
        http__ = https;
    }
    var req = http__.request(url_to_option(urlstr,method,postData,header), function(res){
        var responseContent = '';
        res.setEncoding('utf8');
        res.on('data', function(chunk){
            responseContent += chunk;
        });
        res.on('end', function() {
            //console.log('response = ' + responseContent);
            if(callback != null){
                callback(responseContent,null);
            }
        });
        res.on('error',function(err){
            if(callback != null){
                callback(null,err);
            }
        })
    });

    req.on('error', function(e) {
        if(callback != null){
            callback(null,e.message);
        }
    });

    if (method === 'POST' && postData != null && postData !='') {
        req.write(postData);
    }
    req.end();
}


function downloadFile(urlstr,filePath,method,postData,header,callback,process_callback) {
    // body...
    var http__ = http;
    if(urlstr.indexOf('https') == 0)
    {
        http__ = https;
    }
    var req = http__.request(url_to_option(urlstr,method,postData,header), function(res){
        let stream = fs.createWriteStream(filePath);
        res.pipe(stream);
        res.on('close',function(){
            if(callback != null){
                callback('success',null);
            }
        });
    });

    req.on('error', function(e) {
        if(callback != null){
            callback(null,e.message);
        }
    });

    if (method === 'POST' && postData != null && postData !='') {
        req.write(postData);
    }
    req.end();
}

function downloadFileSync(urlstr,filePath,method,postData,header,callback,process_callback) {
    return new Promise(function(resolve, reject){
    // body...
    var http__ = http;
    if(urlstr.indexOf('https') == 0)
    {
        http__ = https;
    }
    var req = http__.request(url_to_option(urlstr,method,postData,header), function(res){
        let stream = fs.createWriteStream(filePath);
        res.pipe(stream);
        res.on('close',function(){
            if(callback != null){
                callback('success',null);
                resolve('success');
            }
        });
    });

    req.on('error', function(e) {
        if(callback != null){
            callback(null,e.message);
            reject(e.message);
        }
    });

    if (method === 'POST' && postData != null && postData !='') {
        req.write(postData);
    }
    req.end();
    });
}

exports.httpSend = httpSend;
exports.downloadFile = downloadFile;
exports.downloadFileSync = downloadFileSync;