const concatStream = require('concat-stream')
const Readable = require('stream').Readable
const path = require("path");
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

async  getObjectType(fn,request){
    request = request.request || request;
    fn = fn.replace( request.protocol+'//','')
    let stat;
    try { stat = fs.lstatSync(fn); }
    catch(err){}
    let read=true,write=true;
    if( stat ) {
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
    }
    let type   = ( stat && stat.isDirectory()) ? "Container" : "Resource";
    if(!stat && fn.endsWith('/')) type = "Container"
    stat = stat ? true : false
    let item = {
      mode : mode,
      exists : stat,
      isContainer : type==="Container" ? true : false,
    }
    return Promise.resolve( [type,stat,mode,item] )
}

async getResource(pathname,options,objectType){
  // const bodyData = await fs.createReadStream(pathname)
  const bodyData = await fs.readFile(pathname)
  return [
    200,
    bodyData
  ]
}

/*
async putResource(pathname,options){
    return new Promise((resolve) => {
        options.body = this._makeStream( options.body );
        options.body.pipe(fs.createWriteStream(pathname)).on('finish',()=>{
          resolve( [201] )
        }).on('error', (err) => { 
          if(options.method==="PUT" && options.objectType==="Container")
            resolve( [405] )
          resolve( [500] )
        })
    })
}
*/
async putResource(pathname,request,item){
    let successCode = 201;
    let failureCode = 500;
    return new Promise(async (resolve) => {
        let writeIt=false
        if(typeof request.body==="undefined") request.body = ""
        if(typeof request.body==="string"){
          writeIt=true
        }
        else if(request.body.stream){
            request.body = await request.body.stream()
            request.body = await request.body.read()
            writeIt=true
        }
        else if(request.body.text){
            request.body = await request.body.text()
            writeIt=true
        }
        if(writeIt){
            try {
                await fs.writeFileSync(pathname,request.body)
                return resolve([successCode])
            }
            catch(e){ console.log(e); return resolve([failureCode])}
        }
        if(!request.body.pipe && typeof FileReader !="undefined"){
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
            fileReader.readAsArrayBuffer(request.body);
        }
        else {
            request.body = request.body || ""
            request.body = this._makeStream( request.body );
            request.body.pipe(fs.createWriteStream(pathname)).on('finish',()=>{
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
            if(err)  resolve( [409] );
            else     resolve( [200] );
        });
    });
}

deleteContainer(fn) {
  return new Promise(function(resolve) {
        fs.rmdir( fn, function(err) {
            if(err) {
                resolve( [409] );
            } else {
                resolve( [200] );
            }
        });
    });
}
postContainer(fn,options){
  fn = fn.replace(/\/$/,'');
  return new Promise(function(resolve) {
    if(fs.existsSync(fn)){
      return resolve( [201] )
    }
    fs.mkdirp( fn, {}, (err) => {
      if(err) {
        return resolve( [500] )
      } 
      else {
        return resolve( [201] )
      }
    });
  });
}
async makeContainers(pathname){
  const foldername = path.dirname(pathname)
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
