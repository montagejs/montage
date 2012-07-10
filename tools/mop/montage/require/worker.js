/* <copyright>
Copyright (c) 2012, Motorola Mobility LLC.
All Rights Reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice,
  this list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of Motorola Mobility LLC nor the names of its
  contributors may be used to endorse or promote products derived from this
  software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
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

