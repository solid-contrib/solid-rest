const {SolidRestFile} = require('./file');
const auth = new SolidRestFile();
auth.fetch('./head.js',{method:'HEAD'}).then(response=>console.log( response ));

