# Solid-Rest

Treat any storage backend as a Solid pod

## Overview

Solid-Rest translates Solid requests into backend requests and backend responses into Solid responses.  This means that any storage system that has a Solid-Rest plugin may be treated as a pod.  Currently there are plugins for file and dropbox which means that any app that uses Solid-Rest can address file:// and dropbox:// URIs the same way as a Solid pod https:// URI and expect the same responses with some exceptions : permissions are not handled by Solid .acls, they  are based on the underlying file or cloud permissions; collaborative tools such as chat are not available.  These backends can now be addressed with most Solid libraries (e.g. rdflib) and apps (e.g. the databrowser). 

Plugins for ssh, in-memory storage, in-browser storage (indexedDB, localStorage, Native File API) are almost ready and will be released soon.

Although Solid-Rest can be used stand-alone, it is best used in conjunction with other libraries, especially [Solid-Node-Client](), a nodejs client for Solid.  Solid-Node-Client comes preloaded with the Solid-Rest-File plugin and you may add the dropbox and other plugins as shown below:
```javascript
    import { SolidNodeClient } from 'SolidNodeClient';
    import { SolidRestDropbox } from 'SolidRestDropbox';
    const client = new SolidNodeClient({
        handlers : { dropbox : new SolidRestDropbox() }
    });
    await client.login( your_dropbox_credentials, {protocol:'dropbox'} );
    await client.login( your_pod_credentials, {protocol:'https'} );
    // you may now use client.fetch() as per the [Solid Rest Spec]() with
    // dropbox://, file://, and authenticated https:// URIs.
```
