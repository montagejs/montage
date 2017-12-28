/*jshint node:true, browser:false */
var jasmineRequire = require('jasmine-core/lib/jasmine-core/jasmine.js');
var JasmineConsoleReporter = require('jasmine-console-reporter');
var Montage = require('../montage');
var PATH = require("path");
global.XMLHttpRequest = require('xhr2');
// Init
var jasmine = jasmineRequire.core(jasmineRequire);
var jasmineEnv = jasmine.getEnv();
    
// Export interface
var jasmineInterface = jasmineRequire.interface(jasmine, jasmineEnv);
global.jasmine = jasmine;
global.jasmineRequire = jasmineRequire;
for (var property in jasmineInterface) {
    if (jasmineInterface.hasOwnProperty(property)) {
       global[property] = jasmineInterface[property];
    }
} 

// Default reporter
jasmineEnv.addReporter(jasmineInterface.jsApiReporter);

// Html reporter
var consoleReporter = new JasmineConsoleReporter({
    colors: 1,         
    cleanStack: 1,      
    verbosity: 4,        
    listStyle: 'indent', 
    activity: false
});
jasmineEnv.addReporter(consoleReporter);

// Exit code
var exitCode = 0;
jasmineEnv.addReporter({
    specDone: function(result) {
        exitCode = exitCode || result.status === 'failed' ? 1 : 0;
    }
});

// Load package
Montage.loadPackage(PATH.join(__dirname, "."), {
    mainPackageLocation: PATH.join(__dirname, "../")
})
// Preload montage to avoid montage-testing/montage to be loaded
.then(function (mr) {
    return mr.async('montage').then(function (montage) {
         return mr;
    });
})
// Execute
.then(function (mr) {
    return mr.async("all");
}).then(function () {
    console.log('Done');
}, function (err) {
    console.error('Fail', err, err.stack);
    exitCode = 1;
}).then(function () {
    process.exit(exitCode);
}).thenReturn();

