# Solid Rest Browser

Solid access to in-browser and cloud storage

This library supports using most Solid methods on data stored in the browser and cloud storage.  It is a shim between Solid and the [browserFS]() library.  Out of the box, it supports Local Storage, IndexedDB, and the HTML5 File System API.  Users may also pass in their own browserFS configuration for example, Dropbox or any of the dozen or so browserFS supported file systems.

Once initialized, most Solid methods can be used with in-browser or cloud data simply by using URLs in the form `browser://LocalStorage/foo/bar.ttl`, where "LocalStorage" could be "IndexedDB", "Dropbox" or other browserFS storage type.

In-browser URLs may be used directly with stand-alone Solid Rest fetches, or, more likely, as the fetch for rdflib, the solid-ui forms system, or other high-level libraries.

It's easy to create local-first apps with this library, see below for some examples.

## Importing the prerequisites

Before loading Solid Rest you should import the browserFS library as well 
as any Solid libraries you need (e.g. solid-client-authn-browser, rdflib, 
etc.).  You can install these libraries locally or point to CDNs such as 

* https://cdn.jsdelivr.net/npm/browserfs@1/dist/browserfs.min.js,
* https://cdn.jsdelivr.net/npm/rdflib@2/dist/rdflib.min.js, or 
* https://cdn.jsdelivr.net/npm/@inrupt/solid-client-authn-browser@1/dist/solid-client-authn.bundle.js
                     
## Using Stand-alone

Once you have imported the Solid Rest Browser and BrowserFS libraries in script tags, you can create a new solid rest client and configure it, like this :
```
    const solidRest = new SolidRestBrowser();
    await solidRest.configure();
```
Once you've done that, you can do Solid 'GET' and 'PUT' fetches that will read/write using in-browser storage :
```
    await solidRest.fetch( "browser://IndexedDB/foo/bar.txt", {
      method:"'PUT", 
      body: "Some text ccontent",
      headers:{"content-type":"text/plain"},
    })
```
That statement will write the named file in the IndexedDB storage under the path "/foo/bar.txt".  Not very exciting on its own, but it means that apps which use Solid REST protocols will be able to use the storage.

See also a [complete working example of stand-alone usage](examples/stand-alone.html).

## Using with rdflib, solid-ui, SolidOS, etc.
```
The library has a configFetcher method that modifies rdflib's fetcher object to handle both http and in-browser data.  The first parameter is the knowledge-base, rdflib's internal graph. ConfigFetcher is aynchronous, so must be called with await.  It returns a fetcher object that is the same as rdflib's fetcher, except that it handles "browser://" URIs on its own.
```
    // define the knowledge-base & updater as usual
    //
    const kb = $rdf.graph();
    const myUpdater = new $rdf.UpdateManager(kb)

    // define a custom fetcher using solid rest and the knowledge base
    //
    const solidRest = new SolidRestBrowser();
    const myFetcher = await solidRest.configFetcher(kb);

    // from here on, myFetcher & myUpdater will
    // support in-browser fetches
    //
```
See also a [complete working example of rdflib no-auth usage](examples/rdflib.html).

In most cases, you'll want to interact with both the in-browser data and data from one or more pods.  If some of those pods require authentication, you'll need to supply an authenticated fetch such as [Inrupt's Solid Client Authn Browser](https://github.io/inrupt/solid-client-authn).  You can add this the same way as you would with standard rdflib, by supplying the Inrupt fetch on fetcher creation. If you've imported Inrupt's authentication library in a script tag, you can add it to rdflib's fetcher like this:
```
    const fetcher = await solidRest.configFetcher(kb,{
      fetch : solidClientAuthentication.getDefaultSession().fetch
    })
```
This assumes that you have provided other code to handle the authentication, see [a hybrid in-browser and authenticated rdflib fetch](examples/hybrid.html) for a working example.

If you create a fetcher with the fetch option specified, you will end up with a hybrid fetcher. URLs in http: and https: schemes will use the supplied authenticated fetch, while URLs in the browser: scheme will use the in-browser fetch.   

If you are working with libraries further up the chain than rdflib (e.g. solid-ui, or mashlib) you can set the global window.solidFetch to equal your custom fetch : 
```
    const myFetcher = await solidRest.makeFetcher(kb,{
      fetch : solidClientAuthentication.getDefaultSession().fetch
    })
    window.solidFetch = myFetcher.fetch.bind(solidRest);
```
This should make any fetch in mashlib and friends use Inrupt's client for http: fetches and solid rest for browser: fetches.

## Supplying A Custom BrowserFS Configuration

By default, this library supports three storages at /IndexedDB, /LocalStorage, and /HTML5FS.  If you would like things mounted somewhere else or you want to add or substitute other BrowserFS backends, you can supply a BrowserFS configuration when you configure Solid Rest.
```
    const myFetcher = await solidRest.makeFetcher(kb,{
      browserFSconfiguration : {fs:"LocalStorage"}
      fetch : solidClientAuthentication.getDefaultSession().fetch
    })
```
This example would remove the mountable file system and replace it with a single Local Storage.  URLs in the form `browser://foo/bar.txt` would be written in Local Storage as `/foo/bar.txt`.

You can use this configuration option to support any of the dozen or so browserFS backends or to create a mountable or mirrored file system. You can pass any valid browserFS configuration.

## A Local-First Example

A local-first system stores data in the browser and syncs it with remote Pod data.  To do this you'll need to create a custom fetch method.  

In the example below, we'll simply copy the file locally and then remotely with no syncing logic which you would have to supply.  We'll use a URL pattern like `browser://https://example.com/foo.ttl` which would store the data fist in the browser's storage under the key https://example.com/foo.ttl and remotely with that same address.  We have to add and remove the browser:// portion in order to let rdflib know to let your fetch handle the local part.
```
 async function myFetch(uri,options){
    let inrupt = solidClientAuthentication.getDefaultSession();
    let res;
    try {
      res = await solidRest.fetch(uri,options);
      console.log(`Stored local <${uri}>.`);
    }
    catch(e){console.log(`Could not store local <${uri}> : ${e}`);}
    if(options.method==='PUT'){
      uri = uri.replace(/browser:\/\//,'');
      try {
        await inrupt.fetch(uri,options);
        console.log(`Stored remote <${uri}>.`);
      }
      catch(e){console.log(`Could not store remote <${uri}> : ${e}`);}
    }
    return res;
  }
  const myFetcher = await solidRest.configFetcher(kb,{
    browserFSconfiguration : {fs:"LocalStorage"}
    fetch : myFetch
  });
```
This code would mean that any uses of myFetcher.load, myFetcher.putBack,
and myUpdater.update would always read from the in-browser data and write 
to both the in-browser and the external Pod storages.

&copy; 2021, Jeff Zucker, all rights reserved;
may be freely distributed under an MIT license










