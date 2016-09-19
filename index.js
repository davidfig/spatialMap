const PIXI = require('pixi.js');
const Debug = require('yy-debug');
const Update = require('yy-update');
const Animate = require('yy-animate');
const Renderer = require('yy-renderer');
const Intersects = require('yy-intersects');
const SpatialMap = require('yy-spatialmap');

// debug and update components
Debug.init();
Update.init({debug: Debug, FPS: true, percents: true});
Animate.init({debug: Debug, update: Update});
Update.update();

// creates the renderer with one option
var renderer = new Renderer({autoresize: true, debug: Debug, update: Update, styles: {pointerEvents: 'none'}});
var g = renderer.add(new PIXI.Graphics());

// creates the spatial map
var size = 200;
var map = new SpatialMap(size / 10, size, size);

// create colors for the buckets
var colors = [];
for (var i = 0; i < size * size; i++)
{
    colors[i] = Math.random() * 0xffffff;
}

// store visible bucket counts in map
var counts = [];

// draw original map, scale, and center
drawMap(true);
renderer.stage.scale.set(Math.min(window.innerWidth, window.innerHeight) * 0.85 / size);
renderer.stage.position.set(window.innerWidth / 2 - renderer.stage.width / 2, window.innerHeight / 2 - renderer.stage.height / 2);

// create circles to put into the map
var circles = [];
for (var i = 0; i < 5; i++)
{
    var x = Math.random() * size;
    var y = Math.random() * size;
    var r = Math.random() * size * 0.1;
    var color = Math.random() * 0xffffff;

    // create a circle
    var circle = new PIXI.Circle(x, y, r);
    circle.color = circle.original = color;
    // circle.AABB = [x - r, y - r, x + r, y + r];

    // hack so Intersects works properly
    circle.width = circle.height = r * 2;

    circle.shape = new Intersects.Circle(circle);

    circles.push(circle);

    // insert circle into the map
    map.insert(circle.shape);
}
drawCircles();

// start the circles moving
animate();

Update.add(
    function()
    {
        g.clear();
        drawMap();
        collisions();
        drawCircles();
        renderer.dirty = true;
    });

function drawMap(first)
{
    // call a helper function for testing purposes (usually use query functions)
    var buckets = map.getBuckets();
    for (var i = 0; i < buckets.length; i++)
    {
        var bucket = buckets[i];
        if (bucket.bucket.length)
        {
            g.beginFill(0xff0000);
        }
        else
        {
            g.beginFill(colors[i], 0.2);
        }
        g.drawRect(bucket.AABB[0], bucket.AABB[1], bucket.AABB[2] - bucket.AABB[0], bucket.AABB[3] - bucket.AABB[1]);
        g.endFill();
        if (first)
        {
            var count = renderer.add(new PIXI.Text('0', {fontSize: 10, fill: 'white'}));
            count.anchor.set(0.5);
            count.x = bucket.AABB[0] + (bucket.AABB[2] - bucket.AABB[0]) / 2;
            count.y = bucket.AABB[1] + (bucket.AABB[3] - bucket.AABB[1]) / 2;
            counts.push(count);
        }
        else
        {
            counts[i].text = bucket.bucket.length;
        }
    }
}

function drawCircles()
{
    for (var i = 0; i < circles.length; i++)
    {
        var circle = circles[i];
        g.beginFill(circle.color, 0.75);
        g.drawShape(circle);
        g.endFill();
        circle.shape.update();
    }
}

function next(circle)
{
    function each(elapsed, object)
    {
        map.insert(object.shape);
    }

    var target = new PIXI.Point(Math.random() * size, Math.random() * size);
    new Animate.target(circle, target, 0.05, {onEach: each, onDone: next});
}

function animate()
{
    for (var i = 0; i < circles.length; i++)
    {
        next(circles[i]);
    }
}

// find collisions using the map
function collisions()
{
    // reset all circles to original colors
    for (var i = 0; i < circles.length; i++)
    {
        circles[i].color = circles[i].original;
    }

    // query the map for each circle and set intersections
    var count = 0;
    for (var i = 0; i < circles.length; i++)
    {
        var circle = circles[i];
        map.queryCallback(circle.shape.AABB,
            function(shape)
            {
                // possible intersection
                if (shape.article !== circle)
                {
                    // check intersection
                    if (circle.shape.collidesCircle(shape))
                    {
                        shape.article.color = 0xffffff;
                        circle.color = 0xffffff;
                    }
                    count++;
                }
            });
    }

    function factorial(num)
    {
        let value = 1;
        for (let i = 2; i <= num; i++)
        {
            value *= i;
        }
        return value;
    }

    function combination(n, r)
    {
        return factorial(n) / (factorial(r) * (factorial(n - r)));
    }
    Debug.one('Checking ' + count + ' intersections instead of ' + combination(circles.length, 2) + ' intersections.');
}

// for eslint
/* global window */