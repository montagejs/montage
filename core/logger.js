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
/**
 * @module montage/core/logger
 * @requires montage/core/core
 */
var Montage = require("montage").Montage,
    Logger,
    loggers,
    consoleLog,
    consoleLogMontage,
    emptyLoggerFunction,
    getFunctionName,
    toTimeString,
    LoggerUI,
    localStorage;

loggers = exports.loggers = {};

/**
 * @private
 */
getFunctionName = function(montageObject) {
    var aCaller = getFunctionName.caller.caller,
        aFunctionName;
    aFunctionName = aCaller.name;
    if (aFunctionName === "") {
        aFunctionName = "anonymous";
    }
    return aFunctionName;
};

/**
 * @private
 */
toTimeString = function(date) {
    if (date.getHours) {
        var hours = date.getHours(),
        mins = date.getMinutes(),
        secs = date.getSeconds();
        return (hours.length === 1 ? "0" + hours : hours) + ":" + (mins.length === 1 ? "0" + mins : mins) + ":" + (secs.length === 1 ? "0" + secs : secs) + "." + date.getMilliseconds();
    }
};

/**
 * @private
 */
emptyLoggerFunction = function() {
};

/**
 * @private
 */
consoleLog = function() {
    console.log(arguments);
};

/**
 * @private
 */
consoleLogMontage = function() {
    var firstArgument = arguments[0],
        metadata = firstArgument._montage_metadata,
        now = new Date();
    //[].unshift.call(arguments, toTimeString(now));
    if (metadata) {
        [].shift.call(arguments);
        [].unshift.call(arguments, metadata.objectName + "." + getFunctionName(firstArgument) + "()");
        if (this.buffered) {
            this.buffer.push(arguments);
        } else {
            console.debug.apply(console, arguments);
        }
    } else {
        if (this.buffered) {
            this.buffer.push(arguments);
        } else {
            console.debug.apply(console, arguments);
        }
    }

};

/**
 * @class Logger
 * @extends Montage
 */
Logger = exports.Logger = Montage.specialize(/** @lends Logger# */ {

    constructor: {
        value: function Logger() {
            this.super();
        }
    },

   /**
    @function
    @param {String} name The name of the logger.
    @param {State} [dontStoreState=false] If true, don't store the isDebug state of the logger in localStorage .
    @returns itself
    */
    init: {
        value: function(name, onStateChange, dontStoreState) {
            this.name = name;
            this._onStateChange = onStateChange;
            this._storeState = !dontStoreState;
            if (this._storeState && localStorage) {
                var storedState = localStorage.getItem("_montage_logger_" + name);
                if (storedState) {
                    this.isDebug = storedState === "true";
                }
            }
            if (onStateChange) {
                this._onStateChange(storedState === "true");
            }
            this.isError = true;
            return this;
        }
    },

    /**
     * @type {String}
     * @default {String} null
     */
    name: {
        value: null
    },

    /**
     * @private
     * @type {Array}
     * @default {Array} []
     */
    buffer: {
        value: [],
        distinct: true
    },

    /**
     * @type {Property}
     * @default {Boolean} false
     */
    buffered: {
        value: false
    },

    /**
     * Log all the contents the logger's buffer.
     */
    flush: {
        value: function() {
            var buffer = this.buffer,
                args,
                i;
            for (i = 0; (args = buffer[i]); i++) {
                console.debug.apply(console, args);
            }
            this.buffer.length = 0;
        }
    },

    /**
     * @type {Boolean}
     */
    isDebug: {
        get: function() {
            return this.debug !== emptyLoggerFunction;
        },
        set: function(value) {
            if (value) {
                this.debug = consoleLogMontage;
            } else {
                this.debug = emptyLoggerFunction;
            }
        }

    },

    /**
     * @type {Boolean}
     */
    isError: {
        get: function() {
            return this.error !== emptyLoggerFunction;
        },
        set: function(value) {
            if (value) {
                this.error = consoleLogMontage;
            } else {
                this.error = emptyLoggerFunction;
            }
        }
    },

    /**
     * @method Logger#debug
     * @param {Function|String} object If the first argument is a function the logger with print its name
     * @param {String} [...]
     */
    debug: {
        value: emptyLoggerFunction
    },

    /**
     * @method Logger#error
     * @param {Function|String} object If the first argument is a function the logger with print its name
     * @param {String} [...]
     */
    error: {
        value: emptyLoggerFunction
    },

    /**
     * @method Logger#toTimeString
     * @description Prints the current time in format HH:MM:SS.000
     */
    toTimeString: {
        value: toTimeString
    },

    /**
     * @private
     */
    _storeState: {
        value: null
    },

    _onStateChange: {
        value: null
    }
});

/**
    @function module:montage/core/logger#logger
    */
exports.logger = function(loggerName, onStateChange, dontStoreState) {
    var logger;
    if ((logger = loggers[loggerName]) == null) {
        logger = new Logger().init(loggerName, onStateChange, dontStoreState);
        Montage.defineProperty(loggers, loggerName, {
            value: logger
        });
    }
    return logger;
};

LoggerUI = Montage.specialize( /** @lends LoggerUI# */{

    constructor: {
        value: function LoggerUI() {
            this.super();
        }
    },

    init: {
        value: function() {
            if (document.nativeAddEventListener) {
                document.nativeAddEventListener("keyup", this, false);
                document.nativeAddEventListener("keydown", this, false);
            } else {
                document.addEventListener("keyup", this, false);
                document.addEventListener("keydown", this, false);
            }
            return this;
        }
    },

    inspectorElement: {
        value: null
    },

    m_dontRemove: {
        value: null
    },

    titleHeader: {
        value: null
    },

    shown: {
        value: false
    },

    isCtrl: {
        value: false
    },

    isAlt: {
        value: false
    },

    keyup: {
        value: function(event) {
            if (event.which == 17) {
                this.isCtrl = false;
            }
            if (event.which == 18) {
                this.isAlt = false;
            }
        }
    },

    keydown: {
        value: function(event) {
            if (event.which == 17) {
                this.isCtrl = true;
            }
            if (event.which == 18) {
                this.isAlt = true;
            }
            if (event.which == 76 && this.isCtrl === true && this.isAlt === true) {
                if (this.shown) {
                    this.hideInspector();
                } else {
                    this.showInspector();
                }
                return false;
            }
        }
    },

    change: {
        value: function(event) {
            var value = event.target.checked,
                name = event.target.value,
                logger = loggers[name];
            logger.isDebug = value;
            if (logger._onStateChange) {
                logger._onStateChange(value);
            }
            if (logger._storeState && localStorage) {
                localStorage.setItem("_montage_logger_" + name, value);
            }
        }
    },

    mouseup: {
        value: function(event) {
            this.hideInspector();
        }
    },

    showInspector: {
        value: function() {
            if (! this.inspectorElement) {
                var i = 0,
                    iLogger,
                    div1,
                    h1,
                    div2,
                    label,
                    input,
                    storedValue,
                    storageKey,
                    loggerKeys,
                    style,
                    span;
                this.m_dontRemove = document.getElementsByTagName("body")[0];
                ;
                this.inspectorElement = document.createElement("div");
                this.inspectorElement.id = "_montage_logger_inspector";
                div1 = document.createElement("div");
                this.inspectorElement.appendChild(div1);
                div2 = document.createElement("div");
                div1.appendChild(div2);
                h1 = document.createElement("h1");
                h1.className = "_montage_logger_inspector-title";
                h1.textContent = "Logger Inspector";
                this.titleHeader = h1;
                div2.appendChild(h1);
                loggerKeys = Object.keys(loggers);

                for (i = 0; iLogger = loggers[loggerKeys[i]]; i++) {
                    label = document.createElement("label");
                    input = document.createElement("input");
                    span = document.createElement("span");
                    label.className = "_montage_logger_inspector-content";
                    span.textContent = iLogger.name;
                    label.appendChild(input);
                    label.appendChild(span);
                    input.value = iLogger.name;
                    input.type = "checkbox";
                    input.checked = !!iLogger.isDebug;
                    storageKey = "_montage_logger_" + iLogger.name;
                    if (iLogger._storeState && localStorage) {
                        storedValue = localStorage.getItem(storageKey);
                        if (storedValue == null) {
                            localStorage.setItem(storageKey, iLogger.isDebug);
                        }
                    }
                    div2.appendChild(label);
                }
                style = document.createElement("style");
                //YUCK!! I wish I could use a reel!!!
                var styleTest = "#_montage_logger_inspector {";
                styleTest += "    border: 1px solid rgba(15,15,15,0.4);";
                styleTest += "    position: fixed;";
                styleTest += "    right: 25px;";
                styleTest += "    top: 25px;";
                styleTest += "    -webkit-border-radius: 5px;";
                styleTest += "    color: #dddddd;";
                styleTest += '    font: 10px "Lucida Grande","Lucida Sans", sans;';
                styleTest += "    background:-webkit-gradient(linear, left top, left bottom, from(rgba(15,15,15,0.75)), to(rgba(15,15,15,0.95)) );";
                styleTest += "    -webkit-box-shadow: 0 0 15px rgba(0,0,0,.3);";
                styleTest += "    width: 250px;";
                styleTest += "}";
                styleTest += "#_montage_logger_inspector div {";
                styleTest += "    -webkit-border-radius: 5px;";
                styleTest += "    background: -webkit-gradient(radial, 100 -60, 0, 125 -50, 125, from(rgba(255,255,255,0.00)), to(rgba(0,0,0,.2)), color-stop(1, rgba(0,0,0,.2)));";
                styleTest += "}";
                styleTest += "#_montage_logger_inspector div div {";
                styleTest += "    background: -webkit-gradient(linear, left top, left bottom, from(rgba(255,255,255,0.2)), to(rgba(0,0,0,.1)), color-stop(0.33, rgba(255,255,255,.01)), color-stop(0.33, rgba(50,50,50,1)) );";
                styleTest += "    padding: 7px 10px;";
                styleTest += "    -webkit-border-radius: 3px;";
                styleTest += "    overflow-x: hidden;";
                styleTest += "}";
                styleTest += "._montage_logger_inspector-title {";
                styleTest += "    color: rgba(255,255,255,0.9);";
                styleTest += "    font-size: 13px;";
                styleTest += "    margin: 0 0 11px 0;";
                styleTest += "    padding: 0 0 0 5px;";
                styleTest += "}";
                styleTest += "._montage_logger_inspector-content {";
                styleTest += "    padding: 0 0 0 20px;";
                styleTest += "    margin: 0;";
                styleTest += "    display: block;";
                styleTest += "}";
                style.textContent = styleTest;
                document.head.appendChild(style);
            }
            this.shown = true;

            this.m_dontRemove.appendChild(this.inspectorElement);
            this.titleHeader.nativeAddEventListener("mouseup", this, false);
            this.inspectorElement.nativeAddEventListener("change", this, false);

        }
    },

    hideInspector: {
        value: function() {
            if (document.getElementById("_montage_logger_inspector")) {
                this.shown = false;
                this.m_dontRemove.removeChild(this.inspectorElement);
                this.titleHeader.nativeRemoveEventListener("mouseup", this, false);
                this.inspectorElement.nativeRemoveEventListener("change", this, false);
            }
        }
    },

    handleEvent: {
        enumerable: false,
        value: function(event) {
            if (this[event.type]) {
                this[event.type](event);
            }
        }
    }
});

var setupUI = function() {
    new LoggerUI().init();
}
if (typeof window !== "undefined") {
    // assigning to a local allows us to feature-test without typeof
    localStorage = window.localStorage;
    window.loggers = loggers;
    if (window.localStorage) {
        setupUI();
    }
}

