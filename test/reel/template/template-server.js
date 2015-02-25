var http = require('http');
var fs = require('fs');

var port = 9090;

http.createServer(function (req, res) {
    var delay = Number(getUrlParam(req, "delay"));

    if (delay) {
        console.log("Serving " + req.url + " with delay: " + delay + ".");
        serveWithDelay(req, res, delay);
    } else {
        console.log("Serving " + req.url + ".");
        serve(req, res);
    }
}).listen(port);

function serveWithDelay(req, res, delay) {
    setTimeout(function () {
        serve(req, res);
    }, delay);
}

function serve(req, res) {
    var path = getUrlPath(req);

    if (path === "/resource.js") {
        fs.readFile('./resource.js', function (err, data) {
            res.writeHead(200, {'Content-Type': 'text/javascript'});
            res.end(data);
        });
    } else {
        res.writeHead(404, {'Content-Type': 'text/plain'});
        res.end("404 Not Found\n");
    }
}

function getUrlPath(req) {
    return req.url.split("?")[0];
}

function getUrlParam(req, name) {
    var indexOf = req.url.indexOf("?"),
        queryString,
        queryStringParams,
        param;

    if (indexOf >= 0) {
        queryString = req.url.slice(indexOf + 1);
        queryStringParams = queryString.split("&");

        for (var i = 0; i < queryStringParams.length; i++) {
            param = queryStringParams[i].split("=");
            if (param[0] === name) {
                return decodeURIComponent(param[1]);
            }
        }
    }
}

console.log("Template server started at: " + port);
