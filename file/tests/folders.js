const $rdf = global.$rdf = require('rdflib');
const {SolidRestFile} = require('../');
const client = global.client = new SolidRestFile();
const rest = require('./rest-methods');

const base =  "file://"+process.cwd()+"/ztest/"

const files = [
  base+".acl",
  base+".meta",
  base+"foo.txt",
  base+"foo.txt.acl",
  base+"foo.txt.meta",
  base+"foo.txt.meta.acl ",
];

async function main(resource){
  for(let file of files){
    await rest.PUT(file);
  }
  if( await rest.EXISTS(files[5]) ) console.log( "Folder & files created." );
  for(let file of files){
    await rest.DELETE(file);
  }
  if( ! await rest.EXISTS(files[5]) ) console.log( "Files deleted." );
  await rest.DELETE(base);
  if( ! await rest.EXISTS(base) ) console.log( "Folder deleted." );
}
main();
