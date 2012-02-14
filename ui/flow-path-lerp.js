/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

var Montage = require("montage").Montage;

var FlowPathLerp = exports.FlowPathLerp = Montage.create(Montage, {

    _path1: {
        enumerable: false,
        value: null
    },

    _path2: {
        enumerable: false,
        value: null
    },

    _interpolant: {
        enumerable: false,
        value: 0
    },

    path1: {
        get: function () {
            return this._path1;
        },
        set: function (value) {
            this._path1 = value;
            this.resultPath = true;
        }
    },

    path2: {
        get: function () {
            return this._path2;
        },
        set: function (value) {
            this._path2 = value;
            this.resultPath = true;
        }
    },

    interpolant: {
        get: function () {
            return this._interpolant;
        },
        set: function (value) {
            this._interpolant = value;
            this.resultPath = true;
        }
    },

    _resultPath: {
        enumerable: false,
        value: null
    },

    resultPath: {
        get: function () {
            return this._resultPath;
        },
        set: function () {
            var self = this;

            this._resultPath = {
                value: function (slide) {
                    var v1=self._path1.value(slide),
                        v2=self._path2.value(slide),
                        m1=1-self._interpolant,
                        m2=self._interpolant,
                        result={},
                        i;

                    for (i in v1) {
                        if (v1.hasOwnProperty(i)&&(i!="style")) {
                            if (v2.hasOwnProperty(i)) {
                                if ((typeof v1[i]==="number")&&(typeof v2[i]==="number")) {
                                    result[i]=v1[i]*m1+v2[i]*m2;
                                } else {
                                    result[i]=v1[i];
                                }
                            } else {
                                result[i]=v1[i];
                            }
                        }
                    }
                    for (i in v2) {
                        if (v2.hasOwnProperty(i)&&(i!="style")&&(!v1.hasOwnProperty(i))) {
                            result[i]=v2[i];
                        }
                    }
                    if (v1.style) {
                        result.style={};
                        for (i in v1.style) {
                            if (v1.style.hasOwnProperty(i)) {
                                if ((v2.style)&&(v2.style.hasOwnProperty(i))&&(typeof v1.style[i]==="number")&&(typeof v2.style[i]==="number")) {
                                    result.style[i]=v1.style[i]*m1+v2.style[i]*m2;
                                } else {
                                    result.style[i]=v1.style[i];
                                }
                            }
                        }
                    }
                    return result;
                }
            };
        }
    }
});
