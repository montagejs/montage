
var Target = require("./target").Target;

//Todo, to run in node, we'll need to bring in something like the ws npm package.

/* A WebSocket that offers automatic reconnection and re-send of data that couldn't if closed. */

var _WebSocket = global.WebSocket,
    WebSocket = exports.WebSocket = Target.specialize({

    /*
        The constructor can throw exceptions from inside _connect():

        SECURITY_ERR
        The port to which the connection is being attempted is being blocked.

    */
    constructor: {
        value: function WebSocket(url, protocols) {
            this._url = url;
            this._protocols = protocols;
            this._messageQueue = [];
            this._webSocket = null;
            this._isMessagePending = false;
            this._isReconnecting = false;
            this._connect();
            return this;
        }
    },

    _url: {
        value: undefined
    },
    _protocols: {
        value: undefined
    },
    _messageQueue: {
        value: undefined
    },
    _webSocket: {
        value: undefined
    },
    _isMessagePending: {
        value: undefined
    },
    reconnectionInterval: {
        value: 100
    },
    _connect: {
        value: function () {
        this._webSocket = new _WebSocket(this._url,this._protocols);
        this._webSocket.addEventListener("error", this, false);
        this._webSocket.addEventListener("open", this, false);
        }
    },
    send: {
        value: function send(data) {
            this._messageQueue.push(data);
            this._sendNextMessage();
        }
    },
    _sendNextMessage: {
        value: function () {
            if (!this._isMessagePending && this._messageQueue.length) {
                if (this._webSocket) {
                    this._isMessagePending = true;
                    if ((this._webSocket.readyState !== WebSocket.CLOSING) && (this._webSocket.readyState !== WebSocket.CLOSED)) {
                        try {
                            this._webSocket.send(this._messageQueue[0]);
                        } catch (e) {
                            this._isMessagePending = false;
                            this._reconnect();
                        }
                    } else {
                        this._isMessagePending = false;
                        this._reconnect();
                    }
                } else {
                    this._reconnect();
                }
            }
        }
    },
    _reconnect: {
        value: function () {
            var self;

            //if (this._messageQueue.length && !this._isReconnecting) {
            if (!this._isReconnecting) {
                self = this;
                this._webSocket = null;
                this._isMessagePending = false;
                this._isReconnecting = true;
                setTimeout(function () {
                    self._connect();
                    self._isReconnecting = false;
                }, Math.random() * this._reconnectionInterval);
                this._reconnectionInterval *= 2;
                if (this._reconnectionInterval > 30000) {
                    this._reconnectionInterval = 30000;
                }
            }
        }
    },

    handleEvent: {
        value: function (event) {
            switch (event.type) {
                case "open":
                    this._reconnectionInterval = 100;
                    if (this._webSocket) {
                        this._webSocket.addEventListener("message", this, false);
                        this._webSocket.addEventListener("close", this, false);
                    }
                    this.dispatchEvent(event);
                    this._sendNextMessage();
                break;
                case "message":
                    this._isMessagePending = false;
                    this._messageQueue.shift();
                    this.dispatchEvent(event);
                    this._sendNextMessage();
                break;
                default:
                    this.dispatchEvent(event);
                    this._reconnect();
            }
        }
    },
    close: {
        value: function close(code, reason) {
            return this._webSocket.close(code, reason);
        }
    },
    binaryType: {
        get: function () {
            return this._webSocket.binaryType;
        },
        set: function (value) {
            this._webSocket.binaryType = value;
        }
    },
    bufferedAmount: {
        get: function () {
            return this._webSocket.bufferedAmount;
        }
    },
    extensions: {
        get: function () {
            return this._webSocket.extensions;
        },
        set: function (value) {
            this._webSocket.extensions = value;
        }
    },
    protocol: {
        get: function () {
            return this._webSocket.protocol;
        }
    },
    readyState: {
        get: function () {
            return this._webSocket.readyState;
        }
    },

    //Events Handlers
    _onclose: {
        value: undefined
    },
    onclose: {
        get: function () {
            return this._onclose;
        },
        set: function (eventListener) {
            if(eventListener !== this._onclose) {
                this.removeEventListener("close", this._onclose, false);
                this._onclose = eventListener;
            }
            this.addEventListener("close", eventListener, false);
        }
    },
    _onerror: {
        value: undefined
    },
     onerror: {
        get: function () {
            return this._onerror;
        },
        set: function (eventListener) {
            if(eventListener !== this._onerror) {
                this.removeEventListener("error", this._onerror, false);
                this._onerror = eventListener;
            }
            this.addEventListener("error", eventListener, false);
        }
    },
   _onmessage: {
        value: undefined
    },
    onmessage: {
        get: function () {
            return this._onmessage;
        },
        set: function (eventListener) {
            if(eventListener !== this._onmessage) {
                this.removeEventListener("message", this._onmessage, false);
                this._onmessage = eventListener;
            }
            this.addEventListener("message", eventListener, false);
        }
    },
   _onopen: {
        value: undefined
    },
    onopen: {
        get: function () {
            return this._onopen;
        },
        set: function (eventListener) {
            if(eventListener !== this._onopen) {
                this.removeEventListener("open", this._onopen, false);
                this._onopen = eventListener;
            }
            this.addEventListener("open", eventListener, false);
        }
    }

},{
    CONNECTING:	{
        value: 0	//The connection is not yet open.
    },
    OPEN: {
        value: 1	//The connection is open and ready to communicate.
    },
    CLOSING: {
        value: 2	//The connection is in the process of closing.
    },
    CLOSED:	{
        value: 3	//The connection is closed or couldn't be opened.
    }
});
