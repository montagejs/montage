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
var Montage = require("montage").Montage,
    Composer = require("montage/ui/composer/composer").Composer;

exports.AnimateTestComposer = Montage.create(Composer, /** @lends module:montage/ui/composer/swipe-composer.SwipeComposer# */ {

/**
    Description TODO
    @function
    @param {Element}
    */
    load: {
        value: function() {
            this.needsFrame = true;
        }
    },

/**
    Description TODO
    @function
    */
    unload: {
        value: function() {
            this.needsFrame = false;
        }
    },

    frame: {
        value: function(timestamp) {
            this.needsFrame = true;
            this.top = Math.sin(this.count / 10) * 10;
            this.left = Math.cos(this.count / 10) * 10;
            this.color = (this.count) % 255;
            this.content = this.count % 100;
            this.count = this.count + 1;
        }
    },

    top: {
        value: 0
    },

    left: {
        value: 0
    },

    color: {
        value: 0
    },

    content: {
        value: 0
    },

    count: {
        value: 0
    }

});
