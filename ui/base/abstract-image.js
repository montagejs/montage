/*global require, exports*/

/**
 * @module montage/ui/base/abstract-image.reel
 */
var Component = require("../component").Component,
    URL = require("../../core/mini-url");

/**
 * @class AbstractImage
 * @extends Component
 */
var AbstractImage = exports.AbstractImage = Component.specialize( /** @lends AbstractImage# */ {

    constructor: {
        value: function AbstractImage() {
            if(this.constructor === AbstractImage) {
                throw new Error("AbstractImage cannot be instantiated.");
            }
            Component.constructor.call(this); // super
            this._image = new Image();
            this._image.onload = this.handleImageLoad.bind(this);
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
            this._image.src = src;
            this._isLoadingImage = !this._image.complete;
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
            var url = this._src,
                baseUrl,
                // Check for "<protocol>:", "/" and "//"
                absoluteUrlRegExp = /^[\w\-]+:|^\//;

            if (url) {
                if (absoluteUrlRegExp.test(url)) {
                    return url;
                } else if (this._ownerDocumentPart) {
                    baseUrl = this._ownerDocumentPart.template.getBaseUrl();
                    if (baseUrl) {
                        return URL.resolve(baseUrl, url);
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
                src = this.emptyImageSrc;
            } else {
                src = this._getRebasedSrc();
            }

            // data: procotol is considered local and fires a CORS exception
            // when loaded in a non-localhost configuration because it doesn't
            // have the necessary properties for a cross-request.
            // From the spec it seems there is a special case for data: URLs
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

    handleImageLoad: {
        value: function () {
            this._isLoadingImage = false;
            this.needsDraw = true;
        }
    }
});

