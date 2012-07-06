/* <copyright>
Copyright (c) 2012, Motorola Mobility, Inc
All Rights Reserved.
BSD License.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

  - Redistributions of source code must retain the above copyright notice,
    this list of conditions and the following disclaimer.
  - Redistributions in binary form must reproduce the above copyright
    notice, this list of conditions and the following disclaimer in the
    documentation and/or other materials provided with the distribution.
  - Neither the name of Motorola Mobility nor the names of its contributors
    may be used to endorse or promote products derived from this software
    without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
</copyright> */
var Montage = require("./core").Montage;
var UUID = require("./uuid");
var Promise = require("./promise").Promise;
var PromiseQueue = require("./promise-queue").PromiseQueue;
var CacheMap = require("./shim/structures").CacheMap;
var logger = require("./logger").logger("promise-connections");
var rootId = "";

exports.connect = connect;
function connect(port, local, options) {
    return PromiseConnection.create().init(port, local, options);
}

var has = Object.prototype.hasOwnProperty;

var PromiseConnection = exports.PromiseConnection = Montage.create(Montage, {

    init: {
        value: function (port, local, options) {
            options = options || {};
            // sigil for debug message prefix
            this.sigil = Math.random().toString(36).toUpperCase().slice(2, 4);
            this.makeId = options.makeId || UUID.generate;
            this.locals = CacheMap(options.max);
            this.port = Adapter.adapt(port, options.origin);
            this.port.forEach(function (message) {
                this.log("receive:", message);
                message = JSON.parse(message);
                if (!this.receivers[message.type])
                    return;
                if (!this.locals.has(message.to))
                    return;
                this.receivers[message.type].call(this, message);
            }, this);
            this.makeLocal(rootId);
            this.resolveLocal(rootId, local);
            return this.makeRemote(rootId);
        }
    },

    log: {
        value: function (/*...args*/) {
            logger.debug.apply(logger, ["Connection:", this.sigil].concat(Array.prototype.slice.call(arguments)));
        }
    },

    encode: {
        value: function (object) {
            if (Promise.isPromise(object)) {
                var id = this.makeId();
                this.makeLocal(id);
                this.resolveLocal(id, object);
                return {"@": id};
            } else if (Array.isArray(object)) {
                return object.map(this.encode, this);
            } else if (typeof object === "object") {
                var newObject = {};
                for (var key in object) {
                    if (has.call(object, key)) {
                        var newKey = key;
                        if (/^[!@]$/.exec(key))
                            newKey = key + key;
                        newObject[newKey] = this.encode(object[key]);
                    }
                }
                return newObject;
            } else {
                return object;
            }
        }
    },

    decode: {
        value: function (object) {
            if (!object) {
                return object;
            } else if (object['!']) {
                return Promise.reject(object['!']);
            } else if (object['@']) {
                return this.makeRemote(object['@']);
            } else if (Array.isArray(object)) {
                return object.map(this.decode, this);
            } else if (typeof object === 'object') {
                var newObject = {};
                for (var key in object) {
                    if (has.call(object, key)) {
                        var newKey = key;
                        if (/^(@@|!!)$/.exec(key))
                            newKey = key.substring(1);
                        newObject[newKey] = this.decode(object[key]);
                    }
                }
                return newObject;
            } else {
                return object;
            }
        }
    },

    makeLocal: {
        value: function (id) {
            if (!this.locals.has(id)) {
                this.locals.set(id, Promise.defer());
            }
            return this.locals.get(id).promise;
        }
    },

    resolveLocal: {
        value: function (id, value) {
            this.log('resolve:', 'L' + JSON.stringify(id), JSON.stringify(value));
            this.locals.get(id).resolve(value);
        }
    },

    makeRemote: {
        value: function (id) {
            return RemotePromise.create().init(this, id);
        }
    },

    receivers: {
        value: Object.create(null, {

            resolve: {
                value: function (message) {
                    if (this.locals.has(message.to)) {
                        this.resolveLocal(message.to, this.decode(message.resolution));
                    }
                }
            },

            send: {
                value: function (message) {
                    var connection = this;
                    this.locals.get(message.to).promise
                    .send(message.op, this.decode(message.args))
                    .then(function (resolution) {
                        return Promise.call(function () {
                            return JSON.stringify({
                                type: 'resolve',
                                to: message.from,
                                resolution: connection.encode(resolution)
                            })
                        })
                        .fail(function (error) {
                            console.log('XXX:', error);
                            return JSON.stringify({
                                type: 'resolve',
                                to: message.from,
                                resolution: null
                            });
                        })
                    }, function (reason, error, rejection) {
                        return Promise.call(function () {
                            return JSON.stringify({
                                type: 'resolve',
                                to: message.from,
                                resolution: {'!': connection.encode(reason)}
                            })
                        })
                        .fail(function () {
                            return JSON.stringify({
                                type: 'resolve',
                                to: message.from,
                                resolution: {'!': null}
                            });
                        })
                    })
                    .then(function (envelope) {
                        connection.port.put(envelope);
                    })
                    .end();
                }
            }

        })
    }

});

var RemotePromise = Montage.create(Promise.AbstractPromise, {
    init: {
        value: function (connection, id) {
            this._connection = connection;
            this._id = id;
            this.Promise = Promise;
            return this;
        }
    },
    _handlers: {
        value: {}
    },
    _fallback: {
        value: function (resolve, op /*...args*/) {
            var localId = this._connection.makeId();
            var response = this._connection.makeLocal(localId);
            var args = Array.prototype.slice.call(arguments, 2);
            this._connection.log('sending:', 'R' + JSON.stringify(this._id), JSON.stringify(op), JSON.stringify(args));
            this._connection.port.put(JSON.stringify({
                type: 'send',
                to: this._id,
                from: localId,
                op: op,
                args: this._connection.encode(args)
            }));
            return response;
        }
    }
});

var Adapter =
exports.Adapter = Montage.create(Montage, {
    adapt: {
        value: function (port, origin) {
            return this.create().init(port, origin);
        }
    },
    init: {
        value: function (port, origin) {
            var queue;
            if (port.postMessage) {
                // MessagePorts
                this._send = function (message) {
                    // some message ports require an "origin"
                    port.postMessage(message, origin);
                };
            } else if (port.send) {
                // WebSockets have a "send" method, indicating
                // that we cannot send until the connection has
                // opened.  We change the send method into a
                // promise for the send method, resolved after
                // the connection opens, rejected if it closes
                // before it opens.
                var deferred = Promise.defer();
                this._send = deferred.promise;
                port.addEventListener("open", function () {
                    deferred.resolve(port.send);
                });
                port.addEventListener("close", function () {
                    queue.close();
                    deferred.reject("Connection closed.");
                });
            } else if (port.get && port.put) {
                return port;
            } else {
                throw new Error("An adaptable message port required");
            }
            // Message ports have a start method; call it to make sure
            // that messages get sent.
            port.start && port.start();
            queue = this._queue = PromiseQueue.create().init();
            function onmessage(event) {
                queue.put(event.data);
            }
            if (port.addEventListener) {
                port.addEventListener("message", onmessage, false);
            } else {
                // onmessage is one thing common between WebSocket and
                // WebWorker message ports.
                port.onmessage = onmessage;
            }
            this._port = port;
            this.closed = queue.closed;
            return this;
        }
    },
    get: {
        value: function () {
            return this._queue.get();
        }
    },
    put: {
        value: function (value) {
            return Promise.invoke(this._send, "call", this._port, value);
        }
    },
    forEach: {
        value: PromiseQueue.forEach
    },
    close: {
        value: function (reason, error, rejection) {
            this._port.close && this._port.close();
            return this._queue.close();
        }
    }
});

