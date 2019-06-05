# Solid REST

## treat any storage backend as a minimal Solid server

<!--
[![NPM](https://nodei.co/npm/solid-rest.png)](https://nodei.co/npm/solid-rest/)
-->

This package sits between auth modules like solid-auth-client and solid-auth-cli to handle requests for file:// and app:// URIs. and then uses the appropriate storage module to do the work.  Doing it this way means that any app that uses those auth modules (which AFAIK is all Solid apps) can make use of the extended storage spaces.  The file:// portion is already working in rdflib in nodejs.  So far I have backends working for a file-system and for localStorage.  Files work only in node; localStorage works either in browser or node (using a simulated in-memory localStorage).  Otto_A_A is working on a cache backend which will use web-workers to dynamically update a mini-pod in the browser's cache.  

<img src="https://github.com/jeff-zucker/solid-rest/blob/master/sold-rest.png" alt="diagram of solid-rest">

**For those who want to use file:// or app:// URLs** Soon, solid-rest will be included in the auth modules.  At that point, in a nodejs app, you simply require solid-rest and then use the extra URLs and in a browser app you supply script tags for solid-rest and for whichever of the app:// handlers you want.

**For those who want to create other storage handlers:** This package provides request routing, header handling, response preparation, and a test framework.  Storage modules can leverage all of that and/or over-ride what they want.  I am preparing an API guide, in the meantime there is documentation in the [localStorage](./src/localStorage.js) file.

copyright &copy; 2019, Jeff Zucker, may be freely distributed with the MIT license
