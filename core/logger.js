/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
	@module montage/core/logger
	@requires montage/core/core
*/
var Montage = require("montage").Montage,
    Logger,
    loggers,
    consoleLog,
    consoleLogMontage,
    emptyLoggerFunction,
    getFunctionName,
    toTimeString,
    LoggerUI;

loggers = exports.loggers = {};

/**
 Description TODO
 @function
 @param {Object} montageObject TODO
 @returns aFunctionName
 @private
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
	Description TODO
	@function
    @param {Date} date TODO
    @returns length hours, minutes, seconds, date.getMilliseconds()
    @private
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
	Description TODO
	@function
    @private
*/
emptyLoggerFunction = function() {
};
/**
	Description TODO
	@function
    @private
*/
consoleLog = function() {
    console.log(arguments);
};
/**
	Description TODO
	@function
    @private
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
 @class module:montage/core/logger.Logger
 @extends module:montage/core/core.Montage
 */
Logger = exports.Logger = Montage.create(Montage,/** @lends module:montage/core/logger.Logger# */ {
   /**
    Description TODO
    @function
    @param {String} name The name to be logged.
    @param {State} dontStoreState The state in which the name is to be stored.
    @returns itself
    */
    init: {
        value: function(name, dontStoreState) {
            this.name = name;
            this._storeState = !dontStoreState;
            if (this._storeState) {
                var storedState = localStorage.getItem("_montage_logger_" + name);
                if (storedState) {
                    this.isDebug = storedState === "true";
                }
            }
            this.isError = true;
            return this;
        }
    },
/**
        Description TODO
        @type {Property}
        @default {String} null
    */
    name: {
        value: null
    },
/**
        Description TODO
        @type {Property}
        @default {Array} []
    */
    buffer: {
        value: [],
        distinct: true
    },
/**
        Description TODO
        @type {Property}
        @default {Boolean} false
    */
    buffered: {
        value: false
    },
/**
    Description TODO
    @function
    */
    flush: {
        value: function() {
            var buffer = this.buffer,
                args,
                i;
            for (i = 0; (args = buffer[i]); i++) {
                console.debug.apply(console, args);
            }
        }
    },
/**
        Description TODO
        @type {Function}
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
        Description TODO
        @type {Function}
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
        Description TODO
        @type {Property}
        @default {Function} emptyLoggerFunction
    */
    debug: {
        value: emptyLoggerFunction
    },
/**
        Description TODO
        @type {Property}
        @default {Function} emptyLoggerFunction
    */
    error: {
        value: emptyLoggerFunction
    },
/**
        Description TODO
        @type {Property}
        @default {Function} toTimeString
    */
    toTimeString: {
        value: toTimeString
    },
/**
  @private
*/
    _storeState: {
        value: null
    }
});

/**
    Description TODO
    @function module:montage/core/logger.#logger
    */
exports.logger = function(loggerName, dontStoreState) {
    var logger;
    if ((logger = loggers[loggerName]) == null) {
        logger = Montage.create(Logger).init(loggerName, dontStoreState);
        Montage.defineProperty(loggers, loggerName, {
            value: logger
        });
    }
    return logger;
};

/**
    @class module:montage/core/logger.LoggerUI
*/
LoggerUI = Montage.create(Montage, /** @lends module:montage/core/logger.LoggerUI# */{
    /**
    Description TODO
    @function
    @returns itself
    */
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
/**
        Description TODO
        @type {Property}
        @default {Function} null
    */
    inspectorElement: {
        value: null
    },
/**
        Description TODO
        @type {Property}
        @default {Function} null
    */
    m_dontRemove: {
        value: null
    },
/**
        Description TODO
        @type {Property}
        @default {String} null
    */
    titleHeader: {
        value: null
    },
/**
        Description TODO
        @type {Property}
        @default {Boolean} false
    */
    shown: {
        value: false
    },
/**
        Description TODO
        @type {Property}
        @default {Boolean} false
    */
    isCtrl: {
        value: false
    },
/**
        Description TODO
        @type {Property}
        @default {Boolean} false
    */
    isAlt: {
        value: false
    },

/**
    Description TODO
    @function
    @param {Event} event TODO
    */
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

/**
    Description TODO
    @function
    @param {Event} event TODO
    @returns {Boolean} false
    */
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

/**
    Description TODO
    @function
    @param {Event} event TODO
    */
    change: {
        value: function(event) {
            var value = event.target.checked,
                name = event.target.value,
                logger = loggers[name];
            logger.isDebug = value;
            if (logger._storeState) {
                localStorage.setItem("_montage_logger_" + name, value);
            }
        }
    },
/**
    Description TODO
    @function
    @param {Event} event TODO
    */
    mouseup: {
        value: function(event) {
            this.hideInspector();
        }
    },
/**
    Description TODO
    @function
    */
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
                    if (iLogger._storeState) {
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
                styleTest += "    position: absolute;";
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
/**
    Description TODO
    @function
    */
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
/**
    Description TODO
    @function
    @param {Event} event TODO
    */
    handleEvent: {
        enumerable: false,
        value: function(event) {
            if (this[event.type]) {
                this[event.type](event);
            }
        }
    }
});

/**
    @function module:montage/core/logger.#setupUI
*/
var setupUI = function() {
    LoggerUI.create().init();
}
/**
        Description TODO
        @type {Statement}
        @default window
    */
if (window) {
    window.loggers = loggers;
    if (window.localStorage) {
        setupUI();
    }
}
