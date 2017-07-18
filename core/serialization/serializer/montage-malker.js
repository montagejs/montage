var Montage = require("../../core").Montage;

var MontageWalker = exports.MontageWalker = Montage.specialize({
    _visitHandler: {value: null},
    _enteredObjects: { value: null },
    legacyMode: { value: false },

    constructor: {
        value: function Malker(visitHandler, legacyMode) {
            this._visitHandler = visitHandler;
            this.legacyMode = !!legacyMode;
            this._enteredObjects = {};
        }
    },

    _isObjectEntered: {
        value: function(object) {
            return Object.hash(object) in this._enteredObjects;
        }
    },

    _markObjectAsEntered: {
        value: function(object) {
            this._enteredObjects[Object.hash(object)] = true;
        }
    },

    visit: {
        value: function(value, name) {
            this._visitValue(value, name);
        },
        enumerable: true
    },

    _getTypeOf: {
        value: function(value) {
            if (Array.isArray(value)) {
                return "array";
            } else if (RegExp.isRegExp(value)) {
                return "regexp";
            } else if (value === null) {
                return "null";
            } else if (typeof value === "object" || typeof value === "function") {
                return this._getObjectType(value);
            } else {
                return typeof value;
            }
        }
    },

    _getObjectType: {
        value: function(object) {
            var visitor = this._visitHandler,
                type;

            if (typeof visitor.getTypeOf === "function") {
                type = visitor.getTypeOf(object);
            }

            if (typeof type === "undefined") {
                return typeof object;
            } else {
                return type;
            }
        }
    },

    _visitValue: {
        value: function(value, name) {
            var type = this._getTypeOf(value);

            if (type === "object") {
                this._visitObject(value, name);
            } else if (type === "array") {
                this._visitArray(value, name);
            } else if (type === "regexp") {
                this._visitRegExp(value, name);
            } else if (type === "number") {
                this._visitNumber(value, name);
            } else if (type === "string") {
                this._visitString(value, name);
            } else if (type === "boolean") {
                this._visitBoolean(value, name);
            } else if (type === "null") {
                this._visitNull(name);
            } else if (type === "undefined") {
                this._visitUndefined(name);
            } else {
                this._visitCustomType(type, value, name);
            }
        }
    },

    _visitCustomType: {
        value: function(type, object, name) {
            this._callVisitorMethod("visit" + type, object, name);
        }
    },

    _enterCustomObject: {
        value: function(type, object, name) {
            this._callVisitorMethod("enter" + type, object, name);
            this._callVisitorMethod("exit" + type, object, name);
        }
    },

    _visitObject: {
        value: function(object, name) {
            var willEnterObject;

            if (this._isObjectEntered(object)) {
                this._callVisitorMethod("visitObject", object, name);
            } else {
                willEnterObject = this._callVisitorMethod("willEnterObject", object, name);
                if (willEnterObject !== false) {
                    this._markObjectAsEntered(object);
                    this._enterObject(object, name);
                }
            }
        }
    },

    _enterObject: {
        value: function(object, name) {
            var keys = Object.keys(object),
                key;

            this._callVisitorMethod("enterObject", object, name);

            for (var i = 0, ii = keys.length; i < ii; i++) {
                key = keys[i];
                this._visitValue(object[key], key);
            }

            this._callVisitorMethod("exitObject", object, name);
        }
    },

    _visitArray: {
        value: function(array, name) {
            var willEnterArray;

            if (this._isObjectEntered(array)) {
                this._callVisitorMethod("visitArray", array, name);
            } else {
                willEnterArray = this._callVisitorMethod("willEnterArray", array, name);
                if (willEnterArray !== false) {
                    this._markObjectAsEntered(array);
                    this._enterArray(array, name);
                }
            }
        }
    },

    _enterArray: {
        value: function(array, name) {
            this._callVisitorMethod("enterArray", array, name);

            for (var i = 0, ii = array.length; i < ii; i++) {
                this._visitValue(array[i], ""+i);
            }

            this._callVisitorMethod("exitArray", array, name);
        }
    },

    _visitRegExp: {
        value: function(regexp, name) {
            this._callVisitorMethod("visitRegExp", regexp, name);
        }
    },

    _visitString: {
        value: function(string, name) {
            this._callVisitorMethod("visitString", string, name);
        }
    },

    _visitNumber: {
        value: function(number, name) {
            this._callVisitorMethod("visitNumber", number, name);
        }
    },

    _visitBoolean: {
        value: function(boolean, name) {
            this._callVisitorMethod("visitBoolean", boolean, name);
        }
    },

    _visitNull: {
        value: function(name) {
            this._callVisitorMethod("visitNull", name);
        }
    },

    _visitUndefined: {
        value: function(name) {
            this._callVisitorMethod("visitUndefined", name);
        }
    },

    _callVisitorMethod: {
        value: function(methodName /*, args... */) {
            var visitor = this._visitHandler,
                args;

            if (typeof visitor[methodName] === "function") {
                args = Array.prototype.slice.call(arguments, 1);
                // the first parameter of the handler function is always the malker
                args.unshift(this);

                return visitor[methodName].apply(
                    visitor,
                    args);
            }
        }
    }
});

exports.visit = function(object, visitHandler, legacyMode) {
    var malker = new MontageWalker(visitHandler, legacyMode);
    malker.visit(object);
};
