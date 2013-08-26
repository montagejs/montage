
var bootstrap = require("./browser");
var preload = require("mr/preload");

module.exports = function bootstrapPreload(plan) {
    return bootstrap(preload(plan));
};

