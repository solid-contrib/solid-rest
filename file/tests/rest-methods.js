/* =========================================================== */
/* REST METHODS                                                */
/* =========================================================== */
async function GET(url){
  return await global.client.fetch( url, {method:"GET"} )
}
async function HEAD(url){
  return await global.client.fetch( url, {method:"HEAD"} )
}
async function EXISTS(url){
  try {
    let res = await global.client.fetch( url, {method:"HEAD"} );
    return res.ok;
  }
  catch(e){ return false; }
}
async function PUT(url,text){
  return await global.client.fetch( url, {method:"PUT",body:text,headers:{"content-type":"text/turtle"}} )
}
async function PATCH(url, patchContent, patchContentType){
  return await global.client.fetch(url, {
    method: 'PATCH',
    body:patchContent,
    headers:{
      'Content-Type': patchContentType,
      link: '<http://www.w3.org/ns/ldp#Resource>; rel="type"'
    },
    relative: true
  })
} 
async function DELETE(url){
  return await global.client.fetch( url, {method:"DELETE"} )
}
async function POST(parent,item,content,link){
  return await global.client.fetch( parent,{
    method:"POST",
    headers:{slug:item,link:link,"content-type":"text/turtle"},
    body:content
  })
}
async function postFile(parent,file,content){
  let link = '<http://www.w3.org/ns/ldp#Resource>; rel="type"'
  return POST(parent,file,content,link)
}
async function postFolder(parent,folder){
  let link ='<http://www.w3.org/ns/ldp#BasicContainer>; rel="type"'
  return POST(parent,folder,'',link)
}
module.exports = { GET, HEAD, EXISTS, PUT, PATCH, DELETE, POST, postFile, postFolder }
