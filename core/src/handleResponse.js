/*
          url : file:///foo/bar.txt
     location : /foo/bar.txt
 ldp:contains : bar.txt
*/
//import libPath from 'path';
import { Response, Headers } from 'cross-fetch';
import { v4 as uuid } from 'uuid';
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
  let method = originalRequest.method || this.request.method || "GET";
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
    let fr  = response ? 201 : 500;
    fr = fr===201 && method.match(/(GET|HEAD)/) ?200 :201;
    if( method.match(/OPTIONS/) ) fr = 204;
    finalResponse.headers.status = fr
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

  if(method.match(/(PUT)/) && finalResponse.headers.status == 200){
    finalResponse.headers.status = 201 
  }
  if(method.match(/(DELETE|GET|HEAD)/) && finalResponse.headers.status == 201){
    finalResponse.headers.status = 200 
  }

  let headers = {};
  const request = this.requestObj;
  const item = this.item;

  const pathname = item.pathname;

  // const fn = libPath.basename(pathname); 
  const fn = pathname.replace(/.*\//,''); 

  headers['content-type'] = this.item.contentType; // CONTENT-TYPE	  

  headers.link = headers.link || createLinkHeader(item); // LINK

  headers.allow = createAllowHeader(this.patch, this.item.mode); // ALLOW

  headers['wac-allow'] = createWacHeader(this.item.mode); // WAC-ALLOW

  headers.date = headers.date || new Date(Date.now()).toISOString(); // DATE

  headers['x-powered-by'] = headers['x-powered-by'] || (await this.perform('STORAGE_NAME')); // LOCATION (we pre-populated this in performRequestedMethod.js) // X-POWERED-BY

  if (this.response && this.response.headers) headers.location = this.response.headers.location;

  //  NO, DON'T USE LOCATION headers.url = headers.location || pathname ;
  headers.url = pathname ;
  if(method==="POST"){
    headers.url = this.request.url;
/*
    // NO, DON'T ADD SLUG headers.url = this.request.url + this.request.slug;
    let cont = await this.perform('ITEM_TYPE',pathname);
    if(cont==="Resource") {
      headers.url = headers.url.replace(/\/$/,'');
      headers.url = headers.url.replace(/\/[^\/]*$/,'');
    }
    if(!headers.url.endsWith('/')) headers.url=headers.url+"/";
*/
  }
  if (this.patch) {                        // ACCEPT-PATCH & MS-AUTHOR-VIA
    headers['accept-patch'] = ['application/sparql-update'];
    headers['ms-author-via'] = ["SPARQL"];                   
  }


  let body = finalResponse.body || this.response.body || ""; // Now we merge headers we created with response headers, prefering response

  Object.assign(headers, finalResponse.headers);
//alert(finalResponse.headers.status)
  headers.status = finalResponse.headers.status || this.response.headers.status || 500;

  async function serialize(uri,body,informat,outformat){
    return new Promise( async (resolve,reject)=>{
      let u = $rdf.sym(uri);
      let kb = $rdf.graph();
      await $rdf.parse(body, kb, uri, informat); 
      $rdf.serialize(u, kb, uri,outformat,(err, str)=>{
        if(err) return( reject(err) );
        else return( resolve(str)  );
      });
    })
  }

  let accept = this.request.headers.accept;
  accept = accept && accept.match(/ /) ?null :accept;
  if(accept){
    if( accept.match(/(text\/turtle|application\/ld\+json)/) ){
      body = await serialize(this.request.url,body.toString(),this.item.contentType,accept)
    }
    else {
      headers.status = "405";
      headers.statusText = `Unsupported content-type in accept header : ${accept}`;
    }
  }

  headers.statusText = headers.statusText || statusText[headers.status]; 

  headers.etag = `W/"${uuid()}"`;
  headers['content-length'] = (typeof Buffer !='undefined') ?Buffer.byteLength(body,'utf8') :(typeof Blob!="undefined") ?(new Blob([body])).size :77;

  // Now we create & return the Response object
  for(var h of Object.keys(headers)){
    if(! headers[h]) delete headers[h];
  }

  if(!headers.url.match(/:/)) headers.url = (this.prefix||"file:") + "//"+headers.url;

//  headers.location = headers.location || headers.url.replace(/^....?:\/\//,'');


//  if(!headers.location.match(/^file:/)) headers.location = "file://"+headers.location;

if(originalRequest.method==='HEAD') {
  body = "";
  for(let k of Object.keys(headers)){
    body = body + `${k}:${headers[k]}\n`;
  }
}

  if (originalRequest.plainResponse) {
    // from a server that wants to munge
    return {
      status:headers.status,
      statusText:headers.statusText,
      body: body,
      headers: headers,
      url:headers.url,
      location:headers.location,
    };
  }
wrapHeaders = true;
  headers = wrapHeaders ? {
    status:headers.status,
    statusText:headers.statusText,
    headers: headers,
    location:headers.location,
    url:headers.url

  } : headers;
  let responseObject;

  

  try {
    responseObject = new Response(body, headers,{url:headers.url});
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
  let isContainer = item.isContainer;
  let fn = item.pathname.replace(/\/$/,'');
  fn = fn.replace(/.*\//,'');
  let ext = item.extension;
  if (ext === '.acl') // .acl not controlledBy or describedBy anything
    return `<http://www.w3.org/ns/ldp#Resource>; rel="type"`;
  else if (ext === '.meta') {
    return `<${fn}.acl>; rel="acl",` // .meta controlledBy .meta.acl
        + `<http://www.w3.org/ns/ldp#Resource>; rel="type"`;
  }
  else if (isContainer) {
    return  `<.meta>; rel="describedBy", <.acl>; rel="acl",` + `<http://www.w3.org/ns/ldp#Container>; rel="type",` + `<http://www.w3.org/ns/ldp#BasicContainer>; rel="type"` + `<http://www.w3.org/ns/ldp#Resource>; rel="type"`;
  }
  else {
    let link = `<${fn}.meta>; rel="describedBy", <${fn}.acl>; rel="acl",` + `<http://www.w3.org/ns/ldp#Resource>; rel="type"`;
    return link;
  }  
} // THE END!
