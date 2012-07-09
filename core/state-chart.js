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
 /**
	@module montage/core/state-chart
    @requires montage
*/
var Montage = require("montage").Montage;

/**
    @class module:montage/core/state-chart.State
    @extends module:montage/core/core.Montage
*/
var State = exports.State = Montage.create(Montage, /** @lends module:montage/core/state-chart.State# */{

    _stateChart: {
        enumerable: false,
        value: null
    },
/**
    Initializes a State object with a set of options.
    @function
    @param {String} options The options for the new State.
    @returns {State}
    */
    init: {
        value: function(options) {

            this.substates = {};
            this.enterState = null;
            this.exitState = null;

            var keys = Object.keys(options),
                i = 0,
                iKey,
                iOption;

            for (; (iKey = keys[i]); i++) {

                iOption = options[iKey];

                if (iOption.prototype === State.prototype) {
                    iOption.name = iKey;
                    iOption.parentState = this;
                    this.substates[iKey] = iOption;
                }

                // TODO is it worth guarding against any old property being added to this state?
                if (typeof iOption === "string" && "initialSubstate" !== iKey) {
                    // this is a simple gotoState transition syntax
                    this[iKey] = this._encloseGotoState(iOption);
                } else {
                    this[iKey] = iOption;
                }
            }

            return this;
        }
    },
/**
        The name of the state.
        @type {Property}
        @default {String} null
    */
    name: {
        enumerable: false,
        value: null
    },
    _initialSubstate: {
        enumerable: false,
        value: null
    },

/**
        The intitial substate.
        @type {Function}
        @default {String} null
    */
    initialSubstate: {
        get: function() {
            if (typeof this._initialSubstate === "string") {
                this._initialSubstate = this[this._initialSubstate];
            }
            return this._initialSubstate;
        },
        set: function(value) {
            this._initialSubstate = value;
        }
    },
/**
        The set of substates.
        @type {Property}
        @default {String} null
    */
    substates: {
        enumerable: false,
        value: null
    },
/**
       The state's parent state.
        @type {Property}
        @default {String} null
    */
    parentState: {
        enumerable: false,
        value: null
    },

    _path: {
        enumerable: false,
        value: null
    },

/**
        @type {Function}
        @default {String} null
    */
    path: {
        // TODO add dependency on parentState, remember to clear cached value
        enumerable: false,
        get: function() {
            if (!this._path) {

                if (this.parentState && this.parentState.path) {
                    this._path = this.parentState.path + "." + this.name;
                } else {
                    this._path = this.name;
                }
            }
            return this._path;
        }
    },
/**
        @type {Property}
        @default {String} null
    */
    enterState: {
        enumerable: false,
        value: null
    },
/**
        @type {Property}
        @default {String} null
    */
    exitState: {
        enumerable: false,
        value: null
    },
/**
    @function
    @param {String} otherState
    @returns !!this.path.match(new RegExp(".?" + otherState + ".?"))
    */
    isInState: {
        enumerable: false,
        value: function(otherState) {

            if (typeof otherState !== "string") {
                otherState = otherState.name;
            }

            return !!this.path.match(new RegExp(".?" + otherState + ".?"));
        }
    },
/**
  @private
*/
    _encloseGotoState: {
        value: function(state) {
            return (function(stateChart, owner) {
                // Not relying on original implementation to save an extra function call, despite duplicated code
                return this._stateChart._gotoState(state, owner);
            });
        }
    },
/**
    @function
    @param {Property} state
    @param {Property} owner
    @returns this._stateChart._gotoState(state, owner)
    */
    gotoState: {
        value: function(state, owner) {
            return this._stateChart._gotoState(state, owner);
        }
    },
/**
  @private
*/
    _performAction: {
        enumerable: null,
        value: function(actionName, stateChart, owner) {
            if (this[actionName]) {
                // TODO what should the context be inside the action function: state or stateChart?
                // state makes sense but requires that authors know that when building a stateChart
                // it's easy to get annoyed with having to remember which one you're in when building
                // a relatively complex stateChart
                // we could just .call(this._stateChart, args) etc...
                this[actionName](stateChart, owner);

            } else if (this.parentState) {
                this.parentState._performAction(actionName, stateChart, owner);
            } else {
                throw "Action '" + actionName + "' not available";
            }
        }
    },
/**
    @function
    @returns "[State " + this.path + " ]"
    */
    toString: {
        enumerable: false,
        value: function() {
            return "[State " + this.path + " ]";
        }
    }

});
/**
    @class module:montage/core/state-chart.StateChart
*/
var StateChart = exports.StateChart = Montage.create(Montage,/** @lends module:montage/core/state-chart.StateChart# */ {
/**
        @type {Property}
        @default {String} null
    */
    delegate: {
        enumerable: false,
        value: null
    },

    // When the ownerStateProperty is set, we expect all operations of this stateChart to rely on the owner property.
    // That is, many objects can rely on this stateChart to manage the flow of state but keep track of their own
    // currentState (exposed as ownerStateProperty and recorded at "_" + ownerStateProperty);
    // When this is set, the statechart itself is completely stateless and an object must take ownership of it
    // prior to performing any actions
/**
        @type {Property}
        @default {String} null
    */
    ownerStateProperty: {
        enumerable: false,
        value: null
    },
/**
        @type {Property}
        @default {String} null
    */
    rootState: {
        enumerable: false,
        value: null
    },

    _currentState: {
        enumerable: false,
        value: null
    },
/**
    The current state.
    @function
    @returns The current state.
    */
    currentState: {
        get: function() {
            return this.ownerStateProperty ? null : this._currentState;
        }
    },
/**
    Initializes a StateChart with a State object, and returns the StateChart.
    @function
    @param {String} state TODO
    @returns {StateChart}
    */
    initWithState: {
        value: function(state) {

            this._states = {};

            this.rootState = state;
            this.rootState._stateChart = this;
            this._prepareState(this.rootState);

            this.enterDefaultState();

            return this;
        }
    },

    _defaultState: {
        enumerable: false,
        value: null
    },
/**
    The default state.
    @function
    @returns this._defaultState
    */
    defaultState: {
        enumerable: false,
        get: function() {
            if (!this._defaultState) {

                var deepestState, nextState;
                deepestState = nextState = this.rootState;

                while ((nextState = nextState.initialSubstate)) {
                    deepestState = nextState;
                }

                this._defaultState = deepestState;
            }

            return this._defaultState;
        }
    },
/**
    @function
    @returns this.defaultState
    */
    enterDefaultState: {
        enumerable: false,
        value: function() {
            if (this.ownerStateProperty && !this.owner) {
                throw "This stateChart has been configured to require an owner to execute this function";
            }

            var owner = this.ownerStateProperty ? this.owner : this,
                // Using internal ownerStateProperty normally reserved for writing, seeing as many
                // components trigger this enterDefaultState, when their ownerStateProperty.get is invoked the first
                // time. So we need to stop the infinite loop
                currentState = this.ownerStateProperty ? owner["_" + this.ownerStateProperty] : owner.currentState;

            if (currentState) {
                throw "Cannot enter default state from '" + currentState.name + "'";
            }

            // We could probably use gotoState for this but I want to minimize the callbacks
            // as we're not really transitioning for the first setup of the state
            // we're just getting there, I don't think we need to make it look like
            // a "transition" to the delegate
            var deepestState, nextState;
            deepestState = nextState = this.rootState;

            while ((nextState = nextState.initialSubstate)) {

                if (deepestState.enterState) {
                    deepestState.enterState(this, owner);
                }

                deepestState = nextState;

                if (nextState.initialSubstate && deepestState.exitState) {
                    deepestState.exitState(this, owner);
                }

            }

            if (this.ownerStateProperty) {
                owner["_" + this.ownerStateProperty] = this.defaultState;
            } else {
                this._currentState = this.defaultState;
            }

            return this.defaultState;
        }
    },
/**
  @private
*/
    _prepareState: {
        enumerable: false,
        value: function(state) {
            state._stateChart = this;

            // Keep a record of all states other than the root
            if (state.name) {
                this._states[state.name] = state;
            }

            var substateName;
            for (substateName in state.substates) {
                this._prepareState(state.substates[substateName]);
            }
        }
    },
/**
  @private
*/
    _states: {
        enumerable: false,
        value: null
    },
/**
    @function
    @param {Property} stateName TODO
    @returns {Array} this._states[stateName]
    */
    stateWithName: {
        enumerable: false,
        value: function(stateName) {
            return this._states[stateName];
        }
    },
/**
    @function
    @param {String} action TODO
    @param {String} owner TODO
    */
    performAction: {
        value: function(action, owner) {

            if (this.ownerStateProperty && !owner) {
                throw "This stateChart has been configured to require an owner to execute this function";
            }

            owner = this.ownerStateProperty ? owner : this;

            var currentState = this.ownerStateProperty ? owner[this.ownerStateProperty] : owner.currentState;

            if (!currentState) {
                throw "Cannot perform action '" + action + "' without a currentState";
            }

            currentState._performAction(action, this, owner);

            // After performing the action, possibly with state transitions, clear out the owner
            this.owner = null;
        }
    },
/**
  @private
*/
    _gotoState: {
        value: function(state, owner) {

            if (this.ownerStateProperty && !owner) {
                throw "This stateChart has been configured to require an owner to execute this function";
            }

            owner = this.ownerStateProperty ? owner : this;

            var fromState = this.ownerStateProperty ? owner[this.ownerStateProperty] : owner.currentState,
                fromStateName = fromState.name,
                stateName = state,
                currentPath,
                destinationPath,
                i,
                interiorDestinationPath,
                interiorDestinationPathCount,
                lastCommonIndex,
                nextIndex,
                destinationPathCount,
                searchCount,
                iState,
                oldState,
                delegateWillExit = false,
                delegateWillEnter = false,
                delegateDidExit = false,
                delegateDidEnter = false;

            if (typeof stateName === "string") {
                state = this._states[state];
            } else {
                stateName = state.name;
            }

            //same state
            if (stateName === fromStateName) {
                return;
            }

            if (this.delegate) {
                delegateWillExit = typeof this.delegate.stateChartWillExitState === "function";
                delegateWillEnter = typeof this.delegate.stateChartWillEnterState === "function";
                delegateDidExit = typeof this.delegate.stateChartDidExitState === "function";
                delegateDidEnter = typeof this.delegate.stateChartDidEnterState === "function";
            }

            if (this.delegate && typeof this.delegate.stateChartShouldGoFromStateToState === "function") {
                if (!this.delegate.stateChartShouldGoFromStateToState(this, fromState, state)) {
                    return;
                }
            }

            if (this.delegate && typeof this.delegate.stateChartWillGoFromStateToState === "function") {
                this.delegate.stateChartWillGoFromStateToState(this, fromState, state);
            }

            currentPath = fromState.path;
            destinationPath = state.path;

            //state is inside this state
            if ((new RegExp(currentPath)).test(destinationPath)) {

                interiorDestinationPath = destinationPath.replace(new RegExp(currentPath + ".?"), "").split(".");
                interiorDestinationPathCount = interiorDestinationPath.length;
                i = 0;

                for (; i < interiorDestinationPathCount; i++) {
                    iState = this._states[interiorDestinationPath[i]];

                    if (delegateWillEnter) {
                        this.delegate.stateChartWillEnterState(this, iState);
                    }

                    if (typeof iState.enterState === "function") {
                        iState.enterState(this, owner);
                    }

                    if (delegateDidEnter) {
                        this.delegate.stateChartDidEnterState(this, iState);
                    }
                }

            }
            // state is outside this state, need to find where they fork
            else {
                currentPath = currentPath.split(".");
                destinationPath = destinationPath.split(".");

                lastCommonIndex = -1;
                destinationPathCount = destinationPath.length;
                searchCount = Math.min(currentPath.length, destinationPathCount);

                while (lastCommonIndex < searchCount) {
                    nextIndex = lastCommonIndex + 1;
                    if (currentPath[nextIndex] !== destinationPath[nextIndex]) {
                        break;
                    }
                    lastCommonIndex++;
                }

                // exit from the currentState to just before the common path
                for (i = currentPath.length - 1; i > lastCommonIndex; i--) {
                    iState = this._states[currentPath[i]];

                    if (delegateWillExit) {
                        this.delegate.stateChartWillExitState(this, iState);
                    }

                    if (typeof iState.exitState === "function") {
                        iState.exitState(this, owner);
                    }

                    if (delegateDidExit) {
                        this.delegate.stateChartDidExitState(this, iState);
                    }
                }

                // We don't want to enter the root state
                lastCommonIndex = lastCommonIndex < 0 ? 0 : lastCommonIndex;

                // enter from the common path to the new state at the end
                for (i = lastCommonIndex; i < destinationPathCount; i++) {
                    iState = this._states[destinationPath[i]];

                    if (delegateWillEnter) {
                        this.delegate.stateChartWillEnterState(this, iState);
                    }

                    // Update the currentState as we enter each state
                    // TODO is this really necessary, is it best done at this point? what about exit?
                    if (this.ownerStateProperty) {
                        owner["_" + this.ownerStateProperty] = iState;
                    } else {
                        this._currentState = iState;
                    }

                    if (typeof iState.enterState === "function") {
                        iState.enterState(this, owner);
                    }

                    if (delegateDidEnter) {
                        this.delegate.stateChartDidEnterState(this, iState);
                    }
                }
            }

            oldState = fromState;

            if (this.delegate && typeof this.delegate.stateChartDidGoFromStateToState === "function") {
                this.delegate.stateChartDidGoFromStateToState(this, oldState, state);
            }

            if (typeof owner.transitionedFromStateToState === "function") {
                owner.transitionedFromStateToState(this, oldState, state);
            }

        }
    }

});
