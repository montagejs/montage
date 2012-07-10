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
/*global bootstrap */
// This module is used during the boot-strapping, so it can be required as
// a normal CommonJS module, but alternately bootstraps Montage if there
// is a bootstrap global variable.
(function (definition) {
    if (typeof bootstrap !== "undefined") {
        bootstrap("core/url", definition);
    } else {
        definition(require, exports);
    }
})(function (require, exports) {

// from Narwhal's URL module:
// https://raw.github.com/280north/narwhal/master/packages/narwhal-lib/lib/uri.js
// from Chiron's HTTP module:
// http://code.google.com/p/chironjs/source/browse/trunk/src/http.js
// in turn, based on Steve Levithan's work
// http://blog.stevenlevithan.com/archives/parseuri

var urlKeys = [
    "url",
    "scheme",
    "authorityRoot",
    "authority",
        "userInfo",
            "user",
            "password",
        "domain",
        "port",
    "path",
        "root",
        "directory",
        "file",
    "search",
        "query",
    "hash"
];

var urlExpression = new RegExp( /* url */
    "^" +
    "(?:" +
        "([^:/?#]+):" + /* scheme */
    ")?" +
    "(?:" +
        "(//)" + /* authorityRoot */
        "(" + /* authority */
            "(?:" +
                "(" + /* userInfo */
                    "([^:@]*)" + /* user */
                    ":?" +
                    "([^@]*)" + /* password */
                ")?" +
                "@" +
            ")?" +
            "([^:/?#]*)" + /* domain */
            "(?::(\\d*))?" + /* port */
        ")" +
    ")?" +
    "(" + /* path */
        "(/?)" + /* root */
        "((?:[^?#/]*/)*)" +
        "([^?#]*)" + /* file */
    ")" +
    "(\\?([^#]*))?" + /* search, query */
    "(?:#(.*))?" + /* hash */
    "$"
);

exports.parse = function (url) {
    url = String(url);

    var items = {};
    var parts = urlExpression.exec(url);
    var i;

    for (i = 0; i < parts.length; i++) {
        items[urlKeys[i]] = parts[i] ? parts[i] : "";
    }

    items.root = (items.root || items.authorityRoot) ? '/' : '';

    items.directories = items.directory.split("/");
    if (items.directories[items.directories.length - 1] == "") {
        items.directories.pop();
    }

    /* normalize */
    var directories = [];
    for (i = 0; i < items.directories.length; i++) {
        var directory = items.directories[i];
        if (directory == '.') {
        } else if (directory == '..') {
            if (directories.length && directories[directories.length - 1] != '..')
                directories.pop();
            else
                directories.push('..');
        } else {
            directories.push(directory);
        }
    }
    items.directories = directories;

    items.domains = items.domain.split(".");

    return items;
};

exports.format = function (object) {
    if (typeof(object) == 'undefined')
        throw new Error("UrlError: URL undefined for urls#format");
    if (object instanceof String || typeof(object) == 'string')
        return object;
    var domain =
        object.domains ?
        object.domains.join(".") :
        object.domain;
    var userInfo = (
            object.user ||
            object.password
        ) ?
        (
            (object.user || "") +
            (object.password ? ":" + object.password : "")
        ) :
        object.userInfo;
    var authority = (
            userInfo ||
            domain ||
            object.port
        ) ? (
            (userInfo ? userInfo + "@" : "") +
            (domain || "") +
            (object.port ? ":" + object.port : "")
        ) :
        object.authority;
    var directory =
        object.directories ?
        object.directories.join("/") :
        object.directory;
    var path =
        directory || object.file ?
        (
            (directory ? directory + "/" : "") +
            (object.file || "")
        ) :
        object.path;
    var search =
        object.query ? "?" + object.query :
        (object.search || "");
    return (
        (object.scheme ? object.scheme + ":" : "") +
        (authority ? "//" + authority : "") +
        (object.root || (authority && path) ? "/" : "") +
        (path ? path : "") +
        (search) +
        (object.hash ? "#" + object.hash : "")
    ) || object.url || "";
};

/*
    returns an object representing a URL resolved from
    a relative location and a source location.
*/
exports.resolveObject = function (source, relative) {
    if (!source)
        return relative;

    source = exports.parse(source);
    relative = exports.parse(relative);

    if (relative.url == "")
        return source;

    delete source.url;
    delete source.authority;
    delete source.domain;
    delete source.userInfo;
    delete source.path;
    delete source.directory;
    delete source.search;
    delete source.query;
    delete source.hash;

    if (relative.authorityRoot) {
        if (!relative.scheme) {
            relative.scheme = source.scheme;
        }
        source = relative;
    } else if (
        relative.scheme && relative.scheme != source.scheme ||
        relative.authority && relative.authority != source.authority
    ) {
        source = relative;
    } else if (relative.root) {
        source.directories = relative.directories;
    } else {

        var directories = source.directories
            .concat(relative.directories);
        source.directories = [];
        for (var i = 0; i < directories.length; i++) {
            var directory = directories[i];
            if (directory == "") {
            } else if (directory == ".") {
            } else if (directory == "..") {
                if (source.directories.length) {
                    source.directories.pop();
                } else {
                    source.directories.push('..');
                }
            } else {
                source.directories.push(directory);
            }
        }

        if (relative.file == ".") {
            relative.file = "";
        } else if (relative.file == "..") {
            source.directories.pop();
            relative.file = "";
        }
    }


    if (relative.root)
        source.root = relative.root;
    if (relative.protcol)
        source.scheme = relative.scheme;
    if (relative.path || !relative.hash)
        source.file = relative.file;
    if (relative.query)
        source.query = relative.query;
    if (relative.hash)
        source.hash = relative.hash;

    return source;
};

/**** relativeObject
    returns an object representing a relative URL to
    a given target URL from a source URL.
*/
exports.relativeObject = function (source, target) {
    target = exports.parse(target);
    source = exports.parse(source);

    delete target.url;

    if (
        target.scheme == source.scheme &&
        target.authority == source.authority
    ) {
        delete target.scheme;
        delete target.authority;
        delete target.userInfo;
        delete target.user;
        delete target.password;
        delete target.domain;
        delete target.domains;
        delete target.port;
        if (
            !!target.root == !!source.root && !(
                target.root &&
                target.directories[0] != source.directories[0]
            )
        ) {
            delete target.path;
            delete target.root;
            delete target.directory;
            while (
                source.directories.length &&
                target.directories.length &&
                target.directories[0] == source.directories[0]
            ) {
                target.directories.shift();
                source.directories.shift();
            }
            while (source.directories.length) {
                source.directories.shift();
                target.directories.unshift('..');
            }

            if (!target.root && !target.directories.length && !target.file && source.file)
                target.directories.push('.');

            if (source.file == target.file)
                delete target.file;
            if (source.query == target.query)
                delete target.query;
            if (source.hash == target.hash)
                delete target.hash;
        }
    }

    return target;
};

/**
 * @returns a URL resovled to a relative URL from a source URL.
 */
exports.resolve = function (source, relative) {
    return exports.format(exports.resolveObject(source, relative));
};

/**
 * @returns a relative URL to a target from a source.
 */
exports.relative = function (source, target) {
    return exports.format(exports.relativeObject(source, target));
};

});
