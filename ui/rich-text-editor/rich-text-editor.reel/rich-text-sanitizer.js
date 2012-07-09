/* <copyright>
Copyright (c) 2012, Motorola Mobility LLC.
All Rights Reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice,
  this list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of Motorola Mobility LLC nor the names of its
  contributors may be used to endorse or promote products derived from this
  software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
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

    willInsertHtmlData: {
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
