const Url      = require('url')
const path     = require("path");
const Headers  = require('node-fetch').Headers
const Readable = require('stream').Readable
const contentTypeLookup = require('mime-types').contentType

class SolidRest {

constructor( storage ) {
  this.storage = storage
  this.statusText = {
    200 : "OK",
    201 : "Created",
    404 : "Not Found",
    405 : "Method Not Supported",
    409 : "Conflict",
    500 : "Internal Server Error"
  }
}

async fetch(uri, options) {
  const self = this
  options = options || {}
  options.headers = options.headers || {}
  options.uri = decodeURIComponent(uri)
  let pathname = decodeURIComponent(Url.parse(uri).pathname)
  options.method = (options.method || options.Method || 'GET').toUpperCase()
  const [objectType,objectExists] = 
    await self.storage.getObjectType(pathname,options)
  options.objectType = objectType
  options.objectExists = objectExists

  /* GET
  */
  if (options.method === 'GET') {
    if(!objectExists) return _response([404])
    if( objectType==="Container"){
      let contents = await  self.storage.getContainer(pathname,options)
      contents = _container2turtle(pathname,options,contents) 
      return _response( contents )
    }
    else if( objectType==="Resource" ){
      return _response(await self.storage.getResource(pathname,options))
    }
  }
  /* HEAD
  */
  if (options.method === 'HEAD') {
    if(!objectExists) return _response([404])
    else return _response( [200] )
  }
  /* DELETE
  */
  if( options.method==="DELETE" ){
    if(!objectExists) return _response([404])
    if( objectType==="Container" ){
      return Promise.resolve( _response( 
        await self.storage.deleteContainer(pathname,options) 
      ))
    }
    else if (objectType === 'Resource' ) {
      return Promise.resolve( _response(
        await self.storage.deleteResource(pathname,options)
      ) )
    }
    else {
    }
  }
  /* POST
  */
  if( options.method==="POST"){
    if( !objectExists ) return _response([404])
    let slug = options.headers.Slug || options.headers.slug
    let link = options.headers.Link || options.headers.link
    pathname = path.join(pathname,slug);
    if( link && link.match("Container") ) {  
      return Promise.resolve( _response( await 
        self.storage.postContainer(pathname,options) 
      ))
    }
    else if( link && link.match("Resource")){
      return _response( await self.storage.putResource( pathname, options))
    }
  }
  /* PUT
  */
  if (options.method === 'PUT' ) {
    if(objectType==="Container") return Promise.resolve( _response([405]) )
    let res = await self.storage.makeContainers(pathname,options)
    if(!res==200 && !res==201) return Promise.resolve(_response([res]))
    return Promise.resolve(
       _response( await self.storage.putResource( pathname, options ))
    )
  }
  else {
    return Promise.resolve( _response([405]) )
  }
  function _response( response ){
    let [status,body,headers]  = response
    headers = headers || _getHeaders(pathname,options)
    return {
      status: status,
      ok: status >= 200 && status <= 299,
      statusText: self.statusText[status],
      headers: new Headers(headers),
      body: body,
      text: _text.bind(null, body),
      json: _json.bind(null, body)
    }
  }
  function _text (stream) {
    if(typeof self.storage.text !="undefined")
      return self.storage.text(stream) 
    else return stream
  }
  function _json (stream) {
    if(typeof self.storage.json != "undefined") return self.storage.json(stream)
    else return JSON.parse(stream)
  }
  function _makeStream(text){
      let s = new Readable
      s.push(text)
      s.push(null)  
      return s;
  }
  function _container2turtle( pathname, options, contentsArray ){
    if(typeof self.storage.container2turtle != "undefined")
      return self.storage.container2turtle(pathname,options,contentsArray)  
    let filenames=contentsArray.filter( item => {
      if(!item.endsWith('.acl') && !item.endsWith('.meta')){ return item }
    })
    let str = "@prefix ldp: <http://www.w3.org/ns/ldp#>.\n"
            + "<> a ldp:BasicContainer, ldp:Container"
    if(filenames.length){
      str = str + "; ldp:contains\n";
      filenames.forEach(async function(filename) {
        let fn = filename
        str = str + `  <${fn}>,\n`
      });
      str = str.replace(/,\n$/,"")
    }
    str = str + `.\n`
    // str = _makeStream(str);
    return ( [ 200,  str, _getHeaders(pathname,options,'Container') ] )
  }
  /* DEFAULT HEADER
       link created using .meta and .acl appended to uri 
       content-type assigned by mime-types.lookup
       date from nodejs Date
  */
  function _getHeaders(pathname,options){    
    let fn = pathname.replace(/.*\//,'');    
    let headers = (typeof self.storage.getHeaders != "undefined")
      ? self.storage.getHeaders(pathname,options)
      : {}
    headers.location = headers.location || options.uri
    headers.date = headers.date || 
      new Date(Date.now()).toISOString()
    headers.allow = headers.allow || 
      [ 'OPTIONS, HEAD, GET, PATCH, POST, PUT, DELETE' ]
    headers['x-powered-by'] = headers['x-powered-by'] || 
      'solid-rest'
    headers.link = headers.link || 
      options.objectType==="Container"
        ? `<.meta>; rel="describedBy", <.acl>; rel="acl",`
          +`<http://www.w3.org/ns/ldp#Container>; rel="type",`
          +`<http://www.w3.org/ns/ldp#BasicContainer>; rel="type"`
        : `<${fn}.meta>; rel="describedBy", <${fn}.acl>; rel="acl",`
          +`<http://www.w3.org/ns/ldp#Resource>; rel="type"`
    headers['content-type'] = headers['content-type'] || 
      options.objectType==="Container"
        ? "text/turtle"
        : contentTypeLookup(path.extname(pathname))
    return headers
  } // end of getHeaders()
 } // end of fetch()
} // end of SolidRest()

module.exports = exports = SolidRest

/* END */


/*
required
  getObjectType
  getResouce
  getContainer
  putResource
  postResource
  postContainer
  deleteResource
  deleteContainer
  makeContainers
optional
  getHeaders
  text
  json
*/
