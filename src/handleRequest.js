import {getItem} from './examineRequestedItem.js';
import {getRequest} from './examineRequest.js';

const methods = {
  DELETE  : { mustPrexist:1, requiresWrite:1 },
  POST    : { mustPrexist:1, requiresAppend:1, requiresContentType:1 },
  GET     : { mustPrexist:1, requiresRead:1 },
  HEAD    : { mustPrexist:1, requiresRead:1 },
  OPTIONS : { mustPrexist:1, requiresRead:1 },
  PUT     : { requiresWrite:1, requiresContentType:1 },
  PATCH   : { requiresWrite:1, requiresContentType:1 },
}

export async function handleRequest( uri, originalRequest ){
  const request = this.request = await this.getRequest( uri, originalRequest );
  if( !request.url || !request.method ) return 400;
  if( request.slug.endsWith('/') ) return 400;
  if( request.originMismatch ) return 403;
  if( request.method==='PATCH' && !request.validPatchContent ) return 400;
  const item = this.item = await this.getItem( uri, request );
  if( this.isAuxResource() ){
    request.method.requiresControl = true;
    if( request.method==="POST" ) return 405;
  }
  if( request.method==='DELETE' && item.containerNotEmpty ) return 409;
  if( request.method==='PATCH' && !item.canBePatched ) return 405;
  if( item.mode.control ) item.mode.write=true;
  if( item.mode.write ) item.mode.append=true;
  const method = methods[request.method];
  if( !method ) return 409;
  if( method.mustPrexist && !item.exists  ) return 404;
  if( (method.requiresRead && !item.mode.read)
   || (method.requiresAppend && !item.mode.append )
   || (method.requiresWrite && !item.mode.write )
   || (method.requiresControl && !item.mode.control )
  ) return 401;
  if( method.requiresContentType && !request.headers['content-type'] )
    return 400;
  if ( request.method==='PUT'||request.method==='PATCH'){
    if( item.isContainer ) return 405;
    let okDir = await this.perform('CREATE_INTERMEDIATE_CONTAINERS');  
    if( !okDir ) return 500;
  }
  if( request.method==='DELETE' ){
    let okDel = await this.perform('DELETE_AUX_RESOURCES');
    if( !okDel ) return 500;
  }
  let successfulRequest = await this.perform(request.method);  
  return successfulRequest ? successfulRequest : 500;
}
// ENDS

