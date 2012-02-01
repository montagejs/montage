var Montage = require("montage").Montage;

var NearestNeighborComponentSearch = exports.NearestNeighborComponentSearch = Montage.create(Montage, {

    _componentList: {
        enumerable: false,
        value: null
    },

    componentList: {
        get: function () {
            return this._componentList;
        },
        set: function (value) {
            var i;

            this._componentList=value;
        }
    },

    _pointerPosition: {
   	    enumerable: false,
        value: null
    },

	pointerPosition: {
	    get: function () {
	        return this._pointerPosition;
	    },
	    set: function (value) {
	        var nearest = null;

            this._pointerPosition=value;
            if ((this._componentList)&&(this._componentList.length)) {
                var target = value.target,
                    nearest;

                for (i=0; i<this._componentList.length; i++) {
                    this._componentList[i]._element.setAttribute("data-nn-index", i);
                }
                while ((target.tagName !== "BODY")&&!(nearest = target.getAttribute("data-nn-index"))) {
                    target = target.parentNode;
                }
                for (i=0; i<this._componentList.length; i++) {
                    this._componentList[i]._element.removeAttribute("data-nn-index", i);
                }
            }
            if (nearest) {
                this.nearestNeighborComponent = Number(nearest);
            } else {
                if (value && this._hasNearestNeighborComponentSearch && this._componentList) {
                    if (this._nearestNeighborComponentSearchMethod==="precise") {
                        this.nearestNeighborComponent=this._searchPreciseNearestNeighborComponent();
                    } else {
                        this.nearestNeighborComponent=this._searchMidpointNearestNeighborComponent();
                    }
                } else {
                    this.nearestNeighborComponent=null;
                }
            }
	    }
	},

    _hasNearestNeighborComponentSearch: {
        enumerable: false,
        value: true
    },

    hasNearestNeighborComponentSearch: {
        get: function () {
            return this._hasNearestNeighborComponentSearch;
        },
        set: function (value) {
            if (value===true) {
                this._hasNearestNeighborComponentSearch=true;
            } else {
                this._hasNearestNeighborComponentSearch=false;
            }
        }
    },

    _nearestNeighborComponentSearchMethod: {
        enumerable: false,
        value: "precise"
    },

    nearestNeighborComponentSearchMethod: {
        get: function () {
            return this._nearestNeighborComponentSearchMethod;
        },
        set: function (vale) {
            if (value==="midpoint") {
                this._nearestNeighborComponentSearchMethod=value;
            } else {
                this._nearestNeighborComponentSearchMethod="precise";
            }
        }
    },

    _pointToQuadSquaredDistance: {
        enumerable: false,
        value: function (pX, pY, q) {
			var dist, iDist,
				i, j, u, x, y, div,
				dist=1e20, a, b;

			q[0]-=pX; q[1]-=pY;	q[2]-=pX; q[3]-=pY;
			q[4]-=pX; q[5]-=pY;	q[6]-=pX; q[7]-=pY;
			for (i=0; i<8; i+=2) {
				j=(i+2)%8;
				a=q[i+1]-q[j+1];
				b=q[j]-q[i];
				div=a*a+b*b;
				if (div>1e-10) {
					u=q[i+1]*a-q[i]*b;
					if (u<0) {
						x=q[i];
						y=q[i+1];
					} else if (u>div) {
						x=q[i]+b;
						y=q[i+1]-a;
					} else {
						u/=div;
						x=q[i]+u*b;
						y=q[i+1]-u*a;
					}
					iDist=x*x+y*y;
					if (iDist<dist) {
						dist=iDist;
					}
				}
			}
			return dist;
		}
	},

	_searchPreciseNearestNeighborComponent: {
	    enumerable: false,
	    value: function () {
            var length=this._componentList.length,
                point=new WebKitPoint(0, 0),
                v0, v1, v2, v3, i,
                quad=Array(8),
                element,
                iDistance,
                distance=1e20,
                pageX=this._pointerPosition.pageX,
                pageY=this._pointerPosition.pageY,
                convert=window.webkitConvertPointFromNodeToPage,
                nearest=null,
                index;

            for (i=0; i<length; i++) {
                element=this._componentList[i].element;
                point.y=0;
                v0=convert(element, point);
                point.x=element.offsetWidth;
                v1=convert(element, point);
                point.y=element.offsetHeight;
                v2=convert(element, point);
                point.x=0;
                v3=convert(element, point);
                quad[0]=v0.x;
                quad[1]=v0.y;
                quad[2]=v1.x;
                quad[3]=v1.y;
                quad[4]=v2.x;
                quad[5]=v2.y;
                quad[6]=v3.x;
                quad[7]=v3.y;
                iDistance=this._pointToQuadSquaredDistance(pageX, pageY, quad);
                if (iDistance < distance) {
                    distance=iDistance;
                    //nearest=this._componentList[i];
                    nearest=i;
                }
            }
            return nearest;
	    }
	},

	_searchMidpointNearestNeighborComponent: {
	    enumerable: false,
	    value: function () {
            var length=this._componentList.length,
                point=new WebKitPoint(0, 0),
                element,
                iDistance,
                distance=1e20,
                v, i,
                pageX=this._pointerPosition.pageX,
                pageY=this._pointerPosition.pageY,
                convert=window.webkitConvertPointFromNodeToPage,
                nearest=null,
                index;

            for (i=0; i<length; i++) {
                element=this._componentList[i].element;
                point.x=element.offsetWidth>>1;
                point.y=element.offsetHeight>>1;
                v=convert(element, point);
                iDistance=(pageX-v.x)*(pageX-v.x)+(pageY-v.y)*(pageY-v.y);
                if (iDistance < distance) {
                    distance=iDistance;
                    //nearest=this._componentList[i];
                    nearest=i;
                }
            }
            return nearest;
	    }
	},

    _nearestNeighborComponent: {
	    enumerable: false,
        value: null
    },

    nearestNeighborComponent: {
        get: function () {
	        return this._nearestNeighborComponent;
	    },
	    set: function (value) {
	        this._nearestNeighborComponent=value;
	    }
    }
});
