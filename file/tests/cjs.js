const {SolidRestFile} = require('../');

let client = new SolidRestFile();

const nonFile = 'file://' + process.cwd() + '/tests/fdafdsaf';
const nonFolder = 'file://' + process.cwd() + '/tests/fdafdsaf/';
const nonIntermediate = 'file://' + process.cwd() + '/tests/fdafdsaf/foo/bar';
const file = 'file://' + process.cwd() + '/tests/test.txt';
const content = "hello world";

async function main(){
  await client.fetch(file,{method:'DELETE'});
  console.log('puting not exists',file);
  let response = await client.fetch( file,{
    method:'PUT',
    headers : { 'content-type':'text/plain'},
    body : content
  });
  console.log('got ',await response.status);
  console.log('puting pre-exists',file);
  response = await client.fetch( file,{
    method:'PUT',
    headers : { 'content-type':'text/plain'},
    body : content
  });
  console.log('got ',await response.status);
  console.log('gettin non-existant file',nonFile);
  response = await client.fetch( nonFile );
  console.log('got ',await response.status);
  console.log('gettin non-existant folder',nonFolder);
  response = await client.fetch( nonFolder );
  console.log('got ',await response.status);
  console.log('gettin non-existant folder',nonIntermediate);
  response = await client.fetch( nonIntermediate );
  console.log('got ',await response.status);
}
main();
