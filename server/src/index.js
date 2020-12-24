import SolidRest from '../../src/index.js';
import SolidRestFile from '../../plugins/solid-rest-file/src/index.js';
import express from 'express';
import {URL} from "url";
import fs from 'fs';
import bodyParser from 'body-parser';
import libPath from 'path'
// import solidWs from 'solid-ws'; // websockets
// import ldnode from 'ldnode';    // websockets
import * as $rdf from 'rdflib';
const fileFetcher = new SolidRest({
  plugin:new SolidRestFile(),
  parser: $rdf
});

const port = process.argv[2] || 7000;    // PORT
const host = "http://localhost:" + port  // HOSTNAME
const base = `${process.cwd()}/myPod`    // LOCAL FILE SYSTEM POD HOME

const app  = express()
app.use(bodyParser.json({extended:true}));
app.use(bodyParser.raw({extended:true}));
app.use(bodyParser.text({extended:true}));
app.use(bodyParser.urlencoded({extended:true}));
app.use( '/', express.static( base,{
  index:false,
//  '/databox':ldnode(), // websockets
  extensions:['ttl'],
  setHeaders: (res, requestPath) => {
    let noExtension = !Boolean(libPath.extname(requestPath));
    if(noExtension) res.setHeader('Content-Type', 'text/html');
  }
}));

const isSpecialUrl = {"/inbox/":1, "/private/":1, "/profile/":1, "/profile/card":1, "/public/":1, "/settings/":1, "/.well-known/":1, "/.acl":1,"/favicon.ico":1, "/common/":1 };
const dkTemplate = await getTemplate('data-kitchen.tmpl',port,'core');

// IF /shh* HANDLE AS SSH
//
app.get('/ssh*', function (req, res,next) {
});

// ELSE HANDLE AS FILE
//
app.all('/*', async function (req, res,next) {
  let path = req.path;
  if(req.path === '/')  { 
    path = base + req.path;
  }
  if(req.path === '/dk')  { 
    return await doRoot( req, res ); // don't delete root!
  }
  if(req.path === '/profile/card')  path = req.path + ".ttl";
  if(req.path === '/.well-known/solid/login')  
    res.setHeader('Content-type','text/html')
  if( isSpecialUrl[req.path] )      path = base + req.path
  if( req.path.match(/^\/assets/) ) path = base + req.path;
  if( req.path.match(/\.tmpl$/) ) handleTemplate( req, res );
  else return fileFetch(path,req,res);
})

app.listen(port, () => {
  console.log(`Solid-Rest-Server listening at http://localhost:${port}`)
})

async function doRoot( req, res ){

  // Don't delete or overwrite root
  //
  if( !req.method.match(/GET|HEAD|OPTIONS/) ){
    let msg = 'Cowardly refusing to change the root container!';
    console.log(msg);
    res.append('status',500);
    res.append('statusText',msg);
    res.send();
    return;
  }
  return sendTemplate( dkTemplate, res );
}

//solidWs(app, app); // websockets




// COMMUNICATION WITH SOLID REST
//
function fileFetch(path,req,res) {
  const url = new URL( 'file://' + path );
  req.plainResponse=1;
  fileFetcher.fetch( url.href, req ).then( async(response)=>{
    let status="",statusText="";
    for(var h in response.headers){
      if(h==='status') status = response.headers[h];
      if(h==='statusText') statusText = response.headers[h];
      if(h==='content-type' && path.endsWith('/') )
        response.headers[h]='text/turtle'; 
      res.set(h,response.headers[h])
// websockets
//      if(req.method==="GET")
//        res.setHeader('Updates-Via',host.replace(/^http/,'ws')
//      if(req.method==="PATCH"){
//        this should not be here, it should be inside recursive folders in PUT
//        solidWs.publish()
//      }
    }
    console.log( "%s %s %s %s", req.method, url.href, status, statusText );
    res.set("Connection", "close");
    res.send( response.body );
  })
}

// TEMPLATE HANDLING
//

async function handleTemplate( req,res ){
//  let templateName = req.path.replace('/templates/','');
  let templateName = req.path
  let templateContent = await getTemplate(templateName,port);
  if(!templateContent ){
    console.log('No template!');
    res.append('status',500);
    res.append('statusText','No template!');
    res.send()
  }
  else return sendTemplate( templateContent, res )
}

async function getTemplate( templateName, port ){
  // console.log('getting template '+templateName);
  let templateType;
  try {
/*
    if( templateName.match('Browser') ){
      templateType = templateName.substr(1,4)
      templateType = templateType==="file" ?`{username:"${host}/profile/card#me"}` : null;
      templateName = 'fileBrowser.tmpl'
    }
*/
    let path = base + "/../templates/" + templateName //+ ".tmpl";
    // console.log( 'as '+path );
    let content;
    try { content = await fs.readFileSync(path,'utf-8') } catch(e){}
    if(!content) return null;
    content = content.replace(/\$\{host\}/g,'http://localhost:' + port);
    content = content.replace(/\$\{browserType\}/g,templateType);
    return content
  } catch(e) { console.log(e) }
}
function sendTemplate( content, res ){
    res.append('status',200);
    res.append('content-type','text/html');
    res.set("connection", "close");
    res.send(content)
}

