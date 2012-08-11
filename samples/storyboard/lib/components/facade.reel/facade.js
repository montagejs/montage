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
    Component   = require("montage/ui/component").Component,
    UndoManager = require("montage/core/undo-manager").UndoManager,
    Template  = require("montage/ui/template").Template,
    Textelement = require("lib/components/textelement.reel").Textelement;



exports.Facade = Montage.create(Component, {

  _isShowingBrowser: {
    value: false
  },
  isShowingBrowser: {
    set: function(val){
      this._isShowingBrowser = val;
      this.needsDraw = true;
    },
    get: function(){
      return this._isShowingBrowser;
    }
  },

	appData: {
    value: null
  },

  documentData: {
    value: null
  },

  browser: {
  	value: null
  },

  editor: {
    value: null
  },

  undoManager: {
    value: null
  },

  selectedSlideIndex: {
    value: null
  },

  templateDidLoad: {
  	value: function(){
  		this.application.facade = this;
      // Install an undomanager for the application to use
      this.undoManager = document.application.undoManager = UndoManager.create();
  	}
  },

	prepareForDraw: {
    value: function(){

      this.documentData = this.appData.documentData;

      this.defineHelpers();

    	this.eventManager.addEventListener( "menuAction", this, false );
      this.eventManager.addEventListener( "appAction", this, false );

    }
  },

  handleMenuAction: {
    value: function( event ){


      if( event.detail === "toggleBrowser" ){

        this.toggleBrowser();

      } else if( event.detail === "addTextElement" ){

        var textElement = Textelement.create();

        this.undoManager.add( "removeElement", this.editor.stage.slide.removeElement, this, textElement );

        this.editor.stage.slide.addElement( textElement );

      } else if( event.detail === "undo" ){

        this.undo();

      }

    }
  },

  toggleBrowser: {
    value: function( ){

        this.isShowingBrowser = !this.isShowingBrowser;

    }
  },

  draw: {
    value: function( ){

      if( this.isShowingBrowser ){
        this.element.classList.add( "showBrowser" );
      } else {
        this.element.classList.remove( "showBrowser" );
      }

    }
  },

  handleAppAction: {
    value: function( event ){

      if( event.detail.parameter == "addNewSlide" )
      {

        this.saveCurrentSlide();

        this.undoManager.add( "deleteSlide", this.deleteSlide, this, event.detail.index+1 );

        var slide = this.appData.emptySlide;

        this.addSlide( event.detail.index+1 , slide );

      }
      else if( event.detail.parameter == "deleteSlide" )
      {
        if( this.documentData.slides.length > 1 )
        {

          this.saveCurrentSlide();

          var slide = this.browser.getSlideByIndex( event.detail.index ).data;

          this.undoManager.add( "addSlide", this.addSlide, this, event.detail.index, slide );

          this.deleteSlide( event.detail.index );

        }

      }
      else if( event.detail.parameter == "selectSlide" )
      {

        this.saveCurrentSlide();

        if( this.selectedSlideIndex != null )
        {
           this.undoManager.add( "selectSlide", this.selectSlide, this, this.selectedSlideIndex );
        }

        this.selectSlide(event.detail.index);

      }
      else if( event.detail.parameter == "duplicateSlide" )
      {

        this.saveCurrentSlide();

        this.undoManager.add( "deleteSlide", this.deleteSlide, this, event.detail.index+1 );


        var slide  = JSON.parse( JSON.stringify( this.browser.getSlideByIndex( event.detail.index ).data ) );


        this.addSlide( event.detail.index+1 , slide );

      }

      console.log( "data",this.appData)

    }
  },



  undo: {
    value: function( ){

      if( this.undoManager.canUndo ) {
        this.undoManager.undo();
      } else {
        console.log( "nothing to undo" )
      }

    }
  },

  saveCurrentSlide: {
    value: function( ){

      var templateCreator = Template.create();
      templateCreator.initWithComponent( this.editor.stage.slide );
      var serialized = templateCreator.exportToString();

     // console.log( "serialized", serialized )

      this.undoManager.add( "loadSavedSlide", this.loadSavedSlide, this, this.selectedSlideIndex, this.application.facade.appData.documentData.slides[this.selectedSlideIndex].data );

      this.application.facade.appData.documentData.slides[this.selectedSlideIndex].data = serialized;
      this.browser.getSlideByIndex( this.selectedSlideIndex ).updateSlide();

    }
  },

  loadSavedSlide: {
    value: function( index, slide ){
      this.application.facade.appData.documentData.slides[this.selectedSlideIndex].data = slide;
      this.browser.getSlideByIndex( this.selectedSlideIndex ).updateSlide();
      this.selectSlide( this.selectedSlideIndex )

    }
  },

  selectSlide: {
    value: function( index ){

      this.browser.selectSlideByIndex( index );

      this.editor.resetEditor();

      this.editor.stage.loadSlide( index );

      this.selectedSlideIndex = index;

    }
  },


    addSlide: {
      value: function( index, slide ){

        this.documentData.slides.splice( index, 0, slide );
        this.indexSlides();
        this.selectSlide( index );

      }
    },

    deleteSlide: {
      value: function( index ){

        this.documentData.slides.splice( index, 1 );
        this.indexSlides();

        if( index > 0 )
        {
          this.selectSlide( index - 1 );
        }
        else
        {
          this.selectSlide( 0 );
        }

      }
    },

    indexSlides: {
      value: function( index, slide ){

        for( var i = 0, length = this.documentData.slides.length; i<length; i++ )
        {
           this.documentData.slides[i].index = i;

        }

      }
    },

    defineHelpers: {
      value: function(){

        var self = this;

        Object.defineProperty( Object.prototype, "dispatchEventWithType",
        {
          enumerable: false,
          value: function( type, detail, canBubble, cancellable )
          {

            if ( canBubble == undefined )
            {
              canBubble = true
            }

            if ( cancellable == undefined )
            {
              cancellable = true
            }

            var customEvent = document.createEvent("CustomEvent");
            customEvent.initCustomEvent( type, canBubble, cancellable, detail );
            self.eventManager.dispatchEvent( customEvent );
          }
        });

      }
    }

});
