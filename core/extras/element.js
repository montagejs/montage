/* <copyright>
Copyright (c) 2012, António Afonso. All Rights Reserved.
3-Clause BSD License
http://opensource.org/licenses/BSD-3-Clause
</copyright> */

if (Element && !Element.isElement) {
    Object.defineProperty(Element, "isElement", {
        value: function (obj) {
            return !!(obj && 1 === obj.nodeType);
        },
        writable: true,
        configurable: true
    });
}