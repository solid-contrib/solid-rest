"use strict";

import {getRequest} from './examineRequest.js';
import {getItem} from './examineRequestedItem.js';
import {handleRequest} from './handleRequest.js';
import perform from './performRequestedMethod.js';
import {handleResponse} from './handleResponse.js';

import {
  createServerlessPod,
  getContentType,
  isAuxResource,    isLink,
  getAuxResources,  getLinks,
  getAvailableUrl,
  linkExt,
  linksExt,
} from './utils/utils.js';
import containerAsTurtle from './utils/container.js';
const RestPatch = require('./utils/rest-patch')


let patch,pathname,pathSep,request,item;

export default class SolidRest {

constructor( options ) {
  options = options || {}
  if(!options.plugin) {
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
  this.getContentType = getContentType.bind(this);
  this.getAvailableUrl = getAvailableUrl.bind(this);
  this.containerAsTurtle = containerAsTurtle.bind(this);
/*
  createServerlessPod,
  isLink,
  getLinks,
  linkExt,
  linksExt,
*/
  let $rdf = (options.parser) ? options.parser
           : (typeof window !="undefined" && window.$rdf) ? window.$rdf
           : (typeof global !="undefined" && global.$rdf) ? global.$rdf
           : null;
  patch = options.patch = ($rdf) ? new RestPatch($rdf) : null;
  this.os = { canPatch : patch ? true :false };
}

async createServerlessPod ( base ){
  return u.createServerlessPod( base );
}

async itemExists(pathname,options){
  return (await this.storage.getObjectType(pathname, options),request)[1]
}

async fetch(uri, options = {}) {
  let request =  await this.handleRequest(uri,options);
  return await this.handleResponse(request);
/*

  if( options.method==="DELETE" ){
    return makeResponse( resOptions,
      await actions.DELETE(pathname,options,this.storage)
    );
  }

  // POST

  if( options.method==="POST"){
    let link = options.headers.link
    let slug = options.headers.Slug || options.headers.slug || options.slug
    if(slug.match(/\//)) return _response(null, resOptions, 400)
    if( link && link.match("Container") ) {
      options.resourceType="Container"
      slug = await u.getAvailableUrl(pathname, slug, options,this.storage) // jz add
      pathname = u.mungePath(pathname, slug, options)
      const [status, , headers] =  await self.storage.postContainer(pathname,options)
//      Object.assign(resOptions.headers, { location: mapPathToUrl(pathname, options) + '/' })
      Object.assign(resOptions.headers, { location: pathname + '/' })
      Object.assign(resOptions.headers, headers)
      return _response(null, resOptions, status)
    }
    else if( link && link.match("Resource")){
      options.resourceType="Resource"
      slug = await u.getAvailableUrl(pathname, slug, options,this.storage)
      pathname = u.mungePath(pathname, slug, options)
      if (u.isLink(pathname, options)) return _response(null, resOptions, 405)
      const [status, , headers] = await self.storage.putResource( pathname, options)
      Object.assign(resOptions.headers, { location: pathname })
      Object.assign(resOptions.headers, headers)
      return _response(null, resOptions, status)
    }
   
  }
  // PUT

  if (options.method === 'PUT' ) {
    const [status, undefined, headers] = await self.storage.makeContainers(pathname,options)
    Object.assign(resOptions.headers, headers)

    if(status !== 200 && status !== 201) return _response(null, resOptions, status)
    const [putStatus, , putHeaders] = await self.storage.putResource(pathname, options)

    Object.assign(resOptions.headers, putHeaders) // Note: The headers from makeContainers are also returned here

    return _response(null, resOptions, putStatus)
  }
  // PATCH
  
  if (options.method === 'PATCH' ) {

    if(!patch){
       console.log( 'TO USE PATCH, YOU MUST IMPORT rdflib IN YOUR MAIN SCRIPT AND SET global.$rdf = $rdf');
       return _response( null, resOptions, 405);
    }

    // check pathname and 'text/turtle'. TODO see if NSS allows other RD

    let content = ''
    if (objectExists) {
      const [status, contents, headers] = await self.storage.getResource(pathname,options)
      content = typeof contents === 'string' ? contents : contents.toString()
    }
    const contentType = u.getContentType(u.getExtension(pathname, options))
    if (contentType !== 'text/turtle') return _response('500 '+ pathname + ' is not a "text/turtle" file', resOptions, 500)

    // patch content
    try {
      const [patchStatus, resContent] = await patch.patchContent(content, contentType, options)
      if ( patchStatus !== 200) return _response(resContent, resOptions, patchStatus)
      options.body = resContent
      options.headers['content-type'] = contentType
    } catch (e) { throw _response(e, resOptions, parseInt(e)) }

    // PUT content to file
    if (!objectExists) {
      const [status, undefined, headers] = await self.storage.makeContainers(pathname,options)
      // TODO add patchHeaders('MS-Author-Via', 'SPARQL')
      Object.assign(resOptions.headers, headers)
      if(status !== 200 && status !== 201) return _response(null, resOptions, status)
    }
    const [putStatus, , putHeaders] = await self.storage.putResource(pathname, options)

    //Object.assign(resOptions.headers, putHeaders) // Note: The headers from makeContainers are also returned here

    let returnStatus = (putStatus === 201)  ? 200 : putStatus
    return _response(null, resOptions, returnStatus)
  }
  else {
    return _response(null, resOptions, 405)
  }

  function handleResponse(response){
    // combine the standard headers with ones returned from the action if any
    // respons = [status,body,headers]
//    Object.assign(resOptions.headers, response[2])
//    return _response( response[1], resOptions, response[0] );
    let status = response[0];
    let body =  response[1];
    let headers =  response[2];
      options.status = status;
    let headersFromPlugin = 
      typeof this.storage.getHeaders != "undefined"
          ? this.storage.getHeaders(pathname,options,item,request)
          : {}
    let name =  self.storage.name
    headers = Object.assign(
      getResponseHeader(
        pathname,options,headersFromPlugin,name,item,request
      ), 
      options.headers
    )
    return new Response(body, options)
  }
*/
  function makeResponse(resOptions,response){
    // combine the standard headers with ones returned from the action if any
    // respons = [status,body,headers]
    Object.assign(resOptions.headers, response[2])
    return _response( response[1], resOptions, response[0] );
  }

    /**
     * @param {RequestInfo} body
     * @param {RequestInit} options
     * @param {Number} status - Overrules options.status
     */
    function _response(body, options, status = options.status) {
      options.status = status;
      let headersFromPlugin = 
        typeof self.storage.getHeaders != "undefined"
          ? self.storage.getHeaders(pathname,options,item,request)
          : {}
      let name =  self.storage.name
      options.headers = Object.assign(
        getResponseHeader(
          pathname,options,headersFromPlugin,name,item,request
        ), 
        options.headers
      )
      return new Response(body, options)
    }


  } // end of fetch()

} // end of SolidRest()

// module.exports = exports = SolidRest
// module.exports.SolidRest = SolidRest


// THE END
