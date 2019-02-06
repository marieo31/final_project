
// Variables
var selector_transform = d3.select("#selTransform");
var selector_nbpix = d3.select("#selNBpix")

// Layout variables
var margin = {top: 50, right: 100, bottom: 100, left: 100},
    width = 400,
    height = 400;

function transformChanged(newTransfrom) {
  }

function nbpixChanged(newNBpix){
}

function randomImage(){
    let url = "/random_image/"+selector_nbpix.property("value")
    d3.json(url).then(function(response){
        console.log(response)
    })
}

var svg = d3.select("#svg-random-img").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .style("margin-left", -margin.left + "px")
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

svg.append("rect")
    .attr("class", "background")
    .attr("width", width)
    .attr("height", height);


console.log(selector_nbpix.property("value"))    
// var numrows = +selector_nbpix.property("value");
// var numcols = +selector_nbpix.property("value");
var numrows = 4;
var numcols = 4;

// console.log(d3.range(selector_nbpix.property("value")))


var matrix = new Array(numrows);
for (var i = 0; i < numrows; i++) {
  matrix[i] = new Array(numcols);
  for (var j = 0; j < numcols; j++) {
    matrix[i][j] = Math.random()*2 - 1;
  }
}

// console.log(matrix)

var x = d3.scale.ordinal()
    .domain(d3.range(numcols))
    .rangeBands([0, width]);

var y = d3.scale.ordinal()
    .domain(d3.range(numrows))
    .rangeBands([0, height]);

console.log(x)    

// var rowLabels = new Array(numrows);
// for (var i = 0; i < numrows; i++) {
//   rowLabels[i] = "Row "+(i+1);
// }

var columnLabels = new Array(numrows);
// for (var i = 0; i < numcols; i++) {
//   columnLabels[i] = "Column "+(i+1);
// }

var colorMap = d3.scale.linear()
    .domain([-1, 0, 1])
    .range(["black", "white"]);    
    //.range(["red", "black", "green"]);
    //.range(["brown", "#ddd", "darkgreen"]);

var row = svg.selectAll(".row")
    .data(matrix)
  .enter().append("g")
    .attr("class", "row")
    .attr("transform", function(d, i) { return "translate(0," + y(i) + ")"; });

row.selectAll(".cell")
    .data(function(d) { return d; })
  .enter().append("rect")
    .attr("class", "cell")
    .attr("x", function(d, i) { return x(i); })
    .attr("width", x.rangeBand())
    .attr("height", y.rangeBand())
    .style("stroke-width", 0);

row.append("line")
    .attr("x2", width);

row.append("text")
    .attr("x", 0)
    .attr("y", y.rangeBand() / 2)
    .attr("dy", ".32em")
    .attr("text-anchor", "end")
    .text(function(d, i) { return i; });

var column = svg.selectAll(".column")
    .data(columnLabels)
  .enter().append("g")
    .attr("class", "column")
    .attr("transform", function(d, i) { return "translate(" + x(i) + ")rotate(-90)"; });

column.append("line")
    .attr("x1", -width);

column.append("text")
    .attr("x", 6)
    .attr("y", y.rangeBand() / 2)
    .attr("dy", ".32em")
    .attr("text-anchor", "start")
    .text(function(d, i) { return d; });

row.selectAll(".cell")
    .data(function(d, i) { return matrix[i]; })
    .style("fill", colorMap);





function init(){
    
    // Fill the drop down menu for choosing a transformation    
    d3.json("/transform_types").then((transforms) => {
        // console.log(transforms)
        transforms.forEach((transform) => {
            selector_transform
            .append("option")
            .text(transform)
            .property("value", transform);
        });
      });

    // Fill the drop down menu for choosing the nb of pixels    
    d3.json("/nbpixels").then((nbpixels) => {  
        // console.log(nbpixels)
        nbpixels.forEach((nbp) => {
            // console.log(nbp+" X "+nbp)
            selector_nbpix
            .append("option")
            .text(nbp+" X "+nbp)
            .property("value", nbp);
        });
      });    
}







// Initialize the dashboard
init();



