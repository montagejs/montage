/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */
var Montage = require("montage").Montage,
    Component = require("ui/component").Component,
    NativeControl = require("ui/native-control").NativeControl;
    
/**
 * The <img> native control with binding support for the standard attributes
 */
var Link = exports.Link = Montage.create(NativeControl, {

});

Link.addProperties({        
        href: null,
        hreflang: null,
        media: null,
        rel: null,
        target: null,
        type: null
});
