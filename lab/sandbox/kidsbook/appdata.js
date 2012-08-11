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
                                height: 36,
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