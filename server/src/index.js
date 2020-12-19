import SolidRest from '../../src/index.js';
import SolidRestFile from '../../plugins/solid-rest-file/src/index.js';
import express from 'express';
import {URL} from "url";
import fs from 'fs';
import bodyParser from 'body-parser';

const fileFetcher = new SolidRest({plugin:new SolidRestFile()});
const port = 8000
const base = `${process.cwd()}/myPod`

const app  = express()
app.use(bodyParser.json({extended:true}));
app.use(bodyParser.raw({extended:true}));
app.use(bodyParser.text({extended:true}));
app.use(bodyParser.urlencoded({extended:true}));
app.use( '/', express.static( base,{index:false,extensions:['ttl']} ) );

const isSpecialUrl = {
  "/inbox/":1,
  "/private/":1,
  "/profile/":1,
  "/profile/card":1,
  "/public/":1,
  "/settings/":1,
  "/.well-known/":1,
}

// Calls to / return data-kitchen.html - the DK Menu & Frame
//
app.get('/', function (req, res,next) {
  res.sendFile( base + '/data-kitchen.html' );
  return;
});

// Calls to /mashlib.html load the databrowser at a specified URI
// into the frame created by data-kitchen.html
//
app.get('/mashlib.html', async function (req, res,next) {
  res.sendFile( base+req.path ) 
  return;
});

// SSH Protocol
//
app.get('/ssh*', function (req, res,next) {
});

// Calls to Pod-structure special Urls serve static files
//
app.get('/profile/card', function (req, res,next) {
  const url = new URL( 
   req.path.replace( /^\/profile\/card/, 'file:////profile/card.ttl' ) 
  );
  fileFetch( url.href );
});

// Everything Else gets sent as a fetch request
//
app.all('/*', function (req, res,next) {
  return fileFetch(req,res);
})

function fileFetch(req,res) {
  const url = new URL( 'file://' + req.path );
  req.plainResponse=1;
  fileFetcher.fetch( url.href, req ).then( async(response)=>{
    let status="",statusText="";
    for(var h in response.headers){
      if(h==='status') status = response.headers[h];
      if(h==='statusText') statusText = response.headers[h];
      res.append(h,response.headers[h])
    }
    console.log( "%s %s %s %s", req.method, url.href, status, statusText );
    res.send( response.body );
  })
}

app.listen(port, () => {
  console.log(`Solid-Rest-Server listening at http://localhost:${port}`)
})
// THE END!
