import libPath from "path";
import {contentType as contentTypeLookup} from 'mime-types'
import { v1 as uuidv1 } from 'uuid'
//const { v1: uuidv1 } = require('uuid')
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
  async function getAuxResources (pathname) {
    let linksExists = linksExt.filter(async ext => 
      await this.perform('ITEM_EXISTS',pathname + ext)
    )
    const links = linksExists.map( ext => pathname + ext)
    return links || [];
  }

  async function generateRandomSlug (pathname, slug = uuidv1()) {
    let requestUrl = this.mungePath(pathname, slug)
    if( this.item.isContainer && !this.request.url.endsWith(this.pathSep) )
      requestUrl = requestUrl + this.pathSep
    if( await this.perform('ITEM_EXISTS',requestUrl) )
      { slug=`${uuidv1()}-${slug}` }
    return this.mungePath(pathname, slug)
  }

export {
  createServerlessPod,
  getContentType,
  isAuxResource,
  getAuxResources,
  generateRandomSlug,
  linkExt,
  linksExt,
}
