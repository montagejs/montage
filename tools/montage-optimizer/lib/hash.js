
var CRYPTO = require("crypto");

exports.Hash = function () {
    var hash = new CRYPTO.Hash("sha256");
    return {
        update: function (data) {
            hash.update(data);
        },
        digest: function () {
            return base16(new Buffer(hash.digest(), 'binary'));
        }
    };
};

function base16(buffer) {
    var alphabet = "0123456789abcdef";
    return Array.prototype.map.call(buffer, function (n) {
        return (
            alphabet[(n & 0xF0) >> 4] +
            alphabet[(n & 0x0F) >> 0]
        );
    }).join("");
}

