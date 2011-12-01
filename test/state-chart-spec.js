/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage;
var StateChart= require("montage/core/state-chart").StateChart;
var State = require("montage/core/state-chart").State;

describe("state-chart-spec", function() {

    var stateChart, rootState, stateA, stateB, stateC, stateD;

    beforeEach(function() {

        // NOTE this would probably be written more concisely in real use, I've exposed all the
        // states for my own use during testing

        stateA = State.create().init({
            gamma: function() {
                this.gotoState('C');
            }
        });

        stateB = State.create().init({
            alpha: function() {
                this.gotoState('A');
            },

            delta: function() {
                this.gotoState('C');
            }
        });

        stateC = State.create().init({});

        stateD = State.create().init({
            initialSubstate: 'A',

            A: stateA,

            C: stateC,

            // Uses shorthand for gotoState(stateName)
            beta: "B"
        }),

        rootState = State.create().init({
            initialSubstate: 'D',
            D: stateD,
            B: stateB
        });

        stateChart = StateChart.create().initWithState(rootState);
    });

    describe("when initialized", function() {

        it("should be in the deepest initial state", function() {
            expect(stateChart.currentState.path).toBe("D.A")
        });

    });

    describe("when determining whether it is in a specified state", function() {

        it("should be true when the currentState is the specified state", function() {
            expect(stateChart.currentState.isInState("A")).toBeTruthy();
        });

        it("should be true when the currentState is within the specifiedState", function() {
            expect(stateChart.currentState.isInState("D")).toBeTruthy();
        });

        it("must be false when the currentState is not the specifiedState and is not a child of the specifiedState", function() {
            expect(stateChart.currentState.isInState("C")).toBeFalsy();
        });

    });

    describe("when performing actions", function() {

        it("should end up at the expected state", function() {
            stateChart.performAction("gamma");
            expect(stateChart.currentState.path).toBe("D.C")
        });

        it("exit any states that are not no longer active as part of changing states", function() {
            spyOn(stateA, "exitState");

            stateChart.performAction("gamma");

            expect(stateA.exitState).toHaveBeenCalled();
        });

        it("enter any states that are now active as part of changing states", function() {
            spyOn(stateC, "enterState");

            stateChart.performAction("gamma");

            expect(stateC.enterState).toHaveBeenCalled();
        });

        describe("when the action is defined on a parent", function() {

            it("should end up at the expected state", function() {
                stateChart.performAction("beta");
                expect(stateChart.currentState.path).toBe("B")
            });

        });

    });

});
