"use strict";

var Map = require("./_map");
module.exports = Map;

var PropertyChanges = require("./listen/property-changes");
var MapChanges = require("./listen/map-changes");


if((global.Map === void 0) || (typeof global.Set.prototype.values !== "function")) {
    Object.addEach(Map.prototype, PropertyChanges.prototype);
    Object.addEach(Map.prototype, MapChanges.prototype);
}
else {
    Object.defineEach(Map.prototype, PropertyChanges.prototype, false, /*configurable*/true, /*enumerable*/ false, /*writable*/true);
    Object.defineEach(Map.prototype, MapChanges.prototype, false, /*configurable*/true, /*enumerable*/ false, /*writable*/true);
}
