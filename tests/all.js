"use strict";


// SAME TEST SHOULD WORK FOR solid-rest AND solid-node-client
//
//const SolidNodeClient = require('../').SolidNodeClient
//const client = new SolidNodeClient()
const SolidRest = require('../')


// global.$rdf = require('rdflib') 
// const client = new SolidRest()
const $rdf = require('rdflib');
const client = new SolidRest({ parser:$rdf })

/** Silence rdflib chatty information about patch
 *  Send console.log() to a logfile
 *  Send console.error(), console.warn() and untrapped errors to screen
 */
const fs = require('fs');
const logfile = `${process.cwd()}/log.txt`;
console.log = function(msg) { fs.appendFileSync(logfile,msg.toString()) } 
process.on('uncaughtException', function(err) {
  console.error((err && err.stack) ? err.stack : err);
});

const libUrl = require('url')

let [tests,fails,passes,res] = [0,0,0]
let allfails = 0

async function main(){
  await run("app:")
  await run("file:")
  // await run("https:")
  if(allfails>0){
    process.exit(1)
  }
  else{
    process.exit(0)
  }
}
main()

async function getConfig(scheme){
  let host = scheme;
  if(scheme==="app:"){
    scheme = "app://ls" // = protocol 
    host = scheme;
  }

  // cxRes
  // else if(scheme==="file:") scheme = "file://" + process.cwd()
  else if(scheme==="file:") {
     host = scheme + "//";
     scheme = libUrl.pathToFileURL(process.cwd()).href
  }

  else if(scheme==="https:") {
   let session = await client.login()
   let webId = session.webId
   if(! webId ) throw "Couldn't login!"
    host   = webId.replace("/profile/card#me",'')
    scheme = webId.replace("/profile/card#me",'')+"/public"
  }
  host = host || scheme;
//  host = host || "";

  /*
   * we assume that test-folder exists and is empty
  */
  let  base   = scheme + "/test-folder"
  let  c1name = "rest/"
  let  c2name = "deep-folder"
  let  r1name = "test1.ttl"
  let  r2name = "test2.ttl"
  let  meta = '.meta'
  let  folder1 = base +"/"+ c1name
  let  folder2 =  folder1 + c2name + "/"
  let  folder2meta = folder2 + meta
  let  deepR  =  folder2 +"test-file2.ttl"
  let  deepRacl = folder2 + "test-file2.ttl.acl"
  let  file1  = folder1 + r1name
  let  file2  = folder2 + r2name
  let  missingFolder = base + "/noSuchThing/norThis/"

  const patchSparql = `INSERT { :new <#temp> <#245>; <temp1> "n0:240" .}
  DELETE { <> a :test.}`
  const patchSparql1 = `INSERT { :new <#temp> <#245>; <temp1> "n0:240" .}
  DELETE { <> a :NONEXISTANT.}`
const patchN3_1 = (url) => `@prefix solid: <http://www.w3.org/ns/solid/terms#>.
  @prefix schem: <http://schema.org/>.
  @prefix : <#>.
  @prefix ex: <http://example.com#>.
  <> solid:patches <${url}>;
  solid:inserts { <> a :test; ex:temp :245. <#new> schem:temp1 :245; ex:temp1 :200 .}.`
const patchN3_2 = (url) => `@prefix solid: <http://www.w3.org/ns/solid/terms#>.
  @prefix schem: <http://schema.org/>.
  @prefix : <#>.
  @prefix ex: <http://example.com#>.
  <> solid:patches <${url}>;
  solid:deletes { <> a :test. }.`
const  patchN3_3 = (url) => `@prefix solid: <http://www.w3.org/ns/solid/terms#>.
  @prefix : <#>.
  @prefix ex: <http://example.com#>.
  <> solid:patches <${url}>;
  solid:deletes { <> a :test. };
  solid:where { ?a ex:temp1 :200. };
  solid:inserts { ?a ex:temp :321; ex:temp1 :250, :300. }.`
const resPatchSparql = [`@prefix : <#>.

<#new> <temp1> "n0:240"; <#temp> <#245>.

`,

`@prefix : <#>.
@prefix rest: <./>.

:new rest:temp1 "n0:240"; :temp :245 .

`]
const resPatchN3_1 = [`@prefix : <#>.
@prefix ex: <http://example.com#>.
@prefix schem: <http://schema.org/>.

<> a <#test>; ex:temp <#245>.

<#new> <temp1> "n0:240"; <#temp> <#245>; ex:temp1 <#200>; schem:temp1 <#245>.

`,
`@prefix : <#>.
@prefix rest: <./>.
@prefix ex: <http://example.com#>.
@prefix schem: <http://schema.org/>.

<> a :test; ex:temp :245 .

:new rest:temp1 "n0:240"; :temp :245; ex:temp1 :200; schem:temp1 :245 .

`]
const resPatchN3_2 = [`@prefix : <#>.
@prefix ex: <http://example.com#>.
@prefix schem: <http://schema.org/>.

<> ex:temp <#245>.

<#new>
    <temp1> "n0:240";
    <#temp> <#245>;
    ex:temp <#321>;
    ex:temp1 <#200>, <#250>, <#300>;
    schem:temp1 <#245>.
`,
`@prefix : <#>.
@prefix rest: <./>.
@prefix ex: <http://example.com#>.
@prefix schem: <http://schema.org/>.

<> ex:temp :245 .

:new
    rest:temp1 "n0:240";
    :temp :245;
    ex:temp :321;
    ex:temp1 :200, :250, :300;
    schem:temp1 :245.
`]
  let cfg =  {
    host   : host,
    base   : base,
    dummy  : base + "/dummy.txt",
    c1name : c1name,
    c2name : c2name,
    r1name : r1name,
    r2name : r2name,
    meta : meta,
    folder1 : folder1,
    folder2 : folder2,
    folder2meta : folder2meta,
    deepR  :  deepR,
    deepRacl : deepRacl,
    file1  : file1,
    file2  : file2,
    missingFolder : missingFolder,
    text   : "<> a <#test>.",
    patchN3_1 : patchN3_1(file1),
    patchN3_2 : patchN3_2(file1),
    patchN3_3 : patchN3_3(file1),
    patchSparql: patchSparql,
    patchSparql1: patchSparql1,
    resPatchSparql: resPatchSparql,
    resPatchN3_1 : resPatchN3_1,
    resPatchN3_2 : resPatchN3_2
  }
  return(cfg)
}

async function run(scheme){


  [tests,fails,passes] = [0,0,0]
  let cfg = await getConfig(scheme)
  let res
  let res1

  if(scheme==="app:")  cfg.base += "/"
  try {res=await PUT(cfg.dummy)}catch{}

  console.warn(`\nTesting ${cfg.base} ...`)

  /** POST */
  res = await postFolder( cfg.base,cfg.c1name )
  ok( "400 post container with trailing slash on slug", res.status==400,res)

  cfg.c1name = cfg.c1name.replace(/\/$/,'')

  res = await postFolder( cfg.base,cfg.c1name )
  ok( "201 post container", res.status==201,res)

  let loc = res.headers.get('location')
  ok( "post container returns location header",loc.match(`${cfg.c1name}/`))

  res = await postFolder( cfg.base,cfg.c1name )
  let cSlug = res.headers.get('location')
  ok( "post container returns location header (new slug generated)",  cfg.folder1!=cSlug && cSlug.match('-'+cfg.c1name)) 

  res = await postFolder( cfg.missingFolder,cfg.c2name )
  ok( "404 post container, parent not found", res.status==404,res)

  res = await postFile( cfg.folder1,cfg.r1name,cfg.text )
  ok( "201 post resource", res.status==201,res)

  loc = res.headers.get('location')
  ok( "post resource returns location header",  (cfg.folder1+cfg.r1name).match(loc), loc) 

//  NSS allows this and returns 201
//  res = await postFile( cfg.folder1,cfg.meta )
//  ok( "405 post aux resource", res.status==405,res)

  res = await postFile( cfg.folder1,cfg.r1name,cfg.txt )
  ok( "201 post resource, resource found", res.status==201, res )
  let slug = res.headers.get('location')
  ok( "post resource returns location (new slug generated)", slug !== cfg.r1name && slug.endsWith('-test1.ttl'),res)

  res = await postFile( cfg.missingFolder,cfg.file2 )
  ok( "404 post resource, parent not found", res.status==404,res)

  /** PUT */
  res = await PUT( cfg.folder1 )
  ok( "409 put container (method not allowed)", res.status==409,res)

  res = await PUT( cfg.file1,cfg.text )
  ok( "201 put resource", res.status==201,res)

  res = await PUT( cfg.file1,cfg.text )
  ok( "201 put resource, resource found", res.status==201,res)

  res = await PUT( cfg.deepR,cfg.text )
  ok("201 put resource, parent not found (recursive creation)",res.status==201, res)

  res = await PUT( cfg.folder2meta,cfg.text )
  ok("201 put container acl",res.status==201, res)

  res = await PUT( cfg.deepRacl,cfg.text )
  ok("201 put resource acl",res.status==201, res)

  /** HEAD */
  res = await HEAD( cfg.deepR )
  ok("200 head",res.status==200 && res.headers.get("allow"),res )

  res = await HEAD( cfg.missingFolder )
  ok("404 head resource, not found",res.status==404,res )

  /** GET */
  res = await GET( cfg.missingFolder )
  ok("404 get container, not found",res.status==404,res )

  res = await GET( cfg.file1 )
  ok("200 get resource",res.status==200 && await res.text()===cfg.text, res)

  res = await GET( cfg.folder1 )
  let type = res.headers.get("content-type")
  ok("200 get container",res.status==200 && type==="text/turtle",res)

  /** PATCH */
  res = await PATCH( cfg.file1,cfg.patchSparql, 'fake-contentType')
  ok("415 patch wrong patch contentType",res.status==415, res)

  res = await PATCH( cfg.file1,cfg.text, 'application/sparql-update' )
  ok("400 patch erroneous patchContent",res.status==400, res)

 res = await PATCH( cfg.file1,cfg.patchSparql1, 'application/sparql-update' )
 ok("409 patch failed, cannot delete not existant triple",res.status==409, res)

  res = await PATCH( cfg.file1,cfg.patchSparql, 'application/sparql-update' )
  res1 = await GET( cfg.file1 )
  ok("200 patch sparql insert, delete to existing resource",res.status==200 && testPatch(res1, cfg.resPatchSparql), res1)

  res = await PATCH( cfg.file1,cfg.patchN3_1, 'text/n3' )
  res1 = await GET( cfg.file1 )
  //console.warn(res1.statusText.toString())
  ok("200 patch n3 insert",res.status==200 && testPatch(res1, cfg.resPatchN3_1), res1)

  res = await PATCH( cfg.file1,cfg.patchN3_3, 'text/n3' )
  res1 = await GET( cfg.file1 )
  //console.warn(res1.statusText.toString())
  ok("200 patch n3 delete, insert, where",res.status==200 && testPatch(res1, cfg.resPatchN3_2), res1)

  /** DELETE */
  res = await DELETE( cfg.file1 )  // delete r1.name
  ok("200 delete resource",res.status==200,res)

  res = await DELETE( cfg.folder1 )
  ok("409 delete container, not empty",res.status==409,res)

  res = await DELETE( cfg.deepR )
  ok("200 delete resource with acl", res.status===200, res)

  res = await DELETE( cfg.folder2meta)
  ok("200 delete folder with meta", res.status===200, res)

  res = await DELETE( cfg.host + slug )
  ok("200 delete resource",res.status==200,res)

  /** Cleaning */
  res = await DELETE( cfg.base+'/dummy.txt' )
  res = await DELETE( cfg.base+'dummy.txt' )

  res = await DELETE( cfg.folder2 )
  res = await DELETE( cfg.folder1 )
  res = await DELETE( cfg.host + cSlug )
  cfg.base = cfg.base.endsWith("/") ? cfg.base : cfg.base+"/"
  res = await DELETE( cfg.base )
  ok("200 delete container",res.status==200,res)

  console.warn(`${passes}/${tests} tests passed, ${fails} failed\n`)
  allfails = allfails + fails
}
/* =========================================================== */
/* REST METHODS                                                */
/* =========================================================== */
async function GET(url){
  return await client.fetch( url, {method:"GET"} )
}
async function HEAD(url){
  return await client.fetch( url, {method:"HEAD"} )
}
async function PUT(url,text){
  return await client.fetch( url, {method:"PUT",body:text,headers:{"content-type":"text/turtle"}} )
}
async function PATCH(url, patchContent, patchContentType){
  return await client.fetch(url, {
    method: 'PATCH',
    body:patchContent,
    headers:{
      'Content-Type': patchContentType,
      link: '<http://www.w3.org/ns/ldp#Resource>; rel="type"'
    },
    relative: true
  })
} 
async function DELETE(url){
  return await client.fetch( url, {method:"DELETE"} )
}
async function POST(parent,item,content,link){
  return await client.fetch( parent,{
    method:"POST",
    headers:{slug:item,link:link,"content-type":"text/turtle"},
    body:content
  })
}
async function postFile(parent,file,content){
  let link = '<http://www.w3.org/ns/ldp#Resource>; rel="type"'
  return POST(parent,file,content,link)
}
async function postFolder(parent,folder){
  let link ='<http://www.w3.org/ns/ldp#BasicContainer>; rel="type"'
  return POST(parent,folder,'',link)
}

/* ============================================== */

function ok( label, success,res ){
   tests = tests + 1;   
   if(success) passes = passes + 1
   else fails = fails+1
   let msg = success ? "ok " : "FAIL "
   console.warn( "  " + msg + label)
   if(!success && res ) console.warn(res.status,res.statusText)
   return success
}

async function testPatch (res, resPatch) {
  let content = await res.text();
  return resPatch.find(string => string === content)
}
