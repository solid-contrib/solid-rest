const $rdf = global.$rdf = require('rdflib');
const {SolidRestFile} = require('../');
const client = new SolidRestFile();
const uri = "file://"+process.cwd()+"/test.ttl";
//const uri = "https://jeff-zucker.solidcommunity.net/public/test.ttl";

(async ()=>{
  let r = await client.fetch( uri, {
    method:'PUT',
    body:'<#This> <#isA> <#Foo>.',
    headers:{"content-type":"text/turtle"}
  });
  console.log( r.status );
  r = await client.fetch( uri, {
    method:'GET',
    headers:{"accept":"application/ld+json"}
  });
  console.log( r.status );
  console.log( await r.text() );
})();
