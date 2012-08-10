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
var Montage     = require("montage").Montage,
    Component   = require("montage/ui/component").Component,
    Remotemediator   = require("model/remotemediator").Remotemediator,
    AppData     = require("model/appdata").AppData;

exports.Main = Montage.create(Component, {
    appData: {
        value: AppData.create()
    },

    remoteMediator: {
        value: Remotemediator.create()
    },

    _categoryButtonGroup: {
        value: null
    },

    didCreate: {
        value: function() {
            this.application.addEventListener( "remoteDataReceived", this, false);
            this.application.addEventListener( "openTrailer", this, false);

            this.canDrawGate.setField("latestBoxofficeMovies", false);

            this.remoteMediator.load();
        }
    },

    templateDidLoad: {
        value: function() {
            var templateObjects = this.templateObjects;

            this._categoryButtonGroup = [
                templateObjects.latest,
                templateObjects.theaters,
                templateObjects.dvd,
                templateObjects.upcoming
            ];
        }
    },

    handleRemoteDataReceived: {
        value: function(event){
            var data = event.detail.data,
                type = event.detail.type;

            this.appData[type] = data;

            if( type === "latestBoxofficeMovies" ){
                this.canDrawGate.setField("latestBoxofficeMovies", true);
                this.dispatchEventNamed("dataReceived", true);
                this.changeCategory(type);
            }
        }
    },

    handleOpenTrailer: {
        value: function(event) {
            var title = event.detail,
                popup = this.templateObjects.popup;

            this.remoteMediator.searchYoutubeTrailer(title, function(id) {
                popup.openTrailer(id);
            });
        }
    },

    handleCategoryButtonAction: {
        value: function(action) {
            this.changeCategory(action.target.category);
        }
    },

    changeCategory: {
        value: function(category) {
            var buttons = this._categoryButtonGroup;

            this.templateObjects.facadeflow.changeCategory(category);
            for (var i = 0; i < buttons.length; i++) {
                buttons[i].pressed = (buttons[i].category === category);
            }
        }
    }
});
