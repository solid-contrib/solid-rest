import {SolidRestDropbox} from '../';
import {credentials} from '/home/jeff/.solid-identities.js';
const client = new SolidRestDropbox();

const access_token = credentials.dropbox.access_token;
const testFolder = 'dropbox:///';
const testFile = 'dropbox:///x.txt';

async function main(){
  await login({access_token:access_token});
  await readFolder( testFolder );
  await readFile( testFile );
}
main();

async function login(init){
   console.log("logging in ...");
   let response = await client.login(init);
   console.log("got status : ",response.status,response.statusText,"\n");
}
async function readFile(file){
   console.log("reading file ",file);
   let response = await client.fetch(file);
   console.log("got content : ",await response.text(),"\n");
   console.log("got status : ",response.status,response.statusText,"\n");
}
async function readFolder(folder){
   console.log("reading folder ",folder);
   let response = await client.fetch(folder);
   let content = await response.text();
   console.log("got container turtle : ",content.length,"\n");
   console.log("got status : ",response.status,response.statusText,"\n");
}


  
