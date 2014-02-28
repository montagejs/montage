var Montage = require("montage").Montage,
    Promise = require("core/promise").Promise,
    URL = require("core/mini-url");

var DocumentResources = Montage.specialize({

    _SCRIPT_TIMEOUT: {value: 5000},
    _document: {value: null},
    _resources: {value: null},
    _preloaded: {value: null},
    _expectedStyles: {value: null},

    constructor: {
        value: function DocumentResources() {
            this.super();
            this._expectedStyles = [];
        }
    },

    initWithDocument: {
        value: function(_document) {
            this.clear();
            this._document = _document;

            this._populateWithDocument(_document);

            return this;
        }
    },

    _populateWithDocument: {
        value: function(_document) {
            var scripts = _document.querySelectorAll("script"),
                forEach = Array.prototype.forEach;

            forEach.call(scripts, function(script) {
                if (script.src) {
                    this._addResource(this.normalizeUrl(script.src));
                }
            }, this);

            var links = _document.querySelectorAll("link");

            forEach.call(links, function(link) {
                if (link.rel === "stylesheet") {
                    this._addResource(this.normalizeUrl(link.href));
                }
            }, this);
        }
    },

    clear: {
        value: function () {
            this._resources = Object.create(null);
            this._preloaded = Object.create(null);
        }
    },

    _addResource: {
        value: function(url) {
            this._resources[url] = true;
        }
    },

    hasResource: {
        value: function(url) {
            return url in this._resources;
        }
    },

    isResourcePreloaded: {
        value: function(url) {
            return this._preloaded[url] === true;
        }
    },

    isResourcePreloading: {
        value: function(url) {
            return Promise.isPromise(this._preloaded[url]);
        }
    },

    setResourcePreloadedPromise: {
        value: function(url, promise) {
            this._preloaded[url] = promise;
        }
    },

    setResourcePreloaded: {
        value: function(url) {
            this._preloaded[url] = true;
        }
    },

    getResourcePreloadedPromise: {
        value: function(url) {
            return this._preloaded[url];
        }
    },

    addScript: {
        value: function(script) {
            var url = this.normalizeUrl(script.src);

            if (url) {
                if (this.isResourcePreloaded(url)) {
                    return Promise.resolve();
                } else if (this.isResourcePreloading(url)) {
                    return this.getResourcePreloadedPromise(url);
                } else {
                    return this._importScript(script);
                }
            } else {
                return this._importScript(script);
            }
        }
    },

    // TODO: this should probably be in TemplateResources, need to come up with
    //       a better scheme for know what has been loaded in what document.
    //       This change would make addStyle sync and up to whoever is adding
    //       to listen for its proper loading.
    _importScript: {
        value: function(script) {
            var self = this,
                _document = this._document,
                documentHead = _document.head,
                scriptLoaded,
                deferred = Promise.defer(),
                loadingTimeout,
                url = script.src;

            if (url) {
                self._addResource(url);
                // We wait until all scripts are loaded, this is important
                // because templateDidLoad might need to access objects that
                // are defined in these scripts, the downsize is that it takes
                // more time for the template to be considered loaded.
                scriptLoaded = function(event) {
                    //if (event.type === "load") {
                    self.setResourcePreloaded(url);
                    //}
                    script.removeEventListener("load", scriptLoaded);
                    script.removeEventListener("error", scriptLoaded);

                    clearTimeout(loadingTimeout);
                    deferred.resolve();
                };
                script.addEventListener("load", scriptLoaded, false);
                script.addEventListener("error", scriptLoaded, false);

                // Setup the timeout to wait for the script until the resource
                // is considered loaded. The template doesn't fail loading just
                // because a single script didn't load.
                loadingTimeout = setTimeout(function() {
                    self.setResourcePreloaded(url);
                    deferred.resolve();
                }, this._SCRIPT_TIMEOUT);

                this.setResourcePreloadedPromise(url, deferred.promise);

            } else {

                deferred.resolve();

            }

            // This is one of the very few ocasions where we go around the draw
            // loop to modify the DOM. Since it doesn't affect the layout
            // (unless the script itself does) it shouldn't be a problem.
            documentHead.appendChild(
                _document.createComment("Inserted from FIXME")
            );
            documentHead.appendChild(script);

            return deferred.promise;
        }
    },

    addStyle: {
        value: function(element) {
            var url = element.getAttribute("href"),
                documentHead;

            url = this.normalizeUrl(url);

            if (url) {
                if (this.hasResource(url)) {
                    return;
                } else {
                    this._addResource(url);
                }
            }

            documentHead = this._document.head;

            this._expectedStyles.push(url);
            documentHead.insertBefore(element, documentHead.firstChild);
        }
    },

    normalizeUrl: {
        value: function(url, baseUrl) {
            if (!baseUrl) {
                baseUrl = this._document.location.href;
            }

            return URL.resolve(baseUrl, url);
        }
    },

    domain: {
        value: window.location.protocol + "//" + window.location.host
    },

    isCrossDomain: {
        value: function(url) {
            return url.indexOf(this.domain + "/") !== 0 ||
                url.indexOf("file://") === 0;
        }
    },

    preloadResource: {
        value: function(url, forcePreload) {
            var skipPreload;

            url = this.normalizeUrl(url);

            // We do not preload cross-domain urls to avoid x-domain security
            // errors unless forcePreload is requested, it could be a server
            // configured with CORS.
            if (!forcePreload && this.isCrossDomain(url)) {
                skipPreload = true;
            }

            if (skipPreload || this.isResourcePreloaded(url)) {
                return Promise.resolve();
            } else if (this.isResourcePreloading(url)) {
                return this.getResourcePreloadedPromise(url);
            } else {
                return this._preloadResource(url);
            }
        }
    },

    _preloadResource: {
        value: function(url) {
            var self = this,
                req = new XMLHttpRequest(),
                loadHandler,
                loadingTimeout,
                deferred = Promise.defer();

            req.open("GET", url);

            loadHandler = function(event) {
                //if (event.type === "load") {
                self.setResourcePreloaded(url);
                //}
                req.removeEventListener("load", loadHandler);
                req.removeEventListener("error", loadHandler);

                clearTimeout(loadingTimeout);
                deferred.resolve();
            };
            req.addEventListener("load", loadHandler, false);
            req.addEventListener("error", loadHandler, false);
            req.send();

            // Setup the timeout to wait for the script until the resource
            // is considered loaded.
            loadingTimeout = setTimeout(function() {
                self.setResourcePreloaded(url);
                deferred.resolve();
            }, this._SCRIPT_TIMEOUT);

            this.setResourcePreloadedPromise(url, deferred.promise);

            return deferred.promise;
        }
    },

    areStylesLoaded: {
        get: function() {
            var styleSheets,
                ix;

            if (this._expectedStyles.length > 0) {
                styleSheets = this._document.styleSheets;
                for (var i = 0, styleSheet; styleSheet = styleSheets[i]; i++) {
                    ix = this._expectedStyles.indexOf(styleSheet.href);
                    if (ix >= 0) {
                        this._expectedStyles.splice(ix, 1);
                    }
                }
            }

            return this._expectedStyles.length === 0;
        }
    }

}, {

    getInstanceForDocument: {
        value: function(_document) {
            //jshint -W106
            var documentResources = _document.__montage_resources__;

            if (!documentResources) {
                documentResources = _document.__montage_resources__ = new DocumentResources().initWithDocument(_document);
            }

            return documentResources;
            //jshint +W106
        }
    }

});

exports.DocumentResources = DocumentResources;

