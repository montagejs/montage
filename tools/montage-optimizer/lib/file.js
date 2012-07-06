
var FS = require("q-fs");
var Q = require("q");

exports.File = File;
function File(options) {
    for (var name in options) {
        this[name] = options[name];
    }
}

Object.defineProperties(File.prototype, {
    utf8: {
        get: function () {
            if (this._shelved) {
                throw new Error("Cannot get shelved content: " + JSON.stringify(this.name));
            }
            if (this._utf8 === undefined) {
                this._utf8 = this._content.toString("utf-8");
            }
            return this._utf8;
        },
        set: function (utf8) {
            this.touch();
            this._utf8 = utf8;
            this._content = undefined;
        }
    },
    content: {
        get: function () {
            if (this._shelved) {
                throw new Error("Cannot get shelved content: " + JSON.stringify(this.name));
            }
            if (this._content === undefined) {
                this._content = new Buffer(this._utf8, "utf-8");
            }
            if (typeof this._content !== "object") {
                throw new Error("Assertion filed, content must be a buffer");
            }
            return this._content;
        },
        set: function (content) {
            if (typeof content !== "object") {
                throw new Error("Assertion filed, content must be a buffer");
            }
            this.touch();
            this._content = content;
            this._utf8 = undefined;
        }
    },
    shelf: {
        value: function () {
            if (this._modified) {
                throw new Error("Cannot shelf modified content: " + JSON.stringify(this.name));
            } else {
                this._content = undefined;
                this._utf8 = undefined;
                this._shelved = true;
            }
        }
    },
    touch: {
        value: function () {
            if (this._new) {
                this._modified = true;
            } else {
                this._new = true;
            }
        }
    },
    write: {
        value: function (target) {
            var self = this;
            return Q.call(function () {
                if (self._shelved) {
                    return FS.read(self.name, "b");
                } else {
                    return self.content;
                }
            })
            .then(function (content) {
                return FS.write(target, content, "wb");
            });
        }
    }
});

