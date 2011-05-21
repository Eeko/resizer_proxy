#!/usr/bin/env python

# Proxy-Core done by tutorial at http://blog.somethingaboutcode.com/?p=155,
# (offline by 18.05.2011, Can be found with Google Cache?)
# control-code on top of http://twistedmatrix.com/documents/current/web/howto/web-in-60/handling-posts.html
#

# for proxy
from twisted.internet import reactor
from twisted.web import http
from twisted.web.proxy import Proxy, ProxyRequest, ProxyClientFactory, ProxyClient
# to create the control-server
from twisted.web.server import Site
from twisted.web.resource import Resource

from ImageFile import Parser
from StringIO import StringIO

import cgi, sys

# for proxy.
# mostly 1:1 with the code on the tutorial
class InterceptingProxyClient(ProxyClient):
    def __init__(self, *args, **kwargs):
        ProxyClient.__init__(self, *args, **kwargs)
        self.image_parser = None
        self.ctype_received = False
        self.clength = 0
 
    def handleHeader(self, key, value):
        if key.lower() == "content-type": 
            if value in ["image/jpeg", "image/gif", "image/png"]:
                self.image_parser = Parser()
            
            self.ctype_received = True         # content-type must be known before handling header
            if self.clength != 0 and not self.image_parser:
                # processes a content-length, if that was a prior header
                print "Header:  Content-Length  ", self.clength
                ProxyClient.handleHeader(self, "Content-Length", self.clength)
                
        if key.lower() == "content-length": 
            print "Handling content-length"
            if self.image_parser: # don't set content-length yet if an image-file.
                print "CHeader1: ", key, " ", value
                # LEAVES CONTENT-LENGTH UNSET!
            elif self.ctype_received:
                # a bit ugly. Just pass the header forward, if not an image c-length
                print "CHeader2: ", key, " ", value
                ProxyClient.handleHeader(self, key, value)
            else:
                # if content-type has not been processed yet
                print "old-clength ", value
                self.clength = value
                
                
                
        else:
            print "Header: ", key, " ", value
            ProxyClient.handleHeader(self, key, value)
 
    def handleEndHeaders(self):
        if self.image_parser:
            pass #Need to calculate and send Content-Length first
        else:
            ProxyClient.handleEndHeaders(self)
 
    def handleResponsePart(self, buffer):
        if self.image_parser:
            self.image_parser.feed(buffer)
        else:
            ProxyClient.handleResponsePart(self, buffer)
 
    def handleResponseEnd(self):
        if self.image_parser:
            print "imageparsing ", compress_rate
            try:
              image = self.image_parser.close()
            except IOError as (error):
              print "I/O error: ", error
              print self.image_parser
              
            
            try:
                # do the compression
                format = image.format
                newsize = int(image.size[0] * compress_rate) , int(image.size[1] * compress_rate)
                image.thumbnail(newsize) # likely, image sizing like this does not work
                s = StringIO()
                image.save(s, format)
                buffer = s.getvalue()
            except NameError as (error):
                print "in exception: ", error
                # send Original C-length if just queryed for header
                buffer = " " *(int(self.clength))
            print "Header:  Content-Lengths ", len(buffer)
            ProxyClient.handleHeader(self, "Content-Length", len(buffer))
            
            # all headers received and processed
            ProxyClient.handleEndHeaders(self)
            ProxyClient.handleResponsePart(self, buffer)
        
        ProxyClient.handleResponseEnd(self)

# Spells to route my proxy-calls to my custom widget...
class InterceptingProxyClientFactory(ProxyClientFactory):
    protocol = InterceptingProxyClient
 
class InterceptingProxyRequest(ProxyRequest):
    protocols = {'http': InterceptingProxyClientFactory}
 
class InterceptingProxy(Proxy):
    requestFactory = InterceptingProxyRequest
    
# control-service code

class ControlPage(Resource):
    def render_GET(self, request):
        return str(compress_rate)
        
    def render_POST(self, request):
        new_rate = float(cgi.escape(request.args["new_compression_rate"][0]),)
        global compress_rate
        compress_rate = new_rate
        return "OK"



if __name__ == "__main__":
    global compress_rate 
    compress_rate = 0.50   # sets 50% as a default compression-rate
    # create listeners for proxy
    proxy_factory = http.HTTPFactory()
    proxy_factory.protocol = InterceptingProxy
    
    # Maps the proxy at port
    print "\nUsage: ./compressproxy.py [proxyport] [controlport]\nDefaults to 8080 and 8081\nExample: ./compressproxy.py 8888 8889\n"
    
    if len(sys.argv) > 1:
        print sys.argv[1]
        proxyport = int(sys.argv[1], 10)
    else:
        proxyport = 8080
    
    print "Starting proxy-service at ", str(proxyport)
    reactor.listenTCP(proxyport, proxy_factory)
    
    # spells for control-port
    if len(sys.argv) > 2:
        controlport = int(sys.argv[2], 10)
    else:
        controlport = 8081
    print "Starting control-service at ", str(controlport)
    
    control_software = Resource()
    # The process answers at http://localhost:port/control
    control_software.putChild("control", ControlPage())
    control_factory = Site(control_software)
    reactor.listenTCP(controlport,control_factory)
    
    # start the reactor!  
    reactor.run()
