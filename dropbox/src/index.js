import {Dropbox} from "dropbox";
import SolidRest from "@solid-rest/core";

export class SolidRestDropbox {

  /**
   * Dropbox backend for Solid-Rest
   * @constructor
   * @return {prefix:"dropbox",name:"solid-rest-dropbox-version"}
   */
  constructor() {
    this.prefix = "dropbox"
    this.name = "solid-rest-dropbox-1.0.0"
    return new SolidRest({
      plugin: this
    });
  }

  /**
   * login to Dropbox.com
   * @param accessToken // get one in browser from Dropbox
   * @return true or error object
   */
  async login(token){
    try {
      this.dbx = new Dropbox({ accessToken: token });
      return true;
    }
    catch(e){ 
      console.log("Dropbox login error : ",e.status)
      return false;
      return { headers: {
        status:e.status,
        statusText:e.error,
      }}; 
    }
  }
  
  /**
   * examine a requested item
   * @param filePath, request object
   * @return item object
   */
  async  getItemInfo(fn,request){
    try {
      fn = fn.replace( /^dropbox:\/\/\//,'')
      if( fn.endsWith('/') ) return( {
        path : fn,
        exists : true,
        name : fn,
        isContainer : true,
        mode : { read:1,write:0,append:0,control:0 }
      });
      else return( {
        path : fn,
        exists : true,
        name : fn,
        isContainer : false,
        mode : { read:1,write:0,append:0,control:0 }
      });
      let info = await this.dbx.filesGetMetadata({ path:fn });
      let item = {
        path : info.path_lower,
        name : info.name,
        exists : true,
        isContainer : info['.tag']==='folder' ? true : false,
        mode : { read:1,write:0,append:0,control:0 }
      };
      return( item )
    }
    catch(e){ 
      console.log("Dropbox getItemInfo error : ",e.status)
      return { headers: {
        status:e.status||500,
        statusText:e.error,
      }}; 
    }
  }

  /**
   * read a folder
   * @param filePath
   * @return on success : a possibly empty array of child fileNames (not paths)
   * @return on failure : false
   */
  async getContainer(path) {
    try {
      path = path.replace( /^dropbox:\/\/\//,'')
      path = path==="/" ?"" :path;
      let container = [];
      let folder = await this.dbx.filesListFolder({path:path});
      for(var f of folder.result.entries){
        let info = await this.dbx.filesGetMetadata({
          path : f.path_lower,
        });
        container.push({
          path : f.path_lower,
          name : f.name,
          isContainer : f['.tag']==='folder' ? true : false,
        });
      }
      return container;
    }
    catch(e){ 
      console.log("Dropbox getContainer error : ",e.status)
      return { headers: {
        status:e.status,
        statusText:e.error,
      }}; 
    }
  }

  /**
   * read a file
   * @param filePath
   * @return on success : body | Response object
   * @return on failure false  | Response object
   */
  async getResource(pathname){
    try{
       let bodyData = await this.dbx.filesDownload({path:pathname})
       return bodyData.result.fileBinary;
    }
    catch(e){ 
      console.log("Dropbox getResource error : ",e.status)
      return { headers: {
        status:e.status,
        statusText:e.error,
      }}; 
    }
  }

} 

// ENDS


