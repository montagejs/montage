var test = require("test");
var object = require("./object");

test.assert(object.model._montage_metadata, "should expose _montage_metadata on exports properties");
test.assert(object.model._montage_metadata.module === 'object', "should expose module on _montage_metadata");
test.assert(object.model._montage_metadata.property === 'model', "should expose module on _montage_metadata");
test.assert(object.model._montage_metadata.require, "should expose require on _montage_metadata");
test.print("DONE", "info");
