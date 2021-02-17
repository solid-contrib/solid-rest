# Solid-Rest-Mem

Treat virtual in-memory storage as a Solid pod

**Warning** This library has not been upgraded to version 2.x yet, so is NOT usable at the moment.  If you have need for it before I upgrade, contact me on the Solid forum (@jeffz) or Gitter channel. (@jeff-zucker).

This library treats a local file system as a serverless Solid Pod, accepting Solid requests (GET, PUT, etc.) and returning Solid responses (wac-allow headers, turtle representation of folders, etc.).

The library may be used stand-alone (see [tests](./tests/all.js) for examples), or as a plugin to [Solid-Node-Client](https://github.com/solid/solid-node-client) from where it can be integrated into almost any Solid library or app.  Simply import Solid-Node-Client and thereafter use file:// URLs almost anywhere that https:// URLs work.  See the Solid-Node-Client documentation for details.

&copy; 2021, Jeff Zucker, may be freely used with an MIT license.





