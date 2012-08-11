/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component;


exports.Main = Montage.create(Component, {

    appData: {
        value: null,
        serializable: true
    },

    pagesArray: {
        value: null,
        serializable: true
    },

    portraitData: {
        value: []
    },

    landscapeData: {
        value: []
    },

    windowSize: {
        value: null
    },

    _needsToModifyPlayBtn: {
        value: false
    },

    needsToModifyPlayBtn: {
        get: function () {
            return this._needsToModifyPlayBtn;
        },
        set: function (value) {
            if (value) {
                this.needsDraw = true;
            }
            this._needsToModifyPlayBtn = value;
        }
    },

    playBtn: {
        value: null,
        serializable: true
    },

    _selectedSpreadIdx: {
        value: null
    },

    selectedSpreadIdx: {
        set: function(val){
            this._selectedSpreadIdx = val;
            this.setActivePage();
        },
        get: function(){
            return this._selectedSpreadIdx;
        }
    },

    _scroll: {
        value: []
    },

    scroll: {
        set: function(val){
            this._scroll = val;
            if( val%1 == 0 )
            {
                this.selectedSpreadIdx = val;
            }
        },
        get: function(){
            return this._scroll;
        }
    },

    activePageIdx: {
        value: null
    },

    _width: {
        enumerable: false,
        value: null
    },

    _height: {
        enumerable: false,
        value: null
    },

    arrayController: {
        enumerable: false,
        value: null,
        serializable: true
    },

    pageList: {
        value: null,
        serializable: true
    },

    pages: {
        value: [],
        serializable: true
    },

    audioElement: {
        value: null,
        serializable: true
    },

    _isPlaying: {
        value: false,
        serializable: true
    },

    isPlaying: {
        set: function(val){
            this._isPlaying = val;
            if( !val ){
                this.stopPlaying();
            }
            this.needsToModifyPlayBtn = true;
        },
        get: function(){
            return this._isPlaying;
        }
    },


    setActivePage: {
        value: function() {

            if( this.activePageIdx )
            {
                dispatchEventWithType( "resetPage", this.activePageIdx );
            }
              
            var right_idx = this.selectedSpreadIdx*2;
            var left_idx = right_idx-1;

            if( this.appData.pages[right_idx].end )
            {
                this.activePageIdx = right_idx;
            }
            else
            {
                this.activePageIdx = left_idx;
            }
        }
    },

    templateDidLoad: {
        value: function() {
            this.application.main = this;
            this.prepareData();
            this.pagesArray = this.landscapeData;
        }
    },

    prepareData: {
        value: function() {
            this.landscapeData = this.appData.pages;

            for (var i = 0, length = this.landscapeData.length; i < length; i++) {
                var page = this.landscapeData[i];

                if( page.end )
                {
                    this.portraitData.push(page);
                }
            };
        }
    },

    isTouchDevice: {
        value: function(){
            return 'ontouchstart' in document.documentElement;
        }
    },

    handleResize: {
        value: function () {
            this.needsDraw = true;
        }
    },

    prepareForDraw: {
        value: function() {


            var self = this;

            self.loadAudio();

            this.audioElement.addEventListener( "ended", this, false );
            this.audioElement.addEventListener( "timeupdate", this, false );

            window.addEventListener( "resize", this, false );





            this.eventManager.addEventListener( "inputEvent", this, false );

            this.element.addEventListener( "mousedown", this, true );

            Object.defineProperty( Object.prototype, "dispatchEventWithType", {
                enumerable: false,
                value: function( type, detail, canBubble, cancellable ) {
                    if ( canBubble === undefined ) {
                        canBubble = true;
                    }

                    if ( cancellable === undefined ) {
                        cancellable = true;
                    }

                    var customEvent = document.createEvent("CustomEvent");
                    customEvent.initCustomEvent( type, canBubble, cancellable, detail );
                    self.eventManager.dispatchEvent( customEvent );
                }
            });
        }
    },

    loadAudio: {
        value: function(){
            this.audioElement.src = this.appData.audio;
            this.audioElement.load();
            
        }
    },

    pageWidth: {
        value: 0
    },

    pageOffset: {
        value: 0
    },

    pageMargin: {
        value: 0
    },

    prevMargin: {
        value: 0
    },

    pageWidth: {
        value: 648
    },

    pointInCircleAt: { // returns a point in a unit radius circle with center at origin for a given angle
        value: function (angle) {
            return [Math.cos(angle), Math.sin(angle)];
        }
    },

    tangentInCircleAt: { // returns normalized tangent vector for a point in a circle at a given angle
        value: function (angle) {
            return [-Math.sin(angle), Math.cos(angle)];
        }
    },

    scaleVector: {
        value: function (vector, scale) {
            return [
                vector[0] * scale,
                vector[1] * scale
            ];
        }
    },

    _orientation: {
        enumerable: false,
        value: null
    },

    orientation: { // portait or landscape
        get: function () {
            return this._orientation;
        },
        set: function (value) {
            if (value !== this._orientation) {
                var bezierHandlerLength = .130976446, // magic number, optimized length of a handler to create a 16-segments cubic bezier unit radius circle
                    halfPageWidth = this.pageWidth / 2,
                    point,
                    tangent,
                    angle,
                    i;

                this._orientation = value;
                if (this._orientation === "portait") {

                    this.pagesArray = this.portraitData;

                    var pagesKnots = [];

                    pagesKnots.push(
                        {
                                "knotPosition": [-halfPageWidth * 2, 0, 0],
                                "previousHandlerPosition": [-halfPageWidth * 2, 0, 0],
                                "nextHandlerPosition": [-halfPageWidth * 2, 0, 0],
                                "previousDensity": 1/2,
                                "nextDensity": 1/2,
                                "rotateY": -.9,
                                "opacity": 0
                        }
                    );
                    pagesKnots.push(
                        {
                                "knotPosition": [-halfPageWidth, 0, 0],
                                "previousHandlerPosition": [-halfPageWidth, 0, 0],
                                "nextHandlerPosition": [-halfPageWidth, 0, 0],
                                "previousDensity": 1/2,
                                "nextDensity": 1/2,
                                "rotateY": -.6,
                                "opacity": 1
                        }
                    );
                    pagesKnots.push(
                        {
                                "knotPosition": [0, 0, 0],
                                "previousHandlerPosition": [0, 0, 0],
                                "nextHandlerPosition": [0, 0, 0],
                                "previousDensity": 1/2,
                                "nextDensity": 1/2,
                                "rotateY": 0,
                                "opacity": 1
                        }
                    );
                    pagesKnots.push(
                        {
                                "knotPosition": [0, 0, -300],
                                "previousHandlerPosition": [0, 0, -300],
                                "nextHandlerPosition": [0, 0, -300],
                                "previousDensity": 1.5001,
                                "nextDensity": 1.5001,
                                "rotateY": 0,
                                "opacity": 0
                        }
                    );
                    this.pageList.paths = [
                        {
                            "knots": pagesKnots,
                            "headOffset": 1,
                            "tailOffset": 1,
                            "units": {
                                "opacity": "",
                                "rotateY": "rad"
                            }
                        }
                    ];
                    this.pageList.cameraPosition = [0, 0, 3300];
                } else {

                    this.pagesArray = this.landscapeData;

                    var oddPagesKnots = [], // the odd pages are at the right side in a book
                        evenPagesKnots = [];

                    oddPagesKnots.push(
                        {
                                "knotPosition": [-halfPageWidth, 0, -2],
                                "previousHandlerPosition": [-halfPageWidth, 0, -2],
                                "nextHandlerPosition": [-halfPageWidth, 0, -2],
                                "previousDensity": 15 / 8,
                                "nextDensity": 15 / 8,
                                "rotateY": -Math.PI,
                                "opacity": 1
                        }
                    );
                    for (i = 0; i <= 8; i++) {
                        angle = Math.PI - i * Math.PI / 8;
                        point = this.scaleVector(this.pointInCircleAt(angle), halfPageWidth);
                        tangent = this.scaleVector(this.tangentInCircleAt(angle), halfPageWidth * bezierHandlerLength);
                        oddPagesKnots.push(
                            {
                                "knotPosition": [point[0], 0, point[1]],
                                "previousHandlerPosition": [point[0] + tangent[0], 0, point[1] + tangent[1]],
                                "nextHandlerPosition": [point[0] - tangent[0], 0, point[1] - tangent[1]],
                                "previousDensity": 1 / 8,
                                "nextDensity": 1 / 8,
                                "rotateY": -angle,
                                "opacity": 1
                            }
                        );
                    }
                    oddPagesKnots[1].previousHandlerPosition = [-halfPageWidth, 0, 0];
                    oddPagesKnots[9].nextHandlerPosition = [halfPageWidth, 0, 0];
                    oddPagesKnots.push(
                        {
                                "knotPosition": [halfPageWidth, 0, -1],
                                "previousHandlerPosition": [halfPageWidth, 0, -1],
                                "nextHandlerPosition": [halfPageWidth, 0, -1],
                                "previousDensity": 7 / 8,
                                "nextDensity": 7 / 8,
                                "rotateY": 0,
                                "opacity": .9
                        }
                    );
                    oddPagesKnots.push(
                        {
                                "knotPosition": [halfPageWidth, 0, -1],
                                "previousHandlerPosition": [halfPageWidth, 0, -1],
                                "nextHandlerPosition": [halfPageWidth, 0, -1],
                                "previousDensity": 1 / 8,
                                "nextDensity": 1 / 8,
                                "rotateY": 0,
                                "opacity": 0
                        }
                    );
                    oddPagesKnots.push(
                        {
                                "knotPosition": [halfPageWidth, 0, -2],
                                "previousHandlerPosition": [halfPageWidth, 0, -2],
                                "nextHandlerPosition": [halfPageWidth, 0, -2],
                                "previousDensity": 15.0001 / 8,
                                "nextDensity": 15.0001 / 8,
                                "rotateY": 0,
                                "opacity": 0
                        }
                    );
                    evenPagesKnots.push(
                        {
                                "knotPosition": [-halfPageWidth, 0, -2],
                                "previousHandlerPosition": [-halfPageWidth, 0, -2],
                                "nextHandlerPosition": [-halfPageWidth, 0, -2],
                                "previousDensity": 1 / 8,
                                "nextDensity": 1 / 8,
                                "rotateY": 0,
                                "opacity": 0
                        }
                    );
                    evenPagesKnots.push(
                        {
                                "knotPosition": [-halfPageWidth, 0, -2],
                                "previousHandlerPosition": [-halfPageWidth, 0, -2],
                                "nextHandlerPosition": [-halfPageWidth, 0, -2],
                                "previousDensity": 7 / 8,
                                "nextDensity": 7 / 8,
                                "rotateY": 0,
                                "opacity": .9
                        }
                    );
                    for (i = 0; i <= 8; i++) {
                        angle = Math.PI - i * Math.PI / 8;
                        point = this.scaleVector(this.pointInCircleAt(angle), halfPageWidth);
                        tangent = this.scaleVector(this.tangentInCircleAt(angle), halfPageWidth * bezierHandlerLength);
                        evenPagesKnots.push(
                            {
                                "knotPosition": [point[0], 0, point[1]],
                                "previousHandlerPosition": [point[0] + tangent[0], 0, point[1] + tangent[1]],
                                "nextHandlerPosition": [point[0] - tangent[0], 0, point[1] - tangent[1]],
                                "previousDensity": 1 / 8,
                                "nextDensity": 1 / 8,
                                "rotateY": -angle + Math.PI,
                                "opacity": 1
                            }
                        );
                    }
                    evenPagesKnots[2].previousHandlerPosition = [-halfPageWidth, 0, 0];
                    evenPagesKnots[10].nextHandlerPosition = [halfPageWidth, 0, 0];
                    evenPagesKnots.push(
                        {
                                "knotPosition": [halfPageWidth, 0, -1000],
                                "previousHandlerPosition": [halfPageWidth, 0, -1000],
                                "nextHandlerPosition": [halfPageWidth, 0, -1000],
                                "previousDensity": 15.0001 / 8,
                                "nextDensity": 15.0001 / 8,
                                "rotateY": Math.PI,
                                "opacity": 1
                        }
                    );
                    this.pageList.paths = [
                        {
                            "knots": oddPagesKnots,
                            "headOffset": 2,
                            "tailOffset": 2,
                            "units": {
                                "rotateY": "rad",
                                "opacity": ""
                            }
                        },
                        {
                            "knots": evenPagesKnots,
                            "headOffset": 2,
                            "tailOffset": 1,
                            "units": {
                                "rotateY": "rad",
                                "opacity": ""
                            }
                        }
                    ];
                    this.pageList.cameraPosition = [0, 0, 3000];
                }
            }
        }
    },

    willDraw: {
        value: function() {
            var needsOrientationChange = false;

            if (this._width !== this._element.offsetWidth) {
                this._width = this._element.offsetWidth;
                needsOrientationChange = true;
            }
            if (this._height !== this._element.offsetHeight) {
                this._height = this._element.offsetHeight;
                needsOrientationChange = true;
            }
            if (needsOrientationChange) {
                if (this._width / this._height < 1.5) {
                    this.orientation = "portait";
                } else {
                    this.orientation = "landscape";
                }
            }
        }
    },

    draw: {
        value: function() {

          if( this._needsToModifyPlayBtn ){
                if( this.isPlaying ){
                    this.playBtn.innerHTML = "STOP";
                } else {
                    this.playBtn.innerHTML = "PLAY";
                }
                this._needsToModifyPlayBtn = false;
            }
/*
            if( this._needsToChangeOrientation ){
                if( this.orientation === "vertical" ){

                    this.pageList.element.style.left = "-400px"
                } else {
                    this.pageList.element.style.left = "0px"
                }
                this._needsToChangeOrientation = false;
            }*/
            
        }
    },

    handleInputEvent: {
        value: function( event ) {

            this.isPlaying = false;

            if( event.detail == "left" ) {
                this.handlePrevAction();
            } else if( event.detail == "right" ) {
                this.handleNextAction();
            } else if( event.detail == "escape" ) {
                this.resetBook();
            }
        }
    },

    handlePrevAction: {
        value: function() {

            var prevIndex = this.selectedSpreadIdx-1;
            this.pageList.startScrollingIndexToOffset(prevIndex < 0 ? [0] : [prevIndex],0);

        }
    },

    handleNextAction: {
        value: function() {

            var nextIndex = this.selectedSpreadIdx+1;
            var maxIndex = this.pageList.length;
            
            if( nextIndex > maxIndex )
            {
                this.resetBook();
            }
            else
            {
                this.pageList.startScrollingIndexToOffset(nextIndex,0);
            }

        }
    },

    

    handleTimeupdate: {
        value: function( e ) {

            if( this.activePageIdx != null && this.isPlaying )
            {

                var time = this.audioElement.currentTime;
                var data = this.appData.pages[ this.activePageIdx ];

                if( time <= data.end )
                {
                    var blocks = data.blocks;

                    if( blocks ){

                        for (var i=0, length = blocks.length; i < length; i++) {

                            var block = blocks[i];

                            for (var j = 0, length1 = block.words.length; j < length1; j++ ) {

                                var word = block.words[j];
                                if( time+.2 >= word.start )
                                {
                                    if( !word.flagged) {
                                        word.flagged = true;
                                        dispatchEventWithType( "moveIndicator", { "page_idx": this.activePageIdx, "data": word } );
                                        break;
                                    }         
                                }
                            }  
                        };
                    }
                }
                else
                {
                    dispatchEventWithType( "resetPage", this.activePageIdx );
                    this.activePageIdx = null;
                    this.handleNextAction();
                }
            }
            
        }
    },

    handleStartPlayingAction: {
        value: function( e ) {

            e.preventDefault();
            e.stopPropagation();

            if( !this.isPlaying )
            {
                this.audioElement.currentTime = this.appData.pages[ this.activePageIdx ].start;
                this.audioElement.play();
                this.isPlaying = true;
            }
            else
            {
                this.audioElement.currentTime = this.appData.pages[ this.activePageIdx ].start;
                this.audioElement.pause();
                this.isPlaying = false;
            }
    
        }
    },

    handleEnded: {
        value: function( e ) {
            this.resetBook();
        }
    },

    captureMousedown: {
        value: function(e) {

            if( !e.target.classList.contains('button') )
            {
                this.isPlaying = false;
            }
            
        }
    },

    resetBook: {
        value: function() {
            this.isPlaying = false;
            this.pageList.startScrollingIndexToOffset(0,0);    
        }
    },

    stopPlaying: {
        value: function() {
            dispatchEventWithType( "resetPage", this.activePageIdx );
            this.audioElement.pause();   
        }
    }

});
