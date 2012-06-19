exports = {
    "hello": "Hello",
    "num_albums": function(d) {
        var r = "";
        if (!d) {
            throw new Error("MessageFormat: No data passed to function.");
        }
        var lastkey_1 = "albums";
        var k_1 = d[lastkey_1];
        var off_0 = 0;
        var pf_0 = {
            "one": function(d) {
                var r = "";
                r += "1 album";
                return r;
            },
            "other": function(d) {
                var r = "";
                r += "" + (function() {
                    var x = k_1 - off_0;
                    if (isNaN(x)) {
                        throw new Error("MessageFormat: `" + lastkey_1 + "` isnt a number.");
                    }
                    return x;
                })() + " albums";
                return r;
            }
        };
        if (pf_0[k_1 + ""]) {
            r += pf_0[k_1 + ""](d);
        } else {
            r += (pf_0[MessageFormat.locale["en"](k_1 - off_0)] || pf_0["other"])(d);
        }
        return r;
    },
    "welcome": function(d) {
        var r = "";
        r += "Welcome to the site, ";
        if (!d) {
            throw new Error("MessageFormat: No data passed to function.");
        }
        r += d["name"];
        return r;
    },
    "photo_deleted": function(d) {
        var r = "";
        if (!d) {
            throw new Error("MessageFormat: No data passed to function.");
        }
        r += d["photo_name"];
        r += " was deleted";
        return r;
    }
};
