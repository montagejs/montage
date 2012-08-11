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

exports.Appdata = Montage.create( Component, {


    flow: {
        value: [1,2,3,4, 5,6,9,10,12,15,16,18,20,23]
    },

    layouts: {
        value: [
                [ 0, 1 ],
                [ 2, 3 ]
            ]
    },

    audio: {
        value: "resources/audio/audio.mp3"
    },

    pages: {

        value: [

            {
                pageIndex: 0,
                start: 0.0,
                end: 0.25,
                image: "resources/page-images/1_1.jpg"
            },

           {
                pageIndex: 1,
                image: ""
            },
            {
                pageIndex: 2,
                start: 0.3,
                end: 4.0,
                image: "resources/page-images/3_1.jpg",
                blocks: [
                    {
                        id: 0,
                        words: [
                            {
                                start: 1.5,
                                end: 2.1,
                                text: "This",
                                x: 80,
                                y: 365,
                                width: 71,
                                height: 36,
                                id: 0,
                                hide: true
                            }
                        ]
                    },
                    {
                        id: 1,

                        words: [
                            {
                                start: 2.1,
                                end: 2.3,
                                text: "is",
                                x: 154,
                                y: 365,
                                width: 36,
                                height: 36,
                                id: 0,
                                hide: true
                            }
                        ]
                    },
                    {
                        id: 2,

                        words: [
                            {
                                start: 2.3,
                                end: 2.4,
                                text: "a",
                                x: 188,
                                y: 365,
                                width: 34,
                                height: 36,
                                id: 0,
                                hide: true
                            }
                        ]
                    },
                    {
                        id: 3,

                        words: [
                            {
                                start: 2.5,
                                end: 3.0,
                                text: "Montage",
                                x: 219,
                                y: 365,
                                width: 151,
                                height: 42,
                                id: 0,
                                hide: true
                            }
                        ]
                    },
                    {
                        id: 4,

                        words: [
                            {
                                start: 3.1,
                                end: 3.2,
                                text: "book",
                                x: 369,
                                y: 365,
                                width: 92,
                                height: 36,
                                id: 0,
                                hide: true
                            }
                        ]
                    },
                    {
                        id: 5,

                        words: [
                            {
                                start: 3.25,
                        end: 3.6,
                                text: "demo",
                                x: 462,
                                y: 365,
                                width: 98,
                                height: 36,
                                id: 0,
                                hide: true
                            }
                        ]
                    }
                ]
            }
        ]
    }


});