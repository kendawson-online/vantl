// upload.js — handles the upload form and displays JSON response
(function(){
  var form = document.getElementById('uploadForm');
  var status = document.getElementById('status');
  var jsonOut = document.getElementById('jsonOut');
  var actions = document.getElementById('actions');
  var downloadLink = document.getElementById('downloadLink');

  form.addEventListener('submit', function(evt){
    evt.preventDefault();
    status.textContent = 'Uploading...';
    jsonOut.style.display = 'none'; actions.style.display = 'none';

    var fd = new FormData();
    var file = document.getElementById('fileInput').files[0];
    var url = document.getElementById('urlInput').value.trim();
    if (file) fd.append('file', file);
    if (url) fd.append('url', url);
    // All metadata is expected to be present in the uploaded spreadsheet/CSV.

    fetch('convert.php', {method:'POST', body:fd})
      .then(function(resp){
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        return resp.json();
      })
      .then(function(data){
        status.textContent = 'Conversion successful.';
        var pretty = JSON.stringify(data, null, 2);
        jsonOut.textContent = pretty;
        jsonOut.style.display = 'block';
        // create downloadable blob
        var blob = new Blob([pretty], {type:'application/json'});
        var url = URL.createObjectURL(blob);
        downloadLink.href = url;
        downloadLink.download = (data.timelineName || 'timeline') + '.json';
        actions.style.display = 'block';
      })
      .catch(function(err){
        status.textContent = 'Error: ' + err.message;
      });
  });
})();
