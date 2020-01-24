# Solid REST

## treat any storage backend as a minimal Solid server

<!--
[![NPM](https://nodei.co/npm/solid-rest.png)](https://nodei.co/npm/solid-rest/)
-->

This package sits between auth modules like solid-auth-client and solid-auth-cli to handle requests for file:// and app:// URIs. and then uses the appropriate storage module to do the work.  Doing it this way means that any app that uses those auth modules (which AFAIK is all Solid apps) can make use of the extended storage spaces.  

In nodejs, the file:// space works to access the local file system and the app://ls space works to access an in-memory local storage.

In the browser, the app://bfs space provides acces to the browserFS system which supports over a dozen backends, including Dropbox, the native file system API, indexedDB.  I've successfully tested Solid-rest-browserFS using rdflib against the indexedDB, localStorage, and native file system API (available in chrome with appropriate flags set).  It should work for all other backends as far as I know.

Temporarily, using the browser version requires a patched solid-auth-client (included in the repository).  Once that patch makes it into the master, that will no longer be neccessary.

See the tests for examples of usage.  Here's the basic idea:
```javascript
solid.rest    = new SolidRest([ new SolidBrowserFS() ])

async function init(){
  /*
    add browserFS configs here
    if all you need is LocalStorage, it is included by default
    and you call initBackends() with no arguments
  */
  fs = await solid.rest.storage("bfs").initBackends({
      '/HTML5FS'   : { fs: "HTML5FS"  , options:{size:5} },
      '/IndexedDB' : { fs: "IndexedDB", options:{storeName:"bfs"}}
  })
  /*
     You can now use app://bfs/HTML5FS/*, app://bfs/IndexDB/*, and
     app://bfs/LocalStorage/* as URIs in any app using solid-auth-client.
  */  
  ...
  const fetcher = $rdf.fetcher(store,{fetch:solid-auth.fetch})
  /*
     You can now use app://bfs/HTML5FS/*, app://bfs/IndexDB/*, and
     app://bfs/LocalStorage/* as URIs in any any app using rdflib.
     Defining fetch will become unneccessary once solid-auth-client
     is patched.
  */  
}
```
See [BrowserFS Readme](https://github.com/jvilk/BrowserFS) for an overview of options and see [BrowserFS API](https://jvilk.com/browserfs/2.0.0-beta/index.html) for details of the config settings for other backends.

copyright &copy; 2019, Jeff Zucker, may be freely distributed with the MIT license
