/* <copyright>
Copyright (c) 2013, António Afonso
All Rights Reserved.
</copyright> */
var Montage = require("montage").Montage,
    DocumentResources = require("montage/core/document-resources").DocumentResources,
    Promise = require("montage/core/promise").Promise;

function createPage(url) {
        var deferred = new Promise(function(resolve, reject) {
            var iframe = document.createElement("iframe");
            iframe.src = url;
            iframe.onload = function() {
                resolve(iframe.contentWindow);
                iframe.onload = null;
                iframe.onerror = null;
            };
            iframe.onerror = function() {
                reject(new Error("Can't load " + url));
                iframe.onload = null;
                iframe.onerror = null;
            };

            // Iframe visibility should be hidden, and not display: none
            // to allow all browsers to measure elements layout inside of it.
            // At the time of writing Firefox wasn't computing layout if
            // display is none.

            iframe.style.visibility = "hidden";
            document.body.appendChild(iframe);

            iframe.contentWindow.__iframe__ = iframe;
        });

    return deferred;
}

function deletePage(page) {
    var iframe = page.__iframe__;

    iframe.parentNode.removeChild(iframe);
}

describe("document-resources-spec", function () {
    it("should add an inline script", function (done) {
        var resources = new DocumentResources(),
            script;

        createPage("spec/reel/template/page.html").then(function (page) {
            resources.initWithDocument(page.document);

            script = page.document.createElement("script");
            script.textContent = "window.InlineScriptLoaded = 1;";

            return resources.addScript(script)
            .then(function () {
                expect(page.document.scripts.length).toBe(1);
                expect(page.InlineScriptLoaded).toBe(1);
                deletePage(page);
            });

        }).catch(function(reason) {
            expect("test").toBe("executed");
        }).finally(function () {
            done();
        });
    });

    it("should add a script file", function (done) {
        var resources = new DocumentResources(),
            url = "resource.js",
            script;

        createPage("spec/reel/template/page.html").then(function (page) {
            resources.initWithDocument(page.document);

            script = page.document.createElement("script");
            script.src = url;

            return resources.addScript(script)
            .then(function () {
                expect(page.document.scripts.length).toBe(1);
                deletePage(page);
            });

        }).catch(function(reason) {
            expect("test").toBe("executed");
        }).finally(function () {
            done();
        });
    });

    it("should know its loaded resources", function (done) {
        var resources = new DocumentResources(),
            url = "resource.js",
            script;

        createPage("spec/reel/template/page.html").then(function (page) {
            resources.initWithDocument(page.document);

            script = page.document.createElement("script");
            script.src = url;

            return resources.addScript(script)
            .then(function () {
                var src = page.document.scripts[0].src;

                expect(resources.hasResource(src)).toBe(true);
                deletePage(page);
            });

        }).catch(function(reason) {
            expect("test").toBe("executed");
        }).finally(function () {
            done();
        });
    });

    it("should add a script file even if it 404's", function (done) {
        var resources = new DocumentResources(),
            url = "notfound.js",
            script;

        createPage("spec/reel/template/page.html").then(function (page) {
            resources.initWithDocument(page.document);

            script = page.document.createElement("script");
            script.src = url;

            return resources.addScript(script)
            .then(function () {
                expect(page.document.scripts.length).toBe(1);
                deletePage(page);
            });

        }).catch(function(reason) {
            expect("test").toBe("executed");
        }).finally(function () {
            done();
        });
    });

    it("should not add a script file twice when requested in serial", function (done) {
        var resources = new DocumentResources(),
            url = "resource.js",
            script;

        createPage("spec/reel/template/page.html").then(function (page) {
            resources.initWithDocument(page.document);

            script = page.document.createElement("script");
            script.src = url;

            return resources.addScript(script)
            .then(function () {
                script = page.document.createElement("script");
                script.src = url;

                return resources.addScript(script)
                .then(function () {
                    expect(page.document.scripts.length).toBe(1);
                    deletePage(page);
                });
            });

        }).catch(function(reason) {
            console.log(reason.stack);
            expect("test").toBe("executed");
        }).finally(function () {
            done();
        });
    });

    it("should not add a script file twice when requested in parallel", function (done) {
        var resources = new DocumentResources(),
            url = "resource.js",
            script1,
            script2;

        createPage("spec/reel/template/page.html").then(function (page) {
            resources.initWithDocument(page.document);

            script1 = page.document.createElement("script");
            script1.src = url;
            script2 = page.document.createElement("script");
            script2.src = url;

            return Promise.all([
                resources.addScript(script1),
                resources.addScript(script2)
            ]).then(function () {
                expect(page.document.scripts.length).toBe(1);
                deletePage(page);
            });
        }).catch(function(reason) {
            expect("test").toBe("executed");
        }).finally(function () {
            done();
        });
    });

    it("should add a scripts even if it timesout", function (done) {
        var resources = new DocumentResources(),
            // The server is available as template-server.js
            url = "http://localhost:9090/resource.js?delay=60000",
            script;

        createPage("spec/reel/template/page.html").then(function (page) {
            var initialTime = new Date;

            resources.initWithDocument(page.document);
            // The default is too much wait for in a test, change it to 500ms.
            resources._SCRIPT_TIMEOUT = 500;

            script = page.document.createElement("script");
            script.src = url;

            return resources.addScript(script)
            .then(function () {
                var finalTime = new Date;

                expect(page.document.scripts.length).toBe(1);
                expect(finalTime - initialTime).toBeLessThan(60000);
                deletePage(page);
            });

        }).catch(function(reason) {
            expect("test").toBe("executed");
        }).finally(function () {
            done();
        });
    });

    it("should preload a resource", function (done) {
        var resources = new DocumentResources(),
            url = "resource.js",
            script;

        return createPage("spec/reel/template/page.html")
        .then(function (page) {
            resources.initWithDocument(page.document);

            return resources.preloadResource(url)
            .then(function () {
                var normalizedUrl = resources.normalizeUrl(url);

                expect(resources.isResourcePreloaded(normalizedUrl)).toBe(true);
                deletePage(page);
            });

        }).catch(function(reason) {
            console.log(reason.stack);
            expect("test").toBe("executed");
        }).finally(function () {
            done();
        });
    });

    it("should preload a resource even if it 404's", function (done) {
        var resources = new DocumentResources(),
            url = "notfound.js",
            script;

        return createPage("spec/reel/template/page.html")
        .then(function (page) {
            resources.initWithDocument(page.document);

            return resources.preloadResource(url)
            .then(function () {
                var normalizedUrl = resources.normalizeUrl(url);

                expect(resources.isResourcePreloaded(normalizedUrl)).toBe(true);
                deletePage(page);
            });

        }).catch(function(reason) {
            console.log(reason.stack);
            expect("test").toBe("executed");
        }).finally(function () {
            done();
        });
    });

    it("should preload a resource even if it timesout", function (done) {
        var resources = new DocumentResources(),
            // The server is available as template-server.js
            url = "http://localhost:9090/resource.js?delay=60000",
            script;

        return createPage("spec/reel/template/page.html")
        .then(function (page) {
            var initialTime = new Date;

            resources.initWithDocument(page.document);
            // The default is too much wait for in a test, change it to 500ms.
            resources._SCRIPT_TIMEOUT = 500;

            return resources.preloadResource(url, true)
            .then(function () {
                var finalTime = new Date;

                expect(resources.isResourcePreloaded(url)).toBe(true);
                expect(finalTime - initialTime).toBeLessThan(60000);
                deletePage(page);
            });
        }).catch(function(reason) {
            console.log(reason.stack);
            expect("test").toBe("executed");
        }).finally(function () {
            done();
        });
    });

    it("should avoid x-domain requests on file://", function (done) {
        var resources = new DocumentResources(),
            url = "file://example.html";

        return createPage("spec/reel/template/page.html")
        .then(function (page) {
            resources.initWithDocument(page.document);

            return resources.preloadResource(url)
            .then(function () {
                expect(resources.isResourcePreloaded(url)).toBe(false);
                deletePage(page);
            });
        }).finally(function () {
            done();
        });
    });

    it("should avoid x-domain requests on absolute urls", function (done) {
        var resources = new DocumentResources(),
            url = "http://montagejs.org/example.html";

        createPage("spec/reel/template/page.html").then(function (page) {
            resources.initWithDocument(page.document);

            return resources.preloadResource(url)
            .then(function () {
                expect(resources.isResourcePreloaded(url)).toBe(false);
                deletePage(page);
            });
        }).finally(function () {
            done();
        });
    });

    it("should load on absolute url if it's in the same domain", function (done) {
        var resources = new DocumentResources(),
            url = resources.domain + "/example.html";

        createPage("spec/reel/template/page.html").then(function (page) {
            resources.initWithDocument(page.document);

            return resources.preloadResource(url)
                .then(function () {
                    expect(resources.isResourcePreloaded(url)).toBe(true);
                    deletePage(page);
                });
        }).finally(function () {
            done();
        });
    });

    it("should add an inline style", function (done) {
        var resources = new DocumentResources();

        createPage("spec/reel/template/page.html").then(function (page) {
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
        }).catch(function(reason) {
            console.log(reason.stack);
            expect("test").toBe("executed");
        }).finally(function () {
            done();
        });
    });

    it("should add an inline style but not wait for it to be loaded like a style file", function (done) {
        var resources = new DocumentResources();

        createPage("spec/reel/template/page.html").then(function (page) {
            var style;

            resources.initWithDocument(page.document);

            style = page.document.createElement("style");
            style.textContent = "body { padding-left: 42px; }";

            resources.addStyle(style);

            expect(resources.areStylesLoaded).toBe(true);
            deletePage(page);
        }).catch(function(reason) {
            console.log(reason.stack);
            expect("test").toBe("executed");
        }).finally(function () {
            done();
        });
    });

    it("should add a style file", function (done) {
        var resources = new DocumentResources(),
            url = "resource.css";

        createPage("spec/reel/template/page.html").then(function(page) {
            var deferred = new Promise(function(resolve, reject) {
                var style;
                resources.initWithDocument(page.document);
                
                style = page.document.createElement("link");
                style.rel = "stylesheet";
                style.href = url;

                function checkAreStylesLoaded () {
                    if (resources.areStylesLoaded) {
                        computedStyle = page.getComputedStyle(page.document.body);
                        expect(computedStyle.paddingLeft).toBe("42px");
                        expect(page.document.styleSheets.length).toBe(1);
                        deletePage(page);
                        resolve();
                    } else {
                        setTimeout(checkAreStylesLoaded, 0);
                    }
                }

                resources.addStyle(style);
                checkAreStylesLoaded();
            });

            return deferred;
        }).catch(function(reason) {
            console.log(reason.stack);
            expect("test").toBe("executed");
        }).finally(function () {
            done();
        });
    });

    it("should not add a style file twice when requested in serial", function (done) {
        var resources = new DocumentResources(),
            url = "resource.css";

        createPage("spec/reel/template/page.html").then(function(page) {
            var style,
                links;

            resources.initWithDocument(page.document);

            style = page.document.createElement("link");
            style.rel = "stylesheet";
            style.href = url;

            resources.addStyle(style);
            resources.addStyle(style);

            links = page.document.head.querySelectorAll("link");

            expect(links.length).toBe(1);
        }).catch(function(reason) {
            console.log(reason.stack);
            expect("test").toBe("executed");
        }).finally(function () {
            done();
        });
    });

    it("should report styles as not loaded when they're not loaded", function (done) {
        var resources = new DocumentResources();

        createPage("spec/reel/template/page.html").then(function (page) {
            resources.initWithDocument(page.document);
            resources._expectedStyles.push("resource.css");

            expect(resources.areStylesLoaded).toBeFalsy();
        }).catch(function(reason) {
            console.log(reason.stack);
            expect("test").toBe("executed");
        }).finally(function () {
            done();
        });
    });

    describe("prepopulate with the existing resources in the document", function () {
        it("should prepopulate with a script file", function (done) {
            var resources = new DocumentResources();

            createPage("spec/reel/template/prepopulated-page.html").then(function (page) {
                resources.initWithDocument(page.document);
                var src = page.document.querySelector("script").src;
                expect(resources.hasResource(src)).toBe(true);
            }).catch(function(reason) {
                expect("test").toBe("executed");
            }).finally(function () {
                done();
            });
        });

        it("should prepopulate with a link file", function (done) {
            var resources = new DocumentResources();

            createPage("spec/reel/template/prepopulated-page.html").then(function (page) {
                resources.initWithDocument(page.document);
                var src = page.document.querySelector("link").href;
                expect(resources.hasResource(src)).toBe(true);
            }).catch(function(reason) {
                expect("test").toBe("executed");
            }).finally(function () {
                done();
            });
        });
    });

    describe("normalize url", function () {
        it("should normalize a relative url", function (done) {
            var resources = new DocumentResources(),
                normalizedUrl,
                url = "../resource.css",
                expectedUrl;

            createPage("spec/reel/template/page.html").then(function (page) {
                expectedUrl = page.document.location.href.split("/").slice(0, -2).join("/") + "/resource.css";

                resources.initWithDocument(page.document);
                normalizedUrl = resources.normalizeUrl(url);

                expect(normalizedUrl).toBe(expectedUrl);
            }).catch(function(reason) {
                console.log(reason.stack);
                expect("test").toBe("executed");
            }).finally(function () {
                done();
            });
        });

        it("should normalize an absolute url", function (done) {
            var resources = new DocumentResources(),
                normalizedUrl,
                url = "http://www.montagejs.org/resource.css",
                expectedUrl = "http://www.montagejs.org/resource.css";

            createPage("spec/reel/template/page.html").then(function (page) {
                resources.initWithDocument(page.document);
                normalizedUrl = resources.normalizeUrl(url);

                expect(normalizedUrl).toBe(expectedUrl);
            }).catch(function(reason) {
                console.log(reason.stack);
                expect("test").toBe("executed");
            }).finally(function () {
                done();
            });
        });

        it("should normalize an url with a base url", function (done) {
            var resources = new DocumentResources(),
                normalizedUrl,
                url = "resource.css",
                baseUrl = "http://www.montagejs.org/",
                expectedUrl = "http://www.montagejs.org/resource.css";

            createPage("spec/reel/template/page.html").then(function (page) {
                resources.initWithDocument(page.document);
                normalizedUrl = resources.normalizeUrl(url, baseUrl);

                expect(normalizedUrl).toBe(expectedUrl);
            }).catch(function(reason) {
                console.log(reason.stack);
                expect("test").toBe("executed");
            }).finally(function () {
                done();
            });
        });
    });
});
