
// Variables
var selector_transform = d3.select("#selTransform");
var selector_nbpix = d3.select("#selNBpix")
var selector_rdm_image = d3.select("#svg-random-img")
var selector_crt_image = d3.select("#svg-create-img")
var sel_input_img = d3.select("#svg-input-img")
var sel_mang_img = d3.select("#svg-mang-img")
var sel_cor_img = d3.select("#ssvg-cor-img")
var sel_out_img = d3.select("#svg-out-img")




// Layout variables
var margin = {top: 20, right: 100, bottom: 50, left: 100},
    width = 250,
    height = 250;


// Functions
//-------------------------------------
function transformChanged(newTransfrom) {
  }

function nbpixChanged(newNBpix){
    // replot the randomImage each time we change the nb of pixels
    randomImage()

    // update the create image grid
    // Plot the drawing grid
    var gd_create = gridData(Array(newNBpix*newNBpix).fill(0))
    plotMatrix(selector_crt_image, gd_create )
    // Make it clickable
    makeClickable(selector_crt_image, gd_create)
}

// Create the dataset to build the matrices
function gridData(values) {
    // INPUTS:
    // @nbpix: nb of pixels
    // @values: list containing all the values
    let nbpix = parseInt(Math.sqrt(values.length))
	let data = new Array();
	let xpos = 1; //starting xpos and ypos at 1 so the stroke will show when we make the grid below
	let ypos = 1;
	let cell_width = 0.99*width/nbpix;
	let cell_height =0.99*height/nbpix;
	let click = 0;
	
    // iterate for rows	
    console.log(nbpix)
    let ii = 0;
	for (var rr = 0; rr < nbpix; rr++) {
        data.push( new Array() );
		// iterate for cells/columns inside rows
		for (var cc = 0; cc < nbpix; cc++) {          
			data[rr].push({
				x: xpos,
				y: ypos,
				width: cell_width,
				height: cell_height,
                click: click,
                value: values[ii]
            })
            ii++
			// increment the x position. I.e. move it over by 50 (width variable)
			xpos += cell_width;
        }
        
		// reset the x position after a row is complete
		xpos = 1;
		// increment the y position for the next row. Move it down 50 (height variable)
		ypos += cell_height;	
    }
	return data;
}

// Create and plot a random matrix
function randomImage(){

    // create the random matrix
    let url = "/random_image/"+selector_nbpix.property("value")
    d3.json(url).then(function(resp){
        console.log(resp)
        
        // Plot the random matrix
        // plotMatrix(selector_rdm_image, gridData(resp))

        // Plot the input image
        plotMatrix(sel_input_img, gridData(resp))

        // Call the app.py to get the mangled and corrected outputs
        // It may be a little "rustic" but we chose to transmit the matrix to the app.py,
        // by concatenating all the values in the route
        let url = "/applyModel/"
            +selector_nbpix.property("value") // the nb of pixel
            +selector_transform.property("value") // the type of transformation
            +resp.join("") // the matrix values concatenated into a string
        console.log(url)

        d3.json(url).then((mangled) => {
            console.log(mangled.Mmang)
            
            plotMatrix(sel_mang_img, gridData(mangled.Mmang))


        })

        
        
    })    
}

// General function to plot the matrix
function plotMatrix(svg_obj, gridD){

    // clear the svg obj
    svg_obj.html("")

    var grid = svg_obj
	.append("svg")
	.attr("width",width + margin.left + margin.right)//"510px")
    .attr("height",height + margin.top + margin.bottom)//"510px");
    .style("margin-left", -margin.left + "px")
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");      

    var row = grid.selectAll(".row")
	.data(gridD)
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

}

// Make the squares of an svg obj clickable
function makeClickable(svg_obj, gridD){
    svg_obj
    .data(gridD)
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

    return gridD
}    


// var gridD = gridData([0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 1]);	
// // I like to log the data to the console for quick debugging
// console.log(gridD);

// plotMatrix(d3.select("#svg-create-img"), gridD)


// gridData2 = makeClickable(d3.select("#svg-create-img"), gridD)






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

            
            // Plot a random image
            randomImage()

            // Plot the drawing grid
            var gd_create = gridData(Array(nbpix*nbpix).fill(0))
            plotMatrix(selector_crt_image, gd_create )
            // Make it clickable
            var gd_create_clc = makeClickable(selector_crt_image, gd_create)

            // // // get the mangled matrices
            // let url = "/applyModel_old/"+nbpix+transform
            // console.log(url)

            // d3.json(url).then((response) => {
            //     console.log(response)
            // })




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




// TRASH

// function plotMatrix2(values, svg_obj){
//     // Plot a level of gray matrix
//     // INPUTS:
//     // @values: list of values constituing the matrix
//     // @svg_obj: d3 selection of the division where to plot the matrix

//     // nb of pixels
//     let nbpix = parseInt(Math.sqrt(values.length))

//     // building the matrix
//     var numrows = nbpix;
//     var numcols = nbpix;     
//     var matrix = new Array(numrows);
//     var bb = 0
//     for (var i = 0; i < numrows; i++) {
//         matrix[i] = new Array(numcols);
//         for (var j = 0; j < numcols; j++) {                 
//             matrix[i][j] = values[bb]
//             bb = bb+1
//         }
//       }    

//     // clear the svg obj
//     svg_obj.html("")

//     // Build the background
//     var svg = svg_obj.append("svg")
//             .attr("width", width + margin.left + margin.right)
//             .attr("height", height + margin.top + margin.bottom)
//             .style("margin-left", -margin.left + "px")
//           .append("g")
//             .attr("transform", "translate(" + margin.left + "," + margin.top + ")");            
//     svg.append("rect")
//         .attr("class", "background")
//         .attr("width", width)
//         .attr("height", height);

//     // Create the x and y scales
//     var x = d3.scale.ordinal()
//         .domain(d3.range(numcols))
//         .rangeBands([0, width]);        
//     var y = d3.scale.ordinal()
//         .domain(d3.range(numrows))
//         .rangeBands([0, height]);        
            
//     // Define the colormap
//     var colorMap = d3.scale.linear()
//         .domain([0, 1])
//         .range(["white", "black"]);    
           
//     // Build the grid of nbpix x nbpix squares
//     var row = svg.selectAll(".row")
//         .data(matrix)
//         .enter()
//         .append("g")
//         .attr("class", "row")
//         .attr("transform", function(d, i) { return "translate(0," + y(i) + ")"; });    
//     row.selectAll(".cell")
//         .data(function(d) { return d; })
//         .enter()
//         .append("rect")
//         .attr("class", "cell")
//         .attr("x", function(d, i) { return x(i); })
//         .attr("width", x.rangeBand())
//         .attr("height", y.rangeBand())
//         // .style("stroke-width", 0.1);
//         .attr('stroke', '#2378ae')
//         .attr('stroke-linecap', 'butt')
//         .attr('stroke-width', '1')
    
//     // Fill the squares with the color corresponding the matrix value
//     row.selectAll(".cell")
//         .data(function(d, i) { return matrix[i]; })
//         .style("fill", colorMap);

// }
