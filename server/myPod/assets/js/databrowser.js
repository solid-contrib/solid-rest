function goUri ( event ) {
      const prompt = document.getElementById('prompt');
      prompt.innerHTML = "File Path : ";
      const params = new URLSearchParams(location.search)
      let display_uri = uri = params.get('q') ;
      if(event && typeof event.toString().match('Mouse')){
        display_uri = uri = uriField.value;
      }
      if( !uri && !event ) return;
      if(!uri.startsWith('http')) {
        uri = '${host}'+display_uri
        prompt.innerHTML = "File Path : ";
      }    
      else if(uri.match(prefix) ){
        uri = uri.replace('${host}/tabulator.html?','');
        display_uri = uri;
        prompt.innerHTML = "URI : ";
        if( !uri.startsWith('http') ){
          display_uri = uri;
          uri = '${host}'+uri
          prompt.innerHTML = "File Path : ";
        }
      }
      display_uri = display_uri.replace('${host}','');
      console.log("User field " + uriField.value)
      console.log("User requests " + uri)
  
      uriField.value = display_uri;
      params.set('uri', uri);
      window.history.replaceState({}, '', `${location.pathname}?${params}`);

      var subject = kb.sym(uri);
      // UI.widgets.makeDraggable(icon, subject) // beware many handlers piling up
      outliner.GotoSubject(subject, true, undefined, true, undefined);
    }

    function go ( event ) {
      let uri = event || $rdf.uri.join(uriField.value, window.location.href)
      if( uri && !uri.toString().startsWith('http') ){
        uri = '${host}'+uri
        prompt.innerHTML = "File Path : ";
      }
      console.log("User field " + uriField.value)
      console.log("User requests " + uri)

      const params = new URLSearchParams(location.search)
      params.set('uri', uri);
      window.history.replaceState({}, '', `${location.pathname}?${params}`);

      var subject = kb.sym(uri);
      // UI.widgets.makeDraggable(icon, subject) // beware many handlers piling up
      outliner.GotoSubject(subject, true, undefined, true, undefined);
    }

