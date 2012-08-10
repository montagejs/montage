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
var Montage     = require("montage/core/core").Montage,
    Component   = require("montage/ui/component").Component;

exports.Details = Montage.create(Component, {
    _data: {
        value: null
    },

    data: {
        set: function(val){
            this._data = val;
            this.needsDraw = true;
        },
        get: function(){
            return this._data;
        }
    },

    draw: {
        value: function(){
            if( this.data ){
                var audience = this.data.ratings.audience_rating,
                    critics = this.data.ratings.critics_rating;

                if( audience == "Fresh" ){
                    this.aImage.style.backgroundPosition = '0px 0px'
                }else if( audience == "Rotten" ){
                    this.aImage.style.backgroundPosition = '0px -25px'
                }else if( audience == "Certified Fresh" ){
                    this.aImage.style.backgroundPosition = '0px -50px'
                }else if( audience == "Upright" ){
                    this.aImage.style.backgroundPosition = '0px -75px'
                }else if( audience == "Spilled" ){
                    this.aImage.style.backgroundPosition = '0px -125px'
                }else{
                    this.aImage.style.backgroundPosition = '0px -100px'
                }

                if( critics == "Fresh" ){
                    this.cImage.style.backgroundPosition = '0px 0px'
                }else if( critics == "Rotten" ){
                    this.cImage.style.backgroundPosition = '0px -25px'
                }else if( critics == "Certified Fresh" ){
                    this.cImage.style.backgroundPosition = '0px -50px'
                }else if( critics == "Upright" ){
                    this.cImage.style.backgroundPosition = '0px -75px'
                }else if( critics == "Spilled" ){
                    this.cImage.style.backgroundPosition = '0px -125px'
                }else{
                    this.cImage.style.backgroundPosition = '0px -100px'
                }
            }
        }
    },

    handleRentButtonAction: {
        value: function() {
            window.open( this.data.links.alternate );
        }
    },

    handleTrailerButtonAction: {
        value: function() {
            this.dispatchEventNamed("openTrailer", true, true, this.data.title);
        }
    }
});
