"use strict";

require("../../lib/jasmine-promise");
var Q = require("../../../../q");
var FS = require("../../../fs");
var Mock = require("../../../fs-mock");
var normalize = FS.normal;

describe("copyTree", function () {
    it("should copy a tree", function () {

        var mock = Mock({
            "a/b": {
                "c": {
                    "d": 66,
                    "e": 99
                }
            }
        });

        return Q.fcall(function () {
            return mock.copyTree("a/b", "a/f");
        })
        .then(function () {
            return Q.all([
                mock.isDirectory("a/f"),
                mock.exists("a/f/c"),
                mock.isFile("a/f/c/d"),
                mock.read("a/f/c/e")
            ])
        })
        .then(function (existence) {
            expect(existence.every(Boolean)).toBe(true);
        })

        .then(function () {
            return mock.listTree();
        })
        .then(function (list) {
            expect(list).toEqual([
                ".",
                "a",
                normalize("a/b"),
                normalize("a/b/c"),
                normalize("a/b/c/d"),
                normalize("a/b/c/e"),
                normalize("a/f"),
                normalize("a/f/c"),
                normalize("a/f/c/d"),
                normalize("a/f/c/e")
            ]);
        })

    });

    it("should preserve permissions", function () {
        var mock = Mock({
            "a/b": {
                "c": {
                    "d": 66,
                    "e": 99
                }
            }
        });

        var mode0777 = parseInt("0777", 8);
        var mode0700 = parseInt("0700", 8);

        return Q.all([
            mock.chmod("a/b/c/d", mode0777),
            mock.chmod("a/b", mode0700),
            mock.chmod("a/b/c", mode0700)
        ])
        .then(function () {
            return mock.copyTree("a/b", "a/f");
        })
        .then(function () {
            return Q.all([
                mock.stat("a/f/c/d"),
                mock.stat("a/f"),
                mock.stat("a/f/c")
            ]);
        })
        .spread(function (dStat, fStat, cStat) {
            expect(dStat.node.mode & mode0777).toEqual(mode0777);
            expect(fStat.node.mode & mode0777).toEqual(mode0700);
            expect(cStat.node.mode & mode0777).toEqual(mode0700);
        });
    });
});

