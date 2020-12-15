const methods = {
  DELETE  : { mustExist:1, requiresWrite:1 },
  POST    : { mustExist:1, requiresAppend:1, requiresContentType:1 },
  GET     : { mustExist:1, requiresRead:1 },
  HEAD    : { mustExist:1, requiresRead:1 },
  OPTIONS : { mustExist:1, requiresRead:1 },
  PUT     : { requiresWrite:1, requiresContentType:1 },
  PATCH   : { requiresWrite:1, requiresContentType:1 },
}
export async function handleRequest( uri, originalRequest ){
  const request = this.request = await this.getRequest( uri, originalRequest );
  if( !request.url || !request.method ) return 400;
  if( request.slug.endsWith('/') ) return 400;
  if( request.originMismatch ) return 403;
  if( request.invalidPatchContent ) return 400;
  if( request.unsupportedAcceptFormat ) return 405; 
  if( request.method==='POST' && !request.headers.link ) return 400; 
  const item = this.item = await this.getItem( uri, request );
  if( item.folderFileConfusion ) return 400; // can't have both /foo and /foo/
  if( item.isAuxResource ){ 
    if( item.isAcl ) request.method.requiresControl = true;
    if( request.method==="POST" ) return 405;
  }
  if( request.method==='DELETE' && item.containerNotEmpty ) return 409;
  if( request.method==='PATCH' && !this.patch ) return 405;
  if( item.mode.control ) item.mode.write=true; // does control imply read?
  if( item.mode.write ) item.mode.append=true;  // does write imply read?
  const method = methods[request.method];
  if( !method ) return 409;
  if( method.mustExist && !item.exists ) return 404;
  if( (method.requiresRead && !item.mode.read)
   || (method.requiresAppend && !item.mode.append )
   || (method.requiresWrite && !item.mode.write )
   || (method.requiresControl && !item.mode.control )
  ) return 401;
  if( method.requiresContentType && !request.headers['content-type'] )
    return 400;
  if ( request.method==='POST' ){
    this.item.pathname = await this.generateRandomSlug(
      this.item.pathname, this.request.slug
   )
}
  if ( request.method==='PUT'||request.method==='PATCH'){
    if( item.isContainer ) return 405;
    let okDir = await this.perform('CREATE_INTERMEDIATE_CONTAINERS');  
    if( !okDir ) return 500;
  }
  if( request.method==='DELETE' ){
    let del = await this.perform('DELETE_AUX_RESOURCES');
    if( !del ) return 500;
    if( this.isAccessError(del) ) return 401;
  }
  let response = await this.perform(request.method);  
  if( !response ) return 500; 
  if( this.isPatchConflictError(response) ) return 400;
  return response;
}
// ENDS

