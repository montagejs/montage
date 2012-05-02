#!/bin/bash

# <copyright>
#  This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
#  No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
#  (c) Copyright 2012 Motorola Mobility, Inc.  All Rights Reserved.
# </copyright>

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
MESSAGE_FORMAT_REPO="git://github.com/SlexAxton/messageformat.js.git"
MESSAGE_FORMAT_DIR="messageformat.js"
LOCALE_FILENAME="messageformat-locale.js"
DESTINATION="$DIR/../core"

# remove left over directory if it exists
rm -rf $MESSAGE_FORMAT_DIR

git clone "$MESSAGE_FORMAT_REPO" "$MESSAGE_FORMAT_DIR"
# put all the locale plural functions together
cat "$MESSAGE_FORMAT_DIR"/locale/* > "$LOCALE_FILENAME"
# make into a CommonJS module
sed -i "" "s/MessageFormat.locale/exports/g" "$LOCALE_FILENAME"
# move to the correct place
mv "$LOCALE_FILENAME" "$DESTINATION"

# clean up
rm -rf "$MESSAGE_FORMAT_DIR"
