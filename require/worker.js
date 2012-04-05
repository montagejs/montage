
var URL = require("core/mini-url");

exports.Worker = function (package, id) {
    var worker = new Worker(
        URL.resolve(module.location, 'worker-script.js')
    );
    worker.postMessage({
        "type": "init",
        "package": package,
        "module": id
    })
    worker.onmessage = function (event) {
        // request module text
        // handle URL resolution
        // console log
        // read a url
        if (event.data.type === "console") {
            console[event.data.method].apply(console, event.data.args);
        } else if (event.data.type === "read") {
            require.read(event.data.url)
            .then(function (content) {
                worker.postMessage({
                    type: "read",
                    url: event.data.url,
                    content: content
                })
            }, function (error) {
                worker.postMessage({
                    type: "read",
                    url: event.data.url,
                    error: error
                });
            })
            .end();
        } else if (event.data.type === "forward") {
            if (proxy.onmessage) {
                proxy.onmessage({
                    data: event.data.data
                });
            } else {
                // XXX
            }
        } else {
            // XXX
        }
    };
    var proxy = {
        postMessage: function (data) {
            worker.postMessage({
                type: "forward",
                data: data
            });
        },
        onmessage: null,
        terminate: function () {
            return worker.terminate();
        }
    };
    return proxy;
};

