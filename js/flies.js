var sizeFly = 25
var delayTime = 1000;
var updateTime = 500;

var width = 800
var height = 600



var rand = d3.randomUniform(-2, 2)
var randPosX = d3.randomUniform(0, width)
var randPosY = d3.randomUniform(0, height)
var flightDuration = d3.randomInt(500, 1000)
var flyWaitTime = d3.randomInt(0, 5000)
var randFly = d3.randomInt(0, 10)

var fliesPosition = Array(10).fill(null).map((_) => ({ 'x': Math.random() * width, 'y': Math.random() * height }));
var fliesStates = Array(10).fill("idle")

var help = false;

d3.json("data/dataset.json")
    .then((d) => data = d)
    .catch(function (error) {
        // error
    })

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

    fliesPosition = JSON.parse(JSON.stringify(data[c])) // deep copy
    fliesStates.fill('help')

    flies.data(fliesPosition)
        .transition()
        .duration(updateTime)
        .attr("x", (d) => d.x)
        .attr("y", (d) => d.y)
        .ease(d3.easeLinear)
        .on("end", function () {
            fliesStates.fill('idle')
        })
}

function askHelp() {
    const s = 'AIUTO';
    var i = 0;

    const interval = setInterval(function () {
        if (i < s.length) {
            drawChar(s[i])
            i++
        } else {
            help = false;
            clearInterval(interval)
        }
    }, delayTime);

}

var svg = d3.select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("style", "background-color:lightskyblue");

var flies = svg.selectAll("image")         // change with real fly
    .data(fliesPosition)
    .enter()
    .append("image")
    .attr("x", (d) => d.x)
    .attr("y", (d) => d.y)
    .attr("height", sizeFly)
    .attr("width", sizeFly)
    .attr("href", "data/fly.png")
    .attr("id", (_, i) => i)
    .on('mousedown', function () {
        if (keyPressed && !help) {
            help = true
            askHelp()
        }
    });


fliesPosition.forEach(function (_, i) {
    setInterval(() => {if (!help) moveFly(i)}, flyWaitTime());
})

setInterval(function () {
    fliesPosition.forEach((_, i) => shakeFly(i) )
}, 20);


var keyPressed = false

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