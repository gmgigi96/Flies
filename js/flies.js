const sizeFly = 40
const targetSize = 60

const turnDuration = 200              // time to turn a fly to a target position

const delayTime = 800;               // time between 2 characters drawn by flies
const updateTime = 600;               // time to draw a character (including turnDuration * 2)

const width = window.innerWidth
const height = window.innerHeight



var rand = d3.randomUniform(-2, 2)
var randPosX = d3.randomUniform(0, width)
var randPosY = d3.randomUniform(0, height)
var flightDuration = 1400
var flyWaitTime = d3.randomInt(flightDuration + 500, 5000)

// var fliesPosition = Array(10).fill(null).map((_) => ({ 'x': Math.random() * width, 'y': Math.random() * height }));

var fliesStates = Array(10).fill("idle")
var fliesAngles = Array(10).fill(0)

var help = false;           // true flyes ask help
var keyPressed = false      // true when 'x' is pressed


function shakeFly(flyN) {
    if (fliesStates[flyN] == "idle") {
        var f = svg.select('[id="' + flyN + '"]').select("svg")
        var posX = parseFloat(f.attr("x"))
        var posY = parseFloat(f.attr("y"))

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
    return theta;
}

deep_copy = d => JSON.parse(JSON.stringify(d))

function moveFly(flyN, pos, time, considerHelp = true) {

    var f = fliesPosition[flyN];
    f.x = pos.x
    f.y = pos.y
    fliesStates[flyN] = "moving";

    var fly = svg.select('[id="' + flyN + '"]');
    var body = fly.select("svg")            // fly body
    var oldX = parseFloat(body.attr("x"))
    var oldY = parseFloat(body.attr("y"))

    var a = angle(oldX, oldY, f.x, f.y) + 90;

    fly.transition()
        .delay(100)
        .duration(turnDuration)
        .attrTween("transform", () => d3.interpolateString(
            `rotate(${fliesAngles[flyN]}, ${oldX + 20}, ${oldY + 20})`,
            `rotate(${a}, ${oldX + 20}, ${oldY + 20})`
        ))
        .ease(d3.easeLinear)
        .on("end", function () {

            fliesAngles[flyN] = a

            if (!considerHelp || considerHelp && !help) {

                fly.transition()
                    .duration(time - 2 * turnDuration)
                    .ease(d3.easeLinear)
                    .attrTween("transform", () => d3.interpolateString(
                        `rotate(${a}, ${oldX + 20}, ${oldY + 20})`,
                        `rotate(${a}, ${f.x + 20}, ${f.y + 20})`
                    ))
                    .select("svg")      // fly body 
                    .attr("x", f.x)
                    .attr("y", f.y)
                    .ease(d3.easeLinear)
                    .on("end", function () {

                        //fly.attr("transform", null)
                        fliesStates[flyN] = "idle";

                        if (!help) {

                            var newX = parseFloat(body.attr("x"))
                            var newY = parseFloat(body.attr("y"))

                            fly.transition()
                                .delay(100)
                                .duration(turnDuration)
                                .attrTween("transform", () => d3.interpolateString(
                                    `rotate(${a}, ${newX + 20}, ${newY + 20})`,
                                    `rotate(0, ${newX + 20}, ${newY + 20})`
                                ))
                                .ease(d3.easeLinear)
                                .on("end", function () {

                                })
                        }

                    })

            }

        })

}

function randomWalk(flyN) {
    var randPos = { x: randPosX(), y: randPosY() }
    moveFly(flyN, randPos, flightDuration)
}

function drawChar(c) {
    console.log("Configurazione: " + c)

    nextPos = deep_copy(data.get(c))
    fliesStates.fill('help')

    for (let i = 0; i < 10; i++) {
        moveFly(i, nextPos[i], updateTime, false)
    }

}

function askHelp() {
    const s = 'AIUTO';
    var i = 0;

    const interval = setInterval(function h() {
        if (i < s.length) {
            drawChar(s[i])
        } else if (i == s.length) {
            drawChar('initial')
        } else {
            help = false;
            clearInterval(interval)
        }
        i++
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
        if (d3.event.keyCode == 88 && !keyPressed) {
            // key 'x' pressed
            target.attr("fill", "red")
            keyPressed = true
        }
    })
    .on('keyup', function () {
        if (d3.event.keyCode == 88 && keyPressed) {
            // key 'x' released
            target.attr("fill", "black")
            keyPressed = false
        }
    });

d3.json("data/dataset.json")
    .then(function (d) {

        data = d3.map(d)            // global variable data which contains flies configurations
        data.each((d) => d.forEach((v, i, a) => (a[i] = { x: v.x * width, y: v.y * height })));

        //fliesPosition = data.get("initial")
        fliesPosition = deep_copy(data.get("initial")) // deep copy

        flies = d3.select("svg")
            .selectAll("g")
            .data(fliesPosition)
            .enter()
            .append("g")
            .attr("class", "fly")
            .attr("id", (_, i) => i)
            .append("svg")
            .attr("x", (d) => d.x)
            .attr("y", (d) => d.y)
            .attr("width", sizeFly)
            .attr("height", sizeFly)
            //.attr("transform", `translate(${-sizeFly}, ${-sizeFly})`)
            .on('mousedown', function () {
                if (keyPressed && !help) {
                    help = true
                    askHelp()
                }
            });

        d3.xml("data/fly.svg")
            .then(data => {
                d3.selectAll(".fly").select("svg").nodes().forEach(n => {
                    n.append(data.documentElement.cloneNode(true))
                })
            });

        fliesPosition.forEach(function (_, i) {
            setInterval(() => { if (!help) randomWalk(i) }, flyWaitTime());
        })

        setInterval(function () {
            fliesPosition.forEach((_, i) => shakeFly(i))
        }, 20);

        d3.xml("data/target.svg")
            .then(data => {
                svg.append("svg")
                    .attr("class", "target")
                    .attr("width", targetSize)
                    .attr("height", targetSize)
                    .node()
                    .append(data.documentElement)
                target = d3.select(".target")   // set global variable target
            });

        svg.on('mousemove', function () {
            var mouse = d3.mouse(this)
            var x = mouse[0]
            var y = mouse[1]
            // console.log(x + " " + y)

            target.attr("x", x - targetSize / 2)
                .attr("y", y - targetSize / 2)
        });

    })
    .catch(function (error) {
        // error
    })