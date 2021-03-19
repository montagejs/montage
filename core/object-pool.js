var EMPTY_SLOT = Object.freeze(Object.create(null))
    defaultObjectFactory = function() {
        return {};
    };

exports.ObjectPool = function(objectFactory, objectReseter) {
        objectFactory = objectFactory || defaultObjectFactory;
		var objPool = [];
		var nextFreeSlot = null;	// pool location to look for a free object to use

		return {
			checkout,
			checkin,
			grow,
			size,
		};


		// ******************************

		function checkout() {
			if (nextFreeSlot == null || nextFreeSlot == objPool.length) {
				grow( objPool.length || 5 );
			}

			var objToUse = objPool[nextFreeSlot];
			objPool[nextFreeSlot++] = EMPTY_SLOT;
			return objToUse;
		}

		function checkin(obj) {
            objectReseter ? objectReseter(obj) : void 0;
			if (nextFreeSlot == null || nextFreeSlot == -1) {
				objPool[objPool.length] = obj;
			}
			else {
				objPool[--nextFreeSlot] = obj;
			}
		}

		function grow(count) {
            if(typeof count !== "number") count = objPool.length;

			if (count > 0 && nextFreeSlot == null) {
				nextFreeSlot = 0;
			}

			if (count > 0) {
				var curLen = objPool.length;
				objPool.length += Number(count);

				for (var i = curLen; i < objPool.length; i++) {
					// add new obj to pool
					objPool[i] = objectFactory();
				}
			}

			return objPool.length;
		}

		function size() {
			return objPool.length;
		}
    };

