
// Variables
var selector_transform = d3.select("#selTransform");
var selector_nbpix = d3.select("#selNBpix")
var selector_rdm_image = d3.select("#svg-random-img")
var selector_crt_image = d3.select("#svg-create-img")
var sel_input_img = d3.select("#svg-input-img")
var sel_mang_img = d3.select("#svg-mang-img")
var sel_cor_img = d3.select("#svg-cor-img")
var sel_out_img = d3.select("#svg-out-img")

var gd_create = new Array();


// Layout variables
var margin = {top: 10, right: 10, bottom: 10, left: 10};
var width = 250;
var height = 250;


// Functions
//-------------------------------------

// Activated when the transformation type is changed
function transformChanged(newTransfrom) {
    randomImage()
  }

// Activated when the nb of pixels is changed
function nbpixChanged(newNBpix){
    // replot the randomImage each time we change the nb of pixels
    randomImage()

    // update the create image grid
    // Plot the drawing grid
    gd_create = gridData(Array(newNBpix*newNBpix).fill(0))
    plotMatrix(selector_crt_image, gd_create )
    // Make it clickable
    gd_create = makeClickable(selector_crt_image, gd_create)    
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
        // console.log(resp)
        
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

        d3.json(url).then((mangled) => {
            // Plot the mangled matrix
            plotMatrix(sel_mang_img, gridData(mangled.Mmang))
            // Plot the corrected input
            plotMatrix(sel_cor_img, gridData(mangled.Mcor))
            // Plot the output from the corrected input
            plotMatrix(sel_out_img, gridData(mangled.Mout))
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

// Use the created image
function createdImage(){

    // Collect the values from the gridData of the created image
    let ci_val = gd_create.map(function(d){
        return d.map(function(bb) {return bb.value})
    })  

    // Plot the input image
    plotMatrix(sel_input_img, gd_create)

    // Call the app.py to get the mangled and corrected outputs
    // It may be a little "rustic" but we chose to transmit the matrix to the app.py,
    // by concatenating all the values in the route
    let url = "/applyModel/"
        +selector_nbpix.property("value") // the nb of pixel
        +selector_transform.property("value") // the type of transformation
        +ci_val.flat().join("") // the matrix values concatenated into a string    

    d3.json(url).then((mangled) => {
        // Plot the mangled matrix
        plotMatrix(sel_mang_img, gridData(mangled.Mmang))
        // Plot the corrected input
        plotMatrix(sel_cor_img, gridData(mangled.Mcor))
        // Plot the output from the corrected input
        plotMatrix(sel_out_img, gridData(mangled.Mout))
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
            const nbpix = nbpixels[0];
            
            // Plot a random image
            randomImage()

            // Plot the drawing grid
            gd_create = gridData(Array(nbpix*nbpix).fill(0))
            plotMatrix(selector_crt_image, gd_create )
            // Make it clickable
            gd_create = makeClickable(selector_crt_image, gd_create)

        });   
      });

}



// ------ MAIN --------
// ---------------------

// Initialize the dashboard
init();
