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
 * // each object must have an AABB bounding box {top-left x, top-left y, width, height}
 * circle.AABB = {5, 5, 10, 10};
 * map.insert(circle);
 *
 * // returns the circle
 * var results = map.query({x: 0, y: 0, width: 10, height: 10});
 *
 * // or iterate over the results to avoid creating new arrays
 * map.query({x: 0, y: 0, width: 10, height: 10},
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
        this.width = width;
        this.height = height;
        this.count = width * height;
        this.grid = [];
        for (var i = 0; i < this.count; i++)
        {
            this.grid[i] = [];
        }
    }

    /**
     * inserts an object into the map (also removes object from last insertion)
     * side effect: adds object.spatial to track last insertion
     * @param {object} object
     * @param {object} object.AABB bounding box
     * @param {number} object.AABB.x
     * @param {number} object.AABB.y
     * @param {number} object.AABB.width
     * @param {number} object.AABB.height
     */
    insert(object)
    {
        if (!object.spatial)
        {
            object.spatial = {maps: []};
        }

        var AABB = object.AABB;
        var xStart = Math.floor(AABB.x / this.cellSize);
        xStart = xStart < 0 ? 0 : xStart;
        var yStart = Math.floor(AABB.y / this.cellSize);
        yStart = yStart < 0 ? 0 : yStart;
        var xEnd = Math.ceil((AABB.x + AABB.width) / this.cellSize);
        xEnd = xEnd >= this.width ? this.width - 1 : xEnd;
        var yEnd = Math.ceil((AABB.y + AABB.height) / this.cellSize);
        yEnd = yEnd >= this.height ? this.height - 1 : yEnd;

        // only remove and insert if mapping has changed
        if (object.spatial.xStart !== xStart || object.spatial.yStart !== yStart || object.spatial.xEnd !== xEnd || object.spatial.yEnd !== yEnd)
        {
            if (object.spatial.maps.length)
            {
                this.remove(object);
            }
            for (var y = yStart; y < yEnd; y++)
            {
                for (var x = xStart; x < xEnd; x++)
                {
                    var list = this.grid[y * this.width + x];
                    var length = list.push(object);
                    object.spatial.maps.push({list: list, index: length - 1});
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
        while (object.spatial.maps.length)
        {
            var entry = object.spatial.maps.pop();
            entry.list.splice(entry.index, 1);
        }
    }

    /**
     * returns an array of objects contained within bounding box
     * @param {object} AABB bounding box to search
     * @param {number} object.AABB.x
     * @param {number} object.AABB.y
     * @param {number} object.AABB.width
     * @param {number} object.AABB.height
     * @return {object[]} search results
     */
    query(AABB)
    {
        var results = [];
        var xStart = Math.floor(AABB.x / this.cellSize);
        xStart = xStart < 0 ? 0 : xStart;
        var yStart = Math.floor(AABB.y / this.cellSize);
        yStart = yStart < 0 ? 0 : yStart;
        var xEnd = Math.ceil((AABB.x + AABB.width) / this.cellSize);
        xEnd = xEnd >= this.width ? this.width - 1 : xEnd;
        var yEnd = Math.ceil((AABB.y + AABB.height) / this.cellSize);
        yEnd = yEnd >= this.height ? this.height - 1 : yEnd;
        for (var y = yStart; y < yEnd; y++)
        {
            for (var x = xStart; x < xEnd; x++)
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
     * @param {object} AABB bounding box to search
     * @param {number} object.AABB.x
     * @param {number} object.AABB.y
     * @param {number} object.AABB.width
     * @param {number} object.AABB.height
     * @param {function} callback
     * @return {boolean} true if callback returned early
     */
    queryCallback(AABB, callback)
    {
        var xStart = Math.floor(AABB.x / this.cellSize);
        xStart = xStart < 0 ? 0 : xStart;
        var yStart = Math.floor(AABB.y / this.cellSize);
        yStart = yStart < 0 ? 0 : yStart;
        var xEnd = Math.ceil((AABB.x + AABB.width) / this.cellSize);
        xEnd = xEnd >= this.width ? this.width - 1 : xEnd;
        var yEnd = Math.ceil((AABB.y + AABB.height) / this.cellSize);
        yEnd = yEnd >= this.height ? this.height - 1 : yEnd;
        for (var y = yStart; y < yEnd; y++)
        {
            for (var x = xStart; x < xEnd; x++)
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
        for (var i = 0; i < this.size; i++)
        {
            total += this.grid[i].length;
        }
        return total / this.size;
    }

    /**
     * helper function to evaluate proper cell size
     * @return {number} the largest sized bucket
     */
    getLargest()
    {
        var largest = 0, object;
        for (var i = 0; i < this.size; i++)
        {
            if (this.grid[i].length > largest)
            {
                largest = this.grid[i].length;
            }
        }
        return largest;
    }
}

module.exports = SpatialMap;