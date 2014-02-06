module.exports = function(grunt) {
    var browsers = [{
        browserName: "firefox",
        version: "19",
        platform: "XP"
    }, {
        browserName: "chrome",
        platform: "XP"
    }, {
        browserName: "opera",
        platform: "Windows 7",
        version: "12"
    }];

    grunt.initConfig({
        connect: {
            server: {
                options: {
                    base: "",
                    port: 9998
                }
            }
        },
        'saucelabs-jasmine': {
            all: {
                options: {
                    urls: ["http://127.0.0.1:9998/test/run-sauce.html"],
                    tunnelTimeout: 5,
                    testReadyTimeout: 20000,
                    testTimeout: 1000000,
                    testInterval: 5000,
                    build: process.env.TRAVIS_JOB_ID,
                    concurrency: 3,
                    browsers: browsers,
                    testname: "Montage tests",
                    tags: ["exploratory"]
                }
            }
        },
        watch: {}
    });

    // Loading dependencies
    for (var key in grunt.file.readJSON("package.json").devDependencies) {
        if (key !== "grunt" && key.indexOf("grunt") === 0) grunt.loadNpmTasks(key);
    }

    grunt.registerTask("dev", ["connect", "watch"]);
    grunt.registerTask("test", ["connect", "saucelabs-jasmine"]);
};
