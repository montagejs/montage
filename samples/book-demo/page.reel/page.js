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
    Component = require("montage/ui/component").Component,
    Logo = require("pages/logo.reel").Logo,
    Tempconverter = require("pages/tempconverter.reel").Tempconverter,
    TempconverterText = require("pages/tempconverter-text.reel").TempconverterText,
    MontageLogo = require("pages/montage-logo.reel").MontageLogo,
    MontageText = require("pages/montage-text.reel").MontageText,
    ScreeningLogo = require("pages/screening-logo.reel").ScreeningLogo,
    ScreeningText = require("pages/screening-text.reel").ScreeningText,
    NinjaLogo = require("pages/ninja-logo.reel").NinjaLogo,
    NinjaText = require("pages/ninja-text.reel").NinjaText,
    ScratchpadLogo = require("pages/scratchpad-logo.reel").ScratchpadLogo,
    ScratchpadText = require("pages/scratchpad-text.reel").ScratchpadText,
    GSGLogo = require("pages/gsg-logo.reel").GSGLogo,
    GSGText = require("pages/gsg-text.reel").GSGText,
    End = require("pages/end.reel").End,
    EndLogo = require("pages/end-logo.reel").EndLogo,
    Architecture1 = require("pages/architecture-1.reel").Architecture1,
    Architecture2 = require("pages/architecture-2.reel").Architecture2,
    Architecture3 = require("pages/architecture-3.reel").Architecture3,
    Architecture4 = require("pages/architecture-4.reel").Architecture4,
    Architecture5 = require("pages/architecture-5.reel").Architecture5,
    Architecture6 = require("pages/architecture-6.reel").Architecture6,
    Architecture7 = require("pages/architecture-7.reel").Architecture7,
    Architecture8 = require("pages/architecture-8.reel").Architecture8,
    Architecture9 = require("pages/architecture-9.reel").Architecture9,
    Architecture10 = require("pages/architecture-10.reel").Architecture10,
    Architecture11 = require("pages/architecture-11.reel").Architecture11,
    Architecture12 = require("pages/architecture-12.reel").Architecture12,
    Architecture13 = require("pages/architecture-13.reel").Architecture13,
    Architecture14 = require("pages/architecture-14.reel").Architecture14;


exports.Page = Montage.create(Component, {

    pageContent: {
        value: false,
        serializable: true
    },

    pageNumber: {
        value: false,
        serializable: true
    },

    _needsToChangePageContent: {
        value: false
    },


	_pageData: {
		value: null
	},

    pageData: {
        set: function(val){

            //console.log( val)

            if (this._pageData !== val && val != undefined ) {
                this._pageData = val;
                this._needsToChangePageContent = true;
                this.needsDraw = true;
            }

        },
        get: function(){
            return this._pageData;
        }
    },

    prepareForDraw: {
        value: function() {
        }
    },



    draw: {
        value: function () {

            if( this._needsToChangePageContent ){

                if (this.pageData.image) {
                    this._element.style.background = "url(" + this.pageData.image + ")";
                } else {
                    if (this.pageData.index % 2) {
                        this._element.style.background = "url(resources/shared/page-left.jpg)";
                    } else {
                        this._element.style.background = "url(resources/shared/page-right.jpg)";
                    }
                }

                if (this.pageData.component) {
                    if( this.pageData.component === "Tempconverter"){
                        var component = Tempconverter.create();
                    } else if( this.pageData.component === "TempconverterText"){
                        var component = TempconverterText.create();
                    } else if( this.pageData.component === "Logo"){
                        var component = Logo.create();
                    } else if( this.pageData.component === "MontageText"){
                        var component = MontageText.create();
                    } else if( this.pageData.component === "MontageLogo"){
                        var component = MontageLogo.create();
                    } else if( this.pageData.component === "ScreeningLogo"){
                        var component = ScreeningLogo.create();
                    } else if( this.pageData.component === "ScreeningText"){
                        var component = ScreeningText.create();
                    } else if( this.pageData.component === "NinjaLogo"){
                        var component = NinjaLogo.create();
                    } else if( this.pageData.component === "NinjaText"){
                        var component = NinjaText.create();
                    } else if( this.pageData.component === "ScratchpadLogo"){
                        var component = ScratchpadLogo.create();
                    } else if( this.pageData.component === "ScratchpadText"){
                        var component = ScratchpadText.create();
                    } else if( this.pageData.component === "GSGLogo"){
                        var component = GSGLogo.create();
                    } else if( this.pageData.component === "GSGText"){
                        var component = GSGText.create();
                    } else if( this.pageData.component === "End"){
                        var component = End.create();
                    } else if( this.pageData.component === "EndLogo"){
                        var component = EndLogo.create();
                    } else if( this.pageData.component === "Architecture1"){
                        var component = Architecture1.create();
                    } else if( this.pageData.component === "Architecture2"){
                        var component = Architecture2.create();
                    } else if( this.pageData.component === "Architecture3"){
                        var component = Architecture3.create();
                    } else if( this.pageData.component === "Architecture4"){
                        var component = Architecture4.create();
                    } else if( this.pageData.component === "Architecture5"){
                        var component = Architecture5.create();
                    } else if( this.pageData.component === "Architecture6"){
                        var component = Architecture6.create();
                    } else if( this.pageData.component === "Architecture7"){
                        var component = Architecture7.create();
                    } else if( this.pageData.component === "Architecture8"){
                        var component = Architecture8.create();
                    } else if( this.pageData.component === "Architecture9"){
                        var component = Architecture9.create();
                    } else if( this.pageData.component === "Architecture10"){
                        var component = Architecture10.create();
                    } else if( this.pageData.component === "Architecture11"){
                        var component = Architecture11.create();
                    } else if( this.pageData.component === "Architecture12"){
                        var component = Architecture12.create();
                    } else if( this.pageData.component === "Architecture13"){
                        var component = Architecture13.create();
                    } else if( this.pageData.component === "Architecture14"){
                        var component = Architecture14.create();
                    }



                    this.pageContent = component;
                } else {
                    this.pageContent = null;
                }

                var position = this.pageData.index%2;

                this.pageNumber.classList.remove( "page_number_hidden" );
                this.pageNumber.classList.remove( "page_number_left" );

                if( this.pageData.index === 0 ){
                    this.pageNumber.classList.add( "page_number_hidden" );
                } else if ( position != 0 ) {
                    this.pageNumber.classList.add( "page_number_left" );
                }

                this._needsToChangePageContent = false;
            }

        }
    }



});
