var MutableEvent = require("../event/mutable-event").MutableEvent,
    Montage = require("../core").Montage;

// XXX Does not presently function server-side
if (typeof window !== "undefined") {

    var OBJECT_MINE_TYPE = 'application/object';

    var DataTransfer = exports.DataTransfer = Montage.specialize({

        __data: {
            enumerable: false,
            value: null
        },

        _data: {
            enumerable: false,
            get: function () {
                return this.__data || (this.__data = new Map());
            }
        },

        _dragImage: {
            value: null,
            enumerable: false,
        },

        _dragEffect: {
            value: null
        },

        dragEffect: {
            set: function (effect) {
                if (DataTransfer.ALLOWED_EFFECTS.indexOf(effect) > -1) {
                    this._dragEffect = effect;
                }
            },
            get: function () {
                return this._dragEffect || DataTransfer.Default;
            }
        },

        _dropEffect: {
            value: null
        },

        dropEffect: {
            set: function (effect) {
                if (
                    effect &&
                    DataTransfer.ALLOWED_EFFECTS.indexOf(effect) > -1 &&
                    DataTransfer.isDropEffectAllowed(
                        effect, this.effectAllowed
                    )
                ) {
                    this._dropEffect = effect;
                } else {
                    this._dropEffect = null;
                }
            },
            get: function () {
                if (!this._dropEffect) {
                    var index;

                    if (
                        this.effectAllowed === DataTransfer.All ||
                        this.effectAllowed.startsWith('c')
                    ) {
                        this._dropEffect = DataTransfer.Copy;
                    } else if ((index = DataTransfer.ALLOWED_EFFECTS.indexOf(
                        this.effectAllowed)) > -1
                    ) {
                        this._dropEffect = DataTransfer.ALLOWED_EFFECTS[index];
                    } else {
                        this._dropEffect = DataTransfer.Link;
                    }
                }

                return this._dropEffect;
            }
        },

        _effectAllowed: {
            value: null
        },

        effectAllowed: {
            set: function (effect) {
                if (DataTransfer.ALLOWED_DROP_EFFECTS.indexOf(effect) > -1) {
                    this._effectAllowed = effect;
                }
            },
            get: function () {
                return this._effectAllowed || DataTransfer.All;
            }
        },

        files: {
            value: null
        },

        items: {
            value: null
        },

        types: {
            value: null
        },

        dragTarget: {
            value: null
        },

        _dropTargetCandidates: {
            value: null,
            enumerable: false
        },

        dropTargetCandidates: {
            get: function () {
                return this._dropTargetCandidates ||
                    (this._dropTargetCandidates = new Set());
            }
        },

        draggablePlaceholderStrategy: {
            value: 'hidden'
        },

        draggedObject: {
            set: function (object) {
                this._data.set(OBJECT_MINE_TYPE, object);
            },
            get: function () {
                return this._data.get(OBJECT_MINE_TYPE);
            }
        },

        clearData: {
            value: function () {
                return this._data.clear();
            }
        },

        getData: {
            value: function (key) {
                return this._data.get(key);
            }
        },

        hasData: {
            value: function (key) {
                return this._data.has(key);
            }
        },

        setData: {
            value: function (key, value) {
                return this._data.set(key, value);
            }
        },

        setDragImage: {
            value: function (img, xOffset, yOffset) {
                if (!this._dragImage) {
                    this._dragImage = img;
                }
            }
        },

        getDragImage: {
            value: function () {
                return this._dragImage;
            }
        },

    }, {
            Default: {
                value: "default"
            },

            Copy: {
                value: "copy"
            },

            Move: {
                value: "move"
            },

            Link: {
                value: "alias"
            },

            CopyLink: {
                value: "copyLink"
            },

            CopyMove: {
                value: "copyMove"
            },

            LinkMove: {
                value: "linkMove"
            },

            All: {
                value: "all"
            },

            _ALLOWED_EFFECTS: {
                value: null
            },

            ALLOWED_EFFECTS: {
                get: function () {
                    if (!this._ALLOWED_EFFECTS) {
                        this._ALLOWED_EFFECTS = [
                            this.Default,
                            this.Copy,
                            this.Link,
                            this.Move
                        ];
                    }

                    return this._ALLOWED_EFFECTS;
                }
            },

            _ALLOWED_DROP_EFFECTS: {
                value: null
            },

            ALLOWED_DROP_EFFECTS: {
                get: function () {
                    if (!this._ALLOWED_DROP_EFFECTS) {
                        this._ALLOWED_DROP_EFFECTS = this.ALLOWED_EFFECTS.concat([
                            this.All,
                            this.CopyMove,
                            this.CopyLink,
                            this.LinkMove
                        ]);
                    }

                    return this._ALLOWED_DROP_EFFECTS;
                }
            },

            isDropEffectAllowed: {
                value: function (effect, effectAllowed) {
                    return effectAllowed === this.All ||
                        effect === effectAllowed ||
                        (effect === this.Copy && (
                            effectAllowed === this.CopyMove ||
                            effectAllowed === this.CopyLink
                        )) ||
                        (effect === this.Move && (
                            effectAllowed === this.CopyMove ||
                            effectAllowed === this.LinkMove
                        )) ||
                        (effect === this.Link && (
                            effectAllowed === this.LinkMove ||
                            effectAllowed === this.CopyLink
                        ));
                }
            },

            /**
            * @function
            * @param {window.DataTransfer} dataTransfer The original DataTransfer.
            * @returns DataTransfer
            */
            fromDataTransfer: {
                value: function (dataTransfer) {
                    // can't be re used it for security purposes.
                    var montageDataTransfer = new DataTransfer();

                    montageDataTransfer.items = dataTransfer.items;
                    montageDataTransfer.files = dataTransfer.files;
                    montageDataTransfer.types = dataTransfer.types;
                    montageDataTransfer.dropEffect = dataTransfer.dropEffect === 'none' ?
                        this.Default : dataTransfer.dropEffect;
                    montageDataTransfer.effectAllowed = dataTransfer.effectAllowed;

                    return montageDataTransfer;
                }
            },
        });

    exports.DragEvent = MutableEvent.specialize({
    
        type: {
            value: "drag"
        },

        _event: {
            enumerable: false,
            value: null
        },

        event: {
            get: function () {
                return this._event;
            },
            set: function (value) {
                this._event = value;
            }
        },

        bubbles: {
            value: true
        },

        dataTransfer: {
            value: null
        },

        constructor: {
            value: function (type, eventInit) {
                this.dataTransfer = new DataTransfer();
                this._event = new CustomEvent(type, eventInit);
                this.type = type;
            }
        }

    }, {
        DRAGSTART: {
            value: "dragstart"
        },

        DRAG: {
            value: "drag"
        },

        DRAGENTER: {
            value: "dragenter"
        },

        DRAGEXIT: {
            value: "dragexit"
        },

        DRAGLEAVE: {
            value: "dragleave"
        },

        DROP: {
            value: "drop"
        },

        DRAGEND: {
            value: "dragend"
        }
    });

}
