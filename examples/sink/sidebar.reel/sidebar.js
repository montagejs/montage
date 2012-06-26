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
        value: null,
        serializable: true
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
                    this.selectedItem = hash.substring(hash.indexOf('#!')+3); // #!/
                    //event.preventDefault();
                }
            }
        }
    },

    draw: {
        value: function() {

            if(this.selectedItem) {
                var $link = this.element.querySelector("a[href='#!/" + this.selectedItem + "']");
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
