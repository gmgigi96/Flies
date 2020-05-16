var sizeFly = 40
var delayTime = 750;               // time between 2 characters drawn by flies
var updateTime = 300;               // time to draw a character

var width = window.innerWidth
var height = window.innerHeight



var rand = d3.randomUniform(-1, 2)
var randPosX = d3.randomUniform(0, width)
var randPosY = d3.randomUniform(0, height)
var flightDuration = d3.randomInt(1000, 2000)
var flyWaitTime = d3.randomInt(500, 5000)
var randFly = d3.randomInt(0, 10)
var randRotation = d3.randomUniform(-1, 1)

var fliesPosition = Array(10).fill(null).map((_) => ({ 'x': Math.random() * width, 'y': Math.random() * height }));
var fliesStates = Array(10).fill("idle")

var help = false;           // true flyes ask help
var keyPressed = false      // true when 'x' is pressed


function shakeFly(flyN) {
    if (fliesStates[flyN] == "idle") {
        var f = svg.select('[id="' + flyN + '"]')
        var posX = parseInt(f.attr("x"))
        var posY = parseInt(f.attr("y"))

        posX += rand();
        posY += rand();

        f.attr("x", posX).attr("y", posY)
    }
}

function angle(cx, cy, ex, ey) {
    var dy = ey - cy;
    var dx = ex - cx;
    var theta = Math.atan2(dy, dx);
    theta *= 180 / Math.PI;
    if (theta < 0) theta = 360 + theta; // range [0, 360)
    return theta + 90;
}

function moveFly(flyN) {

    if (!help) {

        var f = fliesPosition[flyN];
        var oldX = f.x;
        var oldY = f.y;
        f.x = randPosX();
        f.y = randPosY();
        fliesStates[flyN] = "moving"

        var fly = svg.select('[id="' + flyN + '"]');

        var a = angle(oldX, oldY, f.x, f.y)

        fly.select("svg")
            .transition()
            .delay(100)
            .duration(200)
            .attr("transform", `rotate(${a}, ${sizeFly}, ${sizeFly}) translate(${sizeFly / 2}, ${sizeFly / 2})`)
            .ease(d3.easeLinear)
            .on("end", function () {

                if (!help) {

                    fly.transition()
                        .duration(flightDuration())
                        .attr("x", f.x)
                        .attr("y", f.y)
                        .ease(d3.easeLinear)
                        .on('end', function () {

                            if (!help) {

                                fly.select("svg")
                                    .transition()
                                    .delay(100)
                                    .duration(200)
                                    .attr("transform", `rotate(0, ${sizeFly}, ${sizeFly})
                                            translate(${sizeFly / 2}, ${sizeFly / 2})`)
                                    .ease(d3.easeLinear)
                                    .on("end", function () {
                                        fliesStates[flyN] = 'idle'
                                    })
                            }

                        })
                }

            })

    }

}

function drawChar(c) {
    console.log("Configurazione: " + c)



    nextPos = JSON.parse(JSON.stringify(data.get(c))) // deep copy
    fliesStates.fill('help')

    var flies = d3.selectAll(".fly")


    flies.select("svg")
        .transition()
        .delay(100)
        .duration(200)
        .attr("transform", (d, i) => `rotate(${angle(d.x, d.y, nextPos[i].x, nextPos[i].y)}, ${sizeFly}, ${sizeFly}) translate(${sizeFly / 2}, ${sizeFly / 2})`)
        .ease(d3.easeLinear)
        .on("end", function () {
            fliesPosition = nextPos

            flies.data(fliesPosition)
                .transition()
                .delay(100)
                .duration(updateTime)
                .attr("x", (d) => d.x)
                .attr("y", (d) => d.y)
                .ease(d3.easeLinear)
                .on("end", function () {

                    flies.select("svg")
                        .transition()
                        .delay(100)
                        .duration(200)
                        .attr("transform", `rotate(0, ${sizeFly}, ${sizeFly})
                                            translate(${sizeFly / 2}, ${sizeFly / 2})`)
                        .ease(d3.easeLinear)
                        .on("end", function () {
                            fliesStates.fill('idle')
                        })

                })

        })
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

        flies = d3.select("svg")
            .selectAll("svg")
            .data(fliesPosition)
            .enter()
            .append("svg")
            .attr("x", (d) => d.x)
            .attr("y", (d) => d.y)
            .attr("width", sizeFly * 2)
            .attr("height", sizeFly * 2)
            .attr("transform", `translate(${-sizeFly}, ${-sizeFly})`)
            .attr("class", "fly")
            .attr("id", (_, i) => i)
            .on('mousedown', function () {
                if (keyPressed && !help) {
                    help = true
                    askHelp()
                }
            });

        d3.xml("data/fly.svg")
            .then(data => {
                d3.selectAll(".fly").nodes().forEach(n => {
                    n.append(data.documentElement.cloneNode(true))
                })
                d3.selectAll(".fly")
                    .select("svg")
                    .attr("width", sizeFly)
                    .attr("height", sizeFly)
                    .attr("transform", `translate(${sizeFly / 2}, ${sizeFly / 2})`)
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