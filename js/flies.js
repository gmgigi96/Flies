var sizeFly = 40
var delayTime = 750;               // time between 2 characters drawn by flies
var updateTime = 300;               // time to draw a character

var width = window.innerWidth
var height = window.innerHeight



var rand = d3.randomUniform(-2, 2)
var randPosX = d3.randomUniform(0, width)
var randPosY = d3.randomUniform(0, height)
var flightDuration = d3.randomInt(1000, 2000)
var flyWaitTime = d3.randomInt(0, 5000)
var randFly = d3.randomInt(0, 10)
var randRotation = d3.randomUniform(-1, 1)

var fliesPosition = Array(10).fill(null).map((_) => ({ 'x': Math.random() * width, 'y': Math.random() * height }));
var fliesStates = Array(10).fill("idle")

var help = false;           // true flyes ask help
var keyPressed = false      // true when 'x' is pressed


function shakeFly(flyN) {
    if (fliesStates[flyN] == "idle") {
        var f = fliesPosition[flyN];
        f.x += rand();
        f.y += rand();
        svg.select('[id="' + flyN + '"]')
            .attr("x", f.x)
            .attr("y", f.y)
    }
}

function moveFly(flyN) {

    if (!help) {

        var f = fliesPosition[flyN];
        f.x = randPosX();
        f.y = randPosY();
        fliesStates[flyN] = "moving"

        var fly = svg.select('[id="' + flyN + '"]')
            .transition()
            .duration(flightDuration())
            .attr("x", f.x)
            .attr("y", f.y)
            .ease(d3.easeLinear)
            .on('end', function () {
                fliesStates[flyN] = 'idle'
            })

    }

}

function drawChar(c) {
    console.log("Configurazione: " + c)

    fliesPosition = JSON.parse(JSON.stringify(data.get(c))) // deep copy
    fliesStates.fill('help')

    flies.data(fliesPosition)
        .transition()
        .duration(updateTime)
        .attr("x", (d) => d.x)
        .attr("y", (d) => d.y)
        .ease(d3.easeLinear)
        .on("end", function () {
            fliesStates.fill('idle')
        });
}

function askHelp() {
    const s = 'AIUTO';
    var i = 0;

    const interval = setInterval(function h() {
        if (i < s.length) {
            drawChar(s[i])
            i++
        } else {
            help = false;
            clearInterval(interval)
        }
        return h
    }(), delayTime);

}

var svg = d3.select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("style", "background-color:lightskyblue");

d3.select("body")
    .on('keydown', function () {
        if (d3.event.keyCode == 88) {
            // key 'x' pressed
            keyPressed = true
        }
    })
    .on('keyup', function () {
        if (d3.event.keyCode == 88) {
            // key 'x' released
            keyPressed = false
        }
    });

d3.json("data/dataset.json")
    .then(function (d) {

        data = d3.map(d)            // global variable data contains flies configurations
        data.each((d) => d.forEach((v, i, a) => (a[i] = { x: v.x * width, y: v.y * height })));

        flies = svg.selectAll("image")      // create flies
            .data(fliesPosition)
            .enter()
            .append("image")
            .attr("x", (d) => d.x)
            .attr("y", (d) => d.y)
            .attr("height", sizeFly)
            .attr("width", sizeFly)
            .attr("href", "data/fly.svg")
            .attr("id", (_, i) => i)
            .on('mousedown', function () {
                if (keyPressed && !help) {
                    help = true
                    askHelp()
                }
            });

        fliesPosition.forEach(function (_, i) {
            setInterval(() => { if (!help) moveFly(i) }, flyWaitTime());
        })

        setInterval(function () {
            fliesPosition.forEach((_, i) => shakeFly(i))
        }, 20);

    })
    .catch(function (error) {
        // error
    })