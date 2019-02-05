

var selector_transform = d3.select("#selTransform");
var selector_nbpix = d3.select("#selNBpix")


function transformChanged(newTransfrom) {
    // Fetch new data each time a new sample is selected
    // buildCharts(newSample);
    // buildMetadata(newSample);
  }

function nbpixChanged(newNBpix){

}

function randomImage(){
    console.log(selector_nbpix.property("value"))

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



