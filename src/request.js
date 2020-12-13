const URL = require("url").URL;

export function getRequest(uri,options){
  const request = normalizeRequestKeys(options)
  request.headers = normalizeRequestKeys(request.headers)
  request.method  = normalizeRequestMethod(request.method)
  request.slug = request.headers.slug || request.slug || "";
  request.body = request.body || "";
  if( !validUrl(uri) ){
    request.url = null;
  }
  else{
    request.url = uri;
    const url = new URL(uri)
    request.protocol = url.protocol
  }
  return request;
}

/* lowercase all request keys e.g. Method -> method
*  lowercase all request.header keys e.g. Content-Type -> content-type
*/
function normalizeRequestKeys(opts){
  let newOpts = {};
  for(var o in opts){
    newOpts[o.toLowerCase()] = opts[o];
  }
  return newOpts;
}  

const validUrl = (s) => {
  try {
    new URL(s);
    return true;
  } catch (err) { return false; }
};

/* uppercase all request methods e.g. get -> GET
*  default method = GET
*/
function normalizeRequestMethod(method){
  return  method ? method.toUpperCase() : 'GET';
}  

