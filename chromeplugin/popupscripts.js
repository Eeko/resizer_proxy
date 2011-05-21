$(document).ready(function() {
  //reloadCompressionRate();
  refreshInterface();
});


// set the compression_rate -div to a given value
function setCompressionRate(to_value) {
  chrome.extension.getBackgroundPage().setNewCompressionValue(to_value);
  // $("#compression_rate").val(chrome.extension.getBackgroundPage().$("#compressionrate").val());
}


// refresg the interface to match background, when
// 1) Popup is loaded
// 2) Slider value has changed
// 3) Proxy address has been changed
function refreshInterface() {
  
  $("#proxy_address").val(
    chrome.extension.getBackgroundPage().$("#proxyaddress").val());
  $("#proxy_port").val(
    chrome.extension.getBackgroundPage().$("#proxyport").val());
  $("#control_port").val(
    chrome.extension.getBackgroundPage().$("#controlport").val());
  //$("#compression_rate").html(
    
    
  var compressionrate = parseFloat(chrome.extension.getBackgroundPage().$("#compressionrate").val());
  // a dumb trick to change the text to "OFF", if compressionrate = 0.0
  if (compressionrate == 0.0) {
    $("#compression_rate").html("off");
  } else {  // tells the amount in percent
    $("#compression_rate").html("" + (compressionrate * 100) + "%");
  }
  
    
  var slider_backwards_map = {
    0.10:0,
    0.25:1,
    0.5:2,
    0.0:3
  };
  var slidervalue = slider_backwards_map[parseFloat(chrome.extension.getBackgroundPage().$("#compressionrate").val())]
  $("#compression_slider").val(slidervalue);
}

function setProxy() {
  var proxy_address = $("#proxy_address").val();
  var proxy_port = $("#proxy_port").val();
  var control_port = $("#control_port").val();
  chrome.extension.getBackgroundPage().setCompressionOn(proxy_address, proxy_port, control_port);
}

// When the slider detects value change 
function sliderModified(value) { 
  //alert("CHANGE!");
  var newvalue = value; 
  //console.log("trying to set proxy to: " +newvalue);
  setCompressionRate(newvalue);
  refreshInterface();
};

