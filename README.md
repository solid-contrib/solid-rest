# Solid REST

## treat any storage backend as a minimal Solid server

<!--
[![NPM](https://nodei.co/npm/solid-rest.png)](https://nodei.co/npm/solid-rest/)
-->

This package provides Solid access to local file systems and other storage spaces. It recieves standard Solid REST requests and returns the same kind of response a Solid server sends.  This means that libraries and apps can make a file:// or app:// request in the same way they make an https request without having to know anything about the backend and without needing a server on the backend.

So far, in addition to the local file system, solid-rest works in-memory (handy for testing), and with any of the dozen or so storage mechanisms supported by [BrowserFS](https://github.com/jvilk/BrowserFS) - Dropbox, browser Local Storage, browser indexedDB, browser Native File Api, and more.

The package supports plugins, so new backends may be added by supplying the storage system specific commands without having to reinvent the wheel of receiving REST requests and responding to them in a Solid manner.

<img src="https://github.com/jeff-zucker/solid-rest/blob/master/solid-rest.png" alt="diagram of solid-rest">

### Acknowledgements

Thanks to [Otto-AA](https://github.com/Otto-AA) and [CxRes](https://github.com/CxRes) for advice and patches.

copyright &copy; 2019, [Jeff Zucker](https://github.com/jeff-zucker), may be freely distributed with the MIT license
