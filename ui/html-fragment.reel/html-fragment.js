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
 * @class HtmlFragment
 * @extends Component
 */
var HtmlFragment = exports.HtmlFragment = Component.specialize(/** @lends HtmlFragment# */ {

    _value: {
        value: null
    },

    value: {
        set: function (value) {
            if (this._value !== value) {
                if (value !== void 0 && value !== null) {
                    this._value = value;
                } else {
                    this._value = null;
                }

                this.needsSanitizeHtml = true;
                this.needsDraw = true;
            }
        },
        get: function () {
            return this._value;
        }
    },

    allowedTags: {
        value: null
    },

    allowedAttributes: {
        value: null
    },

    defaultAllowedTags: {
        get: function () {
            return defaultOptions.allowedTags;
        }
    },

    defaultAllowedAttributes: {
        get: function () {
            return defaultOptions.allowedAttributes;
        }
    },

    _sanitizeNode: {
        value: function (parent, allowedTags, allowedAttributes) {
            if (parent) {
                var children = parent.children;
                
                if (children) {
                    var allowedAttributesForTag, shouldRemoveAttribute,
                        childAttributes, attribute, attributeName, attributeValue,
                        delegateResponse, childTagName, child, ii, ll;

                    for (var i = 0, l = children.length; i < l; i++) {
                        child = children[i];
                        childTagName = child.tagName.toLowerCase();

                        if (allowedTags && allowedTags.indexOf(childTagName) === -1) {
                            parent.removeChild(child);
                            i--;
                            l--;
                        } else {
                            childAttributes = child.attributes;
                            allowedAttributesForTag = allowedAttributes[childTagName] ||
                                allowedAttributes['*'];
                            
                            for (ii = 0, ll = childAttributes.length; ii < ll; ii++) {
                                shouldRemoveAttribute = false;
                                attribute = childAttributes[ii];
                                attributeName = attribute.name;
                                attributeValue = attribute.value;

                                if (allowedAttributesForTag &&
                                    allowedAttributesForTag.indexOf(attributeName) === -1
                                ) {
                                    shouldRemoveAttribute = true;

                                    if (attributeName.startsWith('data-') &&
                                        allowedAttributesForTag.indexOf('data-*') > -1
                                    ) {
                                        shouldRemoveAttribute = false;
                                    }
                                }

                                if (shouldRemoveAttribute) {
                                    delegateResponse = this.callDelegateMethod(
                                        'htmlFragmentWillRemoveNodeAttribute',
                                        this,
                                        child,
                                        attribute
                                    );

                                    if (typeof delegateResponse === 'boolean') {
                                        shouldRemoveAttribute = delegateResponse;
                                    }

                                    if (shouldRemoveAttribute) {
                                        child.removeAttribute(attributeName);
                                        ll--;
                                        ii--;
                                    }
                                } else {
                                    delegateResponse = this.callDelegateMethod(
                                        'htmlFragmentWillUseValueForNodeAttribute',
                                        this,
                                        attributeValue,
                                        child,
                                        attributeName
                                    );

                                    if (typeof delegateResponse === 'string') {
                                        attributeValue = delegateResponse;
                                    }

                                    child.setAttribute(attributeName, attributeValue);
                                }
                            }

                            this._sanitizeNode(child, allowedTags, allowedAttributes);
                        }
                    }
                }                
            }

            return parent;
        }
    },

    _sanitizeHtml: {
        value: function (html, allowedTags, allowedAttributes) {
            var doc;

            if (window.DOMParser) {
                try {
                    doc = new DOMParser().parseFromString(html, "text/html");
                } catch (DOMParserError) {
                    console.error(DOMParserError);
                }

                if (doc) {
                    this._sanitizeNode(
                        doc.body,
                        allowedTags,
                        allowedAttributes
                    );
                }
            }

            return doc;
        }
    },

    draw: {
        value: function () {
            if (this.needsSanitizeHtml) {
                this.element.innerHTML = '';

                if (this.value) {
                    var doc = this._sanitizeHtml(
                        this.value,
                        this.allowedTags || defaultOptions.allowedTags,
                        this.allowedAttributes || defaultOptions.allowedAttributes
                    );
    
                    if (doc) {
                        var range = doc.createRange();
                        range.selectNodeContents(doc.body);
                        this.element.appendChild(range.extractContents());
                        range.selectNodeContents(doc.head);
                        this.element.appendChild(range.extractContents());
                    }
                }
            }
        }
    }
  
}, {
    
    DefaultSanitizerOptions: {
        value: defaultOptions
    }
        
});
