// timestamps das mensagens
(function() {
  var now = new Date();
  var pad = function(n){ return n.toString().padStart(2,'0'); };
  var h = now.getHours(), m = now.getMinutes();
  var t1 = pad(h)+':'+pad(Math.max(0,m-2));
  var t2 = pad(h)+':'+pad(Math.max(0,m-1));
  var t3 = pad(h)+':'+pad(m);
  var el1=document.getElementById('msg-time-1'), el2=document.getElementById('msg-time-2'), el3=document.getElementById('msg-time-3');
  if(el1) el1.textContent='Hoje às '+t1;
  if(el2) el2.textContent='Hoje às '+t2;
  if(el3) el3.textContent='Hoje às '+t3;
})();

function dropImg(ev, type) { ev.preventDefault(); var f = ev.dataTransfer.files[0]; if (f) loadImg({target:{files:[f]}}, type); }

document.addEventListener('paste', function(ev) {
  var items = (ev.clipboardData || ev.originalEvent && ev.originalEvent.clipboardData || {}).items;
  if (!items) return;
  for (var i = 0; i < items.length; i++) {
    if (items[i].type.indexOf('image') !== -1) {
      ev.preventDefault();
      var blob = items[i].getAsFile();
      if (!blob) return;
      var avEditorVisible = document.getElementById('av-editor').style.display !== 'none';
      var bnEditorVisible = document.getElementById('bn-editor').style.display !== 'none';
      var type = (!avEditorVisible && bnEditorVisible) ? 'bn' : 'av';
      loadImg({target:{files:[blob]}}, type);
      break;
    }
  }
});

function loadImg(ev, type) {
  var f = ev.target.files[0]; if (!f) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    var img = document.getElementById(type+'-img');
    img.onload = function() {
      var s = state[type];
      s.naturalW = img.naturalWidth; s.naturalH = img.naturalHeight;
      s.rotation = 0; s.rotatedCanvas = null; s.rotW = s.naturalW; s.rotH = s.naturalH;
      var origImg = new Image();
      origImg.src = e.target.result;
      origImg.onload = function() { s.originalImg = origImg; };
      origImg.src = e.target.result;
      s.originalImg = origImg;
      var rotEl = document.getElementById(type+'-rotation');
      if (rotEl) { rotEl.value = 0; document.getElementById(type+'-rot-val').textContent = '0°'; }
      computeDispSize(type);
      var oldDisp = document.getElementById(type+'-disp-canvas');
      if (oldDisp) { oldDisp.parentNode.removeChild(oldDisp); }
      img.style.display = 'block';
      img.style.transform = '';
      img.style.width = s.dispW+'px'; img.style.height = s.dispH+'px';
      var wrap = document.getElementById(type+'-wrap');
      wrap.style.width = s.dispW+'px'; wrap.style.height = s.dispH+'px';
      var oc = document.getElementById(type+'-canvas');
      oc.width = s.dispW; oc.height = s.dispH;
      oc.style.width = s.dispW+'px'; oc.style.height = s.dispH+'px';
      initBox(type); renderOverlay(type); liveUpdate(type);
      document.getElementById(type+'-editor').style.display = 'flex';
      if (type === 'av') sampleAvatarColor(img);
      bindBox(type);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(f);
}

function resetEditor(type) {
  document.getElementById(type+'-editor').style.display='none';
  document.getElementById(type+'-input').value='';
  state[type].rotation=0; state[type].rotatedCanvas=null; state[type].originalImg=null;
  var rotEl=document.getElementById(type+'-rotation');
  if(rotEl){rotEl.value=0;document.getElementById(type+'-rot-val').textContent='0°';}
  var rotLayer=document.getElementById(type+'-rot-layer');
  if(rotLayer) rotLayer.style.transform='rotate(0deg)';
  var dispCanvas=document.getElementById(type+'-disp-canvas');
  if(dispCanvas){dispCanvas.parentNode.removeChild(dispCanvas);}
  var img=document.getElementById(type+'-img'); if(img) img.style.display='';
  if(type==='av'){
    ['sb-av-ph','sb-av-ph-msg','sb-av-ph-vc'].forEach(function(id){var el=document.getElementById(id);if(el)el.style.display='';});
    ['sb-av-img','sb-av-img-msg','sb-av-img-vc'].forEach(function(id){var el=document.getElementById(id);if(el)el.style.display='none';});
    window._dominantBannerColor = null;
    avatarDataURL = null;
    var row=document.getElementById('color-palette-row');if(row)row.innerHTML='';
    resetProfileColor();
  } else {
    document.getElementById('sb-color-stripe').style.display='';
    document.getElementById('sb-banner-bg').style.display='none';
    document.getElementById('sb-banner-img').style.display='none';
  }
}

// init
resetProfileColor();
