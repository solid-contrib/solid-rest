import u from './utils.js';

export function checkRestErrors( options, request, item ){
  if( !request.url) return(400);
  if( request.slug.endsWith('/') ) return(400);
  if( request.method==='DELETE' && item.containerNotEmpty ) return(409);
  if( u.isAuxResource(options) && request.method==="POST") return(405);
  const methods = {
    DELETE  : { mustPrexist:1, requiresWrite:1 },
    POST    : { mustPrexist:1, requiresAppend:1, requiresContentType:1 },
    GET     : { mustPrexist:1, requiresRead:1 },
    HEAD    : { mustPrexist:1, requiresRead:1 },
    OPTIONS : { mustPrexist:1, requiresRead:1 },
    PUT     : { requiresWrite:1, requiresContentType:1 },
    PATCH   : { requiresWrite:1, requiresContentType:1 },
  }
  const method = methods[request.method];
  if( !method ) return(409);
  if( method.mustPrexist && !item.exists  ) return(404);
  if( (method.requiresRead && !item.mode.read)
   || (method.requiresWrite && !item.mode.write )
   || (method.requiresAppend && !item.mode.append )
  ) return (401);
  if( method.requiresContentType && !request.headers['content-type'] )
    return (400);
  if ( (request.method==='PUT'||request.method==='PATCH') && item.isContainer )
    return(405)
}
// ENDS

