
// Variables
var selector_transform = d3.select("#selTransform");
var selector_nbpix = d3.select("#selNBpix")

// Layout variables
var margin = {top: 50, right: 100, bottom: 100, left: 100},
    width = 400,
    height = 400;


// Functions
function transformChanged(newTransfrom) {
  }

function nbpixChanged(newNBpix){
}

function randomImage(){

    plotRandomMatrix(selector_nbpix.property("value"))
}

function plotRandomMatrix(nbpix){
    // console.log(nbpix)

    // a little brutal... but it forces the update of the table
    d3.select("#svg-random-img").html("")

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
        
         
        var numrows = nbpix;
        var numcols = nbpix;        
        
        // create the random matrix
        let url = "/random_image/"+selector_nbpix.property("value")
        d3.json(url).then(function(response){
            // console.log(response)
            var matrix = new Array(numrows);
            var bb = 0
            for (var i = 0; i < numrows; i++) {
                matrix[i] = new Array(numcols);
                for (var j = 0; j < numcols; j++) {
                    // matrix[i][j] = Math.random()*2 - 1                    
                    matrix[i][j] = response[bb]
                    bb = bb+1
                }
              }
            // console.log(matrix)


            var x = d3.scale.ordinal()
            .domain(d3.range(numcols))
            .rangeBands([0, width]);
        
            var y = d3.scale.ordinal()
                .domain(d3.range(numrows))
                .rangeBands([0, height]);        
            
            var colorMap = d3.scale.linear()
                .domain([0, 1])
                .range(["white", "black"]);    
            
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
                .style("stroke-width", 0.1);
            
            row.selectAll(".cell")
                .data(function(d, i) { return matrix[i]; })
                .style("fill", colorMap);


        })

}




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

            const transform = transforms[0];
            console.log(transform)

            const nbpix = nbpixels[0];
            console.log(nbpix)

            plotRandomMatrix(nbpix)

        });   
      });

 
}



// ------ MAIN --------
// ---------------------

// Initialize the dashboard
init();
console.log("blabla")
console.log(selector_nbpix.property("value"))   





