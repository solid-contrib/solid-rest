const Url      = require('url')

// cxRes
const libPath     = require("path");
//const path   = require("path");

const { Response }  = require('cross-fetch')
const contentTypeLookup = require('mime-types').contentType

class SolidRest {

constructor( handlers ) {
  this.storageHandlers = {}
  handlers.forEach( handler => {
     console.log(`
       Installing Rest Handler ${handler.name} using prefix ${handler.prefix}
     `)
     this.storageHandlers[handler.prefix] = handler
  })
}

storage(options){
  const prefix = (typeof options==="string") ? options : options.rest_prefix
  if(!this.storageHandlers[prefix]) throw "Did not recognize prefix "+prefix
  return this.storageHandlers[prefix]
}

async fetch(uri, options = {}) {
  let self = this
  options = options || {}

  // cxRes
/*
   options.url = decodeURIComponent(uri)

   let pathname = decodeURIComponent(Url.parse(uri).pathname)
   let scheme = Url.parse(uri).protocol
   let prefix = scheme.match("file") 
     ? 'file' 
     : uri.replace(scheme+'//','').replace(/\/.*$/,'')
   options.scheme = scheme
   options.rest_prefix = prefix
*/
/**/
  const url = new URL(uri)
  options.scheme = url.protocol

  let pathname, path
  if (options.scheme.startsWith('file')) {
    options.url = Url.format(url)
    pathname = Url.fileURLToPath(options.url)
    options.rest_prefix = 'file'
    path = libPath
  }
  else {
    options.url = decodeURIComponent(uri)
    pathname = Url.parse(options.url).pathname
    options.rest_prefix=uri.replace(options.scheme+'//','').replace(/\/.*$/,'')
    path = libPath.posix
  }
  /**/
  
  if(!self.storage){
    if(self.storageHandler) {
      self.storage=()=>{return self.storageHandlers[prefix]}
    }
    else {
        self=new SolidRest([ new SolidBrowserFS() ])
    }
  }
  
  options.method = (options.method || options.Method || 'GET').toUpperCase()
  options.headers = options.headers || {}
  const [objectType,objectExists] =
    await self.storage(options).getObjectType(pathname,options)

  options.objectType = objectType
  options.objectExists = objectExists
  const notFoundMessage = '404 Not Found'
  if (objectType === "Container" && !options.url.endsWith('/')) options.url = `${options.url}/`
  const resOptions = Object.assign({}, options)
  resOptions.headers = {}

  /* GET
  */
  if (options.method === 'GET') {
    if(!objectExists) return _response(notFoundMessage, resOptions, 404)
    if( objectType==="Container"){
      let contents = await  self.storage(options).getContainer(pathname,options)
      const [status, turtleContents, headers] = await _container2turtle(pathname,options,contents)
      Object.assign(resOptions.headers, headers)

      return _response(turtleContents, resOptions, status)
    }
    else if( objectType==="Resource" ){
      const [status, contents, headers] = await self.storage(options).getResource(pathname,options)
      Object.assign(resOptions.headers, headers)

      return _response(contents, resOptions, status)
    }
  }
  /* HEAD
  */
  if (options.method === 'HEAD') {
    if(!objectExists) return _response(null, resOptions, 404)
    else return _response(null, resOptions, 200)
  }
  /* DELETE
  */
  if( options.method==="DELETE" ){
    if(!objectExists) return _response(notFoundMessage, resOptions, 404)
    if( objectType==="Container" ){
      const [status, , headers] = await self.storage(options).deleteContainer(pathname,options)
      Object.assign(resOptions.headers, headers)

      return _response(null, resOptions, status)
    }
    else if (objectType === 'Resource' ) {
      const [status, , headers] = await self.storage(options).deleteResource(pathname,options)
      Object.assign(resOptions.headers, headers)

      return _response(null, resOptions, status)
    }
    else {
    }
  }
  /* POST
  */
  if( options.method==="POST"){
    if( !objectExists ) return _response(notFoundMessage, resOptions, 404)
    let link = options.headers.Link || options.headers.link
    let slug = options.headers.Slug || options.headers.slug || options.slug
    if(slug.match(/\//)) return _response(null, resOptions, 400) // Now returns 400 instead of 404
    pathname = path.join(pathname,slug);
    if( pathname.startsWith('\\') ) pathname = pathname.replace(/\\/g,'/')

    if( link && link.match("Container") ) {
      const [status, , headers] =  await self.storage(options).postContainer(pathname,options)
      Object.assign(resOptions.headers, headers)

      return _response(null, resOptions, status)
    }
    else if( link && link.match("Resource")){
      const [status, , headers] = await self.storage(options).putResource( pathname, options)
      Object.assign(resOptions.headers, headers)

      return _response(null, resOptions, status)
    }
  }
  /* PUT
  */
  if (options.method === 'PUT' ) {
    if(objectType==="Container") return _response(null, resOptions, 409)
    const [status, undefined, headers] = await self.storage(options).makeContainers(pathname,options)
    Object.assign(resOptions.headers, headers)

    if(status !== 200 && status !== 201) return _response(null, resOptions, status)
    const [putStatus, , putHeaders] = await self.storage(options).putResource(pathname, options)

    Object.assign(resOptions.headers, putHeaders) // Note: The headers from makeContainers are also returned here

    return _response(null, resOptions, putStatus)
  }
  else {
    return _response(null, resOptions, 405)
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

    // cxRes
    if ( !pathname.endsWith(path.sep) ) pathname += path.sep
    // if (!pathname.endsWith("/")) pathname += "/"

    let str2 = ""
    let str = "@prefix : <#>. @prefix ldp: <http://www.w3.org/ns/ldp#>.\n"
            + "<> a ldp:BasicContainer, ldp:Container"
    if(filenames.length){
      str = str + "; ldp:contains\n";
      for(var i=0;i<filenames.length;i++){
        // let fn = filenames[i]
        let fn = encodeURI(filenames[i])
        let [ftype,e] =  await self.storage(options).getObjectType(pathname + fn)
        if(ftype==="Container" && !fn.endsWith("/")) fn = fn + "/"
        str = str + `  <${fn}>,\n`
        let ctype = _getContentType(_getExtension(fn),options.objectType)
        ftype = ftype==="Container" ? "ldp:Container; a ldp:BasicContainer" : "ldp:Resource"
        str2 = str2 + `<${fn}> a ${ftype}.\n`
        str2 = str2 + `<${fn}> :type "${ctype}".\n`
      }
      str = str.replace(/,\n$/,"")
    }
    str = str + `.\n` + str2
    // str = _makeStream(str);
    return  ([200,str])
  }

  /* treats filename ".acl" and ".meta" as extensions
  */
  function _getExtension(pathname) {
    let ext = ( path.basename(pathname).startsWith('.') )
            ? path.basename(pathname)
            : path.extname(pathname)
    return ext
  }
  function _getContentType(ext,type) {
    if( !ext
     || ext==='.ttl'
     || ext==='.acl'
     || ext==='.meta'
     || type==="Container"
    ) {
      return 'text/turtle'
    }
    else {
      return contentTypeLookup(ext)
    }
  }
  /* DEFAULT HEADER
       link created using .meta and .acl appended to uri
       content-type assigned by mime-types.lookup
       date from nodejs Date
  */

  function _getHeaders(pathname,options){    

    // cxRes
    const fn = path.basename(pathname)
    // let fn = encodeURI(pathname.replace(/.*\//,''))  

    let headers = (typeof self.storage(options).getHeaders != "undefined")
      ? self.storage(options).getHeaders(pathname,options)
      : {}
    headers.location = headers.url = headers.location || options.url
    headers.date = headers.date ||
      new Date(Date.now()).toISOString()
    headers.allow = headers.allow ||
      [ 'HEAD, GET, POST, PUT, DELETE' ]
      //   [ 'OPTIONS, HEAD, GET, PATCH, POST, PUT, DELETE' ]
    headers['wac-allow'] = headers['wac-allow'] ||
      `user="read write append control",public="read"`
    headers['x-powered-by'] = headers['x-powered-by'] ||
      self.storage(options).name
/*
    const ext = ( path.basename(pathname).startsWith('.') )
              ? path.basename(pathname)
              : path.extname(pathname)
*/

    const ext = _getExtension(pathname)

    headers['content-type']
       = headers['content-type']
      || _getContentType(ext,options.objectType)
    if(!headers['content-type']){
       delete headers['content-type']
    }
    headers.link = headers.link;
    if( !headers.link ) {
        if( ext === '.acl' ) {
          // TBD : IS THIS CORRECT? IS THE TYPE OF ACL "resource"?
          headers.link =
            `<http://www.w3.org/ns/ldp#Resource>; rel="type"`
        }
        else if( ext === '.meta' ) {
          headers.link =
           `<${fn}.acl>; rel="acl",`
          +`<http://www.w3.org/ns/ldp#Resource>; rel="type"`
        }
        else if (options.objectType==='Container') {
          headers.link =
           `<.meta>; rel="describedBy", <.acl>; rel="acl",`
          +`<http://www.w3.org/ns/ldp#Container>; rel="type",`
          +`<http://www.w3.org/ns/ldp#BasicContainer>; rel="type"`
        }
        else {
          headers.link =
           `<${fn}.meta>; rel="describedBy", <${fn}.acl>; rel="acl",`
          +`<http://www.w3.org/ns/ldp#Resource>; rel="type"`
        }
    }
    return headers
/*
    headers.link = headers.link ||
      options.objectType==="Container"
        ? `<.meta>; rel="describedBy", <.acl>; rel="acl",`
          +`<http://www.w3.org/ns/ldp#Container>; rel="type",`
          +`<http://www.w3.org/ns/ldp#BasicContainer>; rel="type"`
        : `<${fn}.meta>; rel="describedBy", <${fn}.acl>; rel="acl",`
          +`<http://www.w3.org/ns/ldp#Resource>; rel="type"`
*/

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
