/*global require, exports*/

/**
 * @module montage/ui/base/abstract-image.reel
 */
var Component = require("../component").Component,
    Url = require("../../core/mini-url"),
    Map = require("collections/map");

    if (typeof window !== "undefined") { // client-side
        Map = window.Map || Map;
    }



/**
 * @class AbstractImage
 * @extends Component
 */
exports.AbstractImage = Component.specialize( /** @lends AbstractImage# */ {

    constructor: {
        value: function AbstractImage() {
            if(this.constructor === AbstractImage) {
                throw new Error("AbstractImage cannot be instantiated.");
            }

            this.addPathChangeListener("_ownerDocumentPart", this, "_rebaseSrc");
        }
    },

    // http://stackoverflow.com/questions/6018611/smallest-data-uri-image-possible-for-a-transparent-image
    emptyImageSrc: {
        value: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
    },

    _isLoadingImage: {
        value: false
    },

    _image: {
        value: null
    },

    _src: {
        value: null
    },

    src: {
        set: function (value) {
            if (this._src !== value) {
                this._src = value;

                value = this._getRebasedSrc();
                if (value) {
                    this._isInvalidSrc = false;
                    this._loadImage(value);
                } else {
                    this._isInvalidSrc = true;
                }
                this.needsDraw = true;
            }
        },
        get: function () {
            return this._src;
        }
    },

    _loadImage: {
        value: function (src) {
                if(!this._image || src !== this._image.src ) {
                    if(this._image) {
                        this.constructor.checkinImage(this._image);
                    }
                    this._image = this.constructor.checkoutImageWithUrl(src,this);
                    this._isLoadingImage = !this._image.complete;
                }
        }
    },


    // Invalid source is set when the src property is a relative location that
    // the image was not able to rebase using the templates baseUrl or any
    // other means. It can also mean that there is no src.
    _isInvalidSrc: {
        value: true
    },

    width: {
        value: null
    },

    height: {
        value: null
    },

    _textAlternative: {
        value: null
    },

    textAlternative: {
        set: function (value) {
            this._textAlternative = value;
            this.needsDraw = true;
        },
        get: function () {
            return this._textAlternative;
        }
    },

    _crossOrigin: {
        value: null
    },

    crossOrigin: {
        set: function (value) {
            if (value !== this._crossOrigin) {
                this._crossOrigin = value;
                this.needsDraw = true;
            }
        },
        get: function () {
            return this._crossOrigin;
        }
    },

    _rebaseSrc: {
        value: function () {
            var value;

            value = this._getRebasedSrc();

            if (value) {
                this._isInvalidSrc = false;
                this._loadImage(value);
                this.needsDraw = true;
            }
        }
    },

    // Returns a rebased version of the "src" property using the owner template
    // location when available. If a rebased version of the url is not possible
    // then null is returned.
    // If the "src" property is an absolute url ("http://" "https://" "/" "//"
    // "data:") then no operation is performed and the "src" ir returned as is.
    _getRebasedSrc: {
        value: function () {
            return this._getRebasedUrl(this._src);
        }
    },

    _getRebasedEmptySrc: {
        value: function () {
            return this._getRebasedUrl(this.emptyImageSrc);
        }
    },

    _getRebasedUrl: {
        value: function (url) {
            var baseUrl,
                // Check for "<protocol>:", "/" and "//"
                absoluteUrlRegExp = /^[\w\-]+:|^\//;

            if (url) {
                if (absoluteUrlRegExp.test(url)) {
                    return url;
                } else if (this._ownerDocumentPart) {
                    baseUrl = this._ownerDocumentPart.template.getBaseUrl();
                    if (baseUrl) {
                        return Url.resolve(baseUrl, url);
                    }
                }
            }

            return null;
        }
    },

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
                this.element.setAttribute("role", "img");
            }
        }
    },

    draw: {
        value: function () {
            var src;

            if (this._isLoadingImage || this._isInvalidSrc) {
                src = this._getRebasedEmptySrc();
            } else {
                src = this._getRebasedSrc();
            }

            // data: procotol is considered local and fires a CORS exception
            // when loaded in a non-localhost configuration because it doesn't
            // have the necessary properties for a cross-request.
            // From the spec it seems there is a special case for data: Urls
            // but at least Chrome seems to behave differently.
            // http://www.whatwg.org/specs/web-apps/current-work/multipage/fetching-resources.html#cors-settings-attribute
            if (this._crossOrigin == null || src.slice(0, 5) === "data:") {
                this.element.removeAttribute("crossorigin");
            } else {
                this.element.setAttribute("crossorigin", this._crossOrigin);
            }

            this.element.src = src;
            this.element.setAttribute("aria-label", this._textAlternative);
        }
    },

    handleLoad: {
        value: function handleLoad(event) {
            this._isLoadingImage = false;
            this.needsDraw = true;
            event.target.removeEventListener("load",this,false);
        }
    }
},

//Construtor methods
{
    "checkoutImageWithUrl": {
        value: function(url,imageComponent) {
            var cachedImage = this._imageCache.get(url);

            if (!cachedImage) {
                cachedImage = this._imagePool.pop() || new Image();
                cachedImage.addEventListener("load",imageComponent,false);
                cachedImage.src = url;
                this._imageCache.set(url,cachedImage);
                this._imageCacheSize++;
            }
            else if (!cachedImage.complete) {
                cachedImage.addEventListener("load",imageComponent,false);
            }
            else {
                imageComponent.handleLoad({target:cachedImage});
            }
            //In case
            this._imagesToClear.delete(cachedImage);
            this._imageReferenceCount.set(cachedImage,(this._imageReferenceCount.get(cachedImage)||0)+1);

            return cachedImage;
        }
    },
    "checkinImage": {
        value: function(image) {
            var currentCount = this._imageReferenceCount.get(image)-1;
            if (currentCount === 0) {
                this._imagesToClear.set(image,Date.now());
                if(!this._clearImageInterval) {
                    this._clearImageInterval = setInterval(this._clearImage, this.clearCacheInterval, this);
                }
            }
            else {
                this._imageReferenceCount.set(image,currentCount);
            }
        }
    },
    "_clearImage": {
        value: function(self) {
            self._imagesToClear.forEach(function(lastUsed, image) {
                if((Date.now() - lastUsed) > this.maxTimeUnused) {
                    self._imagePool.push(image);
                    self._imageReferenceCount.delete(image);
                    self._imageCache.delete(image.src);
                    image.src = void 0;
                }
            });
        }
    },
    _imagePool: {
        value: []
    },
    _imagesToClear: {
        value: new Map()
    },
    _imageReferenceCount: {
        value: new Map()
    },
    _imageCache: {
        value: new Map()
    },
    clearCacheInterval: {
        value: 60000
    },
    maxTimeUnused: {
        value: 60000
    },
    _imageCacheSize: {
        value: 0
    }
});
