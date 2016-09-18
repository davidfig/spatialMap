## spatialMap
2D Spatial Map for javascript

## Live Example with Source
https://davidfig.github.io/spatialmap/

## Installation
include update.js in your project or add to your workflow

    npm install yy-spatialmap

# API Reference
<a name="SpatialMap"></a>

## SpatialMap
**Kind**: global class  

* [SpatialMap](#SpatialMap)
    * [new SpatialMap(cellSize, width, height, options)](#new_SpatialMap_new)
    * [.insert(object, AABB)](#SpatialMap+insert)
    * [.remove(object)](#SpatialMap+remove)
    * [.query(AABB)](#SpatialMap+query) ⇒ <code>Array.&lt;object&gt;</code>
    * [.queryCallback(AABB, callback)](#SpatialMap+queryCallback) ⇒ <code>boolean</code>
    * [.getAverageSize()](#SpatialMap+getAverageSize) ⇒ <code>number</code>
    * [.getLargest()](#SpatialMap+getLargest) ⇒ <code>number</code>
    * [.getBuckets()](#SpatialMap+getBuckets) ⇒ <code>Array.&lt;object&gt;</code>

<a name="new_SpatialMap_new"></a>

### new SpatialMap(cellSize, width, height, options)
2D spatial map


| Param | Type | Description |
| --- | --- | --- |
| cellSize | <code>number</code> | used to create map |
| width | <code>number</code> | of world |
| height | <code>number</code> | of world |
| options | <code>object</code> |  |
| options.update | <code>boolean</code> | keep a second list of elements to enable update |

**Example**  
```js
var map = new SpatialMap();

// use your own 2D graphics libraries--I like PIXI.js
var circle = new Circle(10, 10, 5);

// each object must have an AABB bounding box [x1, y1, x2, y2],
// see yy-intersects (github:davidfig/intersects) for a library that provides this with various shapes
circle.AABB = [5, 5, 10, 10];
map.insert(circle);

// returns the circle
var results = map.query([0, 0, 10, 10]);

// or iterate over the results to avoid creating new arrays
map.query([0, 0, 10, 10],
 function(object)
 {
     object.draw();
 }
);
```
<a name="SpatialMap+insert"></a>

### spatialMap.insert(object, AABB)
inserts an object into the map (also removes object from last insertion)
side effect: adds object.spatial to track last insertion

**Kind**: instance method of <code>[SpatialMap](#SpatialMap)</code>  

| Param | Type | Description |
| --- | --- | --- |
| object | <code>object</code> |  |
| AABB | <code>Array.&lt;number&gt;</code> | bounding box [x1, y1, x2, y2] |

<a name="SpatialMap+remove"></a>

### spatialMap.remove(object)
removes existing object from the map

**Kind**: instance method of <code>[SpatialMap](#SpatialMap)</code>  

| Param | Type |
| --- | --- |
| object | <code>object</code> | 

<a name="SpatialMap+query"></a>

### spatialMap.query(AABB) ⇒ <code>Array.&lt;object&gt;</code>
returns an array of objects contained within bounding box
NOTE: this may include duplicates

**Kind**: instance method of <code>[SpatialMap](#SpatialMap)</code>  
**Returns**: <code>Array.&lt;object&gt;</code> - search results  

| Param | Type | Description |
| --- | --- | --- |
| AABB | <code>Array.&lt;number&gt;</code> | bounding box to search [x1, y1, x2, y2] |

<a name="SpatialMap+queryCallback"></a>

### spatialMap.queryCallback(AABB, callback) ⇒ <code>boolean</code>
iterates through objects contained within bounding box
stops iterating if the callback returns true
NOTE: this may return duplicates

**Kind**: instance method of <code>[SpatialMap](#SpatialMap)</code>  
**Returns**: <code>boolean</code> - true if callback returned early  

| Param | Type | Description |
| --- | --- | --- |
| AABB | <code>Array.&lt;number&gt;</code> | bounding box to search [x1, y1, x2, y2] |
| callback | <code>function</code> |  |

<a name="SpatialMap+getAverageSize"></a>

### spatialMap.getAverageSize() ⇒ <code>number</code>
helper function to evaluate proper cell size

**Kind**: instance method of <code>[SpatialMap](#SpatialMap)</code>  
**Returns**: <code>number</code> - the average number of entries in each bucket  
<a name="SpatialMap+getLargest"></a>

### spatialMap.getLargest() ⇒ <code>number</code>
helper function to evaluate proper cell size

**Kind**: instance method of <code>[SpatialMap](#SpatialMap)</code>  
**Returns**: <code>number</code> - the largest sized bucket  
<a name="SpatialMap+getBuckets"></a>

### spatialMap.getBuckets() ⇒ <code>Array.&lt;object&gt;</code>
helper function to evaluate SpatialMap

**Kind**: instance method of <code>[SpatialMap](#SpatialMap)</code>  
**Returns**: <code>Array.&lt;object&gt;</code> - an array of buckets in the form of {x, y, width, height}  
* * *

Copyright (c) 2016 YOPEY YOPEY LLC - MIT License - Documented by [jsdoc-to-markdown](https://github.com/75lb/jsdoc-to-markdown)