const concatStream = require('concat-stream')
const Readable = require('stream').Readable
const libPath = require("path");
const fs = require("fs-extra");
const mime = require('mime-types')

export default class SolidFileStorage {

 /**
  * file system backend for Solid-Rest
  * @constructor
  * @return {prefix:"file",name:"solid-rest-file-version"}
  */
  constructor() {
    this.prefix = "file"
    this.name = "solid-rest-file-2.0.0"
  }

 /**
  * check if file exists
  * @param {filePath:string}
  * @return {boolean}
  */
  async  itemExists(path){
    return await fs.existsSync(path);
  }

 /**
  * check if thing is Container or Resource
  * @param {filePath:string}
  * @return {null|"Container"|"Resource"}
  */
  async  itemType(path,wantFull){
    let stat;
    try { stat = await fs.lstatSync(fn); }
    catch(err){}
    if( !stat ) return null;
    return stat && stat.isDirectory() ? "Container" : "Resource";
  }

async  getItemInfo(fn,request){
    fn = fn.replace( /^file:\/\//,'')
    let mimetype = mime.lookup(fn);  // mimetype from ext
    let type = await this.itemType(fn);    // Container/Resource
    let exists = await this.itemExists(fn);
    if(!type && fn.endsWith('/')) type = "Container"
    let read=true,write=true;
    if( exists ) {
      try {
        fs.accessSync(fn,fs.constants.R_OK);
      }
      catch(e){read=false}
      try {
        fs.accessSync(fn,fs.constants.W_OK);
      }
      catch(e){write=false}
    }
    let mode = {
      read: read,
      write: write,
      append: write,
      control: write,
    }
    let item = {
      mode : mode,
      exists : exists,
      isContainer : type==="Container" ? true : false,
      mimetype : mimetype,
    }
    return Promise.resolve( item )
}

 /**
  * check if thing is Container or Resource
  * @param filePath:string
  * @return { status:number, body?:string, header?:object }
  */
  async getResource(pathname){
    let mimetype = mime.lookup(pathname);
    let bodyData;
    try {
      bodyData = await fs.readFile(pathname,mime.charset(mimetype))
    }
    catch(e) { return false }
    return bodyData 
  }

async putResource(pathname,content){
    let successCode = true;
    let failureCode = false;
    return new Promise(async (resolve) => {
        let writeIt=false
        if(typeof content==="undefined") content = ""
        if(typeof content==="string"){
          writeIt=true
        }
        else if(content.stream){
            content = await content.stream()
            content = await content.read()
            writeIt=true
        }
        else if(content.text){
            content = await content.text()
            writeIt=true
        }
        if(writeIt){
            try {
                await fs.writeFileSync(pathname,content)
                return resolve(successCode)
            }
            catch(e){ console.log(e); return resolve(failureCode)}
        }
        if(!content.pipe && typeof FileReader !="undefined"){
            var fileReader = new FileReader();
            fileReader.onload = function() {
                fs.writeFileSync(pathname, Buffer.from(
                     new Uint8Array(this.result))
                )
            }
            fileReader.onloadend = () => {
              return resolve(successCode)
            }
            fileReader.onerror = (err) => {
                console.log(err);
                return resolve(failureCode)
            }
            fileReader.readAsArrayBuffer(content);
        }
        else {
            content = content || ""
            content = this._makeStream( content );
            content.pipe(fs.createWriteStream(pathname)).on('finish',()=>{
                return resolve( successCode )
            }).on('error', (err) => {
                console.log(err)
                return resolve( failureCode )
            })
        }
    })
}

async deleteResource(fn){
    return new Promise(function(resolve) {
        fs.unlink( fn, function(err) {
            if(err)  resolve( false );
            else     resolve( true );
        });
    });
}

deleteContainer(fn) {
  return new Promise(async function(resolve) {
        await fs.rmdir( fn, function(err) {
            if(err) {
                resolve( false );
            } else {
                resolve( true );
            }
        });
    });
}
async postContainer(fn){
  fn = fn.replace(/\/$/,'');
  return new Promise(function(resolve) {
    if(fs.existsSync(fn)){
      return resolve( true )
    }
    fs.mkdirp( fn, {}, (err) => {
      if(err) {
        return resolve( false )
      } 
      else {
        return resolve( true )
      }
    });
  });
}
// return true on success
async makeContainers(pathname){
  const foldername = libPath.dirname(pathname)
  if (!fs.existsSync(foldername)) {
    try {
      fs.mkdirpSync(foldername);
      return Promise.resolve(true)
    }
    catch {
      return Promise.resolve(false)
    }
  }
  return Promise.resolve(true)
}

  // returns an array of files or false
  async getContainer(pathname) {
    let files
    try {
      files = await fs.readdirSync(pathname)
    }
    catch(e) { return false  }
    return files;
  }

  _makeStream(text){
    if (typeof text === 'object' && typeof text.stream === 'function') {
      return text.stream()
    }
       let s = new Readable
       s.push(text)
       s.push(null)  
       return s;
 }

}

/**
 * return parent url with / at the end.
 * If no parent exists return null
 * @param {string} url 
 * @returns {string|null}
 */
function getParent(url) {
  while (url.endsWith('/'))
    url = url.slice(0, -1)
  if (!url.includes('/'))
    return null
  return url.substring(0, url.lastIndexOf('/')) + '/'
}



