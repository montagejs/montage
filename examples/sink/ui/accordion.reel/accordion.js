/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component;


// similar to jquery.closest. Find the closest ancestor of el matching the type
var findClosestOfType = function(el, type, context, clazz) {
	if(el.tagName.toLowerCase() === type) {
		return el;
	}
	var found = false;
	while(el) {
		el = el.parentNode;
		if(el.tagName && el.tagName.toLowerCase() === type) {
		    if(clazz) {
		        if(el.classList.contains(clazz)) {
		            found = true;
		            break;
		        }
		    } else {
		        found = true;
		        break;
		    }						
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

exports.Accordion = Montage.create(Component, {

    
    prepareForDraw: {
        value: function() {
            if(window.Touch) {
                this.element.addEventListener('touchend', this);
            } else {
                this.element.addEventListener('mouseup', this);
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

    handleEvent: {
        value: function(event) {
            event.preventDefault();
            var target = event.target;
            var $li = findClosestOfType(target, 'li', this.element);

            if($li) {
                var $heading = findClosestOfType(target, 'div', this.element, "accordion-heading");
                if($heading) {
                    // user clicked on the header
                    var a = $li.querySelector('a');
                    if(a) {
                        var $content = $li.querySelector('div.accordion-inner');
                        $content.classList.toggle('montage-hidden');                    
                    }
                    
                } 
                
                
            }
        }
    }

});
