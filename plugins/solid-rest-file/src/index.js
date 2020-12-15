const concatStream = require('concat-stream')
const Readable = require('stream').Readable
const libPath = require("path");
const fs = require("fs-extra");

class SolidFileStorage {
  constructor() {
    this.prefix = "file"
    this.name = "solid-rest-file-1.0.0"
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
 async text (stream) {
  return new Promise((resolve, reject) => {
    stream = stream || ""
    if(typeof stream === "string") return resolve(stream);
    stream.pipe(concatStream({
      encoding: 'string'
    }, resolve())).catch(e=>{console.log(e); reject()})
    stream.on('error', reject())
  })
}
 async json (stream) {
    return text(stream).then(text => JSON.parse(text))
}

  async  itemExists(path){
    return fs.existsSync(path);
  }
  async  itemType(path,wantFull){
    let stat;
    try { stat = fs.lstatSync(fn); }
    catch(err){}
    if( !stat ) return null;
    return stat && stat.isDirectory() ? "Container" : "Resource";
  }

async  getObjectType(fn,request){
    fn = fn.replace( request.protocol+'//','')
    let type = await this.itemType(fn,'want_full');
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
    }
//    return Promise.resolve( [type,stat,mode,item] )
    return Promise.resolve( item )
}

async getResource(pathname,options,objectType){
  // const bodyData = await fs.createReadStream(pathname)
  const bodyData = await fs.readFile(pathname)
  return [
    200,
    bodyData
  ]
}

async putResource(pathname,content){
    let successCode = [200];
    let failureCode = [500];
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
                return resolve([successCode])
            }
            catch(e){ console.log(e); return resolve([failureCode])}
        }
        if(!content.pipe && typeof FileReader !="undefined"){
            var fileReader = new FileReader();
            fileReader.onload = function() {
                fs.writeFileSync(pathname, Buffer.from(
                     new Uint8Array(this.result))
                )
            }
            fileReader.onloadend = () => {
              return resolve([successCode])
            }
            fileReader.onerror = (err) => {
                console.log(err);
                return resolve([failureCode])
            }
            fileReader.readAsArrayBuffer(content);
        }
        else {
            content = content || ""
            content = this._makeStream( content );
            content.pipe(fs.createWriteStream(pathname)).on('finish',()=>{
                return resolve( [successCode] )
            }).on('error', (err) => {
                console.log(err)
                return resolve( [failureCode] )
            })
        }
    })
}
async deleteResource(fn){
    return new Promise(function(resolve) {
        fs.unlink( fn, function(err) {
            if(err)  resolve( false );
            else     resolve( [200] );
        });
    });
}

deleteContainer(fn) {
  return new Promise(async function(resolve) {
        await fs.rmdir( fn, function(err) {
            if(err) {
                resolve( false );
            } else {
                resolve( [200] );
            }
        });
    });
}
async postContainer(fn,options){
  fn = fn.replace(/\/$/,'');
  return new Promise(function(resolve) {
    if(fs.existsSync(fn)){
      return resolve( [200] )
    }
    fs.mkdirp( fn, {}, (err) => {
      if(err) {
        return resolve( false )
      } 
      else {
        return resolve( [200] )
      }
    });
  });
}
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
async getContainer(pathname) {
  return await fs.readdirSync(pathname)
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

module.exports = SolidFileStorage

/*
  linux
    /home/travis/build/jeff-zucker/solid-rest/test-folder/rest/deep-folder

  osx
    /Users/travis/build/jeff-zucker/solid-rest/test-folder/rest/deep-folder
*/
