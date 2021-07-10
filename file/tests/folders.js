const $rdf = global.$rdf = require('rdflib');
const {SolidRestFile} = require('../');
const client = global.client = new SolidRestFile();
const rest = require('./rest-methods');

const folder =  "file://"+process.cwd()+"/ztest/"

async function main(){
  let r1 = await rest.PUT(folder+".acl");
  let r2 = await rest.DELETE(folder);
  let r3 = await rest.GET(folder);
  console.log(r1.status,r2.status,r3.status);
}
main();
