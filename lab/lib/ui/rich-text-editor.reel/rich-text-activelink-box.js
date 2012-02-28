/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
/**
	@module "montage/ui/rich-text-activelink-box.js"
    @requires montage/core/core
*/
var Montage = require("montage").Montage;

/**
    @class module:"montage/ui/rich-text-activelink-box.js".ActiveLinkBox
    @extends module:montage/core/core.Montage
*/
exports.ActiveLinkBox = Montage.create(Montage,/** @lends module:"montage/ui/rich-text-activelink-box.js".ActiveLinkBox# */ {

    _editor: {
        enumerable: false,
        value: null
    },

    initialize: {
        value: function(editor) {
            this._editor = editor;
        }
    },

    _element: {
        enumerable: false,
        value: null
    },

    element: {
        get: function() {
            return this._element;
        }
    },

    show: {
        enumerable: false,
        value: function(element) {
            var editorElement = this._editor.element.firstChild,
                popup,
                parentNode,
                nextSibling,
                w, h, l, t,
                left, right, leftWidth, rightWidth,
                style,
                popupExtraWidth = 53; // This is depending of the popup css

            var offsetLeft,
                offsetTop,
                _findOffset = function(node) {
                    offsetLeft = node.offsetLeft;
                    offsetTop = node.offsetTop;

                    while ((node = node.offsetParent) && node != editorElement) {
                        offsetLeft += node.offsetLeft;
                        offsetTop += node.offsetTop;
                    }
                };


            if (this._element != element) {
                this.hide();
                if (element) {

                    _findOffset(element);

                    parentNode = element.parentNode;
                    nextSibling = element.nextSibling;

                    oh = editorElement.offsetHeight;
                    ow = editorElement.offsetWidth;
                    st = editorElement.scrollTop;
                    sl = editorElement.scrollLeft;

                    w  = element.offsetWidth -1,
                    h  = element.offsetHeight -1,
                    l  = offsetLeft,
                    t  = offsetTop,

                    style = "";

                    // Should we display the popup on top or below the element?
                    if (t > 60 && t - st + h + 50 > oh) {
                        style = "bottom: " + (oh - t + 5) + "px;";
                    } else {
                        style = "top: " + (t + h + 5 ) + "px;";
                    }

                    // Should we display the popup aligned on the left or right of the element?
                    left = sl;
                    right = sl + ow;
                    leftWidth = right - l;
                    rightWidth = l + w - left;

                    if (leftWidth  > rightWidth) {
                        //Let's align the popup to the left of the element or to the far left
                        if (leftWidth < 150) {
                            style += " left: " + (left + 5) + "px;";
                            style += " max-width: " + (ow - 10 - popupExtraWidth) + "px;";
                        } else {
                            style += " left: " + (left + l) + "px;";
                            style += " max-width: " + (leftWidth - 5 - popupExtraWidth) + "px;";
                        }
                    } else {
                        if (rightWidth < 150) {
                            style += " right: " + (left + 6) + "px;";
                            style += " max-width: " + (ow - 10 - popupExtraWidth) + "px;";
                        } else {
                            style += " right: " + (right - (left + l + w + 10)) + "px;";
                            style += " max-width: " + (rightWidth - popupExtraWidth) + "px;";
                        }
                    }

                    popup = document.createElement("DIV");
                    popup.className = "montage-link-popup";
                    popup.setAttribute("contentEditable", "false");
                    popup.setAttribute("style", style);
                    popup.innerHTML = '<a href="' + element.href + '" target="_blank">' + element.href + '</a>';
                    editorElement.insertBefore(popup, null);

                    this._element = element;
                }
            }
        }
    },

    hide: {
        value: function() {
            var popups,
                nbrPopups,
                popup,
                i;
            if (this._element) {
                popups = this._editor.element.firstChild.getElementsByClassName("montage-link-popup");
                nbrPopups = popups.length;

                // Note: We should not have more than one popup, this is just in case...
                for (i = 0; i < nbrPopups; i ++) {
                    popup = popups[0];
                    popup.parentNode.removeChild(popup);
                }

                this._element = null;
            }
        }
    },

    cleanup: {
        value: function(contentNode) {
            var cleanContentNode = contentNode,
                popups = contentNode.getElementsByClassName("montage-link-popup"),
                nbrPopups,
                popup,
                i;

            if (popups) {
                // We don't want to hide the popup, just return a copy of the content without any popup
                cleanContentNode = contentNode.cloneNode(true);
                popups = cleanContentNode.getElementsByClassName("montage-link-popup");
                nbrPopups = popups.length;

                // Note: We should not have more than one popup, this is just in case...
                for (i = 0; i < nbrPopups; i ++) {
                    popup = popups[0];
                    popup.parentNode.removeChild(popup);
                }
            }

            return cleanContentNode;
        }
    }
});
