import {v4 as uuid} from 'uuid';

export default class SolidRestBrowser {

  constructor(options){
    options ||={}
    this.DEBUG = options.DEBUG || 0;
  }


  async fetch(uri,options) {
    options ||= {};
    options.method ||= 'GET';
    let fn = uri.replace(/browser:\//,'');
    const isContainer = fn.endsWith('/');
    uri = new URL( uri );
    let content;
    const success =  {
      ok:true,
      status:200,
      statusText:"OK",
      headers : {
        "etag"         : uuid(),
        "wac-allow"    : `user="read write append control",public="read"`,
        "x-powered-by" : "Solid Rest Browser",
        "date"         : (new Date()).toString(),
      },
    }
    const failure =  { ok:false, status:500 }
    if(options.method==='PUT'){
      try { 
        await this.make_containers(fn); // creates intermediate folders
        if(!isContainer) {
          await this.writeFile(fn,options.body); 
          await this.writeFile(fn+'.type',options.headers['content-type']);
        }
        success.status = "201";
        success.statusText = "Created";
        return new Response(null,success);
      }
      catch(e){ console.log(e); throw e; }
    }
    else if(options.method==='GET'){
      try { 
        if(isContainer){
          content = await this.getContainer(fn)|| ""; 
          success.headers['content-type'] = 'text/turtle';
        }
        else {
          content = await this.readFile(fn) || ""; 
          success.headers['content-type'] = await this.readFile(fn+'.type');
        }
        return new Response(content,success);
      }
      catch(e){ console.log(e); failure.statusText=e; return(failure); }
    }
    else return(failure);
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
        // self.fs.writeFile('/IndexedDB/.dummy','','utf8');
        return resolve();
      })
    });
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

  async writeFile(uri,content){
    this.log('Writing to '+uri);
    content ||= "";
    return new Promise((resolve,reject)=>{
      this.fs.writeFile(uri,content,'utf8',(err)=>{
        if(err) return reject(err);
        else return resolve();
      })
    });
  }

  async readFile(uri){
    return new Promise((resolve,reject)=>{
      this.fs.readFile(uri,'utf8',(err,content)=>{
        if(err) return reject(err);
        else return resolve(content);
      })
    });
  }

  async make_containers(pathname){
    const isContainer = pathname.endsWith('/');
    let inexistentParents = []
    // Get all parents which need to be created
    let curParent = this._getParent(pathname)
    while (curParent && !await this.exists(curParent)) {
      inexistentParents.push(curParent)
      curParent = this._getParent(curParent)
    }
//    if (!curParent) // Should not happen, that we get to the root
//      Promise.resolve();

    if(isContainer) inexistentParents.push(pathname);
    // Create missing parents
    while (inexistentParents.length) {
      let  container = inexistentParents.pop().slice(0, -1)
      this.log("Creating container ",container)
      try{
        await this.fs.mkdir(container)
      }
      catch(e){ console.warn(e); }
    }
    Promise.resolve();
  }

  _getParent(url) {
    if(typeof url==='object')url=url.href;
    while (url.endsWith('/')) url = url.slice(0, -1);
    if (!url.includes('/')) return null;
    return url.substring(0, url.lastIndexOf('/')) + '/';
  }

  async exists(pathname){
    try {        
      let res = await this.readFolder(pathname)
      if(res.code==='ENOENT') return Promise.resolve(false);
      this.log('exists',pathname)
      return Promise.resolve(true)
    }
    catch(e){ 
      try {        
        let res = await this.readFile(pathname)
        if(res.code==='ENOENT') return Promise.resolve(false);
        this.log('exists',pathname)
        return Promise.resolve(true)
      }
      catch(e){
        this.log('does not exist',pathname)
        return Promise.resolve(false) 
      }
    }
  }

  async getContainer(path){
    let folderArray = await this.readFolder(path);
    if(folderArray.code) return Promise.reject(code)
    folderArray = folderArray.filter((i)=>!i.endsWith('.type'));
    let pathname = path;
    let str = "@prefix : <#>. @prefix ldp: <http://www.w3.org/ns/ldp#>.\n" + "<> a ldp:BasicContainer, ldp:Container";
    if (folderArray.length) {
      str = str + "; ldp:contains\n";
      for (var i = 0; i < folderArray.length; i++) {
        let fn = folderArray[i];
        fn = encodeURI(fn);
        str = str + `  <${fn}>,\n`;
      }
      str = str.replace(/,\n$/, "");
    }
    str = str + `.\n`;
    return(str);
  }


  async readFolder(fn){
    return new Promise( async (resolve, reject) => {
      try {
        this.fs.readdir(fn,async (err,folderArray)=>{
          if(err) resolve(err)
          else {
              return resolve(folderArray)
          }
        })
      } catch(e) { resolve(e) }
    })
  }

  async dump(path) {
    path ||= "/" 
    path = path.replace(/^\/\//,'/');
    if(path != '/') path = path + "/";
    let top = await this.readFolder(path);
    if(typeof top === 'string') return;;
    for(let c of top){
      let contains = await this.readFolder(c);
      console.log(c,contains);
    }
  }

  log(...args){
    if(this.DEBUG) console.log(args);
  }

}
