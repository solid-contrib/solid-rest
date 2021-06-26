const {SolidRestFile} = require('./');
const auth = new SolidRestFile();
const f = `file://${process.cwd()}/head.js`;

async function test() {
  let response = await auth.fetch(f,{method:'HEAD'})
  for(var e of response.headers.entries() ){
      console.log( e )
  }
}
test();
