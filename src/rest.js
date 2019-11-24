const Url      = require('url')
const path     = require("path");
const { Response }  = require('node-fetch')
const contentTypeLookup = require('mime-types').contentType

class SolidRest {

constructor( handlers ) {
  this.storageHandlers = {}
  handlers.forEach( handler => {
     this.storageHandlers[handler.prefix] = handler
  })
}

storage(options){
  if(!this.storageHandlers[options.rest_prefix]) throw "Did not recognize prefix "+options.rest_prefix
  return this.storageHandlers[options.rest_prefix]
}

async fetch(uri, options) {
  const self = this
  options = Object.assign({}, options)
  options.headers = options.headers || {}
  options.url = decodeURIComponent(uri)
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
  const notFoundMessage = '404 Not Found'

  /* GET
  */
  if (options.method === 'GET') {
    if(!objectExists) return _response(notFoundMessage, options, 404)
    if( objectType==="Container"){
      let contents = await  self.storage(options).getContainer(pathname,options)
      const [status, turtleContents, headers] = await _container2turtle(pathname,options,contents)
      Object.assign(options.headers, headers)

      return _response(turtleContents, options, status)
    }
    else if( objectType==="Resource" ){
      const [status, contents, headers] = await self.storage(options).getResource(pathname,options)
      Object.assign(options.headers, headers)

      return _response(contents, options, status)
    }
  }
  /* HEAD
  */
  if (options.method === 'HEAD') {
    if(!objectExists) return _response(null, options, 404)
    else return _response(null, options, 200)
  }
  /* DELETE
  */
  if( options.method==="DELETE" ){
    if(!objectExists) return _response(notFoundMessage, options, 404)
    if( objectType==="Container" ){
      const [status, , headers] = await self.storage(options).deleteContainer(pathname,options)
      Object.assign(options.headers, headers)

      return _response(null, options, status)
    }
    else if (objectType === 'Resource' ) {
      const [status, , headers] = await self.storage(options).deleteResource(pathname,options)
      Object.assign(options.headers, headers)

      return _response(null, options, status)
    }
    else {
    }
  }
  /* POST
  */
  if( options.method==="POST"){
    if( !objectExists ) return _response(notFoundMessage, options, 404)
    let link = options.headers.Link || options.headers.link
    let slug = options.headers.Slug || options.headers.slug
    if(slug.match(/\//)) return _response(null, options, 400) // Now returns 400 instead of 404
    pathname = path.join(pathname,slug);
    if( link && link.match("Container") ) {
      const [status, , headers] =  await self.storage(options).postContainer(pathname,options)
      Object.assign(options.headers, headers)

      return _response(null, options, status)
    }
    else if( link && link.match("Resource")){
      const [status, , headers] = await self.storage(options).putResource( pathname, options)
      Object.assign(options.headers, headers)

      return _response(null, options, status)
    }
  }
  /* PUT
  */
  if (options.method === 'PUT' ) {
    if(objectType==="Container") return _response(null, options, 409)

    const [status, undefined, headers] = await self.storage(options).makeContainers(pathname,options) 
    Object.assign(options.headers, headers)

    if(status !== 200 && status !== 201) return _response(null, options, status)
    const [putStatus, , putHeaders] = await self.storage(options).putResource(pathname, options)

    Object.assign(options.headers, putHeaders) // Note: The headers from makeContainers are also returned here

    return _response(null, options, putStatus)
  }
  else {
    return _response(null, options, 405)
  }

  /**
   * @param {RequestInfo} body 
   * @param {RequestInit} options 
   * @param {Number} status - Overrules options.status
   */
  function _response(body, options, status = options.status) {
    options.status = status
    options.headers = Object.assign(_getHeaders(pathname, options), options.headers)
    return new Response(body, options)
  }

  async function _container2turtle( pathname, options, contentsArray ){
    if(typeof self.storage(options).container2turtle != "undefined")
      return self.storage(options).container2turtle(pathname,options,contentsArray)  
    let filenames=contentsArray.filter( item => {
      if(!item.endsWith('.acl') && !item.endsWith('.meta')){ return item }
    })
    if (!pathname.endsWith("/")) pathname += "/"
    let str2 = ""
    let str = "@prefix ldp: <http://www.w3.org/ns/ldp#>.\n"
            + "<> a ldp:BasicContainer, ldp:Container"
    if(filenames.length){
      str = str + "; ldp:contains\n";
      for(var i=0;i<filenames.length;i++){
        let fn = filenames[i]
        let [ftype,e] =  await self.storage(options).getObjectType(pathname + fn)
        if(ftype==="Container" && !fn.endsWith("/")) fn = fn + "/"
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
    headers.location = headers.location || options.url
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
    if (!headers['content-type'])
      delete headers['content-type']
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
