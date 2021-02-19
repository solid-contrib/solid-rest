import {SolidRestFile} from '../';

let client = new SolidRestFile();
const file = 'file://' + process.cwd() + '/tests/test.txt';
const content = "hello world";

async function main(){
  console.log('puting ',file);
  let response = await client.fetch( file,{
    method:'PUT',
    headers : { 'content-type':'text/plain'},
    body : content
  });
  console.log('got ',await response.status);
  console.log('fetching ',file);
  response = await client.fetch( file )
  console.log('got ',await response.text());
}
main();
