const {SolidNodeClient} = require('solid-node-client');
const client = new SolidNodeClient();
const express = require('express');
const URL = require('url');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.text());

const port = process.argv[2] || null;
const docRoot = process.argv[3] || null;
if(!(port && docRoot)) {
  console.log("Syntax: npm run start port documentRoot.");
  console.log("   e.g. npm run start 3000 /home/me.");
  process.exit();
}

app.all('*', async (req, res) => {
  const filePath = "file://" + docRoot + req.path;
  try{
    const solidRestRequest = mungeRestRequest(req);
    const solidRestResponse = await client.fetch(filePath,solidRestRequest);
    let content = solidRestResponse.body.toString();
    res = mungeRestResponse(res,solidRestResponse);
    res.send(content);
  }
  catch(e){console.log(e)}
});
function mungeRestResponse(res,solidRestResponse){
      res.status = solidRestResponse.status;
  res.statusText = solidRestResponse.statusText;
     res.headers = solidRestResponse.headers;
         res.url = solidRestResponse.url;
    res.location = solidRestResponse.location;
  return res;
}
function mungeRestRequest(req){
  return {
     status : req.status,
    headers : req.headers,
        url : 'file://' + docRoot + req.path,
       slug : req.slug,
       body : req.body,
  }
}

app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});

