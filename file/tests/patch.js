const $rdf = global.$rdf = require('rdflib');
const {SolidRestFile} = require('../');
const libUrl = require('url');

const client = new SolidRestFile();

let [tests,fails,passes,res,allfails] = [0,0,0,0];

async function main(){
  await run("file:")
//  await run("https:")
  // await run("mem:")
  if(allfails>0) process.exit(1)
  else process.exit(0)
}
main()

async function run(scheme){
  [tests,fails,passes] = [0,0,0]
  let cfg = await getConfig(scheme)
  let res,res2,res3;

  console.warn(`\nTesting ${cfg.base} ...`)

  const folder     = `${cfg.base}/noSuchFolder/`;
  const file       = `${folder}test.ttl`;
  const nonRDFfile       = `${folder}test.txt`;
  const sparqlType = `application/sparql-update`;
  const insTest   = `INSERT { <> a <#Test>. }`;
  const insBadTest = `INSERT { <> a <#BadTest>. }`
  const delBadTest = `DELETE { <> a <#BadTest>. }`;
  const delNoTrip   = `DELETE { <> a <#NoSuchThing>. }`;
  const insDel  = `INSERT { <> a <#GoodTest>. } DELETE { <> a <#Test>. }`;

console.log("\nSPARQL UPDATE - EXPECTED TO SUCCEED");

  /* PREP : START WITH ONLY NON-RDF FILE
  */
  res = await PUT(nonRDFfile,"some text","text/plain")
  res = await DELETE(file)

  /* 200 SPARQL INSERT TO INEXISTANT RESOURCE, CREATES RESOURCE
  */
  res = await PATCH(file,"INSERT { <> a <#Test>. }",sparqlType);
  res2 = await matchRdfType( file, file+"#Test" );
  ok("200 insert to inexistant resource creates resource",res.status==200 && res2, res2)

  /* 200 SPARQL INSERT TO EXISTING RESOURCE, UPDATES RESOURCE
  */
  res = await PATCH(file,"INSERT { <> a <#BadTest>. }", sparqlType);
  res2 = await matchRdfType( file, file+"#BadTest" );
  ok("200 insert to existing resource",res.status==200 && res2, res2)

  /* 200 SPARQL DELETE EXISTING TRIPLE
  */
  res = await PATCH(file, delBadTest, sparqlType);
  res2 = await matchRdfType( file, file+"#BadTest" );
  ok("200 delete existing triple",res.status==200 && !res2, res2)


  /* 200 SPARQL INSERT TRIPPLE & DELETE EXISTING TRIPLE
  */
  res = await PATCH(file, insDel, sparqlType);
  res2 = await matchRdfType( file, file+"#Test" );
  res3 = await matchRdfType( file, file+"#GoodTest" );
  ok("200 insert new triplee & delete existing triple",res.status==200 && !res2 && res3, res3)

  /* 200 SPARQL DELETE EXISTING TRIPLE WITH WHERE CLAUSE
  */
  await PATCH(file,"INSERT { <> a <#Chutzpah>. }",sparqlType);
  res = await PATCH(file,"DELETE { <> a <#GoodTest>. }\nWHERE { <> a <#Chutzpah>. }",sparqlType);
  res2 = await matchRdfType( file, file+"#GoodTest" );
  res3 = await matchRdfType( file, file+"#Chutzpah" );
  ok("200 delete existing triple with where clause",res.status==200 && !res2 && res3)


console.log("SPARQL UPDATE - EXPECTED TO FAIL");
  /* 400 SPARQL INSERT WITH BAD CONTENT
  */
  res = await PATCH(file, "ceci n'est pas sparql", sparqlType);
  ok("400 invalid patch content",res.status==400, res)

  /* 404 SPARQL DELETE INEXISTING FILE
  */
  res = await PATCH(file+"junk", delBadTest, sparqlType);
  ok("409 can't delete from a file that doesn't exist",res.status==409, res)

  /* 409 SPARQL DELETE INEXISTING TRIPLE
  */
  res = await PATCH(file, delNoTrip, sparqlType);
  ok("409 can't delete a triple that doesn't exist",res.status==409, res)

  /* 409 SPARQL INSERT ON NON-RDF FILE
  */
  res = await PATCH(nonRDFfile, insTest, sparqlType);
  ok("409 can't patch patch a non-rdf file",res.status==409, res)

  /* 409 SPARQL ATTEMPT TO PATCH A CONTAINER
  */
  res = await PATCH(folder, insTest, sparqlType);
  ok("409 can't patch a Container",res.status==409, res)

  /* 415 SPARQL INSERT WITH BAD CONTENT-TYPE
  */
  res = await PATCH(file, insTest, 'fake-contentType');
  ok("415 invalid patch content-type",res.status==415, res)

  /* CLEANUP
  */
  await DELETE(file)
  await DELETE(folder);

  let skipped = 11 - passes - fails;
  console.warn(`${passes}/11 tests passed, ${fails} failed, ${skipped} skipped\n`);
  allfails = allfails + fails
}
/* =========================================================== */
/* REST METHODS                                                */
/* =========================================================== */
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
  try {
    return await client.fetch( url, {method:"DELETE"} )
  }
  catch(e){ return e }
}
async function PUT(url,content){
  return await client.fetch( url, {method:"PUT",body:content,headers:{"content-type":"text/turtle"}} )
}
async function GET(url){
  return await client.fetch( url )
}

/* ============================================== */

async function matchRdfType( subject, object ) {
  const kb = $rdf.graph();
  const fetcher = $rdf.fetcher(kb,{fetch:client.fetch.bind(client)});
  const RDF = $rdf.Namespace("http://www.w3.org/1999/02/22-rdf-syntax-ns#");
  subject = $rdf.sym(subject);
  object = $rdf.sym(object);
  await fetcher.load(subject);
  let result = kb.match( subject, RDF("type"), object );
  return result ?result.length :0;
}

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
//  if(!content) console.log("No body from PATCH",resPatch);
  return resPatch.find(string => string === content)
}

async function getConfig(scheme){
  let host = scheme;
  let base;
  if(scheme==="mem:"){
    base = "mem://" // = protocol 
    host = scheme;
  }
  else if(scheme==="file:") {
     host = scheme + "//";
     base = libUrl.pathToFileURL(process.cwd()).href + "/test-folder";
  }
  else if(scheme==="https:") {
    // let session = await client.login()
    // let webId = session.WebID
    let webId = "https://jeff-zucker.solidcommunity.net/profile/card#me"
    if(! webId ) throw "Couldn't login!"
    host = webId.replace("/profile/card#me",'')
    base = webId.replace("/profile/card#me",'')+ "/public/test-folder";
  }
  host = host || base;
  const cfg = { host, base, }
  // console.log(cfg);
  return cfg;
}
console.log = (...args) => {
  for(let a of args){
    if(a.match(/^@@@/)) continue;
    console.warn(a)
  }
}
