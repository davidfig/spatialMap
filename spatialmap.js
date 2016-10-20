/**
 * @file spatialmap.js
 * @author David Figatner
 * @license MIT
 * Copyright (c) 2016 YOPEY YOPEY LLC
 */

// ID to avoid sending duplicates during query
let checked = Math.floor(Math.random() * 1000000);

/**
 * @description
 * 2D spatial map
 * @example
 * var map = new SpatialMap();
 *
 * // use your own 2D graphics libraries--I like PIXI.js
 * var circle = new Circle(10, 10, 5);
 *
 * // each object must have an AABB bounding box [x1, y1, x2, y2],
 * // see yy-intersects (github:davidfig/intersects) for a library that provides this with various shapes
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
     * @param {number} width of world
     * @param {number} height of world
     * @param {object} options
     * @param {boolean} options.update - keep a second list of elements to enable update
     */
    constructor(cellSize, width, height, options)
    {
        options = options || {};
        this.cellSize = cellSize;
        this.width = Math.ceil(width / cellSize);
        this.height = Math.ceil(height / cellSize);
        this.count = this.width * this.height;
        this.grid = [];
        this.list = options.update ? [] : null;
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
            if (this.list)
            {
                this.list.push(object);
            }
        }

        const AABB = object.AABB;
        let xStart = Math.floor(AABB[0] / this.cellSize);
        xStart = xStart < 0 ? 0 : xStart;
        let yStart = Math.floor(AABB[1] / this.cellSize);
        yStart = yStart < 0 ? 0 : yStart;
        let xEnd = Math.floor((AABB[2] - 1) / this.cellSize);
        xEnd = xEnd >= this.width ? this.width - 1 : xEnd;
        let yEnd = Math.floor((AABB[3] - 1) / this.cellSize);
        yEnd = yEnd >= this.height ? this.height - 1 : yEnd;

        // only remove and insert if mapping has changed
        if (object.spatial.xStart !== xStart || object.spatial.yStart !== yStart || object.spatial.xEnd !== xEnd || object.spatial.yEnd !== yEnd)
        {
            if (object.spatial.maps.length)
            {
                this.remove(object, true);
            }
            for (let y = yStart; y <= yEnd; y++)
            {
                for (let x = xStart; x <= xEnd; x++)
                {
                    const list = this.grid[y * this.width + x];
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
    remove(object, replace)
    {
        const spatial = object.spatial;
        if (spatial)
        {
            const maps = spatial.maps;
            while (maps.length)
            {
                const list = maps.pop();
                const index = list.indexOf(object);
                if (index !== -1)
                {
                    list.splice(index, 1);
                }
            }
        }
        const list = this.list;
        if (list && !replace)
        {
            list.splice(list.indexOf(object));
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
        const results = [];
        let xStart = Math.floor(AABB[0] / this.cellSize);
        xStart = xStart < 0 ? 0 : xStart;
        let yStart = Math.floor(AABB[1] / this.cellSize);
        yStart = yStart < 0 ? 0 : yStart;
        let xEnd = Math.floor((AABB[2] - 1) / this.cellSize);
        xEnd = xEnd >= this.width ? this.width - 1 : xEnd;
        let yEnd = Math.floor((AABB[3] - 1) / this.cellSize);
        yEnd = yEnd >= this.height ? this.height - 1 : yEnd;
        for (let y = yStart; y <= yEnd; y++)
        {
            for (let x = xStart; x <= xEnd; x++)
            {
                const list = this.grid[y * this.width + x];
                if (list.length)
                {
                    results = results.concat(list);
                }
            }
        }
        return results;
    }

    /**
     * iterates through objects in the same buckets as article
     * stops iterating if the callback returns true
     * @param {number[]} AABB bounding box to search [x1, y1, x2, y2]
     * @param {function} callback
     * @return {boolean} true if callback returned early
     */
    queryCallbackArticle(article, callback)
    {
        checked++;
        article.checked = checked;
        const maps = article.spatial.maps;
        const count = maps.length;
        article.checked = checked;
        for (let i = 0; i < count; i++)
        {
            const map = maps[i];
            const mapCount = map.length;
            for (let j = 0; j < mapCount; j++)
            {
                const check = map[j];
                if (check.checked !== checked)
                {
                    if (callback(check))
                    {
                        return true;
                    }
                    check.checked = checked;
                }
            }
        }
        return false;
    }

    /**
     * iterates through objects contained within bounding box
     * stops iterating if the callback returns true
     * @param {number[]} AABB bounding box to search [x1, y1, x2, y2]
     * @param {function} callback
     * @return {boolean} true if callback returned early
     */
    queryCallback(AABB, callback)
    {
        let xStart = Math.floor(AABB[0] / this.cellSize);
        xStart = xStart < 0 ? 0 : xStart;
        let yStart = Math.floor(AABB[1] / this.cellSize);
        yStart = yStart < 0 ? 0 : yStart;
        let xEnd = Math.floor((AABB[2] - 1) / this.cellSize);
        xEnd = xEnd >= this.width ? this.width - 1 : xEnd;
        let yEnd = Math.floor((AABB[3] - 1) / this.cellSize);
        yEnd = yEnd >= this.height ? this.height - 1 : yEnd;
        checked++;
        for (let y = yStart; y <= yEnd; y++)
        {
            for (let x = xStart; x <= xEnd; x++)
            {
                const list = this.grid[y * this.width + x];
                const count = list.length;
                for (let i = 0; i < count; i++)
                {
                    const article = list[i];
                    if (article.checked !== checked)
                    {
                        if (callback(list[i]))
                        {
                            return true;
                        }
                        article.checked = checked;
                    }
                }
            }
        }
        return false;
    }

    update()
    {
        var list = this.list;
        if (list)
        {
            var length = list.length;
            for (var i = 0; i < length; i++)
            {
                this.insert(list[i]);
            }
        }
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
     * @return {object[]} an array of buckets in the form of [x1, y1, x2, y2]
     */
    getBuckets()
    {
        var buckets = [];
        for (var y = 0; y < this.height; y++)
        {
            for (var x = 0; x < this.width; x++)
            {
                let xx = x * this.cellSize;
                let yy = y * this.cellSize;
                buckets.push({AABB: [xx, yy, xx + this.cellSize, yy + this.cellSize], bucket: this.grid[x + y * this.width]});
            }
        }
        return buckets;
    }
}

module.exports = SpatialMap;