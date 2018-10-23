var MutableEvent = require("../event/mutable-event").MutableEvent,
    Montage = require("../core").Montage;

// XXX Does not presently function server-side
if (typeof window !== "undefined") {

    var OBJECT_MIME_TYPE = 'application/object';

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
                if (this.isEffectAllowed(effect)) {
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
                    this.isEffectAllowed(effect) &&
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
                    if (
                        this.effectAllowed === DataTransfer.All ||
                        this.effectAllowed.startsWith('c')
                    ) {
                        this._dropEffect = DataTransfer.Copy;
                    } else if (this.isEffectAllowed(this.effectAllowed)) {
                        this._dropEffect = this.effectAllowed;
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
                if (!!DataTransfer.allowedDropEffectsMap[effect]) {
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

        showPlaceholder: {
            value: false
        },

        draggedObject: {
            set: function (object) {
                this._data.set(OBJECT_MIME_TYPE, object);
            },
            get: function () {
                return this._data.get(OBJECT_MIME_TYPE);
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

        dragImageXOffset: {
            value: null
        },

        dragImageYOffset: {
            value: null
        },

        setDragImage: {
            value: function (img, xOffset, yOffset) {
                if (!this._dragImage) {
                    this._dragImage = img;

                    if (xOffset >= 0) {
                        this.dragImageXOffset = xOffset;
                    }

                    if (yOffset >= 0) {
                        this.dragImageYOffset = yOffset;
                    }
                }
            }
        },

        getDragImage: {
            value: function () {
                return this._dragImage;
            }
        },

        isEffectAllowed: {
            value: function (effect) {
                return !!DataTransfer.allowedEffectsMap[effect];
            }
        }

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

            _allowedEffectsMap: {
                value: null
            },

            allowedEffectsMap: {
                get: function () {
                    if (!this._allowedEffectsMap) {
                        this._allowedEffectsMap = {};
                        this._allowedEffectsMap[this.Default] = true;
                        this._allowedEffectsMap[this.Copy] = true;
                        this._allowedEffectsMap[this.Link] = true;
                        this._allowedEffectsMap[this.Move] = true;
                    }

                    return this._allowedEffectsMap;
                }
            },

            _allowedDropEffectsMap: {
                value: null
            },

            allowedDropEffectsMap: {
                get: function () {
                    if (!this._allowedDropEffectsMap) {
                        var tmp = {};
                        tmp[this.All] = true;
                        tmp[this.CopyMove] = true;
                        tmp[this.CopyLink] = true;
                        tmp[this.LinkMove] = true;

                        this._allowedDropEffectsMap = Object.assign(
                            tmp, this._allowedEffectsMap
                        );
                    }

                    return this._allowedDropEffectsMap;
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
