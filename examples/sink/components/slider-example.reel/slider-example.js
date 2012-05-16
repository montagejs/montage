/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component,
    Pixastic = require("pixastic.custom.js").Pixastic;


exports.SliderExample = Montage.create(Component, {

        image: {value: null},

        _colorAdjust : {value: null},
        _red: {value: null},
        red: {
            set: function(v) {
                this._red = v;
                this._colorAdjust = true;
                this.needsDraw = true;
            },
            get: function() {return this._red;}
        },
        _green: {value: null},
        green: {
            set: function(v) {
                this._green = v;
                this._colorAdjust = true;
                this.needsDraw = true;},
            get: function() {return this._green;}
        },
        _blue: {value: null},
        blue: {
            set: function(v) {
                this._blue = v;
                this._colorAdjust = true;
                this.needsDraw = true;
            },
            get: function() {return this._blue;}
        },

        // Glow
        _glowAmount: {value: null},
        glowAmount: {
            set: function(v) {this._glowAmount = v; this.needsDraw = true;},
            get: function() {return this._glowAmount;}
        },
        _glowRadius: {value: null},
        glowRadius: {
            set: function(v) {this._glowRadius = v; this.needsDraw = true;},
            get: function() {return this._glowRadius;}
        },

        // Sharpen
        _sharpnessChanged: {value: null},
        _sharpnessAmount: {value: null},
        sharpnessAmount: {
            set: function(v) {
                this._sharpnessAmount = v;
                this._sharpnessChanged = true;
                this.needsDraw = true;
            },
            get: function() {return this._sharpnessAmount;}
        },

        _applyEffect: {
            value: function() {

                // unfortunately, this is required to be done (Pixastic)
                var img = document.getElementById("image");

                var self = this, resultImg = img;

                if(this._colorAdjust === true) {
                    Pixastic.process(img, "coloradjust", {
                        red: this.red,
                        green: this.green,
                        blue: this.blue
                    });
                    this._colorAdjust = false;
                }


                if(this._sharpnessChanged) {
                    Pixastic.process(img, "sharpen", {
                        amount: this.sharpnessAmount
                    });
                    this._sharpnessChanged = false;
                }

            }
        },

        prepareForDraw: {
            value: function() {
                // Invoke Google pretty printer on source code samples
                prettyPrint();
                this.handleResetAction();
            }
        },

        draw: {
            value: function() {
                if(Pixastic && this.image.complete) {
                    this._applyEffect();
                }
            }
        },

        handleResetAction: {
            value: function() {
                Pixastic.revert(document.getElementById("image"));
                this.red = 0;
                this.green = 0;
                this.blue = 0;
                this.sharpnessAmount = 0;
            }
        },

        didDraw: {
            value: function() {
                //

            }
        },

        logger: {
            value: null,
            serializable: true
        }
    });

