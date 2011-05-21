// inspired by,
// https://github.com/mohamedmansour/proxy-anywhere-extension/
// http://code.google.com/chrome/extensions/beta/experimental.proxy.html#apiReference
//


function setNewCompressionValue(new_value) {
  
  var map = {
    0:0.10,
    1:0.25,
    2:0.50,
    3:0.0
  }
  // console.log("Trying to set compression to: " + new_value + " = " + map[new_value]);
  // switch compression on if turned off
  if ($("#proxy_status").val() == "0" && new_value != 3) {
    setCompressionOn($("#proxyaddress").val(), $("#proxyport").val(), $("#controlport").val());
    $("#proxy_status").val("1");
  } else if (new_value == 3) {
    // ...or off, if new value asks for 100% compression
    setCompressionOff();
  }
  
  if (map[new_value] != $("#compression").val()) {  // check that we have received a MODIFICATION to value
    
    var controladdress = "http://" + $("#proxyaddress").val() + ":" + $("#controlport").val() + "/control";
    $.post(controladdress, "new_compression_rate="+ map[new_value], function (data) {
      if (data == "OK") {
        //confirm update by asking from the control-service
        $.get(controladdress, function(data) {
          $("#compressionrate").val(data);  // set the background-value to new one.
        });
      }
    });
  }
  
}

function setCompressionOn(host, port, configport) {
  // console.log("Turning compression on...");
  var config = {
    mode: "fixed_servers",
    rules: {
      proxyForHttp: {
        scheme: "http",
        host: host,
        port: parseInt(port)
      },
      // bypassList: ["foobar.com"]
    }
  };
  
  // update the DOM
  $("#proxyaddress").val(host);
  $("#proxyport").val(port);
  $("#controlport").val(configport);  
  
  // set the proxy settings
  chrome.experimental.proxy.settings.set(
      {'value': config, 'incognito': false},
      function() {});
}

function setCompressionOff() {
  // console.log("Turning compression off..");
  chrome.experimental.proxy.settings.clear({incognito: false});
  chrome.experimental.proxy.settings.clear({incognito: true});
  $("#proxy_status").val("0");
  $("#compressionrate").val("0.0");
  
}

// listener for requests by switch_images.js
// http://code.google.com/chrome/extensions/messaging.html
chrome.extension.onRequest.addListener(
  function(request, sender, sendResponse) {
    // console.log(sender.tab ?
    //             "from a content script:" + sender.tab.url :
    //             "from the extension");
    if (request.message == "getcompressionrate") {
      var rate = $("#compressionrate").val();
      sendResponse({compressionrate: rate});
    } else if (request.message == "getproxystatus") {
      sendResponse({proxy: $("#proxy_status").val()});
    } else {
      sendResponse({}); // snub them.
    }
  }
);