import {Dropbox} from "dropbox";
//import SolidRest from "@solid-rest/core";
import SolidRest from "../../../core";

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
  async login(options){
    try {
      this.dbx = new Dropbox({ accessToken: options.access_token });
      return true;
    }
    catch(e){ 
      console.log("Dropbox login error : ",e.status)
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
      console.log("Dropbox getItemInfo error : ",e.status,e.statusText)
      return { headers: {
        status:e.status||500,
        statusText:e.error,
      }}; 
    }
  }

  /**
   * read a folder
   * @param filePath
   * @return on success : folder contents with fields path, name, isContainer
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
      console.log("Dropbox getContainer error : ",path,e.status)
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
    if( pathname.endsWith('/') ) return getContainer(pathname);
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

  /**
   * write a file
   * @param filePath
   * @param content
   * @param content-type
   * @return on success : 200 if pre-existed, 201 otherwise
   * @return on failure false
   */
  async putResource(pathname, content, ctype) {
    try {
      await this.dbx.filesUpload({
        path:pathname,
        content:content,
      });
    }
    catch(e){ 
      console.log("Dropbox putResource error : ",e.status)
      return { headers: {
        status:e.status,
        statusText:e.error,
      }}; 
    }
  }

  /**
   * create folder
   * @param filePath
   * @return true on success, false on failure
   */
  async postContainer(fn) {
    fn = fn.replace(/\/$/, '');
    try {
      await this.dbx.filesCreateFolderV2({path:fn});
    }
    catch(e){ 
      console.log("Dropbox postContainer error : ",e.status)
      return { headers: {
        status:e.status,
        statusText:e.error,
      }}; 
    }
  }

  /**
   * create parent and intermediate folders
   * @param filePath
   * @return true on success, false on failure
   */
  async makeContainers(pathname) {
    const foldername = libPath.dirname(pathname);

    if (!fs.existsSync(foldername)) {
      try {
        fs.mkdirpSync(foldername);
        return Promise.resolve(true);
      } catch {
        return Promise.resolve(false);
      }
    }

    return Promise.resolve(true);
  }

  /**
   * delete file
   * @param filePath
   * @return true on success, false on failure
   */
  async deleteResource(fn) {
    try {
        console.log('deleting ',fn);
        //  await this.dbx.filesDelete({path:fn});
    }
    catch(e){ 
      console.log("Dropbox deleteResource error : ",e.status)
      return { headers: {
        status:e.status,
        statusText:e.error,
      }}; 
    }
  }

  /**
   * delete folder
   * @param filePath
   * @return true on success, false on failure
   */
  async deleteContainer(fn) {
    try {
      let files = await this.getContainer(fn);
      if(files && files.length > 0){
        console.log('Refusing to delete folder - not empty! ',fn);
        return 409;
      }
      else {
        console.log('deleting ',fn);
        //  await this.dbx.filesDelete({path:fn});
      }
    }
    catch(e){ 
      console.log("Dropbox deleteResource error : ",e.status)
      return { headers: {
        status:e.status,
        statusText:e.error,
      }}; 
    }
  }

} 
// THE END!


