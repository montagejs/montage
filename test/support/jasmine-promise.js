/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

/**
Monkey-patches support for promises in Jasmine test blocks.
@fileoverview
@example
describe("promise", function () {
    it("times out", function () {
        return Promise.delay(100).timeout(50)
        .then(function (value) {
            expect(true).toBe(false);
        }, function (error) {
            expect(error).toBe("Timed out");
        })
    });
});
*/

jasmine.Block.prototype.execute = function (onComplete) {
    var spec = this.spec;
    var result;
    try {
        result = this.func.apply(spec);
    } catch (error) {
        spec.fail(error);
    }
    if (typeof result === 'undefined') {
        onComplete();
    } else if (typeof result !== 'object' || typeof result.then !== 'function') {
        spec.fail('`it` block returns non-promise: ' + result);
        onComplete();
    } else {
        result.then(function (value) {
            if (value !== undefined) {
                spec.fail('Promise fulfilled with unexpected value: ' + value);
            }
            onComplete();
        }, function (error) {
            spec.fail(error);
            onComplete();
        });
    }
};

