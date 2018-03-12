/*global require, exports */

var Component = require("ui/component").Component,
    defaultOptions = Object.deepFreeze({
        allowedTags: [
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
            'nl', 'li', 'b', 'i', 'img', 'strong', 'em', 'strike', 'code', 'hr',
            'br', 'div', 'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td',
            'pre', 'span'
        ],
        allowedAttributes: {
            '*': [
                'href', 'align', 'alt', 'center', 'bgcolor', 'src', 'title',
                'height', 'width', 'data-*', 'style'
            ],
            a: ['href', 'name', 'target'],
            img: ['src']
        }
    });

/**
 *
 * @class HtmlParser
 * @extends Component
 */
var HtmlParser = exports.HtmlParser = Component.specialize(/** @lends HtmlParser# */ {

    initWithOptions: {
        value: function (options) {
            this.options = options;
        }
    },

    _data: {
        value: null
    },

    data: {
        set: function (data) {
            if (this._data !== data) {
                if (typeof data === 'string') {
                    this._data = data;
                } else {
                    this._data = null;
                }

                this.needsSanitizeHtml = true;
                this.needsDraw = true;
            }
        },
        get: function () {
            return this._data;
        }
    },

    _options: {
        value: null
    },

    options: {
        set: function (options) {
            this._options = options;
        },
        get: function () {
            return this._options || defaultOptions;
        }
    },

    allowedTags: {
        value: null
    },

    allowedAttributes: {
        value: null
    },

    nonTextTags: {
        value: null
    },

    _allowedStyles: {
        value: null
    },

    allowedStyles: {
        set: function (allowedStyles) {
            if (allowedStyles) {
                var elementKeys = Object.keys(allowedStyles),
                    styles;

                for (var i = 0, l = elementKeys.length; i < l; i++) {
                    element = allowedStyles[elementKeys[i]];
                    styleKeys = Object.keys(element);

                    for (var ii = 0, ll = styleKeys.length; ii < ll; ii++) { 
                        styles = element[styleKeys[i]];

                        for (var iii = 0, lll = styles.length; iii < lll; iii++) {
                            styles[iii] = new RegExp(styles[iii]);
                        }
                    }                    
                }

                this._allowedStyles = allowedStyles;
                
            } else {
                this._allowedStyles = null;
            }
        },
        get: function () {
            return this._allowedStyles;
        }
    },

    _getSanitizerOptions: {
        value: function () {
            var options = {};

            if (this.allowedTags) {
                options.allowedTags = this.allowedTags;
            }

            if (this.allowedAttributes) {
                options.allowedAttributes = this.allowedAttributes;
            } 

            if (this.nonTextTags) {
                options.nonTextTags = this.nonTextTags;
            }

            if (this.allowedStyles) {
                options.allowedStyles = this.allowedStyles;
            }

            return Object.assign({}, this.options, options);
        }
    },

    draw: {
        value: function () {
            if (window.sanitizeHtml) {
                this.element.innerHTML = this.data && this.needsSanitizeHtml ?
                    sanitizeHtml(this.data, this._getSanitizerOptions()) : '';
                this.needsSanitizeHtml = false;
            } else {
                this.needsDraw = true;
            }
           
        }
    }
  
}, {
    
    DefaultSanitizerOptions: {
        value: defaultOptions
    }
        
});
