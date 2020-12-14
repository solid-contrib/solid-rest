const { Response }  = require('cross-fetch')

export async function handleResponse(response){    
    const pathname = this.item.pathname;
    const status = response[0];
    const body =  response[1];
    let headers =  response[2] || {};
    const headersFromPlugin = 
      typeof this.storage.getHeaders != "undefined"
          ? this.storage.getHeaders(pathname)
          : {}
    let name =  this.storage.name
    const item = this.item;
    const request = this.request;
    const fn = this.basename(pathname,item.pathHandler)
    Object.assign(headers,headersFromPlugin);

    headers.location = headers.url = headers.location 
      || request.url

    headers.date = headers.date
      || new Date(Date.now()).toISOString()

    headers.allow = headers.allow
      || createAllowHeader(this.canPatch,this.item.mode)

    let wacAllow = headers['wac-allow'] 
      || createWacHeader(item.mode)
    if( wacAllow ) headers['wac-allow'] = wacAllow;

    headers['x-powered-by'] = headers['x-powered-by'] ||
      name
    const options = {};
    options.item = item; 
    options.request = request;
    const ext = this.getExtension(pathname)

    headers['content-type']
       = headers['content-type']
	  || this.getContentType(ext,item.isContainer==='Container'?"Container":"Resource")
    if(!headers['content-type']){
       delete headers['content-type']
    }
    if(this.canPatch) {
     headers['ms-author-via']=["SPARQL"];
     headers['accept-patch']=['application/sparql-update'];
    }
    headers.link = headers.link;
    if( !headers.link ) {
        if( ext === '.acl' ) {
          headers.link =
            `<http://www.w3.org/ns/ldp#Resource>; rel="type"`
        }
        else if( ext === '.meta' ) {
          headers.link =
           `<${fn}.acl>; rel="acl",`
          +`<http://www.w3.org/ns/ldp#Resource>; rel="type"`
        }
        else if ( item.isContainer ) {
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
    headers.status = status;
    return new Response(body, headers)
  } // end of getHeaders()

  function createWacHeader( mode ){
    if(!mode.read && !mode.write) return null;
    if(mode.read && !mode.write) return `user="read",public="read"`
    if(!mode.read && mode.write) return `user="append write control",public=""`
    return `user="read write append control",public="read"`
  }

  function createAllowHeader( patch, mode ){
    return 'OPTIONS,HEAD' 
         + (mode.read ?',GET' : '') 
         + (mode.write ?',POST,PUT,DELETE' : '') 
         + (mode.write && patch ?',PATCH' : '') 
  }
