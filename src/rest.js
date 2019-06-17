const Url      = require('url')
const path     = require("path");
const Headers  = require('node-fetch').Headers
const Readable = require('stream').Readable
const contentTypeLookup = require('mime-types').contentType

class SolidRest {

constructor( handlers ) {
  this.storageHandlers = {}
  handlers.forEach( handler => {
     this.storageHandlers[handler.prefix] = handler
  })
  this.statusText = {
    200 : "OK",
    201 : "Created",
    400 : "slashes not allowed in filenames",
    404 : "Not Found",
    405 : "Method Not Supported",
    409 : "Conflict",
    500 : "Internal Server Error"
  }
}

storage(options){
  if(!this.storageHandlers[options.rest_prefix]) throw "Did not recognize prefix "+options.rest_prefix
  return this.storageHandlers[options.rest_prefix]
}

async fetch(uri, options) {
  const self = this
  options = options || {}
  options.headers = options.headers || {}
  options.uri = decodeURIComponent(uri)
  let pathname = decodeURIComponent(Url.parse(uri).pathname)
  options.method = (options.method || options.Method || 'GET').toUpperCase()
  let scheme = Url.parse(uri).protocol
  let prefix = scheme.match("file") ? 'file' : uri.replace(scheme+'//','').replace(/\/.*/,'')
  options.scheme = scheme
  options.rest_prefix = prefix
  const [objectType,objectExists] = 
    await self.storage(options).getObjectType(pathname,options)
  options.objectType = objectType
  options.objectExists = objectExists

  /* GET
  */
  if (options.method === 'GET') {
    if(!objectExists) return _response([404],options)
    if( objectType==="Container"){
      let contents = await  self.storage(options).getContainer(pathname,options)
      contents = await _container2turtle(pathname,options,contents) 
      return _response( contents,options )
    }
    else if( objectType==="Resource" ){
      return _response(await self.storage(options).getResource(pathname,options),options)
    }
  }
  /* HEAD
  */
  if (options.method === 'HEAD') {
    if(!objectExists) return _response([404],options)
    else return _response( [200],options )
  }
  /* DELETE
  */
  if( options.method==="DELETE" ){
    if(!objectExists) return _response([404],options)
    if( objectType==="Container" ){
      return Promise.resolve( _response( 
        await self.storage(options).deleteContainer(pathname,options) , options
      ))
    }
    else if (objectType === 'Resource' ) {
      return Promise.resolve( _response(
        await self.storage(options).deleteResource(pathname,options) , options
      ) )
    }
    else {
    }
  }
  /* POST
  */
  if( options.method==="POST"){
    if( !objectExists ) return _response([404],options)
    let link = options.headers.Link || options.headers.link
    let slug = options.headers.Slug || options.headers.slug
    if(slug.match(/\//)) return (_response([400],options))
    pathname = path.join(pathname,slug);
    if( link && link.match("Container") ) {  
      return Promise.resolve( _response( await 
        self.storage(options).postContainer(pathname,options) , options
      ))
    }
    else if( link && link.match("Resource")){
      return _response( await self.storage(options).putResource( pathname, options) , options )
    }
  }
  /* PUT
  */
  if (options.method === 'PUT' ) {
    if(objectType==="Container") return Promise.resolve( _response([409],options) )
    let res = await self.storage(options).makeContainers(pathname,options)
    if(!res==200 && !res==201) return Promise.resolve(_response([res],options))
    return Promise.resolve(
       _response( await self.storage(options).putResource( pathname, options ), options )
    )
  }
  else {
    return Promise.resolve( _response([405],options) )
  }
  function _response( response, options ){
    let [status,body,headers]  = response
    headers = headers || _getHeaders(pathname,options)
    return {
      status: status,
      ok: status >= 200 && status <= 299,
      statusText: self.statusText[status],
      headers: new Headers(headers),
      body: body,
      text: _text.bind(null, body,options),
      json: _json.bind(null, body,options)
    }
  }
  async function _text (stream,options) {
    if(typeof self.storage(options).text !="undefined")
      return self.storage(options).text(stream) 
    else return stream
  }
  async function _json (stream,options) {
    if(typeof self.storage(options).json != "undefined") return self.storage(options).json(stream)
    else return JSON.parse(stream)
  }
  function _makeStream(text){
      let s = new Readable
      s.push(text)
      s.push(null)  
      return s;
  }
  async function _container2turtle( pathname, options, contentsArray ){
    if(typeof self.storage(options).container2turtle != "undefined")
      return self.storage(options).container2turtle(pathname,options,contentsArray)  
    let filenames=contentsArray.filter( item => {
      if(!item.endsWith('.acl') && !item.endsWith('.meta')){ return item }
    })
    let folder = options.uri;
    if(!folder.endsWith("/")) folder = folder + "/"
    let str2 = ""
    let str = "@prefix ldp: <http://www.w3.org/ns/ldp#>.\n"
            + "<> a ldp:BasicContainer, ldp:Container"
    if(filenames.length){
      str = str + "; ldp:contains\n";
      for(var i=0;i<filenames.length;i++){
        let fn = filenames[i]
        let [ftype,e] =  await self.storage(options).getObjectType(pathname + fn)
        if(ftype==="Container") fn = fn + "/"
//        let prefix = options.rest_prefix==="file" ? "" : options.rest_prefix
//        fn = options.scheme+"//"+prefix+pathname + fn
        str = str + `  <${fn}>,\n`
        ftype = ftype==="Container" ? "a ldp:Container; a ldp:BasicContainer." : "a ldp:Resource."
        str2 = str2 + `  <${fn}> ${ftype}\n`
      }
      str = str.replace(/,\n$/,"")
    }
    str = str + `.\n` + str2
    // str = _makeStream(str);
    return  ([200,str])
  }
  /* DEFAULT HEADER
       link created using .meta and .acl appended to uri 
       content-type assigned by mime-types.lookup
       date from nodejs Date
  */
  function _getHeaders(pathname,options){    
    let fn = pathname.replace(/.*\//,'');    
    let headers = (typeof self.storage(options).getHeaders != "undefined")
      ? self.storage(options).getHeaders(pathname,options)
      : {}
    headers.location = headers.location || options.uri
    headers.date = headers.date || 
      new Date(Date.now()).toISOString()
    headers.allow = headers.allow || 
      [ 'OPTIONS, HEAD, GET, PATCH, POST, PUT, DELETE' ]
    headers['x-powered-by'] = headers['x-powered-by'] || 
      self.storage(options).name
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
