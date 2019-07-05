const SolidRest         = require('../src/rest.js')
const SolidLocalStorage = require('../src/localStorage.js')
const SolidFileStorage  = require('../src/file.js')
let [tests,fails,passes] = [0,0,0]

const rest = new SolidRest([
  new SolidLocalStorage(),
  new SolidFileStorage()
  // anything can go here, it doesn't need to be pre-registered or known
  // as long as it defines a prefix app://thatPrefix will use that storage handler
])


console.log(`\n`)
restTests();

async function restTests(){
	await run( "localStorage" ).catch (e => console.log('localStorage '+ e))
	await run("file").catch( e => console.log('file '+ e))
}

async function run(storageType){

  [tests,fails,passes] = [0,0,0]
  let cfg = getConfig(storageType)

  console.log(`Testing ${cfg.folder} ...`)

  let res = await rest.fetch( cfg.file,{method:"PUT",body:cfg.text} )
  ok( "put resource", res.status==201)

  res = await rest.fetch( cfg.deepR,{method:"PUT",body:cfg.text} )
  ok( "put resource with recursive create containers", res.status==201)

  res = await rest.fetch( cfg.folder,{method:"PUT"} )
  ok( "409 on put container (method not allowed)", res.status==409)


//  let link='<http://www.w3.org/ns/ldp#BasicContainer>; rel="type"';
  let link='<http://www.w3.org/ns/ldp#Resource>; rel="type"';
  res = await rest.fetch( cfg.folder,{
    method:"POST",
    headers:{slug:cfg.fn,link:link,body:cfg.txt},
    body:cfg.txt
  })
  ok( "post resource", res.status==201)
  // console.log(res.headers.get("location"))

  res = await rest.fetch( cfg.deepR )
  ok( 'get resource', res.status==200  && cfg.text===await res.text() ) 

  res = await rest.fetch( cfg.folder )
  ok( 'get container', res.status==200 ) 

  res = await rest.fetch( cfg.file, {method:"HEAD"} )
  ok( "head resource", res.status == 200 )

  res = await rest.fetch( cfg.folder, {method:"HEAD"} )
  ok( "head container", res.status == 200 )

//  res = await rest.fetch( cfg.folder,{method:"DELETE"} )
//  ok( "409 on attempt to delete non-empty container", res.status == 409 )
  await rest.fetch( cfg.file,{method:"DELETE"} )
  await rest.fetch( cfg.deepR,{method:"DELETE"} )
  await rest.fetch( cfg.folder + cfg.fn,{method:"DELETE"} )
  await rest.fetch( cfg.file,{method:"DELETE"} )

  res = await rest.fetch( cfg.file )
  ok( "delete resource", res.status == 404 )

  res = await rest.fetch( cfg.deepC,{method:"DELETE"} )
  res = await rest.fetch( cfg.folder,{method:"DELETE"} )
  res = await rest.fetch( cfg.folder )
  ok( "delete container", res.status == 404 )


  console.log(`${passes}/${tests} tests passed, ${fails} failed\n`)

}
function getConfig(storageType){
  let scheme
  if(storageType==="localStorage"){
    scheme = "app://ls"
  }
  else if(storageType==="file"){
    scheme = "file://" + process.cwd()
  }
  return  {
    folder : scheme + "/test-folder/",
    file   : scheme + "/test-folder/" + "test-file.ttl",
    deepC  : scheme + "/test-folder/deep-folder/",
    deepR  : scheme + "/test-folder/deep-folder/" + "test-file2.ttl",
    fn     : "test-file3.ttl",
    text   : "<> a <#test>.",
  }
}
function ok( label, success ){
   tests = tests + 1;   
   if(success) passes = passes + 1
   else fails = fails+1
   let msg = success ? "ok " : "FAIL "
   console.log( "  " + msg + label)
}
