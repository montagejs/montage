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

    draw: {
        value: function () {
            if (sanitizeHtml) {
                this.element.innerHTML = this.data && this.needsSanitizeHtml ?
                    sanitizeHtml(this.data, this.options) : '';
                this.needsSanitizeHtml = false;
            } else {
                this.needsDraw = true;
            }
        }
    }
  
});
