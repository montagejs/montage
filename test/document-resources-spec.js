/* <copyright>
Copyright (c) 2013, António Afonso
All Rights Reserved.
</copyright> */
var Montage = require("montage").Montage,
    DocumentResources = require("montage/ui/document-resources").DocumentResources,
    Promise = require("montage/q");

function createPage(url) {
    var iframe = document.createElement("iframe"),
        deferred = Promise.defer();

    iframe.src = url;
    iframe.onload = function() {
        deferred.resolve(iframe.contentWindow);
    };
    iframe.style.display = "none";
    document.body.appendChild(iframe);

    iframe.contentWindow.__iframe__ = iframe;

    return deferred.promise;
}

function deletePage(page) {
    var iframe = page.__iframe__;

    iframe.parentNode.removeChild(iframe);
}

describe("document-resources-spec", function() {
    it("should add an inline script", function() {
        var resources = DocumentResources.create(),
            script;

        return createPage("reel/template/page.html")
        .then(function(page) {
            resources.initWithDocument(page.document);

            script = page.document.createElement("script");
            script.textContent = "window.InlineScriptLoaded = 1;";

            return resources.addScript(script)
            .then(function() {
                expect(page.document.scripts.length).toBe(1);
                expect(page.InlineScriptLoaded).toBe(1);
                deletePage(page);
            });

        }).fail(function(reason) {
            expect("test").toBe("executed");
        });
    });

    it("should add a script file", function() {
        var resources = DocumentResources.create(),
            url = "resource.js",
            script;

        return createPage("reel/template/page.html")
        .then(function(page) {
            resources.initWithDocument(page.document);

            script = page.document.createElement("script");
            script.src = url;

            return resources.addScript(script)
            .then(function() {
                expect(page.document.scripts.length).toBe(1);
                deletePage(page);
            });

        }).fail(function(reason) {
            expect("test").toBe("executed");
        });
    });

    it("should know its loaded resources", function() {
        var resources = DocumentResources.create(),
            url = "resource.js",
            script;

        return createPage("reel/template/page.html")
        .then(function(page) {
            resources.initWithDocument(page.document);

            script = page.document.createElement("script");
            script.src = url;

            return resources.addScript(script)
            .then(function() {
                var src = page.document.scripts[0].src;

                expect(resources.hasResource(src)).toBe(true);
                deletePage(page);
            });

        }).fail(function(reason) {
            expect("test").toBe("executed");
        });
    });

    it("should add a script file even if it 404's", function() {
        var resources = DocumentResources.create(),
            url = "notfound.js",
            script;

        return createPage("reel/template/page.html")
        .then(function(page) {
            resources.initWithDocument(page.document);

            script = page.document.createElement("script");
            script.src = url;

            return resources.addScript(script)
            .then(function() {
                expect(page.document.scripts.length).toBe(1);
                deletePage(page);
            });

        }).fail(function(reason) {
            expect("test").toBe("executed");
        });
    });

    it("should not add a script file twice when requested in serial", function() {
        var resources = DocumentResources.create(),
            url = "resource.js",
            script;

        return createPage("reel/template/page.html")
        .then(function(page) {
            resources.initWithDocument(page.document);

            script = page.document.createElement("script");
            script.src = url;

            return resources.addScript(script)
            .then(function() {
                script = page.document.createElement("script");
                script.src = url;

                return resources.addScript(script)
                .then(function() {
                    expect(page.document.scripts.length).toBe(1);
                    deletePage(page);
                });
            });

        }).fail(function(reason) {
            console.log(reason.stack);
            expect("test").toBe("executed");
        });
    });

    it("should not add a script file twice when requested in parallel", function() {
        var resources = DocumentResources.create(),
            url = "resource.js",
            script1,
            script2;

        return createPage("reel/template/page.html")
        .then(function(page) {
            resources.initWithDocument(page.document);

            script1 = page.document.createElement("script");
            script1.src = url;
            script2 = page.document.createElement("script");
            script2.src = url;

            return Promise.all([
                resources.addScript(script1),
                resources.addScript(script2)
            ]).then(function() {
                expect(page.document.scripts.length).toBe(1);
                deletePage(page);
            });
        }).fail(function(reason) {
            expect("test").toBe("executed");
        });
    });

    it("should add a scripts even if it timesout", function() {
        var resources = DocumentResources.create(),
            // The server is available as template-server.js
            url = "http://localhost:9090/resource.js?delay=60000",
            script;

        return createPage("reel/template/page.html")
        .then(function(page) {
            var initialTime = new Date;

            resources.initWithDocument(page.document);
            // The default is too much wait for in a test, change it to 500ms.
            resources._SCRIPT_TIMEOUT = 500;

            script = page.document.createElement("script");
            script.src = url;

            return resources.addScript(script)
            .then(function() {
                var finalTime = new Date;

                expect(page.document.scripts.length).toBe(1);
                expect(finalTime - initialTime).toBeLessThan(60000);
                deletePage(page);
            });

        }).fail(function(reason) {
            expect("test").toBe("executed");
        });
    });

    it("should preload a resource", function() {
        var resources = DocumentResources.create(),
            url = "resource.js",
            script;

        return createPage("reel/template/page.html")
        .then(function(page) {
            resources.initWithDocument(page.document);

            return resources.preloadResource(url)
            .then(function() {
                var normalizedUrl = resources.normalizeUrl(url);

                expect(resources.isResourcePreloaded(normalizedUrl)).toBe(true);
                deletePage(page);
            });

        }).fail(function(reason) {
            console.log(reason.stack);
            expect("test").toBe("executed");
        });
    });

    it("should preload a resource even if it 404's", function() {
        var resources = DocumentResources.create(),
            url = "notfound.js",
            script;

        return createPage("reel/template/page.html")
        .then(function(page) {
            resources.initWithDocument(page.document);

            return resources.preloadResource(url)
            .then(function() {
                var normalizedUrl = resources.normalizeUrl(url);

                expect(resources.isResourcePreloaded(normalizedUrl)).toBe(true);
                deletePage(page);
            });

        }).fail(function(reason) {
            console.log(reason.stack);
            expect("test").toBe("executed");
        });
    });

    it("should preload a resource even if it timesout", function() {
        var resources = DocumentResources.create(),
            // The server is available as template-server.js
            url = "http://localhost:9090/resource.js?delay=60000",
            script;

        return createPage("reel/template/page.html")
        .then(function(page) {
            var initialTime = new Date;

            resources.initWithDocument(page.document);
            // The default is too much wait for in a test, change it to 500ms.
            resources._SCRIPT_TIMEOUT = 500;

            return resources.preloadResource(url)
            .then(function() {
                var finalTime = new Date;

                expect(resources.isResourcePreloaded(url)).toBe(true);
                expect(finalTime - initialTime).toBeLessThan(60000);
                deletePage(page);
            });
        }).fail(function(reason) {
            console.log(reason.stack);
            expect("test").toBe("executed");
        });
    });

    it("should add an inline style", function() {
        var resources = DocumentResources.create();

        return createPage("reel/template/page.html")
        .then(function(page) {
            var style,
                computedStyle;

            resources.initWithDocument(page.document);

            style = page.document.createElement("style");
            style.textContent = "body { padding-left: 42px; }";

            resources.addStyle(style);

            computedStyle = page.getComputedStyle(page.document.body);
            expect(computedStyle.paddingLeft).toBe("42px");
            expect(page.document.styleSheets.length).toBe(1);
            deletePage(page);
        }).fail(function(reason) {
            console.log(reason.stack);
            expect("test").toBe("executed");
        });
    });

    it("should add a style file", function() {
        var resources = DocumentResources.create(),
            url = "resource.css";

        return createPage("reel/template/page.html")
        .then(function(page) {
            var deferred = Promise.defer(),
                style;

            resources.initWithDocument(page.document);

            style = page.document.createElement("link");
            style.rel = "stylesheet";
            style.href = url;
            style.onload = function() {
                var computedStyle;

                computedStyle = page.getComputedStyle(page.document.body);

                expect(computedStyle.paddingLeft).toBe("42px");
                expect(page.document.styleSheets.length).toBe(1);

                deletePage(page);
                deferred.resolve();
            }

            resources.addStyle(style);

            return deferred.promise;
        }).fail(function(reason) {
            console.log(reason.stack);
            expect("test").toBe("executed");
        });
    });
});
