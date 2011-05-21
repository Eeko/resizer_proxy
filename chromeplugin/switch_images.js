
$(document).ready(function() {
  var proxystatus = "0";
  
  // compute a multiplication map for image sizes in advance
  var map_to_multiply = {
    0.10:10,
    0.25:4,
    0.50:2,
    0:1
  }
  chrome.extension.sendRequest({message: "getproxystatus"}, function(response) {
    var images = document.images;
    // console.log("proxystatus1: " + response.proxy);  
    proxystatus = response.proxy;
    
    // a request for the current compressionrate
    if (proxystatus == "1") { // only run if proxy is set to be on.
      chrome.extension.sendRequest({message: "getcompressionrate"}, function(response) {
        var compressionrate = parseFloat(response.compressionrate);
        // console.log("compressionrate: " + compressionrate);
        for (var i = 0; i<images.length; i++){  // should be done with .each-function?
          images[i].height = images[i].height * map_to_multiply[compressionrate];
          // not needed, default DOM-height change transforms the width as well
          //images[i].width = images[i].width * map_to_multiply[compressionrate]; 
        }
      });
    }
  });
  
  

  
});