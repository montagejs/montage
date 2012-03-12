/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component;

// similar to jquery.closest. Find the closest ancestor of el matching the type
var findClosestOfType = function(el, type, context) {
	if(el.tagName.toLowerCase() === type) {
		return el;
	}
	var found = false;
	while(el) {
		el = el.parentNode;
		if(el.tagName && el.tagName.toLowerCase() === type) {
			found = true;
			break;
		}
		if(!el || !el.ownerDocument || el === context || el.nodeType === 11) {
			break;
		}
	}
	if(found) {
		return el;
	}
	return null;

};

exports.Sidebar = Montage.create(Component, {

    // the main component
    sandbox: {
        value: null
    },

    sidebarList: {
        value: null
    },

    montageComponents: {
        value: null
    },

    prepareForDraw: {
        value: function() {
            if(window.Touch) {
                this.element.addEventListener('touchend', this);
            } else {
                this.element.addEventListener('click', this);
            }
        }
    },

    handleNavItemClicked: {
        value: function(href) {
            console.log("nav item clicked = " + href);
            var hash = href.substring(href.lastIndexOf('#')+1);
            this.sandbox.selectedItem = hash;
        }
    },

    _highlightSelection: {
        value: function($li) {
            var $ul = findClosestOfType($li, 'div', this.element);
            if($ul) {
                var items = $ul.querySelectorAll('li')||[], len = items.length;
                for(i=0; i< len; i++) {
                    items[i].classList.remove('selected');
                }
                $li.classList.add('selected');
            }
        }
    },

    handleEvent: {
        value: function(event) {

            var target = event.target;
            var $li = findClosestOfType(target, 'li', this.element);

            if($li) {
                var a = $li.querySelector('a');
                if(a) {
                    this._highlightSelection($li);
                    this.handleNavItemClicked(a.href);
                    event.preventDefault();
                }
            }
        }
    }

});
