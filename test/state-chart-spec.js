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
var Montage = require("montage").Montage;
var StateChart= require("montage/core/state-chart").StateChart;
var State = require("montage/core/state-chart").State;

describe("state-chart-spec", function () {

    var stateChart, rootState, stateA, stateB, stateC, stateD;

    beforeEach(function () {

        // NOTE this would probably be written more concisely in real use, I've exposed all the
        // states for my own use during testing

        stateA = new State().init({
            gamma: function () {
                this.gotoState('C');
            }
        });

        stateB = new State().init({
            alpha: function () {
                this.gotoState('A');
            },

            delta: function () {
                this.gotoState('C');
            }
        });

        stateC = new State().init({});

        stateD = new State().init({
            initialSubstate: 'A',

            A: stateA,

            C: stateC,

            // Uses shorthand for gotoState(stateName)
            beta: "B"
        }),

        rootState = new State().init({
            initialSubstate: 'D',
            D: stateD,
            B: stateB
        });
        stateChart = new StateChart().initWithState(rootState);
    });

    describe("when initialized", function () {

        it("should be in the deepest initial state", function () {
            expect(stateChart.currentState.path).toBe("D.A")
        });

    });

    describe("when determining whether it is in a specified state", function () {

        it("should be true when the currentState is the specified state", function () {
            expect(stateChart.currentState.isInState("A")).toBeTruthy();
        });

        it("should be true when the currentState is within the specifiedState", function () {
            expect(stateChart.currentState.isInState("D")).toBeTruthy();
        });

        it("must be false when the currentState is not the specifiedState and is not a child of the specifiedState", function () {
            expect(stateChart.currentState.isInState("C")).toBeFalsy();
        });

    });

    describe("when performing actions", function () {

        it("should end up at the expected state", function () {
            stateChart.performAction("gamma");
            expect(stateChart.currentState.path).toBe("D.C")
        });

        it("exit any states that are not no longer active as part of changing states", function () {
            spyOn(stateA, "exitState");

            stateChart.performAction("gamma");

            expect(stateA.exitState).toHaveBeenCalled();
        });

        it("enter any states that are now active as part of changing states", function () {
            spyOn(stateC, "enterState");

            stateChart.performAction("gamma");

            expect(stateC.enterState).toHaveBeenCalled();
        });

        describe("when the action is defined on a parent", function () {

            it("should end up at the expected state", function () {
                stateChart.performAction("beta");
                expect(stateChart.currentState.path).toBe("B")
            });

        });

    });

});
