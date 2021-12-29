const $rdf = global.$rdf = require('rdflib');
const {SolidRestFile} = require('../');
const client = new SolidRestFile();
const uri = `file://${process.cwd()}/head.js`;
(async()=>{
  let r = await client.fetch(uri,{method:'HEAD'});
  console.log(await r.text());
})();

