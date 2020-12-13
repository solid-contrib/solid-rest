  /* DEFAULT HEADER
       link created using .meta and .acl appended to uri
       content-type assigned by mime-types.lookup
       date from nodejs Date
  */

import u from './utils.js';

export default function getResponseHeader(
  pathname,options,headersFromPlugin,name,item,request
){    
    const fn = u.basename(pathname,item.pathHandler)
    let headers = headersFromPlugin;

    headers.location = headers.url = headers.location 
      || request.url.href

    headers.date = headers.date
      || new Date(Date.now()).toISOString()

    headers.allow = headers.allow
      || createAllowHeader(options.patch,item.mode)

    let wacAllow = headers['wac-allow'] 
      || createWacHeader(item.mode)
    if( wacAllow ) headers['wac-allow'] = wacAllow;

    headers['x-powered-by'] = headers['x-powered-by'] ||
      name

    options.item = item; 
    options.request = request;
    const ext = u.getExtension(pathname,options)

    headers['content-type']
       = headers['content-type']
	  || u.getContentType(ext,item.isContainer==='Container'?"Container":"Resource")
    if(!headers['content-type']){
       delete headers['content-type']
    }
    if(options.patch) {
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
    return headers
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
