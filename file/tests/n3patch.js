const $rdf = global.$rdf = require('rdflib');
const {SolidRestFile} = require('../');
const libUrl = require('url');

const client = new SolidRestFile();

let [tests,fails,passes,res,allfails] = [0,0,0,0];

async function main(){
  await run("file:")
  //  await run("https:")
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
  const nonRdfFile = `${folder}test.txt`;
  const ex = $rdf.Namespace(file+'#');

console.warn("\nN3 update - expected to succeed");

  // PREP : START WITH ONLY NON-RDF FILE
  //
  res = await DELETE(file)
  res = await PUT(nonRdfFile,"some text","text/plain")

  // 200 N3 INSERT TO INEXISTANT RESOURCE, CREATES RESOURCE
  //
  res = await PATCH(file,`solid:inserts {ex:This a ex:Test.} .`);
  res2 = await matchRdfType( ex('This'), ex("Test") );
  ok("200 insert to inexistant resource creates resource",res.status==200 && res2, res2)

  // 200 N3 INSERT TO EXISTING RESOURCE, UPDATES RESOURCE
  //
  res = await PATCH(file,`solid:inserts {ex:This a ex:BadTest.} .`);
  res2 = await matchRdfType( ex('This'), ex("BadTest") );
  ok("200 insert to existing resource",res.status==200 && res2, res2)

  // 200 N3 DELETE EXISTING TRIPLE
  //
  res = await PATCH(file,"solid:deletes { ex:This a ex:BadTest. } .");
  res2 = await matchRdfType( ex('This'), ex("BadTest") );
  ok("200 delete existing triple",res.status==200 && !res2, res2)


  // 200 SPARQL INSERT TRIPPLE & DELETE EXISTING TRIPLE
  //
  res = await PATCH(file,"solid:inserts { ex:This a ex:GoodTest. }; solid:deletes { ex:This a ex:Test. }.");
  res2 = await matchRdfType( ex('This'), ex("Test") );
  res3 = await matchRdfType( ex('This'), ex("GoodTest") );
  ok("200 insert new triple & delete existing triple",res.status==200 && !res2 && res3, res3)

  // 200 SPARQL DELETE EXISTING TRIPLE WITH WHERE CLAUSE
  //
  await PATCH(file,"solid:inserts { ex:This a ex:Chutzpah. }.");
  res = await PATCH(file,"solid:deletes { ex:This a ex:GoodTest. };\nsolid:where { ex:This a ex:Chutzpah. }.");
  res2 = await matchRdfType( ex('This'), ex("GoodTest") );
  res3 = await matchRdfType( ex('This'), ex("Chutzpah") );
  ok("200 delete existing triple with where clause",res.status==200 && !res2 && res3)

  // 200 SPARQL INSERT WITH MULTIPLE CLAUSES AND TRIPLES
  //
  res = await PATCH(file,"solid:inserts { ex:This a ex:A, ex:B. ex:This a ex:C. }.");
  ok("200 insert with multiple clauses and triples",
    res.status == 200 && 
    await matchRdfType( ex('This'), ex("A") ) &&
    await matchRdfType( ex('This'), ex("B") ) &&
    await matchRdfType( ex('This'), ex("C") ) 
  )

console.log("\nN3 update - expected to fail");

  // 400 SPARQL solid:inserts WITH BAD CONTENT
  //
  res = await PATCH(file, "ceci n'est pas sparql");
  ok("400 invalid patch content",res.status==400, res)

  // 400 SPARQL PATCH WITH MULTIPLE solid:inserts STATEMENTS
  //
  res = await PATCH(file,"solid:inserts { ex:This a ex:G. }\nsolid:inserts { ex:This a ex:H. }.");
  ok("400 can't have multiple solid:inserts statements in a patch",res.status==400, res)

  // 404 SPARQL DELETE INEXISTING FILE
  //
  res = await PATCH(file+"junk","DELETE { ex('This') a <#BadTest>. }");
  ok("409 can't delete from a file that doesn't exist",res.status==409, res)

  // 409 SPARQL DELETE INEXISTING TRIPLE
  //
  res = await PATCH(file,"solid:deletes { ex:This a ex:NoSuchThing. }.");
  ok("409 can't delete a triple that doesn't exist",res.status==409, res)

  // 409 SPARQL solid:inserts ON NON-RDF FILE
  //
  res = await PATCH(nonRdfFile,"solid:inserts { ex('This') a <#Test>. }");
  ok("409 can't patch patch a non-rdf file",res.status==409, res)

  // 409 SPARQL ATTEMPT TO PATCH A CONTAINER
  //
  res = await PATCH(folder,"solid:inserts { ex('This') a <#Test>. }");
  ok("409 can't patch a Container",res.status==409, res)

  // 415 SPARQL solid:inserts WITH BAD CONTENT-TYPE
  //
  res = await PATCH(file,"solid:inserts { ex('This') a <#Test>. }.",'fake-contentType');
  ok("415 invalid patch content-type",res.status==415, res)

  // CLEANUP
  //
  await DELETE(file)
  await DELETE(nonRdfFile)
  await DELETE(folder);

  let total = 13;
  let skipped = total - passes - fails;
  console.warn(`${passes}/${total} tests passed, ${fails} failed, ${skipped} skipped\n`);
  allfails = allfails + fails
}
// =========================================================== //
// REST METHODS                                                //
// =========================================================== //
async function PATCH(url, patchContent,ctype){
  patchContent = `
    @prefix solid: <http://www.w3.org/ns/solid/terms#> .
    @prefix ex: <${url+'#'}> .
    <> a solid:InsertDeletePatch ;
    ${patchContent}
  `;
  return await client.fetch(url, {
    method: 'PATCH',
    body:patchContent,
    headers:{
      'Content-Type': ctype || "text/n3",
    },
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

// ============================================== //

async function matchRdfType( subject, object ) {
  const kb = $rdf.graph();
  const fetcher = $rdf.fetcher(kb,{fetch:client.fetch.bind(client)});
  const RDF = $rdf.Namespace("http://www.w3.org/1999/02/22-rdf-syntax-ns#");
  subject = $rdf.sym(subject);
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
    if(a && a.match && a.match(/^@@@/)) continue;
    console.warn(a)
  }
}
