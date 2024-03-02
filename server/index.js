const {SolidNodeClient} = require('solid-node-client');
const client = new SolidNodeClient();
const express = require('express');
const URL = require('url');
const path = require('path')
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.text());

const port = process.argv[2] || null;
let docRoot = process.argv[3] || null;
docRootIndex = __dirname
if(!(port && docRoot)) {
  console.log("Syntax: npm run start port documentRoot.");
  console.log("   e.g. npm run start 3000 /home/me.");
  process.exit();
}

app.all('*', async (req, res, next) => {
  let filePath = "file://" + docRoot + req.path;
  // if (req.path === '/') return res.redirect(301, 'http://localhost:3000/index.html')
  if (req.path === '/index.html') {
    // req.url = '/index.html'
    filePath = "file://" + docRootIndex + req.path
  } if (req.path.startsWith('/node_modules/mashlib/dist')) {
    filePath = "file://" + docRootIndex + req.path
  }
  // return res.sendFile(path.dirname(require.resolve('./index.html'))+'/index.html')
  try{
    const solidRestRequest = mungeRestRequest(req);
    const solidRestResponse = await client.fetch(filePath,solidRestRequest);
    let content = solidRestResponse.body.toString();
    res = mungeRestResponse(res,solidRestResponse);
    res.send(content);
  }
  catch(e){console.log(e)}
  next()
});
function mungeRestResponse(res,solidRestResponse){
      res.status = solidRestResponse.status;
  res.statusText = solidRestResponse.statusText;
     res.headers = solidRestResponse.headers;
         res.url = solidRestResponse.url;
    res.location = solidRestResponse.location;
    // https://expressjs.com/en/api.html#res.type
    // TODO more types to be tested image, json ....
    const type = res.headers.get('content-type')
    if (type.includes('html')) {
      res.type('html');
    } else if (type.includes('text')) {
      res.type('text');
    } else if (type.includes('json')) {
      res.type('json');
    }
  return res;
}
function mungeRestRequest(req){
  return {
     status : req.status,
     method : req.method,
    headers : req.headers,
        url : 'file://' + docRoot + req.path,
       slug : req.slug,
       body : req.body,
  }
}

app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});
