/* <copyright>
Copyright (c) 2012, Motorola Mobility, Inc
All Rights Reserved.
BSD License.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

  - Redistributions of source code must retain the above copyright notice,
    this list of conditions and the following disclaimer.
  - Redistributions in binary form must reproduce the above copyright
    notice, this list of conditions and the following disclaimer in the
    documentation and/or other materials provided with the distribution.
  - Neither the name of Motorola Mobility nor the names of its contributors
    may be used to endorse or promote products derived from this software
    without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
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

    _selectedItem: {value: null},
    selectedItem: {
        get: function() {
            return this._selectedItem;
        },
        set: function(value) {
            if(value && value !== this._selectedItem) {
                this._selectedItem = value;
                this.needsDraw = true;
            }
        }
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

    handleEvent: {
        value: function(event) {

            var target = event.target;
            var $li = findClosestOfType(target, 'li', this.element);

            if($li) {
                var a = $li.querySelector('a');
                if(a) {
                    var hash = a.getAttribute('href') || '#';
                    this.selectedItem = hash.substring(hash.indexOf('#')+1);
                    //event.preventDefault();
                }
            }
        }
    },

    draw: {
        value: function() {

            if(this.selectedItem) {
                var $link = this.element.querySelector("a[href='#" + this.selectedItem + "']");
                if($link) {
                    var items = this.element.querySelectorAll('li.nav-item')||[], len = items.length;
                    for(i=0; i< len; i++) {
                        items[i].classList.remove('selected');
                    }

                    var $li = findClosestOfType($link, 'li', this.element);
                    $li.classList.add('selected');
                }
            }

        }
    }

});
