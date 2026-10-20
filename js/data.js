/* Loads exhibit content. With ?draft in the URL, uses the unsaved draft from the editor (same browser). */
(function () {
  var data = window.EXHIBIT;
  try {
    if (/[?&]draft\b/.test(location.search)) {
      var d = localStorage.getItem('exhibit-draft');
      if (d) data = JSON.parse(d);
    }
  } catch (e) {}
  window.DATA = data;
  window.draftSuffix = /[?&]draft\b/.test(location.search) ? '?draft' : '';
})();
