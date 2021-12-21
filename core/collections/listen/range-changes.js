"use strict";

//TODO:
// Remove Dict and use native Map as much as possible here
//Use ObjectChangeDescriptor to avoid creating useless arrays and benefit from similar gains made in property-changes


var Map = require("../_map"),
    ChangeDescriptor = require("./change-descriptor"),
    ObjectChangeDescriptor = ChangeDescriptor.ObjectChangeDescriptor,
    ChangeListenersRecord = ChangeDescriptor.ChangeListenersRecord,
    ListenerGhost = ChangeDescriptor.ListenerGhost;

var rangeChangeDescriptors = new WeakMap(); // {isActive, willChangeListeners, changeListeners}


//
function RangeChangeDescriptor(name) {
    this.name = name;
    this.isActive = false;
    this._willChangeListeners = null;
    this._changeListeners = null;
};

RangeChangeDescriptor.prototype = new ObjectChangeDescriptor();
RangeChangeDescriptor.prototype.constructor = RangeChangeDescriptor;

RangeChangeDescriptor.prototype.changeListenersRecordConstructor = RangeChangeListenersRecord;
RangeChangeDescriptor.prototype.willChangeListenersRecordConstructor = RangeWillChangeListenersRecord;
Object.defineProperty(RangeChangeDescriptor.prototype,"active",{
    get: function() {
        return this._active || (this._active = this._current ? this._current.slice():[]);
    }
});


var RangeChangeListenersSpecificHandlerMethodName = new Map();

function RangeChangeListenersRecord(name) {
    var specificHandlerMethodName = RangeChangeListenersSpecificHandlerMethodName.get(name);
    if(!specificHandlerMethodName) {
        specificHandlerMethodName = "handle";
        specificHandlerMethodName += name.slice(0, 1).toUpperCase();
        specificHandlerMethodName += name.slice(1);
        specificHandlerMethodName += "RangeChange";
        RangeChangeListenersSpecificHandlerMethodName.set(name,specificHandlerMethodName);
    }
    this.specificHandlerMethodName = specificHandlerMethodName;
	return this;
}
RangeChangeListenersRecord.prototype = new ChangeListenersRecord();
RangeChangeListenersRecord.prototype.constructor = RangeChangeListenersRecord;

var RangeWillChangeListenersSpecificHandlerMethodName = new Map();

function RangeWillChangeListenersRecord(name) {
    var specificHandlerMethodName = RangeWillChangeListenersSpecificHandlerMethodName.get(name);
    if(!specificHandlerMethodName) {
        specificHandlerMethodName = "handle";
        specificHandlerMethodName += name.slice(0, 1).toUpperCase();
        specificHandlerMethodName += name.slice(1);
        specificHandlerMethodName += "RangeWillChange";
        RangeWillChangeListenersSpecificHandlerMethodName.set(name,specificHandlerMethodName);
    }
    this.specificHandlerMethodName = specificHandlerMethodName;
    return this;
}
RangeWillChangeListenersRecord.prototype = new ChangeListenersRecord();
RangeWillChangeListenersRecord.prototype.constructor = RangeWillChangeListenersRecord;

module.exports = RangeChanges;
function RangeChanges() {
    throw new Error("Can't construct. RangeChanges is a mixin.");
}

RangeChanges.prototype.getAllRangeChangeDescriptors = function () {
    if (!rangeChangeDescriptors.has(this)) {
        rangeChangeDescriptors.set(this, new Map());
    }
    return rangeChangeDescriptors.get(this);
};

RangeChanges.prototype.getRangeChangeDescriptor = function (token) {
    var tokenChangeDescriptors = this.getAllRangeChangeDescriptors();
    token = token || "";
    if (!tokenChangeDescriptors.has(token)) {
        tokenChangeDescriptors.set(token, new RangeChangeDescriptor(token));
    }
    return tokenChangeDescriptors.get(token);
};

var ObjectsDispatchesRangeChanges = new WeakMap(),
    dispatchesRangeChangesGetter = function() {
        return ObjectsDispatchesRangeChanges.get(this);
    },
    dispatchesRangeChangesSetter = function(value) {
        return ObjectsDispatchesRangeChanges.set(this,value);
    },
    dispatchesChangesMethodName = "dispatchesRangeChanges",
    dispatchesChangesPropertyDescriptor = {
        get: dispatchesRangeChangesGetter,
        set: dispatchesRangeChangesSetter,
        configurable: true,
        enumerable: false
    };

RangeChanges.prototype.addRangeChangeListener = function addRangeChangeListener(listener, token, beforeChange) {
    // a concession for objects like Array that are not inherently observable
    if (!this.isObservable && this.makeObservable) {
        this.makeObservable();
    }

    var descriptor = this.getRangeChangeDescriptor(token),
        listeners = beforeChange ? descriptor.willChangeListeners : listeners = descriptor.changeListeners;

    // even if already registered
    if(!listeners._current) {
        listeners._current = listener;
    }
    else if(!Array.isArray(listeners._current)) {
        listeners._current = [listeners._current,listener]
    }
    else {
        listeners._current.push(listener);
    }

    if(Object.getOwnPropertyDescriptor((this.__proto__||Object.getPrototypeOf(this)),dispatchesChangesMethodName) === void 0) {
        Object.defineProperty((this.__proto__||Object.getPrototypeOf(this)), dispatchesChangesMethodName, dispatchesChangesPropertyDescriptor);
    }
    this.dispatchesRangeChanges = true;

    var self = this;
    return function cancelRangeChangeListener() {
        if (!self) {
            // TODO throw new Error("Range change listener " + JSON.stringify(token) + " has already been canceled");
            return;
        }
        self.removeRangeChangeListener(listener, token, beforeChange);
        self = null;
    };
};


RangeChanges.prototype.removeRangeChangeListener = function (listener, token, beforeChange) {
    var descriptor = this.getRangeChangeDescriptor(token),
        listeners = beforeChange ? descriptor._willChangeListeners : descriptor._changeListeners;

    if(listeners._current) {
        if(listeners._current === listener) {
            listeners._current = null;
        }
        else {
            var index = listeners._current.lastIndexOf(listener);
            if (index === -1) {
                throw new Error("Can't remove range change listener: does not exist: token " + JSON.stringify(token));
            }
            else {
                if(descriptor.isActive) {
                    listeners.ghostCount = listeners.ghostCount+1
                    listeners._current[index]=ListenerGhost
                }
                else {
                    listeners._current.spliceOne(index);
                }
            }
        }
    }

};

RangeChanges.prototype._createRangeChangeDispatchQueueForDescriptor = function _createRangeChangeDispatchQueueForDescriptor(descriptor) {
    var rangeChangeDispatchQueue = [];
    this._rangeChangeDispatchQueueByDescriptor().set(descriptor, rangeChangeDispatchQueue);
    return rangeChangeDispatchQueue;
}

RangeChanges.prototype._rangeChangeDispatchQueueByDescriptor = function _rangeChangeDispatchQueueByDescriptor() {
    return this.__rangeChangeDispatchQueueByDescriptor || (this.__rangeChangeDispatchQueueByDescriptor = new Map());
}

RangeChanges.prototype._rangeChangeDispatchQueueForDescriptor = function _rangeChangeDispatchQueueForDescriptor(descriptor) {
    return this._rangeChangeDispatchQueueByDescriptor().get(descriptor) || (this._createRangeChangeDispatchQueueForDescriptor(descriptor));
}



RangeChanges.prototype.dispatchRangeChange = function (plus, minus, index, beforeChange) {
    var descriptors = this.getAllRangeChangeDescriptors(),
        descriptor,
        mapIter  = descriptors.values(),
        rangeChangeDispatchQueueByDescriptor,
        hasQueued = false;
        rangeChangeDispatchQueue;


    descriptors.dispatchBeforeChange = beforeChange;

     while (descriptor = mapIter.next().value) {

        if (descriptor.isActive) {
            // console.log("isActive: dispatchRangeChange: this <"+Object.hash(this)+"> ["+this.map((o) => {return Object.hash(o)})+"]._rangeChangeDispatchQueue.push(["+plus.map((o) => {return Object.hash(o)}) + "," + minus.map((o) => {return Object.hash(o)}) + "," + index + "," + beforeChange + ")");

            //Check if we already have it:
            if((rangeChangeDispatchQueueByDescriptor = this.__rangeChangeDispatchQueueByDescriptor)) {
                rangeChangeDispatchQueue = rangeChangeDispatchQueueByDescriptor.get(descriptor);
                if(rangeChangeDispatchQueue.has(arguments)) {
                    hasQueued = true;
                }
            }

            if(!hasQueued) {
                this._rangeChangeDispatchQueueForDescriptor(descriptor).push(arguments);
            }
            return;
        }
        // else {
        //     console.log("this <"+Object.hash(this)+"> ["+this.map((o) => {return Object.hash(o)})+"].dispatchRangeChange("+plus.map((o) => {return Object.hash(o)}) + "," + minus.map((o) => {return Object.hash(o)}) + "," + index + "," + beforeChange + ") - NOT ACTIVE");
        // }

        this._dispatchDescriptorRangeChange(descriptor, plus, minus, index, beforeChange);
    }

    if((rangeChangeDispatchQueueByDescriptor = this.__rangeChangeDispatchQueueByDescriptor) && rangeChangeDispatchQueueByDescriptor.length > 0) {
        var i,
            iQueueItem,
            iQueueItemDescriptor,
            rangeChangeDispatchQueue,
            keysIterator = rangeChangeDispatchQueueByDescriptor.keys(),
            iteration,
            iterationDescriptor,
            _dispatchDescriptorRangeChange = this._dispatchDescriptorRangeChange;


            while(!(iteration = keysIterator.next()).done) {
                iterationDescriptor = iteration.value;
                rangeChangeDispatchQueue = rangeChangeDispatchQueueByDescriptor.get(iterationDescriptor);

                //in case the array grows while we loop on it
                for(i=0 ; i<rangeChangeDispatchQueue.length; i++) {
                    iQueueItem = rangeChangeDispatchQueue[i];
                    iQueueItemDescriptor = iQueueItem[0];
                    // console.log("("+i+") emptyQueue: this <"+Object.hash(this)+">["+this.map((o) => {return Object.hash(o)})+"]._rangeChangeDispatchQueue.call(this,"+iQueueItem[0]+ ","+ iQueueItem[1]+ "," + iQueueItem[2]+","+ iQueueItem[3]+","+ iQueueItem[4]+")");

                    _dispatchDescriptorRangeChange.call(this, iterationDescriptor, iQueueItem[0], iQueueItem[1], iQueueItem[2], iQueueItem[3]);

                }
                rangeChangeDispatchQueue.splice(0);

                // if(rangeChangeDispatchQueue.length > 0) {
                //     console.log("this <"+Object.hash(this)+">.rangeChangeDispatchQueue.length = "+rangeChangeDispatchQueue.length);
                // }
            }
    }
};

RangeChanges.prototype._dispatchDescriptorRangeChange = function (descriptor, plus, minus, index, beforeChange) {
    var listeners,
        tokenName,
        i,
        countI,
        listener,
        currentListeners,
        Ghost;

    // before or after
    listeners = beforeChange ? descriptor._willChangeListeners : descriptor._changeListeners;
    if(listeners && listeners._current) {
        tokenName = listeners.specificHandlerMethodName;
        if(Array.isArray(listeners._current)) {
            if(listeners._current.length) {
                // notably, defaults to "handleRangeChange" or "handleRangeWillChange"
                // if token is "" (the default)

                descriptor.isActive = true;
                // dispatch each listener
                try {
                        //removeGostListenersIfNeeded returns listeners.current or a new filtered one when conditions are met
                        currentListeners = listeners.removeCurrentGostListenersIfNeeded();
                        Ghost = ListenerGhost;
                    for(i=0, countI = currentListeners.length;i<countI;i++) {
                        if ((listener = currentListeners[i]) !== Ghost) {
                            if (listener[tokenName]) {
                                listener[tokenName](plus, minus, index, this, beforeChange);
                            } else if (listener.call) {
                                listener.call(this, plus, minus, index, this, beforeChange);
                            } else {
                                throw new Error("Handler " + listener + " has no method " + tokenName + " and is not callable");
                            }
                        }
                    }
                } finally {
                    descriptor.isActive = false;
                }
            }
        }
        else {
            descriptor.isActive = true;
            // dispatch each listener
            try {
                listener = listeners._current;
                if (listener[tokenName]) {
                    listener[tokenName](plus, minus, index, this, beforeChange);
                } else if (listener.call) {
                    listener.call(this, plus, minus, index, this, beforeChange);
                } else {
                    throw new Error("Handler " + listener + " has no method " + tokenName + " and is not callable");
                }
            } finally {
                descriptor.isActive = false;
            }

        }
    }

}

RangeChanges.prototype.addBeforeRangeChangeListener = function (listener, token) {
    return this.addRangeChangeListener(listener, token, true);
};

RangeChanges.prototype.removeBeforeRangeChangeListener = function (listener, token) {
    return this.removeRangeChangeListener(listener, token, true);
};

RangeChanges.prototype.dispatchBeforeRangeChange = function (plus, minus, index) {
    return this.dispatchRangeChange(plus, minus, index, true);
};
