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
