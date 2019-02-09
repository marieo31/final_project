
// Variables
var selector_transform = d3.select("#selTransform");
var selector_nbpix = d3.select("#selNBpix")

// Layout variables
var margin = {top: 50, right: 100, bottom: 100, left: 100},
    width = 250,
    height = 250;


// Functions
//-------------------------------------
function transformChanged(newTransfrom) {
  }

function nbpixChanged(newNBpix){
    // replot the randomImage each time we change the nb of pixels
    randomImage()
}

function randomImage(){
    // plotRandomMatrix(selector_nbpix.property("value"))
    // create the random matrix
    let url = "/random_image/"+selector_nbpix.property("value")
    d3.json(url).then(function(response){
        console.log(response)
        plotMatrix(response,d3.select("#svg-random-img") ) 
    })    
}

function createImage(){

    // Adapt to the number of pxls
    var list = [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 1]

    plotMatrix(list, d3.select("#svg-create-img") )


    
}

// Create the dataset to build the matrices
function gridData(values) {
    // INPUTS:
    // @nbpix: nb of pixels
    // @values: list containing all the values
    let nbpix = parseInt(Math.sqrt(values.length))
	var data = new Array();
	var xpos = 1; //starting xpos and ypos at 1 so the stroke will show when we make the grid below
	var ypos = 1;
	var width = 50;
	var height = 50;
	var click = 0;
	
    // iterate for rows	
    var ii = 0;
	for (var row = 0; row < nbpix; row++) {
        data.push( new Array() );
        ii = ii+1
		
		// iterate for cells/columns inside rows
		for (var column = 0; column < nbpix; column++) {
            ii = ii+1
			data[row].push({
				x: xpos,
				y: ypos,
				width: width,
				height: height,
                click: click,
                value: values[ii]
			})
			// increment the x position. I.e. move it over by 50 (width variable)
			xpos += width;
        }
        
		// reset the x position after a row is complete
		xpos = 1;
		// increment the y position for the next row. Move it down 50 (height variable)
		ypos += height;	
    }
	return data;
}





var gridData = gridData([0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 1]);	
// I like to log the data to the console for quick debugging
console.log(gridData);


// function plotMatrix(svg_obj, gridData){


// }


var grid = d3.select("#svg-create-img")
	.append("svg")
	.attr("width","510px")
	.attr("height","510px");
	
var row = grid.selectAll(".row")
	.data(gridData)
	.enter().append("g")
    .attr("class", "row");

// Define the colormap
var colorMap = d3.scale.linear()
    .domain([0, 1])
    .range(["white", "black"]);       

	
var column = row.selectAll(".square")
	.data(function(d) { return d; })
	.enter().append("rect")
	.attr("class","square")
	.attr("x", function(d) { return d.x; })
	.attr("y", function(d) { return d.y; })
	.attr("width", function(d) { return d.width; })
	.attr("height", function(d) { return d.height; })
    // .style("fill", "#fff")
    .style("fill", function(d) {return colorMap(d.value)})
    .style("stroke", "#222")

// Make the squares of an svg obj clickable
function makeClickable(svg_obj, gridData){
    svg_obj
    .data(gridData)
    .selectAll(".square")    
	.on('click', function(d) {
       d.click ++;
       if ((d.click)%2 == 0 ) { 
           d3.select(this).style("fill","#fff");
           d.value = 0;
         }
	   if ((d.click)%2 == 1 ) { 
           d3.select(this).style("fill","#000000");
           d.value = 1;
         }      
    });    

    return gridData
}    


gridData2 = makeClickable(d3.select("#svg-create-img"), gridData)

   



function plotMatrix(values, svg_obj){
    // Plot a level of gray matrix
    // INPUTS:
    // @values: list of values constituing the matrix
    // @svg_obj: d3 selection of the division where to plot the matrix

    // nb of pixels
    let nbpix = parseInt(Math.sqrt(values.length))

    // building the matrix
    var numrows = nbpix;
    var numcols = nbpix;     
    var matrix = new Array(numrows);
    var bb = 0
    for (var i = 0; i < numrows; i++) {
        matrix[i] = new Array(numcols);
        for (var j = 0; j < numcols; j++) {                 
            matrix[i][j] = values[bb]
            bb = bb+1
        }
      }    

    // clear the svg obj
    svg_obj.html("")

    // Build the background
    var svg = svg_obj.append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .style("margin-left", -margin.left + "px")
          .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");            
    svg.append("rect")
        .attr("class", "background")
        .attr("width", width)
        .attr("height", height);

    // Create the x and y scales
    var x = d3.scale.ordinal()
        .domain(d3.range(numcols))
        .rangeBands([0, width]);        
    var y = d3.scale.ordinal()
        .domain(d3.range(numrows))
        .rangeBands([0, height]);        
            
    // Define the colormap
    var colorMap = d3.scale.linear()
        .domain([0, 1])
        .range(["white", "black"]);    
           
    // Build the grid of nbpix x nbpix squares
    var row = svg.selectAll(".row")
        .data(matrix)
        .enter()
        .append("g")
        .attr("class", "row")
        .attr("transform", function(d, i) { return "translate(0," + y(i) + ")"; });    
    row.selectAll(".cell")
        .data(function(d) { return d; })
        .enter()
        .append("rect")
        .attr("class", "cell")
        .attr("x", function(d, i) { return x(i); })
        .attr("width", x.rangeBand())
        .attr("height", y.rangeBand())
        // .style("stroke-width", 0.1);
        .attr('stroke', '#2378ae')
        .attr('stroke-linecap', 'butt')
        .attr('stroke-width', '1')
    
    // Fill the squares with the color corresponding the matrix value
    row.selectAll(".cell")
        .data(function(d, i) { return matrix[i]; })
        .style("fill", colorMap);

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
            
            // Plot a random image
            randomImage()            

            const transform = transforms[0];
            console.log(transform)

            const nbpix = nbpixels[0];
            console.log(nbpix)


            // // get the mangled matrices
            let url = "/applyModel/"+nbpix+transform
            console.log(url)

            d3.json(url).then((response) => {
                console.log(response)
            })




        });   
      });

}



// ------ MAIN --------
// ---------------------

// Initialize the dashboard
init();

// createImage()


// d3.select("#svg-create-img")



console.log("blabla")
console.log(selector_nbpix.property("value"))   





