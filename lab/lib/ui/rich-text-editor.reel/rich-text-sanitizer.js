/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
	@module "montage/ui/rich-text-sanitizer.js"
    @requires montage/core/core
*/
var Montage = require("montage").Montage;

/**
    @class module:"montage/ui/rich-text-sanitizer.js".Sanitizer
    @extends module:montage/core/core.Montage
*/
exports.Sanitizer = Montage.create(Montage,/** @lends module:"montage/ui/rich-text-sanitizer.js".Sanitizer# */ {

    willSetValue: {
        value: function(value, uniqueId)  {
            return this._scopeCSS(value, uniqueId);
        }
    },

    didGetValue: {
        value: function(value, uniqueId)  {
            return this._unscopeCSS(value, uniqueId);
        }
    },

    willInsertHTMLData: {
        value: function(data, uniqueId)  {
            return this._scopeCSS(this._removeScript(data), uniqueId);
        }
    },

    _scopeCSS: {
        enumerable: true,
        value: function(htmlFragment, uniqueId) {
            var identifierSelector = ".editor-" + uniqueId+ " ";

            if (typeof htmlFragment == "string") {
                // Extract the style tag and its content
                htmlFragment = htmlFragment.replace(/(<style ?[^>]*>)([^<]*)(<\/style>)/ig, function(match, pre, style, post) {
                    // Remove any newlines and tab for easier processing
                    style = style.replace(/\t|\n|\r/g, function(char) {if (char == "\t") return " "; return ""});

                    // Cleanup any potential leftover from a previous scoping
                    style = style.replace(/\*\.editor-[^ ] +/g, "body");
                    style = style.replace(/\.editor-[^ ]+ /g, "");

                    // Extract the selectors for each css block
                    style = style.replace(/([^{]+)({[^}]*})/ig, function(match, selectors, rules) {

                        // Split the selectors and add the identifierSelector
                        selectors = selectors.replace(/ *([^,]+)/g, function(match, selector) {
                            // convert body selector
                            if (selector.toLowerCase() == "body") {
                                return "*" + identifierSelector;
                            } else {
                                return identifierSelector + selector;
                            }
                        })
                        return selectors + rules;
                    })
                    return pre + style + post;
                });
            }

            return htmlFragment;
        }
    },

    _unscopeCSS: {
        enumerable: true,
        value: function(htmlFragment, uniqueId) {

            if (typeof htmlFragment == "string") {
                // Extract the style tag and its content
                htmlFragment = htmlFragment.replace(/(<style ?[^>]*>)([^<]*)(<\/style>)/ig, function(match, pre, style, post) {
                    style = style.replace(/\*\.editor-[^ ] +/g, "body");
                    style = style.replace(/\.editor-[^ ]+ /g, "");
                    return pre + style + post;
                });
            }
            return htmlFragment;
        }
    },

    _removeScript: {
        enumerable: true,
        value: function(htmlFragment) {
            /*
                Will remove any script tag, onXXX handlers and javascript URLs
             */
            var div = document.createElement("div"),
                _removeScript = function(element) {
                    var children = element.children,
                        child,
                        nbrChildren = children.length,
                        attributes = element.attributes,
                        attribute,
                        nbrAttributes = attributes.length,
                        i;

                for (i = 0; i < nbrAttributes; i ++) {
                    attribute = attributes[i];
                    if (attribute.name.match(/^on[a-z]+/i) || attribute.value.match(/^javascript:/)) {
                        element.removeAttribute(attribute.name);
                        i --;
                        nbrAttributes --;
                    }
                }

                for (i = 0; i < nbrChildren; i ++) {
                    child = children[i];
                    if (child.tagName == "SCRIPT") {
                        child.parentNode.removeChild(child);
                        i --;
                        nbrChildren --;
                    } else {
                        _removeScript(child);
                    }
                }
            };

            div.innerHTML = htmlFragment;
            _removeScript(div);

            return div.innerHTML;
        }
    }
});
