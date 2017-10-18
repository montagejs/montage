/**
 * @module ui/tree-list.reel
 * @requires montage/ui/component
 */
var Component = require("../component").Component,
    TreeNode = require("../../core/tree-controller").TreeNode,
    TranslateComposer = require("../../composer/translate-composer").TranslateComposer,
    WeakMap = require("collections/weak-map");

/**
 * @class TreeList
 * @extends Component
 */
var TreeList = exports.TreeList = Component.specialize(/** @lends TreeList.prototype */ {

    _editable: {
        value: false
    },

    isEditable: {
        set: function (editable) {
            editable = !!editable;

            if (editable !== this._editable) {
                this._editable = editable;
                
                if (editable) {
                    this._startListeningToTranslateIfNeeded();
                } else {
                    this._stopListeningToTranslateIfNeeded();
                }
            }
        },
        get: function () {
            return this._editable;
        }
    },

    timeoutBeforeExpandNode: {
        value: 1000 // ms
    },

    _isListeningToTranslate: {
        value: false
    },

    __translateComposer: {
        value: null
    },

    _translateComposer: {
        get: function () {
            if (!this.__translateComposer) {
                this.__translateComposer = new TranslateComposer();
                this.__translateComposer.hasMomentum = false;
                this.__translateComposer.preventScroll = false;
                this.__translateComposer.translateX = 0;
                this.__translateComposer.translateY = 0;

                this.addComposer(this.__translateComposer);
            }

            return this.__translateComposer;
        }
    },

    _scrollThreshold: {
        value: 10
    },

    _placerHolderPosition: {
        value: null
    },

    _dragOverThreshold: {
        value: 3
    },

    _controller: {
        value: null
    },

    controller: {
        get: function () {
            return this._controller;
        },
        set: function (value) {
            if (this._controller !== value) {
                this._controller = value;
                this._heights = new WeakMap();
                if (this._controller) {
                    this._controller.delegate = this;
                }
            }
        }
    },

    _rowTopMargins: {
        get: function () {
            if (!this.__rowTopMargins) {
                this.__rowTopMargins = [];
            }
            return this.__rowTopMargins;
        }
    },

    _totalHeight: {
        value: 0
    },

    _isRootExpanded: {
        value: false
    },

    isRootExpanded: {
        get: function () {
            return this._isRootExpanded;
        },
        set: function (value) {
            if (this._isRootExpanded !== value) {
                this._isRootExpanded = value;
                if (this._controller) {
                    this._controller.expandNode(this._controller.data);
                }
            }
        }
    },

    _isRootVisible: {
        value: true
    },

    isRootVisible: {
        get: function () {
            return this._isRootVisible;
        },
        set: function (value) {
            if (this._isRootVisible !== value) {
                this._isRootVisible = value;
                this.handleTreeChange();
            }
        }
    },

    _data: {
        value: null
    },

    handleTreeChange: {
        value: function () {
            var i, n;
            if (this._controller) {
                if (this._controller.data !== this._data) {
                    this._data = this._controller.data;
                    if (this.isRootExpanded || !this.isRootVisible) {
                        this._controller.expandNode(this._controller.data);
                    }
                }
            }
            this._heights = new WeakMap();
            if (this.repetition) {
                this.repetitionController.content = this.getIterations();
            }
            if (this.controller &&
                this.controller.data &&
                this.controller.data.children &&
                typeof this.rowHeight === "function") {
                this._totalHeight = 0;
                this._rowTopMargins.length = 0;
                this._rowTopMargins.push(0);
                for (i = 0, n = this.controller.data.children.length; i < n; i += 1) {
                    this._totalHeight += this.rowHeight(this.controller.data.children[i]);
                    this._rowTopMargins.push(this._totalHeight);
                }
            }
        }
    },

    /**
        Represents the range of visible rows in the view window as
        an interval [startRow, endRow)
    */
    _visibilityRange: {
        value: [0, 0]
    },

    visibilityRange: {
        get: function () {
            return this._visibilityRange;
        },
        set: function (value) {
            this._visibilityRange = value;
            this.repetitionController.content = this.getIterations();
        }
    },

    _getNodeHeight: {
        value: function (node) {
            var expansionMetadata,
                height;

            if (this._controller) {
                expansionMetadata = this._controller._expansionMap.get(node);
                if (expansionMetadata) {
                    height = this._heights.get(node);
                    if (!height) {
                        height = this._computeExpandedNodeHeight(node);
                        this._heights.set(node, height);
                    }
                    return height;
                }
                return 1;
            }
        }
    },

    _computeExpandedNodeHeight: {
        value: function (node) {
            if (this._controller) {
                var children = this._controller.childrenFromNode(node),
                    height = 1,
                    length,
                    i;

                if (children) {
                    length = children.length;
                    for (i = 0; i < length; i++) {
                        height += this._getNodeHeight(children[i]);
                    }
                }
                return height;
            }
        }
    },

    _addIterations: {
        value: function (node, iterationsArray, row, depth, parent) {
            var length,
                children,
                height,
                treeNode,
                i;

            if (node) {
                treeNode = new TreeNode(node, this._controller);
                treeNode.height = this._getNodeHeight(node);
                treeNode.parent = parent;
                treeNode.row = row;
                if (!this.isRootVisible && (node === this._controller.data)) {
                    iterationsArray.push(treeNode);
                    treeNode.depth = depth;
                    depth--;
                } else {
                    treeNode.depth = depth;
                    iterationsArray.push(treeNode);
                    row++;
                }
                if (this._controller.isNodeExpanded(node)) {
                    children = this._controller.childrenFromNode(node);
                    if (children) {
                        length = children.length;
                        for (i = 0; i < length; i++) {
                            if (this._isVisible(row, height = this._getNodeHeight(children[i]))) {
                                row = this._addIterations(children[i], iterationsArray, row, depth + 1, treeNode);
                            } else {
                                row += height;
                            }
                        }
                    }
                }
            }
            return row;
        }
    },

    _isVisible: {
        value: function (startRow, height) {
            var endRow = startRow + height;

            return ((startRow < this._visibilityRange[1]) && (endRow > this._visibilityRange[0]));
        }
    },

    getIterations: {
        value: function () {
            var iterations = [];

            if (this._controller.data && (this._visibilityRange[1] > this._visibilityRange[0])) {
                if (this._isVisible(0, this._getNodeHeight(this._controller.data))) {
                    this._addIterations(this._controller.data, iterations, 0, 0);
                }
            }
            return iterations;
        }
    },

    templateDidLoad: {
        value: function() {
            var oldWillDraw = this.repetition.willDraw,
                self = this;

            this.repetition.willDraw = function () {
                if (typeof oldWillDraw === "function") {
                    oldWillDraw.call(self.repetition);
                }

                self.needsDraw = true;
            };
        }
    },

    enterDocument: {
        value: function (firstTime) {
            if (firstTime && !TreeList.cssTransform) {
                if ("webkitTransform" in this._element.style) {
                    TreeList.cssTransform = "webkitTransform";
                } else if ("MozTransform" in this._element.style) {
                    TreeList.cssTransform = "MozTransform";
                } else if ("oTransform" in this._element.style) {
                    TreeList.cssTransform = "oTransform";
                } else {
                    TreeList.cssTransform = "transform";
                }
            }

            window.addEventListener("resize", this, false);
            this._element.addEventListener("scroll", this, false);
            this._startListeningToTranslateIfNeeded();

            this.handleScroll();
            this.handleTreeChange();
        }
    },

    prepareForActivationEvents: {
        value: function () {
            this._startListeningToTranslate();
        }
    },

    exitDocument: {
        value: function () {
            window.removeEventListener("resize", this, false);
            this._element.removeEventListener("scroll", this, false);
            this._stopListeningToTranslateIfNeeded();
        }
    },

    _startListeningToTranslateIfNeeded: {
        value: function () {
            if (this.isEditable &&
                this.preparedForActivationEvents &&
                !this._isListeningToTranslate
            ) {
                this._startListeningToTranslate();
            }
        }
    },

    _startListeningToTranslate: {
        value: function () {
            this._translateComposer.addEventListener('translateStart', this, false);
            this._isListeningToTranslate = true;
        }
    },

    _stopListeningToTranslateIfNeeded: {
        value: function () {
            if (this._isListeningToTranslate) {
                this._translateComposer.removeEventListener('translateStart', this, false);
                this._isListeningToTranslate = false;
            }
        }
    },
   
    _addDragEventListeners: {
        value: function () {
            this._translateComposer.addEventListener('translate', this, false);
            this._translateComposer.addEventListener('translateEnd', this, false);
            this._translateComposer.addEventListener('translateCancel', this, false);
        }
    },

    _removeDragEventListeners: {
        value: function () {
            this._translateComposer.removeEventListener('translate', this, false);
            this._translateComposer.removeEventListener('translateEnd', this, false);
            this._translateComposer.removeEventListener('translateCancel', this, false);
        }
    },

    _findTreeNodeWithElement: {
        value: function (element) {
            if (this.element.contains(element) || element === this.element) {
                var iteration = this.repetition._findIterationContainingElement(element);

                if (!iteration) {
                    iteration = this._findRootTreeNode();
                }

                return this._wrapIterationIntoTreeNode(iteration);
            }
        }
    },

    _findRootTreeNode: {
        value: function () {
            var drawnIterations = this.repetition._drawnIterations,
                rootObject = this.controller.data,
                iteration;
            
            for (var i = 0, length = drawnIterations.length; i < length; i++) {
                iteration = drawnIterations[i];
                if (iteration.object.data === rootObject) {
                    return iteration;
                }
            }
        }
    },

    _findTreeNodeWithNode: {
        value: function (node) {
            var drawnIterations = this.repetition._drawnIterations,
                iteration;
            
            for (var i = 0, length = drawnIterations.length; i < length; i++) {
                iteration = drawnIterations[i];
                if (iteration.object === node) {
                    return this._wrapIterationIntoTreeNode(iteration);
                }
            }
        }
    },

    _wrapIterationIntoTreeNode: {
        value: function (iteration) {
            // Wrapping objects is needed in order to handle iterations recycling.
            if (iteration) {
                // TODO: [Improvements] use a pool object?
                return {
                    element: iteration.cachedFirstElement || iteration.firstElement,
                    object: iteration.object
                };
            }
        }
    },

    _doesNodeAcceptChild: {
        value: function (node) {
            return node && node.data && Array.isArray(node.data.children);
        }
    },

    _findClosestParentWhoAcceptChild: {
        value: function (treeNode) {
            if (treeNode) {
                var nodeObject = treeNode;

                if (treeNode.element) {
                    var treeNodeRect = treeNode.element.getBoundingClientRect(),
                        placeholderHeight = this._placeHolderBoundingRect.height,
                        overThresholdTop = this._dragOverThreshold,
                        overThresholdBottom = this._dragOverThreshold,
                        positionY = this._startPositionY + this._translateY,
                        positionBottomY = (treeNodeRect.y + treeNodeRect.height) - positionY,
                        positionTopY = positionY - treeNodeRect.y;
                    
                    if (this._placerHolderPosition === 0) {
                        overThresholdTop += placeholderHeight;
                    } else if (this._placerHolderPosition === 1) {
                        overThresholdBottom += placeholderHeight;
                        positionBottomY -= placeholderHeight;
                    }

                    this._placerHolderPosition = positionTopY <= overThresholdTop ?
                        0 : positionBottomY <= overThresholdBottom ? 1 : -1;
                    
                    nodeObject = treeNode.object;

                    if (this._placerHolderPosition !== -1) {
                        nodeObject = nodeObject.parent;
                    }
                }

                if (nodeObject) {
                    if (this._doesNodeAcceptChild(nodeObject)) {
                        return nodeObject;
                    }

                    return this._findClosestParentWhoAcceptChild(nodeObject.parent);
                }                
            }
        }
    },

    _scheduleToExpandNode: {
        value: function (node) {
            var self = this;
            this._cancelExpandingNodeIfNeeded();

            this._expandNodeId = setTimeout(function () {
                if (self._isDragging) {
                    node.isExpanded = true;
                }

                self._expandNodeId = null;
            }, this.timeoutBeforeExpandNode);
        }
    },

    _cancelExpandingNodeIfNeeded: {
        value: function () {
            if (this._expandNodeId) {
                clearTimeout(this._expandNodeId);
                this._expandNodeId = null;
            }
        }
    },

    _shouldNodeAcceptDrop: {
        value: function (targetNode, sourceNode) {
            var targetObject = targetNode.data,
                sourceObject = sourceNode.data,
                cursor = targetNode;
            
            if (sourceObject === targetObject ||
                targetObject === sourceNode.parent.data
            ) {
                return false;
            }

            while (cursor && (cursor = cursor.parent)) {
                if (cursor.data === sourceObject) {
                    return false;
                }
            }

            return true;
        }
    },

    handleTranslateStart: {
        value: function (event) {
            var startPosition = this._translateComposer.pointerStartEventPosition,
                treeNode = this._findTreeNodeWithElement(startPosition.target);

            if (treeNode) {
                 //Delegate Method for allowing Dragging?
                this._startPositionX = startPosition.pageX;
                this._startPositionY = startPosition.pageY;
                this._draggingTreeNode = treeNode;
                this._isDragging = true;
                // TODO: automatically close tree nodes
                // that have not been altered after translate ended?
                this._addDragEventListeners();
            }
        }
    },

    handleTranslate: {
        value: function (event) {
            this._translateX = event.translateX;
            this._translateY = event.translateY;
            this.needsDraw = true;
        }
    },

    handleTranslateEnd: {
        value: function () {
            if (this._treeNodeWillAcceptDrop) {
                //Delegate Method when Dragging end over another node?
                var draggingObject = this._draggingTreeNode.object,
                    sourceChildren = draggingObject.parent.data.children,
                    targetChildren = this._treeNodeWillAcceptDrop.object.data.children,
                    index = this._placerHolderPosition > -1 ?
                        targetChildren.indexOf(this._treeNodeOver.object.data) +
                        this._placerHolderPosition : targetChildren.length;

                targetChildren.splice(index, 0, draggingObject.data);
                sourceChildren.splice(sourceChildren.indexOf(draggingObject.data), 1);
            }

            this._resetTranslateContext();
        }
    },

    handleTranslateCancel: {
        value: function () {
            this._resetTranslateContext();
        }
    },

    _resetTranslateContext: {
        value: function () {
            this._cancelExpandingNodeIfNeeded();
            this._removeDragEventListeners();
            this._startPositionX = 0;
            this._startPositionY = 0;
            this._translateX = 0;
            this._translateY = 0;
            this._isDragging = false;
            this._draggingTreeNode = null;
            this.__translateComposer.translateX = 0;
            this.__translateComposer.translateY = 0;
            this._ghostElementBoundingRect = null;
            this._placerHolderPosition = -1;
            this._treeNodeOver = null;
            this.needsDraw = true;
        }
    },

    handleResize: {
        value: function () {
            // Here we use the window height instead of the element height for
            // the calculation so that we still have enough rows even if the
            // tree list is later resized (as long as it's not resized taller
            // than the window). We're wasting a few rows when the tree list
            // is shorter than the window, but not that many.
            var startRow, height, endRow, index;
            if (typeof this.rowHeight === "function") {
                index = 0;
                height = this._element.scrollTop;
                while (this._rowTopMargins[index + 1] < height) {
                    index++;
                }
                startRow = index;
                height = this._rowTopMargins[startRow] + window.innerHeight;
                while (this._rowTopMargins[index] < height) {
                    index++;
                }
                endRow = index;
            } else {
                startRow = this._element.scrollTop / this._rowHeight;
                height = window.innerHeight / this._rowHeight;
                endRow = startRow + height;
            }
            this.visibilityRange = [startRow, endRow];
        }
    },

    _rowHeight: {
        value: 40
    },

    rowHeight: {
        get: function () {
            return this._rowHeight;
        },
        set: function (value) {
            if (this._rowHeight !== value) {
                this._rowHeight = value;
                this.needsDraw = true;
                if (this.repetitionController) {
                    this.handleTreeChange();
                    this.handleResize();
                }
            }
        }
    },

    _indentationWidth: {
        value: 30
    },

    indentationWidth: {
        get: function () {
            return this._indentationWidth;
        },
        set: function (value) {
            if (this._indentationWidth !== value) {
                this._indentationWidth = value;
                this.needsDraw = true;
            }
        }
    },

    handleScroll: {
        value: function () {
            this.handleResize();
        }
    },

    willDraw: {
        value: function () {
            this._treeListBoundingClientRect = this.element.getBoundingClientRect();
            
            if (this._isDragging) {
                if (this._ghostElement && !this._ghostElementBoundingRect) {
                    this._ghostElementBoundingRect = this._draggingTreeNode.element.getBoundingClientRect();
                }

                if (this._placeHolder) {
                    this._placeHolderBoundingRect = this._placeHolder.getBoundingClientRect();
                }

                if (this._placeHolderBoundingRect) {
                    var positionX = this._startPositionX + this._translateX,
                        positionY = this._startPositionY + this._translateY,
                        target = document.elementFromPoint(positionX, positionY),
                        treeNode;
                    
                    this._treeNodeOver = treeNode = this._findTreeNodeWithElement(target);

                    if (treeNode && treeNode.object) {
                        var nodeCandidate = this._findClosestParentWhoAcceptChild(treeNode),
                            sourceNode = this._draggingTreeNode.object;

                        if (nodeCandidate && this._shouldNodeAcceptDrop(nodeCandidate, sourceNode)) {
                            //Delegate Method when Dragging over another node?
                            var previousTreeNodeWillAcceptDrop = this._previousTreeNodeWillAcceptDrop;

                            if (!previousTreeNodeWillAcceptDrop ||
                                (previousTreeNodeWillAcceptDrop &&
                                    previousTreeNodeWillAcceptDrop.object.data !== nodeCandidate.data)
                            ) {
                                this._previousTreeNodeWillAcceptDrop = this._treeNodeWillAcceptDrop;
                                this._treeNodeWillAcceptDrop = this._findTreeNodeWithNode(nodeCandidate);

                                if (!nodeCandidate.isExpanded &&
                                    this._placerHolderPosition === -1
                                ) {
                                    this._scheduleToExpandNode(nodeCandidate);
                                } else {
                                    this._cancelExpandingNodeIfNeeded();
                                }
                            }
                        } else {
                            treeNode = null;
                        }
                    }
                }

                if (!treeNode) {
                    // set previous tree node to remove class.
                    this._previousTreeNodeWillAcceptDrop = this._treeNodeWillAcceptDrop;
                    this._treeNodeWillAcceptDrop = null;
                    this._placerHolderPosition = -1;
                    this._cancelExpandingNodeIfNeeded();
                }
            }
        }
    },

    _pathToParentNode: {
        value: function (node) {
            var path = [];

            while (node.parent) {
                path.unshift(node.parent);
                node = node.parent;
            }

            return path;
        }
    },

    draw: {
        value: function () {
            var treeListHeight = this._treeListBoundingClientRect.height,
                drawnIterations = this.repetition._drawnIterations, isRoot,
                placeholderHeight = 0, pathToParentNode, marginTop, object,
                addPlaceholderPaddingTop, iteration, element, rowHeight, i, length;
            
            if (this._placeHolder && this._treeNodeOver &&
                this._placerHolderPosition !== -1) {
                
                placeholderHeight = this._placeHolderBoundingRect.height;
                pathToParentNode = this._pathToParentNode(this._treeNodeOver.object);
            }           

            for (i = 0, length = drawnIterations.length; i < length; i++) {
                iteration = drawnIterations[i];
                object = iteration.object;
                rootCondition = !this.isRootVisible && object.data === this.controller.data;
                element = iteration.cachedFirstElement || iteration.firstElement;
                rowHeight = 0;

                if (typeof this.rowHeight === "function") {
                    if (rootCondition) {
                        element.style.marginTop = 0;
                        element.style.height = (treeListHeight > this._totalHeight ?
                            treeListHeight : this._totalHeight) + "px";
                    } else {
                        rowHeight = this._rowTopMargins[object.row + 1] - this._rowTopMargins[object.row];
                        element.style.height = rowHeight + "px";
                        element.style.marginTop = this._rowTopMargins[object.row] + "px";
                    }
                } else {
                    marginTop = this._rowHeight * object.row;

                    if (rootCondition) {
                        rowHeight = this._rowHeight * (object.height - 1);

                        element.style.marginTop = marginTop + "px";
                        element.style.height = (treeListHeight > rowHeight ?
                            treeListHeight : rowHeight) + "px";
                    } else {
                        rowHeight = this._rowHeight * object.height;

                        if (pathToParentNode && pathToParentNode.indexOf(object) > -1) {
                            rowHeight += placeholderHeight;
                        }

                        if (addPlaceholderPaddingTop) {
                            marginTop += placeholderHeight;
                        }

                        element.style.marginTop = marginTop + "px";
                        element.style.height = rowHeight + "px";
                    }
                }

                element.style.paddingTop = '0px';
                element.style.paddingBottom = '0px';

                if (placeholderHeight && object === this._treeNodeOver.object) {
                    if (this._placerHolderPosition === 0) {
                        element.style.paddingTop = placeholderHeight + 'px';
                    } else {
                        element.style.paddingBottom = placeholderHeight + 'px';
                    }

                    addPlaceholderPaddingTop = true;
                }
                
                element.style.marginLeft = this._indentationWidth * object.depth + "px";
                element.style.visibility = rootCondition ? "hidden" : 'visible';
            }

            if (this._isDragging) {
                if (this._placeHolder) {
                    var placeholderStyle = this._placeHolder.style;

                    if (placeholderHeight) {
                        var nodeOverStyle = this._treeNodeOver.element.style;

                        if (this._placerHolderPosition === 0) { // above
                            placeholderStyle.marginTop = nodeOverStyle.marginTop;
                        } else { // below
                            placeholderStyle.marginTop = parseInt(nodeOverStyle.marginTop) +
                                parseInt(this._rowHeight) + "px";
                        }

                        placeholderStyle.marginLeft = nodeOverStyle.marginLeft;
                        placeholderStyle.opacity = 1;
                    } else {
                        placeholderStyle.opacity = 0;
                    }
                }
                
                if (!this._ghostElement) {
                    // Delegate Method for ghost element?
                    this._ghostElement = this._draggingTreeNode.element.cloneNode(true);
                    this._ghostElement.classList.add("montage-TreeList-ghostImage");

                    if (!this._placeHolder) {
                        this._placeHolder = document.createElement('div');
                        this._placeHolder.classList.add("montage-TreeList-placeholder");
                        this.element.appendChild(this._placeHolder);
                    }
                   
                    document.body.appendChild(this._ghostElement);

                    this._needsToWaitforGhostElementBoundaries = true;
                    this.needsDraw = true;
                    return void 0;
                }

                if (this._needsToWaitforGhostElementBoundaries) {
                    // Delegate Method for positioning?
                    this._ghostElement.style.top = this._ghostElementBoundingRect.top + "px";
                    this._ghostElement.style.left = this._ghostElementBoundingRect.left + "px";
                    this._ghostElement.style.visibility = "visible";
                    this._ghostElement.style.opacity = 1;
                    this._placeHolder.style.visibility = "visible";
                    this._needsToWaitforGhostElementBoundaries = false;
                }

                if (this._previousTreeNodeWillAcceptDrop) {
                    this._previousTreeNodeWillAcceptDrop.element.classList.remove('willDrop');
                }

                if (this._treeNodeWillAcceptDrop) {
                    this._treeNodeWillAcceptDrop.element.classList.add('willDrop');
                }

                this._ghostElement.style[TreeList.cssTransform] = "translate3d(" +
                    this._translateX + "px," + this._translateY + "px,0)";
                
                // Update scroll view if needed
                var treeListScrollHeight = this.element.scrollHeight;

                if (treeListScrollHeight > treeListHeight) {
                    var multiplierY = 0, scrollThreshold = this._scrollThreshold,
                        pointerPositionY = this._startPositionY + this._translateY,
                        treeListPositionTopY = this._treeListBoundingClientRect.y,
                        treeListPositionBottomY = this._treeListBoundingClientRect.bottom,
                        multiplier;

                    if ((pointerPositionY - scrollThreshold) <= treeListPositionTopY) { // up
                        if (this.element.scrollTop !== 0) {
                            multiplier = pointerPositionY - treeListPositionTopY;
                            multiplierY = (scrollThreshold / (multiplier >= 1 ? multiplier : 1)) * 2;
                            this.element.scrollTop = this.element.scrollTop - multiplierY;
                        }
                    } else if ((pointerPositionY + scrollThreshold) >= treeListPositionBottomY) { // down
                        if ((this.element.scrollTop + treeListHeight) < treeListScrollHeight) {
                            multiplier = treeListPositionBottomY - pointerPositionY;
                            multiplierY = (scrollThreshold / (multiplier >= 1 ? multiplier : 1)) * 2;
                            this.element.scrollTop = this.element.scrollTop + multiplierY;
                        }
                    }
                }
            } else {
                if (this._ghostElement) {
                    document.body.removeChild(this._ghostElement);

                    if (this._previousTreeNodeWillAcceptDrop) {
                        this._previousTreeNodeWillAcceptDrop.element.classList.remove('willDrop');
                    }

                    if (this._treeNodeWillAcceptDrop) {
                        this._treeNodeWillAcceptDrop.element.classList.remove('willDrop');
                    }

                    this._ghostElement = null;
                    this._previousTreeNodeWillAcceptDrop = null;
                    this._treeNodeWillAcceptDrop = null;
                    this._placeHolder.style.opacity = 0;
                }
            }    
        } 
    }

});
