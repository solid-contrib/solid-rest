import {v4 as uuid} from 'uuid';
import SolidRest from '../../core/';

export default class SolidRestBrowser {

  /**
   * browser backend for Solid-Rest
   * @constructor
   * @param options 
   * @return {prefix:"browser",name:"solid-rest-browser-version"}
   */
  constructor(options) {
    options ||= {};
    this.DEBUG = options.DEBUG || false;
    this.prefix = "browser";
    this.name = "solid-rest-browser-2.0.0";
    this.ext = ".priv";
    this.currentItem = {};
    return new SolidRest({
      plugin: this
    });
  }

  getPathHandler(path) {
    return {
      sep: '/',
      join: (first,next)=>{
        return(first.replace(/\/$/,'')+'/'+second.replace(/^\//,''));
      },
      extname: (path)=>{
        return path.substr(path.lastIndexOf('.') + 1);
      },
      basename: (path)=>{
        return path.substr(path.lastIndexOf('/') + 1);
      },
    };
  }
  async configure(config){
    config ||= {
      fs: "MountableFileSystem",
      options: {
        '/LocalStorage':{ fs:"LocalStorage",options:{} },
        '/HTML5FS'     :{ fs:"HTML5FS",options:{size:10000} },
        '/IndexedDB'   :{ fs:"IndexedDB",options:{storeName:"IndexedDB"} }
      }
    }
    const self = this;
    return new Promise((resolve,reject)=>{
      BrowserFS.configure( config, async function(e,fs) {
        if(e) return reject(e);
        self.fs = BrowserFS.BFSRequire('fs');
        return resolve();
      })
    });
  }
  async hybridFetch(options){
    options ||= {};
    const scheme = {
      browser : this,
      http : options.fetch
    }
    return (uri,options)=>{
      const currentScheme = uri.replace(/:\/.*/,'').replace(/s$/,'');
      return scheme[currentScheme].fetch(uri,options);
    }
  }
  async configFetcher(kb,options){
    options ||= {};
    await this.configure(options.browserFSconfig);
    if(options.httpOnly)return $rdf.fetcher(kb,options);
    const scheme = {
      browser : this,
      http : options.fetch
    }
    const schemeFetch = (uri,options)=>{
      const currentScheme = uri.replace(/:\/.*/,'').replace(/s$/,'');
      return scheme[currentScheme].fetch(uri,options);
    }
    options.fetch = schemeFetch;
    return $rdf.fetcher(kb,options);  
  }

  /**
   * create parent and intermediate folders
   * @param filePath
   * @return true on success, false on failure
   */
  async makeContainers(pathname){
    const isContainer = pathname.endsWith('/');
    let inexistentParents = []
    // Get all parents which need to be created
    let curParent = this._getParent(pathname)
    while (curParent && !await this.exists(curParent)) {
      inexistentParents.push(curParent)
      curParent = this._getParent(curParent)
    }
    if (!curParent) // Should not happen, that we get to the root
      Promise.resolve(true);

    if(isContainer) inexistentParents.push(pathname);
    // Create missing parents
    while (inexistentParents.length) {
      let  container = inexistentParents.pop().slice(0, -1)
      this.log("Creating container ",container)
      try{
        await this.createContainer(container);
      }
      catch(e){ console.warn(e); return Promise.resolve(true)}
    }
    return Promise.resolve(true);
  }
  async createContainer(path){
    await this.fs.mkdir(path);
    return await this.putMetadata(path+"/");
  }

  _getParent(url) {
    if(typeof url==='object')url=url.href;
    while (url.endsWith('/')) url = url.slice(0, -1);
    if (!url.includes('/')) return null;
    return url.substring(0, url.lastIndexOf('/')) + '/';
  }

  async getContentType(path,itemType){
    if(itemType==="Container"||path.match(/\.(ttl|acl|meta)$/)||path.endsWith('/')) return "text/turtle"
    try {
      let r = await this.getResource(path+this.ext);
      return (JSON.parse(r)).contentType;
    }
    catch(e){console.log(e);return null;}
  }
  async itemType(path) {
    let st = await this.fs.statSync(path);
    return st.isDirectory() ?"Container" :"Resource";
  }
  async exists(pathname){
    return await this.fs.existsSync(pathname);
  }
  async itemExists(pathname){
    return await this.fs.existsSync(pathname);
  }

  async getItem(){
    return this.currentItem;
  }

  /**
   * examine a requested item
   * @param filePath, request object
   * @return item object
   */
  async getItemInfo(path,request){
    let mode = {
      read: true,
      write: true,
      append: true,
      control: true
    };
    if(request.method.match(/(PUT|POST|PATCH)/)){
      await this.makeContainers(path);
    }
    let exists = await this.exists(path);
    let itemType = exists ?await this.itemType(path) : null;
    itemType ||= path.endsWith('/') ?"Container" :"Resource";
    let ctype = exists ?await this.getContentType(path,itemType) :request.headers['content-type'];
    this.currentItem = {
      fileName: path,
      path: path,
      extension: "",
      mode: mode,
      exists,
      isContainer: itemType === "Container" ? true : false,
      mimetype: ctype,
      contentType: ctype,
    };
    return(this.currentItem);
   }

  /**
   * read a file
   * @param filePath
   * @return on success : body | Response object
   * @return on failure false  | Response object
   */
  async getResource(uri){
    return new Promise((resolve,reject)=>{
      this.fs.readFile(uri,'utf8',(err,content)=>{
        if(err) return reject(err);
        else return resolve(content);
      })
    });
  }

  async getMetadata(path){
    const r = await this.getResource(path+this.ext);
    return JSON.parse(r);
  }

  async putMetadata(path,content){
    return new Promise( async (resolve,rect)=>{
      const mtime = this.currentItem.mtime = Date.now();
      const modified = this.currentItem.modified = (new Date).toUTCString();
      const size = content ?this.currentItem.size =  (new Blob([content])).size :4096;
      const contentType = this.currentItem.contentType;
      const metadata= `{
        "contentType" : "${contentType}",
        "size" : "${size}",
        "mtime" : "${mtime}",
        "modified" : "${modified}"
      }`;
      return this.fs.writeFile(path+this.ext,metadata,'utf8',(err)=>{
        if(err) return reject(err);
        else {
          return resolve(200);
        }
      })
    })
  }

  /**
   * write a file
   * @param filePath, content
   * @return true | Response object on success
   * @return false | Response object on failure
   */
  async putResource(uri,content){
    if(uri.endsWith('/')) return this.makeContainers(uri);
    this.log('Writing to '+uri);
/*
    const mtime = this.currentItem.mtime = Date.now();
    const modified = this.currentItem.modified = (new Date).toUTCString();
    const size = this.currentItem.size =  (new Blob([content])).size;
    const contentType = this.currentItem.contentType;
    const metadata = `{
      "contentType" : "${contentType}",
      "size" : "${size}",
      "mtime" : "${mtime}",
      "modified" : "${modified}"
    }`;
*/
    content ||= "";
    return new Promise((resolve,reject)=>{
      this.fs.writeFile(uri,content,'utf8',async (err)=>{
        if(err) return reject(err);
        else {
          return resolve(await this.putMetadata(uri,content));
        }
      })
    });
  }

  /**
   * create folder
   * @param filePath
   * @return true on success, false on failure
   */
  async postContainer(fn) {
    let successCode = await this.fs.existsSync(fn) ?200 :201;
    let failureCode = 500;
    fn = fn.replace(/\/$/, '');
    return new Promise(async function (resolve) {
      if (await this.fs.existsSync(fn)) {
        return resolve(successCode);
      }
      this.fs.mkdirp(fn, {}, err => {
        if (err) {
          return resolve(failureCode);
        } else {
          return resolve(successCode);
        }
      });
    });
  }

  /**
   * delete file
   * @param filePath
   * @return true on success, false on failure
   */
  async deleteResource(fn) {
    return new Promise(function (resolve) {
     try {
      fs.unlink(fn, function (err) {
        if (err) resolve(false);else resolve(true);
      });
     } catch(e) { console.log(e); resolve(false) }
    });
  }

  /**
   * delete folder
   * @param filePath
   * @return true on success, false on failure
   */
  async deleteContainer(fn) {
    return new Promise(async function (resolve) {
     try {
      await fs.rmdir(fn, function (err) {
        if (err) {
          resolve(false);
        } else {
          resolve(true);
        }
      });
    } catch(e) { console.log(e); resolve(false) }
    });
  }

  async getContainer(fn){
    return new Promise( async (resolve, reject) => {
      try {
        this.fs.readdir(fn,async (err,folderArray)=>{
          if(err) resolve(err)
          else {
            let newArray=[];
            for(let f of folderArray){
              if(!f.endsWith(this.ext)){
                newArray.push(await this.getItemInfo(fn+f,{method:'GET'}) );
              }
            }
//console.log(22,newArray);
            return resolve(newArray)
          }
        })
      } catch(e) { resolve(e) }
    })
  }

  async dump(path) {
    path ||= "/" 
    path = path.replace(/^\/\//,'/');
    if(path != '/') path = path + "/";
    let top = await this.getContainer(path);
    if(typeof top === 'string') return;;
    for(let c of top){
      let contains = await this.getContainer(c);
      console.log(c,contains);
    }
  }

  log(...args){
    if(this.DEBUG) console.log(args);
  }

}

