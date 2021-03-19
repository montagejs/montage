var test = require('test');
var html = require("simple-template.html");

test.assert(html.content.indexOf('<html>') !== -1, 'can require html');
test.print("DONE", "info");
