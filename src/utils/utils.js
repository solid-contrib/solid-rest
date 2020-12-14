import libPath from "path";
import {contentType as contentTypeLookup} from 'mime-types'
const { v1: uuidv1 } = require('uuid')
import pod from './createServerlessPod.js';

const linkExt = ['.acl', '.meta']
const linksExt = linkExt.concat('.meta.acl')

  async function createServerlessPod( base ){
    console.log(`Creating pod at <${base}>`);
    base = base.replace(/\/$/,'');
    await _makeResource( base,"/.acl", pod.acl_content );
    await _makeResource( base,"/profile/card", pod.profile_content );
    await _makeResource( base,"/settings/prefs.ttl", pod.prefs_content );
    await _makeResource(base,"/settings/privateTypeIndex.ttl",pod.private_content );
    await _.makeResource( base,"/settings/publicTypeIndex.ttl", pod.public_content );
    await _.makeResource( base,"/private/.meta", "" );
    await _.makeResource( base,"/.well-known/.meta", "" );
    await _.makeResource( base,"/public/.meta", "" );
    await _.makeResource( base,"/inbox/.meta", "" );
  }
  async function _makeResource( base, path, content ){
    let url = base + path
    console.log ( "  creating " + path )
    await this.fetch( url, {
      method:"PUT",
      body:content,
      headers:{"content-type":"text/turtle"}
    })
  }

  function getContentType(ext,type) {
     if( !ext
     || ext==='.ttl'
     || ext==='.acl'
     || ext==='.meta'
     || type==="Container"
    ) {
      return 'text/turtle'
    }
    else {
      let ctype = contentTypeLookup(ext)
      return( ctype ? ctype : 'text/turtle' )
    }
  }

  function isAuxResource(o) {
    return linkExt.find(ext => 
      this.getExtension( o ) === ext
    )
  }
  async function getAuxResources (pathname, options,storage) {
    let linksExists = linksExt.filter(async ext => 
      await storage.getObjectType(pathname + ext,options.request)[1]
    )
    const links = linksExists.map( ext => pathname + ext)
    return links || [];
  }

// TBD : remove getLinks and isLink, replace in code with isAuxResource, etc.

  function isLink(pathname,options) {
    return linkExt.find(ext => getExtension(pathname,options) === ext)
  }

/**
 * getLinks for item
 * @param {*} pathname 
 * @param {*} options 
 */
async function getLinks (pathname, options,storage) {
  let linksExists = linksExt.filter(async ext => 
    await storage.getObjectType(pathname + ext,options.request)[1]
  )
  const links = linksExists.map( ext => pathname + ext)
  return links
}


/*  getAvailableUrl - generate random prefix for POST file names
*/
async function getAvailableUrl (pathname, slug = uuidv1(), options,storage) {
  let requestUrl = mungePath(pathname, slug, options)
  if(options.resourceType==='Container' && !requestUrl.endsWith(pathSep(options.item.pathHandler))) requestUrl = requestUrl + pathSep(options.item.pathHandler)
 let urlExists = (await storage.getObjectType(requestUrl, options,options.request))[1]
 if (urlExists) { slug = `${uuidv1()}-${slug}` }
  return slug
}

export {
  createServerlessPod,
  getContentType,
  isAuxResource,    isLink,
  getAuxResources,  getLinks,
  getAvailableUrl,
  linkExt,
  linksExt,
}
