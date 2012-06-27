/* <copyright>
 This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
 No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
 (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
 </copyright> */

document.addEventListener("DOMContentLoaded", function(event) {
	var preElement = document.getElementsByTagName("pre")[0];
	var icons = preElement.getElementsByTagName("img"), icon;
	for (var i = 0; icon =  icons[i]; i++) {
		var anchor = icon.nextSibling.nextSibling;
		if (anchor.nodeType !== 3) {
			var newElement = document.createElement("span");
			newElement.className = "fileRow";
			preElement.insertBefore(newElement, icon);
			newElement.appendChild(icon);
			newElement.appendChild(anchor);
		}
	}


}, false);
