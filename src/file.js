const concatStream = require('concat-stream')
const Readable = require('stream').Readable
const path = require("path");
const fs = require("fs-extra");

class SolidFileStorage {
  constructor() {
    this.prefix = "file"
    this.name = "solid-rest-file-storage-1.0.0"
  }

 _makeStream(text){
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

async  getObjectType(fn,options){
    let stat;
    try { stat = fs.lstatSync(fn); }
    catch(err){ }
    let type   = ( stat && stat.isDirectory()) ? "Container" : "Resource";
    if(!stat && fn.endsWith('/')) type = "Container"
    return Promise.resolve( [type,stat] )
}

async getResource(pathname,options,objectType){
 return new Promise((resolve) => {
  let fn = pathname.replace(/.*\//,'');    
  let success="";
  try{ 
     fs.createReadStream(pathname)
    .on("data",(chunk)=>{success=success+chunk})
    .on("error",(err)=>{console.log(err)})
    .on("end",()=>{
      return resolve( [
        200,
        success
      ])
    })
  }catch(e){}
})}

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
async deleteResource(fn){
    return new Promise(function(resolve) {
        fs.unlink( fn, function(err) {
            if(err)  resolve( [409] );
            else     resolve( [200] );
        });
    });
}
deleteContainer(fn){
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
async makeContainers(pathname,options){
      let filename = path.basename(pathname);
      let reg = new RegExp(filename+"\$")
      let foldername = pathname.replace(reg,'');
      let [t,exists] = await this.getObjectType(foldername);
      if(exists) return Promise.resolve([200])
      foldername = foldername.replace(/\/$/,'');
      await fs.mkdirpSync( foldername, {}, (err) => {
        if(err) return Promise.resolve( 500 )
        else    return Promise.resolve( 201 )
      })
      return Promise.resolve([200])
}
async getContainer(pathname,options) {
  return fs.readdirSync(pathname)
}

}
module.exports = SolidFileStorage

