/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

var URL = require("core/mini-url");

exports.Worker = function (package, id) {
    var proxy;
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
    proxy = {
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

