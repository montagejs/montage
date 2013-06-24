/*global require, exports*/

/**
 @module montage/ui/base/abstract-image.reel
 */
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    URL = require("core/mini-url");

/**
 * @class AbstractImage
 * @extends Component
 */
var AbstractImage = exports.AbstractImage = Component.specialize( /** @lends AbstractImage# */ {

    /**
     * @private
     */
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

    // http://probablyprogramming.com/2009/03/15/the-tiniest-gif-ever
    emptyImageSrc: {
        value: "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="
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
        set: function(value) {
            if (this._src !== value) {
                this._src = value;

                value = this._getRebasedSrc();
                if (value) {
                    this._isLoadingImage = true;
                    this._isInvalidSrc = false;
                    this._image.src = value;
                } else {
                    this._isInvalidSrc = true;
                }
                this.needsDraw = true;
            }
        },
        get: function() {
            return this._src;
        }
    },

    // Invalid source is set when the src property is a relative location that
    // the image was not able to rebase using the templates baseUrl or any other
    // means. It can also mean that there is no src.
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
        set: function(value) {
            this._textAlternative = value;
            this.needsDraw = true;
        },
        get: function() {
            return this._textAlternative;
        }
    },

    _rebaseSrc: {
        value: function() {
            var url;

            url = this._getRebasedSrc();

            if (url) {
                this.src = url;
            }
        }
    },

    // Returns a rebased version of the "src" property using the owner template
    // location when available. If a rebased version of the url is not possible
    // then null is returned.
    // If the "src" property is an absolute url ("http://" "https://" "/" "//"
    // "data:") then no operation is performed and the "src" ir returned as is.
    _getRebasedSrc: {
        value: function() {
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
        value: function(firstTime) {
            if (firstTime) {
                this.element.setAttribute("role", "img");
            }
        }
    },

    draw: {
        value: function() {
            if (this._isLoadingImage || this._isInvalidSrc) {
                this.element.src = this.emptyImageSrc;
            } else {
                this.element.src = this._src;
            }
            this.element.setAttribute("aria-label", this._textAlternative);
        }
    },

    handleImageLoad: {
        value: function() {
            this._isLoadingImage = false;
            this.needsDraw = true;
        }
    }
});
