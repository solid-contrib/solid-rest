import { URL } from "url";
export function getRequest(uri, options) {
  const request = normalizeRequestKeys(options);
  request.headers = normalizeRequestKeys(request.headers);
  request.method = normalizeRequestMethod(request.method);
  request.slug = request.headers.slug || request.slug || "";
  request.body = request.body || "";

  if (!validUrl(uri)) {
    request.url = null;
    request.malFormedUrl = true;
  } else {
    request.url = uri;
    const url = new URL(uri);
    request.protocol = url.protocol;
  }

  if (request.url && request.url.endsWith('.dummy')) {
    // rdflib does this !!!
    request.headers["content-type"] = "text/turtle";
    request.body = "";
  }

  return request;
}
/* lowercase all request keys e.g. Method -> method
*  lowercase all request.header keys e.g. Content-Type -> content-type
*/

function normalizeRequestKeys(opts) {
  let newOpts = {};

  for (var o in opts) {
    if (o === 'host') {
      newOpts['hostname'] = opts[o]; // express requires this
    } else newOpts[o.toLowerCase()] = opts[o];
  }

  return newOpts;
}

const validUrl = s => {
  try {
    new URL(s);
    return true;
  } catch (err) {
    return false;
  }
};
/* uppercase all request methods e.g. get -> GET
*  default method = GET
*/


function normalizeRequestMethod(method) {
  return method ? method.toUpperCase() : 'GET';
}