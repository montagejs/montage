/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
	@module "montage/ui/rich-text-sanitizer.js"
    @requires montage/core/core
*/
var Montage = require("montage").Montage,
    Component = require("ui/component").Component

/**
    @class module:"montage/ui/rich-text-sanitizer.js".Sanitizer
    @extends module:montage/ui/component.Component
*/
exports.Sanitizer = Montage.create(Component,/** @lends module:"montage/ui/rich-text-sanitizer.js".Sanitizer# */ {

    scopeCSS : {
        enumerable: true,
        value: function(htmlFragment, identifier) {
            var identifierSelector = ".editor-" + identifier+ " ";

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

    unscopeCSS : {
        enumerable: true,
        value: function(htmlFragment) {

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
    }
});
