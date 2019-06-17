/* 
   constructor should define the pacakage's name 
   by default this will be added to the x-powered-by header of all responses
*/
class SolidLocalStorage {
  constructor() {
    this.prefix = "ls"
    this.name = "solid-rest-localStorage-1.0.0"
    localStorage.setItem( "/", " " );
  }

/*
   getObjectType(pathname,options)
     * trys to find pathname in storage
     * if found, sets exists to true
     * sets type to "Container" or "Resource" or undefined
     * returns an array [type,exists]
*/
async getObjectType(pathname,options){
  let type = (pathname.match(/\/$/)) ? "Container" : "Resource";
  pathname = pathname.replace(/\/$/,'') // REMOVE TRAILING SLASH
  let exists = false
  let keys = Object.keys(localStorage)
  for(var k in keys) {
    let item = keys[k]
    if(type==="Container" && item.startsWith(pathname)){ exists=true; break }
    if(item === pathname){ exists=true; break }
  }
  return [type,exists] 
}

/*
  getResource(pathname,options)
    * gets a resource
    * on success, returns [ 200, resourceContents, optionalHeader ]
    * on failure, returns [ 500, undefined, optionalHeader ]
*/
async getResource(pathname,options){
  try { 
    let body = localStorage.getItem( pathname );
    return Promise.resolve( [ 200, body ] )
  }
  catch(e){ Promise.resolve( [500] ) }
}

/*
  getContainer(pathname,options)
    * returns an array of the container's contained resource names
    * OR returns a turtle representation of the container and contents
*/
async getContainer(pathname,options) {
  let files = Object.keys(localStorage).filter( k=>{
    if(k.startsWith(pathname) && k != pathname){ return k }
  }).map(v=>{return v.replace(pathname,'')})
  return files
}

dump(pathname,options) {
  let keys = Object.keys(localStorage).filter(k=>{
    if(!k.match(/(setItem|getItem|removeItem)/)) return k
  }).map(m=>{
    console.log( m, localStorage.getItem(m) )
  })
}
clear() {
  let keys = Object.keys(localStorage).filter(k=>{
    if(!k.match(/(setItem|getItem|removeItem)/)) return k
  }).map(item=>{
    this.deleteResource(item)
  })
}

/*
   putResource(pathname,options)
     * creates a single Resource
     * on success : status = 201
     * on error : status = 500
     * returns [status,undefined,optionalHeader]
*/
async putResource(pathname,options){
  options = options || {};
  options.body = options.body || "";
  try { 
    localStorage.setItem( pathname, options.body );
    return Promise.resolve( [201] )
  }
  catch(e){ console.log(e); return Promise.resolve( [500] ) }
}

/*
   postContainer(pathname,options)
      * creates a single Container
      * on success : status = 201
      * on error : status = 500
      * returns [status,undefined,optionalHeader]
*/
async postContainer(pathname,options){
  pathname = pathname + '/'     // because wasn't on slug
  return this.putResource(pathname,options)
}

/*
  deleteResource(pathname,options)
    * deletes a resource
    * on success, returns [200,undefined,optionalHeader]
    * on failure, returns [500,undefined,optionalHeader]
*/
async deleteResource(pathname,options){
  try {
    localStorage.removeItem(pathname)
    return Promise.resolve( [200] )
  }
  catch(e){ return Promise.resolve( [500] ) }    
}

/*
  deleteContainer(pathname,options)
    * if container is not empty, returns [409,undefined,optionalHeader]
    * else deletes container
    * on success, returns [200,undefined,optionalHeader]
    * on failure, returns [500,undefined,optionalHeader]
*/
async deleteContainer(pathname,options){
  let files = await this.getContainer(pathname,options)
  if( files.length ){ return Promise.resolve( [409] ) }
  return await this.deleteResource(pathname,options)
}

/*
  makeContainers(pathname,options)
    * if path's parent containers exist, return[200,undefined,optionalHeader]
    * else, recursively create parent containers
    * on success, return [201,undefined,optionalHeader]
    * on failure, return [500,undefined,optionalHeader]
*/
async makeContainers(pathname,options){
  let [t,exists] = await this.getObjectType(pathname);
  if(exists) return Promise.resolve(201)
//  let containers = pathname.split('/');
  return Promise.resolve( [201] )
}
}

/* 
  OPTIONAL METHODS

  see solid-rest.js code for examples of the defaults
  optionally provide your own to replace or augment the behavior

   text(stream)
     * response method to pipe text body
     * receives response body, returns piped string
   json(string)
     * response method to parse json body
     * receives response body returns a json object
   container2turtle(pathname,options,contentsArray)
     * iterates over container's contents, creates a turtle representation
     * returns [200, turtleContents, optionalHeader]
   getHeaders(pathname,options)
     * returns header fields to replace or augment default headers
*/

/*
  if it should work in nodejs, export the object
*/
if(typeof window==="undefined") {
  alert = (msg) => console.log(msg)
  localStorage = {
     getItem    : (key) => { return localStorage[key] },
     removeItem : (key) => { delete localStorage[key] },
     setItem    : (key,val) => { localStorage[key]=val },
  }
  module.exports = SolidLocalStorage
}
