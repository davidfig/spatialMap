/**
 * Copyright (c) 2016 YOPEY YOPEY LLC
 * @author David Figatner
 * @license MIT
*/

/**
 * 2D Spatial Map
 * example:
 *
 * var map = new SpatialMap();
 *
 * // use your own 2D graphics libraries--I like PIXI.js
 * var circle = new Circle(10, 10, 5);
 *
 * // each object must have an AABB bounding box [x1, y1, x2, y2]
 * circle.AABB = [5, 5, 10, 10];
 * map.insert(circle);
 *
 * // returns the circle
 * var results = map.query([0, 0, 10, 10]);
 *
 * // or iterate over the results to avoid creating new arrays
 * map.query([0, 0, 10, 10],
 *  function(object)
 *  {
 *      object.draw();
 *  }
 * );
 */
class SpatialMap
{
    /**
     * @param {number} cellSize used to create map
     */
    constructor(cellSize, width, height)
    {
        this.cellSize = cellSize;
        this.width = Math.ceil(width / cellSize);
        this.height = Math.ceil(height / cellSize);
        this.count = this.width * this.height;
        this.grid = [];
        for (let i = 0; i < this.count; i++)
        {
            this.grid[i] = [];
        }
    }

    /**
     * inserts an object into the map (also removes object from last insertion)
     * side effect: adds object.spatial to track last insertion
     * @param {object} object
     * @param {number[]} AABB bounding box [x1, y1, x2, y2]
     */
    insert(object)
    {
        if (!object.spatial)
        {
            object.spatial = {maps: []};
        }

        var AABB = object.AABB;
        var xStart = Math.floor(AABB[0] / this.cellSize);
        xStart = xStart < 0 ? 0 : xStart;
        var yStart = Math.floor(AABB[1] / this.cellSize);
        yStart = yStart < 0 ? 0 : yStart;
        var xEnd = Math.floor((AABB[2] - 1) / this.cellSize);
        xEnd = xEnd >= this.width ? this.width - 1 : xEnd;
        var yEnd = Math.floor((AABB[3] - 1) / this.cellSize);
        yEnd = yEnd >= this.height ? this.height - 1 : yEnd;

        // only remove and insert if mapping has changed
        if (object.spatial.xStart !== xStart || object.spatial.yStart !== yStart || object.spatial.xEnd !== xEnd || object.spatial.yEnd !== yEnd)
        {
            if (object.spatial.maps.length)
            {
                this.remove(object);
            }
            for (var y = yStart; y <= yEnd; y++)
            {
                for (var x = xStart; x <= xEnd; x++)
                {
                    var list = this.grid[y * this.width + x];
                    list.push(object);
                    object.spatial.maps.push(list);
                }
            }
            object.spatial.xStart = xStart;
            object.spatial.yStart = yStart;
            object.spatial.xEnd = xEnd;
            object.spatial.yEnd = yEnd;
        }
    }

    /**
     * removes existing object from the map
     * @param {object} object
     */
    remove(object)
    {
        if (object.spatial)
        {
            while (object.spatial.maps.length)
            {
                var list = object.spatial.maps.pop();
                var index = list.indexOf(object);
                list.splice(index, 1);
            }
        }
    }

    /**
     * returns an array of objects contained within bounding box
     * NOTE: this may include duplicates
     * @param {number[]} AABB bounding box to search [x1, y1, x2, y2]
     * @return {object[]} search results
     */
    query(AABB)
    {
        var results = [];
        var xStart = Math.floor(AABB[0] / this.cellSize);
        xStart = xStart < 0 ? 0 : xStart;
        var yStart = Math.floor(AABB[1] / this.cellSize);
        yStart = yStart < 0 ? 0 : yStart;
        var xEnd = Math.floor((AABB[2] - 1) / this.cellSize);
        xEnd = xEnd >= this.width ? this.width - 1 : xEnd;
        var yEnd = Math.floor((AABB[3] - 1) / this.cellSize);
        yEnd = yEnd >= this.height ? this.height - 1 : yEnd;
        for (var y = yStart; y <= yEnd; y++)
        {
            for (var x = xStart; x <= xEnd; x++)
            {
                var list = this.grid[y * this.width + x];
                if (list.length)
                {
                    results = results.concat(list);
                }
            }
        }
        return results;
    }

    /**
     * iterates through objects contained within bounding box
     * stops iterating if the callback returns true
     * NOTE: this may return duplicates
     * @param {number[]} AABB bounding box to search [x1, y1, x2, y2]
     * @param {function} callback
     * @return {boolean} true if callback returned early
     */
    queryCallback(AABB, callback)
    {
        var xStart = Math.floor(AABB[0] / this.cellSize);
        xStart = xStart < 0 ? 0 : xStart;
        var yStart = Math.floor(AABB[1] / this.cellSize);
        yStart = yStart < 0 ? 0 : yStart;
        var xEnd = Math.floor((AABB[2] - 1) / this.cellSize);
        xEnd = xEnd >= this.width ? this.width - 1 : xEnd;
        var yEnd = Math.floor((AABB[3] - 1) / this.cellSize);
        yEnd = yEnd >= this.height ? this.height - 1 : yEnd;
        for (var y = yStart; y <= yEnd; y++)
        {
            for (var x = xStart; x <= xEnd; x++)
            {
                var list = this.grid[y * this.width + x];
                for (var i = 0; i < list.length; i++)
                {
                    if (callback(list[i]))
                    {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    /**
     * helper function to evaluate proper cell size
     * @return {number} the average number of entries in each bucket
     */
    getAverageSize()
    {
        var total = 0;
        for (var i = 0; i < this.count; i++)
        {
            total += this.grid[i].length;
        }
        return total / this.count;
    }

    /**
     * helper function to evaluate proper cell size
     * @return {number} the largest sized bucket
     */
    getLargest()
    {
        var largest = 0;
        for (var i = 0; i < this.count; i++)
        {
            if (this.grid[i].length > largest)
            {
                largest = this.grid[i].length;
            }
        }
        return largest;
    }

    /**
     * helper function to evaluate SpatialMap
     * @return {object[]} an array of buckets in the form of {x, y, width, height}
     */
    getBuckets()
    {
        var buckets = [], i = 0;
        for (var y = 0; y < this.height; y++)
        {
            for (var x = 0; x < this.width; x++)
            {
                buckets.push({x: x * this.cellSize, y: y * this.cellSize, width: this.cellSize, height: this.cellSize, bucket: this.grid[i++]});
            }
        }
        return buckets;
    }
}

// add support for AMD (Asynchronous Module Definition) libraries such as require.js.
if (typeof define === 'function' && define.amd)
{
    define(function()
    {
        return {
            SpatialMap: SpatialMap
        };
    });
}

// add support for CommonJS libraries such as browserify.
if (typeof exports !== 'undefined')
{
    module.exports = SpatialMap;
}

// define globally in case AMD is not available or available but not used
if (typeof window !== 'undefined')
{
    window.SpatialMap = SpatialMap;
}