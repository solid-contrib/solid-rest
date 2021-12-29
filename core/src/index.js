import { getRequest } from './examineRequest.js';
import { getItem } from './examineRequestedItem.js';
import { handleRequest } from './handleRequest.js';
import perform from './performRequestedMethod.js';
import { handleResponse } from './handleResponse.js';
import { createServerlessPod, getContentType, isAuxResource, getAuxResources, generateRandomSlug } from './utils/utils.js';
import containerAsTurtle from './utils/container.js';
import RestPatch from './utils/rest-patch.js';
export default class SolidRest {
  constructor(options) {
    options = options || {};

    if (!options.plugin) {
      console.log(`You must specify a plugin storage handler!`);
      process.exit(1);
    }

    this.storage = options.plugin;
    this.handleRequest = handleRequest.bind(this);
    this.handleResponse = handleResponse.bind(this);
    this.getItem = getItem.bind(this);
    this.getRequest = getRequest.bind(this);
    this.perform = perform.bind(this);
    this.isAuxResource = isAuxResource.bind(this);
    this.getAuxResources = getAuxResources.bind(this);
    this.getContentType = this.storage.getContentType.bind(this.storage);
    this.generateRandomSlug = generateRandomSlug.bind(this);
    this.createServerlessPod = createServerlessPod.bind(this);
    if(this.storage.configFetcher) this.configFetcher = this.storage.configFetcher.bind(this.storage)
    if(this.storage.configure) this.configure = this.storage.configure.bind(this.storage)
    this.containerAsTurtle = containerAsTurtle.bind(this);
    let $rdf = options.parser ? options.parser : typeof window != "undefined" && window.$rdf ? window.$rdf : typeof global != "undefined" && global.$rdf ? global.$rdf : null;
    this.patch = options.patch = $rdf ? new RestPatch($rdf) : null;
  }

  async fetch(uri, options = {}) {
    let response = await this.handleRequest(uri, options);
    return await this.handleResponse(response, options);
  }

  async login(options) {
    options = {loginOptions:options,method:'login'};
    let response = await this.handleRequest('http://example.org/', options);
    return await this.handleResponse(response, options );
  }

  async itemExists(pathname) {
    return await this.perform('ITEM_EXISTS', pathname);
  }

  isPatchConflictError(response) {
    if (response === 400) return true;
  }

  isAccessError(response) {
    if (response === 401) return true;
  }

/* =========================================================== */
/* REST METHODS                                                */
/* =========================================================== */
async GET(url){
  return await this.fetch( url, {method:"GET"} )
}
async HEAD(url){
  return await this.fetch( url, {method:"HEAD"} )
}
async EXISTS(url){
  try {
    let res = await this.fetch( url, {method:"HEAD"} );
    return res.status==200 ?true :false;
  }
  catch(e){ return false; }
}
async PUT(url,text,ctype){
  ctype = ctype || 'text/turtle';
  return await this.fetch( url, {method:"PUT",body:text,headers:{"content-type":ctype}} )
}
async PATCH(url, patchContent, patchContentType){
  patchContentType = patchContent || "text/n3";
  return await this.fetch(url, {
    method: 'PATCH',
    body:patchContent,
    headers:{
      'Content-Type': patchContentType,
      link: '<http://www.w3.org/ns/ldp#Resource>; rel="type"'
    },
    relative: true
  })
} 
async DELETE(url){
  return await this.fetch( url, {method:"DELETE"} )
}
async POST(parent,item,content,link){
  return await this.fetch( parent,{
    method:"POST",
    headers:{slug:item,link:link,"content-type":"text/turtle"},
    body:content
  })
}
async postFile(parent,file,content){
  let link = '<http://www.w3.org/ns/ldp#Resource>; rel="type"'
  return POST(parent,file,content,link)
}
async postFolder(parent,folder){
  let link ='<http://www.w3.org/ns/ldp#BasicContainer>; rel="type"'
  return POST(parent,folder,'',link)
}

} // THE END
