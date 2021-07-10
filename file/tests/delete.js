const $rdf = global.$rdf = require('rdflib');
const {SolidRestFile} = require('../');
const client = global.client = new SolidRestFile();
const rest = require('./rest-methods');

const base = "file://"+process.cwd()+"/ztest/"
const deep = "file://"+process.cwd()+"/ztest/deep/"

const files = [
  base+"foo.txt",
  deep+"foo.txt",
];
const auxFiles = [
  base+".acl",
  base+".meta",
  base+"foo.txt.acl",
  base+"foo.txt.meta",
  base+"foo.txt.meta.acl ",
  deep+".acl",
  deep+".meta",
  deep+"foo.txt.acl",
  deep+"foo.txt.meta",
  deep+"foo.txt.meta.acl ",
];

async function main(resource){
  for(let file of files.concat(auxFiles)){
    await rest.PUT(file);
  }
  if( await rest.EXISTS(files[5]) ) console.log( "Folder & files created." );
  for(let file of files){
    if( !file.endsWith('.acl') && !file.endsWith('.meta') )
      await rest.DELETE(file);
  }
  if( ! await rest.EXISTS(files[5]) ) console.log( "Files deleted." );
  await rest.DELETE(base);
  if( ! await rest.EXISTS(base) ) console.log( "Folder deleted." );
}
main();

