/**
    Defines extensions to intrinsic `Set`.
    @see {external:Set}
    @module montage/core/extras/set
*/

/**
 * Deserialize a set object included in a serialization
 * @param {Deserializer} deserializer The Deserializer containing the serialization information
 * @function external:Set.deserializeSelf
*/
Object.defineProperty(Set.prototype, "deserializeSelf", {
    value: function (deserializer) {
        var values,
            i, n;

        values = deserializer.getProperty("values");
        if (values) {
            for (i = 0, n = values.length; i < n; i++) {
                this.add(values[i]);
            }
        } 
    },
    writable: true,
    configurable: true
});


/**
 * Serialize a Set object
 * @param {Deserializer} serializer The Serializer building out the serialization
 * @function external:Set.serializeSelf
*/
Object.defineProperty(Set.prototype, "serializeSelf", {
    value: function (serializer) {
        var serializedValues = [],
            items = this.keys(),
            item;

            while ((item = items.next().value)) {
                serializedValues.push(item);
            }
            
            serializer.setProperty("values", serializedValues);
    },
    writable: true,
    configurable: true
});