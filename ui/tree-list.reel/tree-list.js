/**
 * @module ui/tree-list.reel
 * @requires montage/ui/component
 */
var Component = require("../component").Component,
    TreeNode = require("../../core/tree-controller").TreeNode,
    TranslateComposer = require("../../composer/translate-composer").TranslateComposer,
    WeakMap = require("collections/weak-map");


var PLACEHOLDER_POSITION = {
    BEFORE_NODE: 0,
    OVER_NODE: -1,
    AFTER_NODE: 1
};

/**
 * @class TreeList
 * @extends Component
 */
var TreeList = exports.TreeList = Component.specialize(/** @lends TreeList.prototype */ {

    _sortable: {
        value: false
    },

    isSortable: {
        set: function (sortable) {
            sortable = !!sortable;

            if (sortable !== this._sortable) {
                this._sortable = sortable;

                if (sortable) {
                    this._startListeningToTranslateIfNeeded();
                } else {
                    this._stopListeningToTranslateIfNeeded();
                }
            }
        },
        get: function () {
            return this._sortable;
        }
    },

    timeoutBeforeExpandTreeNode: {
        value: 500 // ms
    },

    _isListeningToTranslateEvents: {
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
                this.__translateComposer.shouldCancelOnSroll = false;
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

    _placerholderPosition: {
        value: null
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
            if (this._controller) {
                if (this._controller.data !== this._data) {
                    this._data = this._controller.data;
                    if (this.isRootExpanded || !this.isRootVisible) {
                        this._controller.expandNode(this._controller.data);
                    }
                }
            }

            this._heights = new WeakMap();
            var children;

            if (this.repetition) {
                this.repetitionController.content = this.getIterations();
            }

            if (this.controller && this.controller.data &&
                typeof this.rowHeight === "function" &&
                (children = this.controller.childrenFromNode(this.controller.data))
            ) {
                this._totalHeight = 0;
                this._rowTopMargins.length = 0;
                this._rowTopMargins.push(0);

                for (var i = 0, n = children.length; i < n; i += 1) {
                    this._totalHeight += this.rowHeight(children[i]);
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
                        for (i = 0; i < length; i++) {
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
        value: function () {
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
            if (this.isSortable) {
                this._startListeningToTranslate();
            }
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
            if (this.isSortable &&
                this.preparedForActivationEvents &&
                !this._isListeningToTranslateEvents
            ) {
                this._startListeningToTranslate();
            }
        }
    },

    _startListeningToTranslate: {
        value: function () {
            this._translateComposer.addEventListener('translateStart', this, false);
            this._isListeningToTranslateEvents = true;
        }
    },

    _stopListeningToTranslateIfNeeded: {
        value: function () {
            if (this._isListeningToTranslateEvents) {
                this._translateComposer.removeEventListener('translateStart', this, false);
                this._isListeningToTranslateEvents = false;
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
                    iteration = this._findRootIterationTreeNode();
                }

                return iteration.object;
            }
        }
    },

    _findRootIterationTreeNode: {
        value: function () {
            return this._findIterationWithDataObject(this.controller.data);
        }
    },

    _findIterationWithDataObject: {
        value: function (dataObject) {
            var drawnIterations = this.repetition._drawnIterations,
                iteration;

            for (var i = 0, length = drawnIterations.length; i < length; i++) {
                iteration = drawnIterations[i];
                if (iteration.object.data === dataObject) {
                    return iteration;
                }
            }
        }
    },

    _findTreeNodeElementWithNode: {
        value: function (node) {
            var iteration = this._findIterationWithDataObject(node.data);

            if (iteration) {
                return iteration.firstElement;
            }
        }
    },

    _nodeAcceptChild: {
        value: function (node) {
            return node && node.data && Array.isArray(this.controller.childrenFromNode(node.data));
        }
    },

    _findClosestNodeWillAcceptDrop: {
        value: function (treeNode) {
            if (treeNode) {
                var nodeObject = treeNode;

                if (nodeObject) {
                    if (this._nodeAcceptChild(nodeObject)) {
                        return nodeObject;
                    }

                    return this._findClosestNodeWillAcceptDrop(nodeObject.parent);
                }
            }
        }
    },

    _scheduleToExpandNode: {
        value: function (node) {
            if (!this._scheduledNodeToExpande) {
                this._scheduledNodeToExpande = {};
            }

            if (!this._scheduledNodeToExpande.id ||
                (this._scheduledNodeToExpande.id &&
                this._scheduledNodeToExpande.object.data !== node.data)
            ) {
                var self = this;
                this._cancelExpandingNodeIfNeeded();

                this._scheduledNodeToExpande.object = node;
                this._scheduledNodeToExpande.id = setTimeout(function () {
                    if (self._isDragging) {
                        node.isExpanded = true;
                    }

                    self._cancelExpandingNodeIfNeeded();
                }, this.timeoutBeforeExpandTreeNode);
            }
        }
    },

    _cancelExpandingNodeIfNeeded: {
        value: function () {
            if (this._scheduledNodeToExpande && this._scheduledNodeToExpande.id) {
                clearTimeout(this._scheduledNodeToExpande.id);
                this._scheduledNodeToExpande.id = null;
                this._scheduledNodeToExpande.object = null;
            }
        }
    },

    _shouldNodeAcceptDrop: {
        value: function (targetNode, sourceNode) {
            var targetDataObject = targetNode.data,
                sourceDataObject = sourceNode.data,
                cursor = targetNode;

            if (sourceDataObject === targetDataObject) {
                return false;
            }

            while (cursor && (cursor = cursor.parent)) {
                if (cursor.data === sourceDataObject) {
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
                var delegateResponse = this.callDelegateMethod(
                    'treeListCanDragNode', this, treeNode.data, true
                ),
                    canDrag = delegateResponse === void 0 ? true : delegateResponse;

                if (canDrag) {
                    this._startPositionX = startPosition.pageX;
                    this._startPositionY = startPosition.pageY;
                    this._draggingTreeNode = treeNode;
                    this._isDragging = true;
                    // TODO: automatically close tree nodes
                    // that have not been altered after translate ended?
                    this._addDragEventListeners();
                }
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
                var draggingNode = this._draggingTreeNode,
                    draggingDataObject = draggingNode.data,
                    previousParentDataObject = draggingNode.parent.data,
                    parentDataObject = this._treeNodeWillAcceptDrop.data,
                    sourceChildren = this.controller.childrenFromNode(
                        previousParentDataObject
                    ),
                    targetChildren = this.controller.childrenFromNode(
                        parentDataObject
                    ),
                    sourceIndex = sourceChildren.indexOf(draggingDataObject);

                if (
                    sourceChildren === targetChildren &&
                    this._placerholderPosition === PLACEHOLDER_POSITION.OVER_NODE
                ) {
                    this._resetTranslateContext();
                    return void 0;
                }

                sourceChildren.splice(sourceChildren.indexOf(draggingDataObject), 1);

                var index = this._placerholderPosition > PLACEHOLDER_POSITION.OVER_NODE ?
                    targetChildren.indexOf(this._treeNodeOver.data) +
                    this._placerholderPosition : targetChildren.length;

                targetChildren.splice(index, 0, draggingDataObject);

                this.dispatchEventNamed('orderchange', true, true, {
                    object: draggingDataObject,
                    previousParent: previousParentDataObject,
                    previousIndex: sourceIndex,
                    parent: parentDataObject,
                    index: index
                });
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
            this._draggingElementBoundingRect = null;
            this._placerholderPosition = PLACEHOLDER_POSITION.OVER_NODE;
            this._treeNodeOver = null;
            this._treeNodeWillAcceptDrop = null;
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

    _placeholderThreshold: {
        value: 6 //px
    },

    _isPointerOnPlaceholder: {
        value: function (pointerPositionX, pointerPositionY) {
            var placeholderRect = this._placeholderBoundingClientRect,
                heightThreshold = this._placeholderThreshold;

            if (pointerPositionY >= placeholderRect.top - heightThreshold &&
                pointerPositionY <= placeholderRect.bottom + heightThreshold &&
                pointerPositionX >= placeholderRect.left - heightThreshold &&
                pointerPositionX <= placeholderRect.right + heightThreshold
            ) {
                return true;
            }

            return false;
        }
    },

    _findClosestTreeNode: {
        value: function (pointerPositionX, pointerPositionY) {
            var treeListRect = this._treeListBoundingClientRect,
                heightThreshold = this._placeholderThreshold,
                treeListScrollTop = this._treeListScrollTop,
                drawnIterations = this.repetition._drawnIterations,
                treeListRectTop = treeListRect.top, object,
                minDist = 0, rowRect = {}, dist, iteration, marginLeft,
                dY, dX, candidate, element;

            for (var i = 0, length = drawnIterations.length; i < length; i++) {
                iteration = drawnIterations[i];
                object = iteration.object;

                if (object) {
                    element = iteration.firstElement;
                    marginLeft = parseInt(element.style.marginLeft);
                    rowRect.top = treeListRectTop +
                        parseInt(element.style.marginTop) - treeListScrollTop;
                    rowRect.left = treeListRect.left + marginLeft;
                    rowRect.width = treeListRect.width - marginLeft;
                    rowRect.height = object.height * this._rowHeight;
                    rowRect.bottom = rowRect.top + rowRect.height;
                    rowRect.right = rowRect.left + rowRect.width;

                    if (
                        pointerPositionX >= rowRect.left && pointerPositionX <= rowRect.right &&
                        pointerPositionY >= rowRect.top - heightThreshold &&
                        pointerPositionY <= rowRect.bottom + heightThreshold
                    ) {
                        dX = pointerPositionX - marginLeft;
                        dY = (rowRect.top + this.rowHeight / 2) - pointerPositionY;

                        if (pointerPositionY > rowRect.top + this.rowHeight) {
                            if (pointerPositionX <= rowRect.left + this.indentationWidth) {
                                dX = (rowRect.left + this.indentationWidth / 2) - pointerPositionX;
                                dY = pointerPositionY;
                            }
                        }

                        dist = dX * dX + dY * dY;

                        if (dist <= minDist || minDist === 0 ||
                            (candidate && candidate.data === this.controller.data)
                        ) {
                            minDist = dist;
                            candidate = object;
                        }
                    }
                }
            }

            return candidate;
        }
    },

    _getPlaceholderPositionOnTreeNode: {
        value: function (treeNode, pointerPositionX, pointerPositionY, canBeOver) {
            var treeNodeElement = this._findTreeNodeElementWithNode(treeNode),
                placeholderRect = this._placeholderBoundingClientRect,    
                rowRect = treeNodeElement.getBoundingClientRect(),
                thresholdHeight = this._placeholderThreshold,
                maxBottom = rowRect.bottom + thresholdHeight,
                minTop = rowRect.top - thresholdHeight,
                minBottom = canBeOver ? rowRect.bottom - thresholdHeight :
                    rowRect.bottom - (rowRect.height / 2),
                maxTop = canBeOver ? rowRect.top + thresholdHeight :
                rowRect.top + (rowRect.height / 2);

            if (pointerPositionY >= minBottom && pointerPositionY <= maxBottom) {
                return PLACEHOLDER_POSITION.AFTER_NODE;
            } else if (pointerPositionY >= minTop && pointerPositionY <= maxTop) {
                return PLACEHOLDER_POSITION.BEFORE_NODE;
            }
            
            return PLACEHOLDER_POSITION.OVER_NODE;
        }
    },

    handleScroll: {
        value: function () {
            this.handleResize();
        }
    },

    willDraw: {
        value: function () {
            this._treeListBoundingClientRect = this._treeListWrapper.getBoundingClientRect();
            this._placeholderBoundingClientRect = this._placeholder.getBoundingClientRect();

            if (this._isDragging) {
                this._treeListScrollTop = this._treeListWrapper.scrollTop;

                if (this._ghostElement && !this._draggingElementBoundingRect) {
                    var draggingElement = this._findTreeNodeElementWithNode(this._draggingTreeNode);
                    this._draggingElementBoundingRect = draggingElement.getBoundingClientRect();
                }

                var positionX = this._startPositionX + this._translateX,
                    positionY = this._startPositionY + this._translateY,
                    treeNodeOver = this._findClosestTreeNode(positionX, positionY);

                if (treeNodeOver === this._placeholder) {
                    return void 0;
                }

                if (treeNodeOver) {
                    var draggingParentTreeNodeDataObject = this._draggingTreeNode.parent.data,
                        draggingTreeNodeDataObject = this._draggingTreeNode.data,
                        draggingParentTreeNodeChildren = this.controller.childrenFromNode(
                            draggingParentTreeNodeDataObject
                        ),
                        treeNodeOverDataObject = treeNodeOver.data,
                        nodeOverAcceptChild = this._nodeAcceptChild(treeNodeOver),
                        overNodeIndex = -1;
                    
                    this._placerholderPosition = this._getPlaceholderPositionOnTreeNode(
                        treeNodeOver,
                        positionX,
                        positionY,
                        nodeOverAcceptChild
                    );

                    if (
                        /**
                         * cancel drop in some cases:
                         * - the over node is the dragging one.
                         * - the over node is the direct parent node from the dragging node.
                         * - the over node is the next sibling of the dragging node.
                         */
                        treeNodeOverDataObject === draggingTreeNodeDataObject ||
                        (treeNodeOverDataObject === draggingParentTreeNodeDataObject &&
                            this._placerholderPosition === PLACEHOLDER_POSITION.OVER_NODE) ||
                        (this._placerholderPosition !== PLACEHOLDER_POSITION.OVER_NODE &&
                            (overNodeIndex = draggingParentTreeNodeChildren.indexOf(treeNodeOverDataObject)) > -1)
                    ) {

                        if (overNodeIndex > -1) {
                            var draggingNodeIndex = draggingParentTreeNodeChildren.indexOf(draggingTreeNodeDataObject);

                            if ((overNodeIndex + 1 === draggingNodeIndex &&
                                this._placerholderPosition !== PLACEHOLDER_POSITION.BEFORE_NODE) ||
                                (overNodeIndex - 1 === draggingNodeIndex &&
                                    this._placerholderPosition !== PLACEHOLDER_POSITION.AFTER_NODE)
                            ) {  // next/previous sibling
                                treeNodeOver = null;
                            }
                        } else {
                            treeNodeOver = null;
                        }
                    }

                    if (treeNodeOver) {
                        var dropNodeCandidate = this._findClosestNodeWillAcceptDrop(
                            this._placerholderPosition === PLACEHOLDER_POSITION.OVER_NODE ?
                                treeNodeOver : treeNodeOver.parent
                            ),
                            sourceNode = this._draggingTreeNode;

                        if (dropNodeCandidate && this._shouldNodeAcceptDrop(dropNodeCandidate, sourceNode)) {
                            var delegateResponse = this.callDelegateMethod(
                                'treeListCanDropNode',
                                this,
                                this._draggingTreeNode.data,
                                dropNodeCandidate.data,
                                true
                            ),
                                canDrop = delegateResponse === void 0 ?
                                    true : delegateResponse;

                            if (canDrop) {
                                if (
                                    !dropNodeCandidate.isExpanded &&
                                    this._placerholderPosition === PLACEHOLDER_POSITION.OVER_NODE
                                ) {
                                    this._scheduleToExpandNode(dropNodeCandidate);
                                } else {
                                    this._cancelExpandingNodeIfNeeded();
                                }

                                this._treeNodeWillAcceptDrop = dropNodeCandidate;
                            } else {
                                treeNodeOver = null;
                            }
                        } else {
                            treeNodeOver = null;
                        }
                    }
                }

                this._treeNodeOver = treeNodeOver;

                if (!treeNodeOver) {
                    this._treeNodeWillAcceptDrop = null;
                    this._placerholderPosition = PLACEHOLDER_POSITION.OVER_NODE;
                    this._cancelExpandingNodeIfNeeded();
                }
            }
        }
    },

    _isNodeParentOf: {
        value: function (node, parent) {
            if (node) {
                if (node.data === parent.data) {
                    return true;
                }

                return this._isNodeParentOf(node.parent, parent);
            }

            return false;
        }
    },

    draw: {
        value: function () {
            var treeListHeight = this._treeListBoundingClientRect.height,
                drawnIterations = this.repetition._drawnIterations,
                rootCondition, marginTop, object, iteration, element,
                rowHeight, i, length;
            
            this.element.classList.add(TreeList.PLACEHOLDER_OVER);

            for (i = 0, length = drawnIterations.length; i < length; i++) {
                iteration = drawnIterations[i];
                object = iteration.object;
                rootCondition = !this.isRootVisible && object.data === this.controller.data;
                element = iteration.cachedFirstElement || iteration.firstElement;
                marginTop = 0;

                if (typeof this.rowHeight === "function") {
                    if (rootCondition) {
                        rowHeight = (treeListHeight > this._totalHeight ?
                            treeListHeight : this._totalHeight);
                    } else {
                        rowHeight = this._rowTopMargins[object.row + 1] - this._rowTopMargins[object.row];
                        marginTop = this._rowTopMargins[object.row];
                    }
                } else {
                    rowHeight = this._rowHeight * (object.height - (rootCondition ? 1 : 0));
                    marginTop = this._rowHeight * object.row;
                }

                rowHeight = rootCondition && treeListHeight > rowHeight ?
                    treeListHeight : rowHeight;

                element.style.marginTop = marginTop + "px";
                element.style.height = rowHeight + "px";
                element.style.marginLeft = this._indentationWidth * object.depth + "px";
                element.style.visibility = rootCondition ? "hidden" : 'visible';
                element.classList.remove('willDrop');

                if (object.isExpanded) {
                    element.classList.add('is-expanded');
                } else {
                    element.classList.remove('is-expanded');
                }
            }

            if (this._isDragging) {
                this.element.classList.add('is-sorting');

                if (!this._ghostElement) {
                    // Delegate Method for ghost element?
                    var draggingElement = this._findTreeNodeElementWithNode(this._draggingTreeNode);
                    this._ghostElement = draggingElement.cloneNode(true);
                    this._ghostElement.classList.add("montage-TreeList-ghostImage");
                    document.body.appendChild(this._ghostElement);
                    this._needsToWaitforGhostElementBoundaries = true;
                    this.needsDraw = true;
                    return void 0;
                }

                if (this._needsToWaitforGhostElementBoundaries) {
                    // Delegate Method for ghost element positioning?
                    this._ghostElement.style.top = this._draggingElementBoundingRect.top + "px";
                    this._ghostElement.style.left = this._draggingElementBoundingRect.left + "px";
                    this._ghostElement.style.width = this._draggingElementBoundingRect.width + "px";
                    this._ghostElement.style.opacity = 1;
                    this._needsToWaitforGhostElementBoundaries = false;
                }

                this._ghostElement.style[TreeList.cssTransform] = "translate3d(" +
                    this._translateX + "px," + this._translateY + "px,0)";

                var treeListScrollHeight = this._treeListWrapper.scrollHeight,
                    placeholderStyle = this._placeholder.style,
                    isScrolling = false;

                // Update scroll view if needed
                if (treeListScrollHeight > treeListHeight) {
                    var multiplierY = 0, scrollThreshold = this._scrollThreshold,
                        pointerPositionY = this._startPositionY + this._translateY,
                        treeListPositionTopY = this._treeListBoundingClientRect.top,
                        treeListPositionBottomY = this._treeListBoundingClientRect.bottom,
                        multiplier;

                    if ((pointerPositionY - scrollThreshold) <= treeListPositionTopY &&
                        this._treeListScrollTop !== 0
                    ) { // up
                        multiplier = pointerPositionY - treeListPositionTopY;
                        multiplierY = (scrollThreshold / (multiplier >= 1 ? multiplier : 1)) * 2;
                        this._treeListWrapper.scrollTop = this._treeListScrollTop - multiplierY;
                        isScrolling = true;

                    } else if (pointerPositionY + scrollThreshold >= treeListPositionBottomY &&
                        this._treeListWrapper.scrollTop + treeListHeight < treeListScrollHeight
                    ) { // down
                        multiplier = treeListPositionBottomY - pointerPositionY;
                        multiplierY = (scrollThreshold / (multiplier >= 1 ? multiplier : 1)) * 2;
                        this._treeListWrapper.scrollTop = this._treeListScrollTop + multiplierY;
                        isScrolling = true;
                    }
                }

                if (!isScrolling) {
                    if (
                        this._placeholder && this._treeNodeOver &&
                        this._placerholderPosition !== PLACEHOLDER_POSITION.OVER_NODE
                    ) {
                        var treeNodeOverElement = this._findTreeNodeElementWithNode(this._treeNodeOver),
                            treeNodeOverStyle = treeNodeOverElement.style,
                            placeholderMarginTop = parseInt(treeNodeOverStyle.marginTop);

                        if (this._placerholderPosition === PLACEHOLDER_POSITION.AFTER_NODE) {
                            placeholderMarginTop += parseInt(treeNodeOverStyle.height);
                        }

                        placeholderStyle.height = "0px";
                        placeholderStyle.top = (placeholderMarginTop - this._treeListScrollTop) + "px";
                        placeholderStyle.left = treeNodeOverStyle.marginLeft;
                        placeholderStyle.width = this._treeListBoundingClientRect.width -
                            parseInt(treeNodeOverStyle.marginLeft) + "px";
                        placeholderStyle.opacity = 0.85;
                    } else {
                        placeholderStyle.opacity = 0;
                    }

                    if (this._treeNodeWillAcceptDrop &&
                        this._placerholderPosition === PLACEHOLDER_POSITION.OVER_NODE
                    ) {
                        var dropNodeElement = this._findTreeNodeElementWithNode(this._treeNodeWillAcceptDrop);
                        dropNodeElement.classList.add('willDrop');
                    }
                } else {
                    placeholderStyle.opacity = 0;
                    this.needsDraw = true;
                }
            } else {
                this.element.classList.remove('is-sorting');

                if (this._ghostElement) {
                    document.body.removeChild(this._ghostElement);
                    this._ghostElement = null;
                    this._placeholder.style.opacity = 0;
                }
            }

            this.element.style.paddingBottom = this._placeholderBoundingClientRect.height + "px";
        }
    }

}, {
    PLACEHOLDER_OVER: {
        value: "over"
    }
});
