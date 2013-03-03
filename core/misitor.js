function Misitor(handlers) {
    this._handlers = handlers;
    this._enteredObjects = {};
}

if (typeof exports !== "undefined") {
    exports.Misitor = Misitor;
    exports.visit = function(object, handlers) {
        var misitor = new Misitor(handlers);
        misitor.visit(object);
    };
}

Misitor.prototype._handlers = null;
Misitor.prototype._enteredObjects = null;

Misitor.prototype._isObjectEntered = function(object) {
    return Object.hash(object) in this._enteredObjects;
};

Misitor.prototype._markObjectAsEntered = function(object) {
    this._enteredObjects[Object.hash(object)] = true;
};

Misitor.prototype.visit = function(value, name) {
    this._visitValue(value, name);
}

Misitor.prototype._getTypeOf = function(value) {
    if (Array.isArray(value)) {
        return "array";
    } else if (RegExp.isRegExp(value)) {
        return "regexp";
    } else if (value === null) {
        return "null";
    } else if (typeof value === "object") {
        return this._getObjectType(value);
    } else {
        return typeof value;
    }
}

Misitor.prototype._getObjectType = function(object) {
    var visitor = this._handlers,
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

Misitor.prototype._visitValue = function(value, name) {
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

Misitor.prototype._visitCustomType = function(type, object, name) {
    var willEnterCustomType;

    if (this._isObjectEntered(object)) {
        this._callVisitorMethod("visit" + type, object, name);
    } else {
        willEnterCustomType = this._callVisitorMethod("willEnter" + type, object, name);
        if (willEnterCustomType !== false) {
            this._markObjectAsEntered(object);
            this._enterCustomObject(type, object, name);
        }
    }
}

Misitor.prototype._enterCustomObject = function(type, object, name) {
    this._callVisitorMethod("enter" + type, object, name);
    this._callVisitorMethod("exit" + type, object, name);
}

Misitor.prototype._visitObject = function(object, name) {
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

Misitor.prototype._enterObject = function(object, name) {
    var keys = Object.keys(object),
        key;

    this._callVisitorMethod("enterObject", object, name);

    for (var i = 0, ii = keys.length; i < ii; i++) {
        key = keys[i];
        this._visitValue(object[key], key);
    }

    this._callVisitorMethod("exitObject", object, name);
}

Misitor.prototype._visitArray = function(array, name) {
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

Misitor.prototype._enterArray = function(array, name) {
    this._callVisitorMethod("enterArray", array, name);

    for (var i = 0, ii = array.length; i < ii; i++) {
        this._visitValue(array[i], ""+i);
    }

    this._callVisitorMethod("exitArray", array, name);
}

Misitor.prototype._visitRegExp = function(regexp, name) {
    this._callVisitorMethod("visitRegExp", regexp, name);
}

Misitor.prototype._visitString = function(string, name) {
    this._callVisitorMethod("visitString", string, name);
}

Misitor.prototype._visitNumber = function(number, name) {
    this._callVisitorMethod("visitNumber", number, name);
}

Misitor.prototype._visitBoolean = function(boolean, name) {
    this._callVisitorMethod("visitBoolean", boolean, name);
}

Misitor.prototype._visitNull = function(name) {
    this._callVisitorMethod("visitNull", name);
}

Misitor.prototype._visitUndefined = function(name) {
    this._callVisitorMethod("visitUndefined", name);
}

Misitor.prototype._callVisitorMethod = function(methodName /*, args... */) {
    var visitor = this._handlers,
        args;

    if (typeof visitor[methodName] === "function") {
        args = Array.prototype.slice.call(arguments, 1);
        // the first parameter of the handler function is always the misitor
        args.unshift(this);

        return visitor[methodName].apply(
            visitor,
            args);
    }
}

if (!Array.isArray) {
    Array.isArray = function(obj) {
        return Object.prototype.toString.call(obj) === "[object Array]";
    }
}

if (!RegExp.isRegExp) {
    RegExp.isRegExp = function(obj) {
        return Object.prototype.toString.call(obj) === "[object RegExp]";
    }
}