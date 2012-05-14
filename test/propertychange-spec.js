/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage;

describe("propertychange-spec", function() {

    describe("when concerned with an array of primitive values", function() {

        it('should fire a change event when an addition is made to an empty observed array', function() {
            var testArray = [];
            var testChangeListener = {
                handleChange: function() {
                }
            };

            spyOn(testChangeListener, 'handleChange');

            testArray.addPropertyChangeListener(null, testChangeListener, false);
            testArray.push("a");

            expect(testChangeListener.handleChange).toHaveBeenCalled();
            expect(testArray.length).toBe(1);
        });

        it('should fire a change event when an addition is made to a non-empty observed array', function() {
            var testArray = ["a"];
            var testChangeListener = {
                handleChange: function() {
                }
            };

            spyOn(testChangeListener, 'handleChange');

            testArray.addPropertyChangeListener(null, testChangeListener, false);
            testArray.push("b");

            expect(testChangeListener.handleChange).toHaveBeenCalled();
            expect(testArray.length).toBe(2);
        });

        it('should fire a change event when a deletion is made from a non-empty observed array', function() {
            var testArray = ["a"];
            var testChangeListener = {
                handleChange: function() {
                }
            };

            spyOn(testChangeListener, 'handleChange');

            testArray.addPropertyChangeListener(null, testChangeListener, false);
            testArray.pop();

            expect(testChangeListener.handleChange).toHaveBeenCalled();
            expect(testArray.length).toBe(0);
        });

        it('should not fire a change event when a deletion is made from an empty observed array', function() {
            var testArray = [];
            var testChangeListener = {
                handleChange: function() {
                }
            };

            spyOn(testChangeListener, 'handleChange');

            testArray.addPropertyChangeListener(null, testChangeListener, false);
            testArray.pop();

            expect(testChangeListener.handleChange).not.toHaveBeenCalled();
            expect(testArray.length).toBe(0);
        });

    });

});
