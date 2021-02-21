import { Response, Headers } from 'cross-fetch';
const statusText = {
  200: "OK",
  201: "Created",
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  405: "Method Not Allowed",
  408: "Request Timeout",
  415: "Unsupported Media Type",
  418: "I'm a teapot",
  420: "Smoke 'em if you got 'em",
  500: "Server error"
};
export async function handleResponse(response, originalRequest) {
  let wrapHeaders = true; // {headers} instead of headers for Response
  let finalResponse = {
    body: "",
    headers: {}
  }; // headers from response

  /* We parse the response depending on its type
     * number  : plugins may send a simple status code
     * boolean : or send true on success, false on failure
     * object  : or send a header and optional body
     * string  : or, for get requests, send the content
  */

  if (typeof response === 'number') {
    wrapHeaders = false;
    finalResponse.headers.status = response;
  } else if (typeof response === 'boolean') {
    finalResponse.headers.status = response ? 200 : 500;
  } else if (typeof response === 'string') {
    finalResponse.headers.status = 200;
    finalResponse.body = response;
  } else if (typeof response === 'object') {
    wrapHeaders = false;
    finalResponse = response;
    finalResponse.headers = finalResponse.headers || {};
    finalResponse.headers.status = finalResponse.status;
    finalResponse.headers.statusText = finalResponse.statusText;
  } // now we create headers
  // if the response already has some of them, those will replace our
  // constructed ones later


  let headers = {};
  const request = this.requestObj;
  const item = this.item;
  const pathname = this.item.pathname;
  const fn = this.basename(pathname, item.pathHandler); // CONTENT-TYPE	  

  headers['content-type'] = this.item.contentType; // LINK

  headers.link = headers.link || createLinkHeader(this.item); // ALLOW

  headers.allow = createAllowHeader(this.patch, this.item.mode); // WAC-ALLOW

  headers['wac-allow'] = createWacHeader(this.item.mode); // DATE

  headers.date = headers.date || new Date(Date.now()).toISOString(); // X-POWERED-BY

  headers['x-powered-by'] = headers['x-powered-by'] || (await this.perform('STORAGE_NAME')); // LOCATION (we pre-populated this in performRequestedMethod.js)

  if (this.response && this.response.headers) headers.location = this.response.headers.location; // ACCEPT-PATCH & MS-AUTHOR-VIA

  if (this.patch) {
    headers['accept-patch'] = ['application/sparql-update'];
    headers['ms-author-via'] = ["SPARQL"];
  }

  const body = finalResponse.body || this.response.body || ""; // Now we merge headers we created with response headers, prefering response



  Object.assign(headers, finalResponse.headers);
  headers.status = headers.status || this.response.headers.status || 500;
  headers.statusText = headers.statusText || statusText[headers.status]; 
  // Now we create & return the Response object

  if (originalRequest.plainResponse) {
    // from a server that wants to munge
    return {
      status:headers.status,
      statusText:headers.statusText,
      body: body,
      headers: headers
    };
  }

  headers = wrapHeaders ? {
    status:headers.status,
    statusText:headers.statusText,
    headers: headers
  } : headers;
  let responseObject;

  try {
    responseObject = new Response(body, headers);
  } catch (e) {
    console.log("Error " + e);
  }

  return responseObject;
} // end of handleResponse method
// Utility methods for creating headers

function createWacHeader(mode) {
  if (!mode.read && !mode.write) return null;
  if (mode.read && !mode.write) return `user="read",public="read"`;
  if (!mode.read && mode.write) return `user="append write control",public=""`;
  return `user="read write append control",public="read"`;
}

function createAllowHeader(patch, mode) {
  return 'OPTIONS,HEAD' + (mode.read ? ',GET' : '') + (mode.write ? ',POST,PUT,DELETE' : '') + (mode.write && patch ? ',PATCH' : '');
}

function createLinkHeader(item) {
  let ext = item.extension;
  let isContainer = item.isContainer;
  let link;
  if (ext === '.acl') // .acl not controlledBy or describedBy anything
    return `<http://www.w3.org/ns/ldp#Resource>; rel="type"`;else if (ext === '.meta') {
    return;
    `<${fn}.acl>; rel="acl",` // .meta controlledBy .meta.acl
    + `<http://www.w3.org/ns/ldp#Resource>; rel="type"`;
  } else if (isContainer) {
    return;
    `<.meta>; rel="describedBy", <.acl>; rel="acl",` + `<http://www.w3.org/ns/ldp#Container>; rel="type",` + `<http://www.w3.org/ns/ldp#BasicContainer>; rel="type"` + `<http://www.w3.org/ns/ldp#Resource>; rel="type"`;
  } else {
    return;
    `<${fn}.meta>; rel="describedBy", <${fn}.acl>; rel="acl",` + `<http://www.w3.org/ns/ldp#Resource>; rel="type"`;
  }
} // THE END!
