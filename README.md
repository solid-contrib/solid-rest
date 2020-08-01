# Solid REST

## treat any storage backend as a minimal Solid server

<!--
[![NPM](https://nodei.co/npm/solid-rest.png)](https://nodei.co/npm/solid-rest/)
-->

This package provides Solid access to local file systems and other storage spaces. It recieves standard Solid REST requests and returns the same kind of response a Solid server sends.  This means that libraries and apps can make a file:// or app:// request in the same way they make an https request without having to know anything about the backend and without needing a server on the backend.

### Using with rdflib

Solid-Rest is included automatically in [rdflib]() when a script is run outside a browser.  This means that commands such as fetcher.load('file:///somepath/container/') will behave, for most purposes just like the same command against an https URI on a Solid server (in this case, create an in-memory parsed version of the container's turtle representation).  

### Using with other libraries

Solid-Rest can be used with any other libraries capable of operating either outside a browser or in an express-wrapped browser.  For example, [solid-file-client]() uses solid-rest behind the scenes to support file transfers between local file systems and remote pods.


### Backends

**Currently supported backends** : file:// - the local file system; and app://ls/ - an in-memory local storage.  These are both available in command-line and nodejs scripts. They do not work in a browser unless running the browser within a local process such as nodejs express.

**Currently experimental backends** : app://bfs/* - any of the dozen or so storage mechanisms supported by [BrowserFS](https://github.com/jvilk/BrowserFS) - Dropbox, browser Local Storage, browser indexedDB, browser Native File Api, and more.  The code is there but I can't commit to providing examples or documentation at this time. Contact me with questions.

### Plugins

The package supports plugins, so new backends may be added by supplying the storage system specific commands without having to reinvent the wheel of receiving REST requests and responding to them in a Solid manner.  The src/localStorage.js package contains documentation on writing plugins.  Contact me for more info.

<img src="https://github.com/jeff-zucker/solid-rest/blob/master/solid-rest.png" alt="diagram of solid-rest">

### Acknowledgements

Thanks to [Otto-AA](https://github.com/Otto-AA) and [CxRes](https://github.com/CxRes) for advice and patches.

copyright &copy; 2019, 2020, [Jeff Zucker](https://github.com/jeff-zucker), may be freely distributed with the MIT license
