
require("./require-spec");

var jasmineEnv = jasmine.getEnv();
jasmineEnv.updateInterval = 1000;

var htmlReporter = new jasmine.HtmlReporter();
this.jsApiReporter = new jasmine.JsApiReporter();

jasmineEnv.addReporter(htmlReporter);
jasmineEnv.addReporter(this.jsApiReporter);

jasmineEnv.specFilter = function(spec) {
    return htmlReporter.specFilter(spec);
};

var currentWindowOnload = window.onload;

if (currentWindowOnload) {
    currentWindowOnload();
}
execJasmine();

function execJasmine() {
    jasmineEnv.execute();
}

