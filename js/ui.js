function updateInfo() {
  var name = document.getElementById('info-name').value || 'utilizador';
  var handle = document.getElementById('info-handle').value || 'utilizador';
  var pronouns = document.getElementById('info-pronouns').value.trim();
  var bio = document.getElementById('info-bio').value;

  document.getElementById('sb-name').textContent = name;
  document.getElementById('sb-msg-name').textContent = name;
  document.getElementById('sb-vc-name').textContent = name;
  document.getElementById('sb-handle').textContent = handle;

  var sep = document.getElementById('sb-pronouns-sep');
  var pr = document.getElementById('sb-pronouns');
  if (pronouns) {
    sep.style.display = '';
    pr.textContent = pronouns;
  } else {
    sep.style.display = 'none';
    pr.textContent = '';
  }

  var bioEl = document.getElementById('sb-bio');
  if (bio.trim()) {
    bioEl.innerHTML = bio;
    bioEl.style.fontStyle = '';
  } else {
    bioEl.innerHTML = 'Aqui ficaria a tua bio.';
    bioEl.style.fontStyle = 'italic';
  }
  applyProfileColor(profileColor);
}

function applyProfileColor(hex) {
  profileColorActive = true;
  profileColor = hex;

  document.getElementById('color-hex').value = hex.replace('#','');
  document.getElementById('color-hex-preview').style.background = hex;

  var stripe = document.getElementById('sb-color-stripe');
  if(stripe) stripe.style.background = hex;

  document.getElementById('sb-av-ph').style.background = hex;
  document.getElementById('sb-av-ph-msg').style.background = hex;
  document.getElementById('sb-av-ph-vc').style.background = hex;

  var bodyColor = deriveCardBodyColor(hex);
  var cardBody = document.getElementById('sb-card-body');
  cardBody.style.background = bodyColor;

  var avEl = document.querySelector('.dc-avatar');
  if(avEl) avEl.style.boxShadow = '0 0 0 6px ' + bodyColor;
  var ringCircle = document.getElementById('sb-status-ring');
  if(ringCircle) ringCircle.setAttribute('fill', bodyColor);

  var light = isLightColor(bodyColor);
  var tp = light ? '#060607'              : '#ffffff';
  var ts = light ? 'rgba(0,0,0,0.55)'    : 'rgba(255,255,255,0.6)';
  var td = light ? 'rgba(0,0,0,0.12)'    : 'rgba(255,255,255,0.12)';
  var tl = light ? 'rgba(0,0,0,0.5)'     : 'rgba(255,255,255,0.65)';
  var tb = light ? 'rgba(0,0,0,0.35)'    : 'rgba(255,255,255,0.35)';
  var tbf= light ? 'rgba(0,0,0,0.8)'     : 'rgba(255,255,255,0.85)';

  var cardBody2 = document.getElementById('sb-card-body');
  document.getElementById('sb-name').style.color = tp;
  document.getElementById('sb-handle').style.color = ts;
  var pe = document.getElementById('sb-pronouns'); if(pe) pe.style.color = ts;
  var se = document.getElementById('sb-pronouns-sep'); if(se) se.style.color = ts;
  var dv = cardBody2.querySelector('.dc-divider'); if(dv) dv.style.borderColor = td;
  var lb = cardBody2.querySelector('.dc-lbl'); if(lb) lb.style.color = tl;
  var be = document.getElementById('sb-bio');
  if(be) be.style.color = (be.style.fontStyle==='italic') ? tb : tbf;

  updateVcBg();
}

function updateVcBg() {
  var src = window._dominantBannerColor || DEFAULT_BANNER;
  var lch = hexToOklch(src);
  var vcBgEl = document.getElementById('sb-vc-bg');
  if (!vcBgEl) return;
  var isLight = lch[0] > 0.55;
  var targetL, targetC;
  if (isLight) {
    targetL = Math.min(0.92, lch[0] * 1.25);
    targetC = lch[1] * 0.30;
  } else {
    targetL = Math.max(0.08, lch[0] * 0.45);
    targetC = lch[1] * 0.55;
  }
  vcBgEl.style.background = oklchToHex(targetL, targetC, lch[2]);
}

function onColorPickerChange(hex) {
  document.getElementById('color-hex').value = hex.replace('#','');
  document.getElementById('color-hex-preview').style.background = hex;
  applyProfileColor(hex);
  updatePaletteSelection(hex);
}

function onColorHexChange(val) {
  var hex = val.trim().replace('#','');
  var full = hex.length===6 ? '#'+hex : null;
  document.getElementById('color-hex-preview').style.background = full||'transparent';
  if (full) {
    var pk = document.getElementById('color-native-picker'); if(pk) pk.value = full;
    applyProfileColor(full);
    updatePaletteSelection(full);
  }
}

function updatePaletteSelection(selectedHex) {
  var swatches = document.querySelectorAll('.palette-swatch');
  swatches.forEach(function(sw) {
    sw.style.outline = (sw.dataset.color === selectedHex.toLowerCase()) ? '2px solid #fff' : 'none';
    sw.style.outlineOffset = '2px';
  });
}

function renderColorPalette(colors) {
  var row = document.getElementById('color-palette-row');
  if (!row) return;
  row.innerHTML = '';
  colors.forEach(function(hex) {
    var sw = document.createElement('button');
    sw.className = 'palette-swatch';
    sw.dataset.color = hex.toLowerCase();
    sw.title = hex;
    sw.style.cssText = 'width:26px;height:26px;border-radius:6px;border:1.5px solid rgba(255,255,255,0.12);cursor:pointer;background:'+hex+';flex-shrink:0;transition:outline 0.1s;';
    sw.onclick = function() {
      var h = this.dataset.color;
      document.getElementById('color-hex').value = h.replace('#','');
      document.getElementById('color-hex-preview').style.background = h;
      applyProfileColor(h);
      updatePaletteSelection(h);
    };
    row.appendChild(sw);
  });
  var resetBtn = document.createElement('button');
  resetBtn.title = 'Repor cor padrão';
  resetBtn.style.cssText = 'width:26px;height:26px;border-radius:6px;border:1.5px solid rgba(255,255,255,0.18);cursor:pointer;background:var(--bg);flex-shrink:0;font-size:14px;color:var(--text3);line-height:1;';
  resetBtn.textContent = '↺';
  resetBtn.onclick = function() {
    resetProfileColor();
    if(window._dominantBannerColor) {
      var stripe = document.getElementById('sb-color-stripe');
      if(stripe) stripe.style.background = window._dominantBannerColor;
    }
  };
  row.appendChild(resetBtn);
  var hint = document.createElement('span');
  hint.style.cssText = 'font-size:10px;color:var(--text3);margin-left:2px;';
  hint.textContent = '← cores do avatar';
  row.appendChild(hint);
}

function showAvatarImg(phId, imgId, url) {
  var ph = document.getElementById(phId); if (ph) ph.style.display = 'none';
  var im = document.getElementById(imgId); if (im) { im.src = url; im.style.display = 'block'; }
}

function liveUpdate(type) {
  var s = state[type]; var b = s.box;
  var hiSrc = buildRotatedSrc(type);
  var rotSrcW = hiSrc.width || hiSrc.naturalWidth || s.naturalW;
  var rotSrcH = hiSrc.height || hiSrc.naturalHeight || s.naturalH;
  var scX = rotSrcW / s.dispW, scY = rotSrcH / s.dispH;
  var sx = b.x * scX, sy = b.y * scY, sw = b.w * scX, sh = b.h * scY;

  if (type === 'av') {
    var url = cropToURL(hiSrc, sx, sy, sw, sh, 512, 512, true);
    avatarDataURL = url;
    ['av-p160','av-p80','av-p48','av-p32'].forEach(function(id){
      var el = document.getElementById(id); if(el) el.src = url;
    });
    showAvatarImg('sb-av-ph','sb-av-img', url);
    showAvatarImg('sb-av-ph-msg','sb-av-img-msg', url);
    showAvatarImg('sb-av-ph-vc','sb-av-img-vc', url);
    sampleColorFromSrc(hiSrc, sx, sy, sw, sh);
  } else {
    var url = cropToURL(hiSrc, sx, sy, sw, sh, Math.round(sw), Math.round(sh), false);
    document.getElementById('sb-color-stripe').style.display = 'none';
    document.getElementById('sb-banner-bg').style.display = '';
    var sbBn = document.getElementById('sb-banner-img'); sbBn.src = url; sbBn.style.display = 'block';
  }
}

function sampleAvatarColor(img) {
  var colors = buildColorPalette(img, undefined, undefined, undefined, undefined);
  renderColorPalette(colors);
  if (colors.length > 0) {
    window._dominantBannerColor = colors[0];
    if (!profileColorActive) {
      var stripe = document.getElementById('sb-color-stripe');
      if(stripe) stripe.style.background = colors[0];
      document.getElementById('sb-av-ph').style.background = colors[0];
      document.getElementById('sb-av-ph-msg').style.background = colors[0];
      document.getElementById('sb-av-ph-vc').style.background = colors[0];
    }
    updateVcBg();
  }
  updatePaletteSelection(profileColorActive ? profileColor : '');
}

function sampleColorFromSrc(src, sx, sy, sw, sh) {
  var colors = buildColorPalette(src, sx, sy, sw, sh);
  if (colors.length > 0) {
    renderColorPalette(colors);
    window._dominantBannerColor = colors[0];
    if (!profileColorActive) {
      var stripe = document.getElementById('sb-color-stripe');
      if(stripe) stripe.style.background = colors[0];
      document.getElementById('sb-av-ph').style.background = colors[0];
      document.getElementById('sb-av-ph-msg').style.background = colors[0];
      document.getElementById('sb-av-ph-vc').style.background = colors[0];
    }
    updatePaletteSelection(profileColorActive ? profileColor : '');
    updateVcBg();
  }
}

function toggleBanner() {
  var card=document.getElementById('bn-card');
  var lbl=document.getElementById('bn-toggle-lbl');
  var isCollapsed=card.classList.contains('bn-collapsed');
  if(isCollapsed){card.classList.remove('bn-collapsed');lbl.textContent='Ocultar';}
  else{card.classList.add('bn-collapsed');lbl.textContent='Mostrar';}
}

function resetProfileColor() {
  profileColorActive = false;
  profileColor = DEFAULT_BANNER;
  document.getElementById('color-hex').value = DEFAULT_BANNER.replace('#','');
  document.getElementById('color-hex-preview').style.background = DEFAULT_BANNER;
  var stripe = document.getElementById('sb-color-stripe');
  if(stripe) stripe.style.background = DEFAULT_BANNER;
  var cardBody = document.getElementById('sb-card-body');
  cardBody.style.background = DEFAULT_BODY;
  var avEl = document.querySelector('.dc-avatar');
  if(avEl) avEl.style.boxShadow = '0 0 0 6px ' + DEFAULT_BODY;
  var ringCircle = document.getElementById('sb-status-ring');
  if(ringCircle) ringCircle.setAttribute('fill', DEFAULT_BODY);
  document.getElementById('sb-av-ph').style.background = '#36393f';
  document.getElementById('sb-av-ph-msg').style.background = '#36393f';
  document.getElementById('sb-av-ph-vc').style.background = '#36393f';
  var usernameEl = document.getElementById('sb-name');
  var handleEl = document.getElementById('sb-handle');
  var pronounsEl = document.getElementById('sb-pronouns');
  var sepEl = document.getElementById('sb-pronouns-sep');
  var divider = cardBody.querySelector('.dc-divider');
  var lbl = cardBody.querySelector('.dc-lbl');
  var bioEl = document.getElementById('sb-bio');
  usernameEl.style.color = '#ffffff';
  handleEl.style.color = 'rgba(255,255,255,0.6)';
  if(pronounsEl) pronounsEl.style.color = 'rgba(255,255,255,0.6)';
  if(sepEl) sepEl.style.color = 'rgba(255,255,255,0.6)';
  if(divider) divider.style.borderColor = 'rgba(255,255,255,0.12)';
  if(lbl) lbl.style.color = 'rgba(255,255,255,0.65)';
  if(bioEl && bioEl.style.fontStyle==='italic') bioEl.style.color='rgba(255,255,255,0.35)';
  else if(bioEl) bioEl.style.color='rgba(255,255,255,0.85)';
  var vcBgEl = document.getElementById('sb-vc-bg');
  if(vcBgEl) vcBgEl.style.background = '#1a1b1e';
  updateVcBg();
  updatePaletteSelection('');
}
