function computeDispSize(type) {
  var s = state[type];
  var srcW = s.rotatedCanvas ? s.rotW : s.naturalW;
  var srcH = s.rotatedCanvas ? s.rotH : s.naturalH;
  var maxW = type === 'av' ? 480 : 560;
  var maxH = type === 'av' ? 420 : 240;
  var sc = Math.min(maxW / srcW, maxH / srcH, 1);
  s.dispW = Math.max(60, Math.round(srcW * sc));
  s.dispH = Math.max(40, Math.round(srcH * sc));
  s.scaleX = srcW / s.dispW;
  s.scaleY = srcH / s.dispH;
}

function initBox(type) {
  var s = state[type]; var bw, bh;
  if (type === 'av') {
    var sz = Math.min(s.dispW, s.dispH);
    bw = sz; bh = sz;
  } else {
    bw = s.dispW;
    bh = Math.round(bw / s.aspect);
    if (bh > s.dispH) { bh = s.dispH; bw = Math.round(bh * s.aspect); }
  }
  s.box = { x: Math.round((s.dispW-bw)/2), y: Math.round((s.dispH-bh)/2), w: bw, h: bh };
}

function renderOverlay(type) {
  var s = state[type]; var b = s.box;
  var oc = document.getElementById(type+'-canvas');
  var ctx = oc.getContext('2d');
  var W = oc.width, H = oc.height;
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle = 'rgba(0,0,0,0.52)';
  if (type === 'av') {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, H);
    ctx.arc(b.x+b.w/2, b.y+b.h/2, b.w/2, 0, Math.PI*2, true);
    ctx.fill('evenodd');
    ctx.restore();
  } else {
    ctx.fillRect(0,0,W,b.y);
    ctx.fillRect(0,b.y+b.h,W,H-b.y-b.h);
    ctx.fillRect(0,b.y,b.x,b.h);
    ctx.fillRect(b.x+b.w,b.y,W-b.x-b.w,b.h);
  }
  ctx.save(); ctx.setLineDash([5,4]); ctx.lineWidth = 1;
  if (type === 'av') {
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath(); ctx.arc(b.x+b.w/2, b.y+b.h/2, b.w/2, 0, Math.PI*2); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.strokeRect(b.x, b.y, b.w, b.h);
    var cx=b.x+b.w/2, cy=b.y+b.h/2, r=b.w/2;
    ctx.strokeStyle = 'rgba(255,220,0,0.5)';
    ctx.beginPath(); ctx.moveTo(cx-r,cy); ctx.lineTo(cx+r,cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx,cy-r); ctx.lineTo(cx,cy+r); ctx.stroke();
  } else {
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.strokeRect(b.x,b.y,b.w,b.h);
  }
  ctx.restore();
  var box = document.getElementById(type+'-box');
  box.style.left = b.x+'px'; box.style.top = b.y+'px';
  box.style.width = b.w+'px'; box.style.height = b.h+'px';
  box.style.borderRadius = type === 'av' ? '50%' : '2px';
}

function bindBox(type) {
  var box = document.getElementById(type+'-box');
  box.addEventListener('mousedown', function(e){ if(!e.target.classList.contains('handle')) startDrag(e,type,'move',null); });
  box.addEventListener('touchstart', function(e){ if(!e.target.classList.contains('handle')){e.preventDefault();startDrag(e.touches[0],type,'move',null);} },{passive:false});
  box.querySelectorAll('.handle').forEach(function(h){
    h.addEventListener('mousedown', function(e){ e.stopPropagation(); startDrag(e,type,'resize',h.dataset.h); });
    h.addEventListener('touchstart', function(e){ e.preventDefault(); e.stopPropagation(); startDrag(e.touches[0],type,'resize',h.dataset.h); },{passive:false});
  });
}

function startDrag(e,type,mode,handle){
  drag.active=true; drag.type=type; drag.mode=mode; drag.handle=handle;
  drag.sx=e.clientX; drag.sy=e.clientY; drag.startBox=Object.assign({},state[type].box);
}

function doMove(cx, cy) {
  var dx=cx-drag.sx, dy=cy-drag.sy;
  var s=state[drag.type]; var sb=drag.startBox; var b=Object.assign({},sb);
  var minS=30, isAv=drag.type==='av';
  if (drag.mode === 'move') {
    b.x = Math.max(0, Math.min(s.dispW-b.w, sb.x+dx));
    b.y = Math.max(0, Math.min(s.dispH-b.h, sb.y+dy));
  } else {
    var h=drag.handle, newW, newH;
    if (h==='se') {
      newW=Math.max(minS,sb.w+dx); newH=isAv?newW:Math.max(minS,sb.h+dy);
      if(!isAv){newW=Math.min(newW,newH*s.aspect);newH=newW/s.aspect;}
      newW=Math.min(newW,s.dispW-sb.x);
      if(isAv){newH=newW=Math.min(newW,s.dispH-sb.y);}else{newH=newW/s.aspect;if(sb.y+newH>s.dispH){newH=s.dispH-sb.y;newW=newH*s.aspect;}}
      b.w=newW; b.h=newH;
    } else if (h==='sw') {
      newW=Math.max(minS,sb.w-dx); newH=isAv?newW:Math.max(minS,sb.h+dy);
      if(!isAv){newW=Math.min(newW,newH*s.aspect);newH=newW/s.aspect;}
      newW=Math.min(newW,sb.x+sb.w);
      if(isAv){newH=newW=Math.min(newW,s.dispH-sb.y);}else{newH=newW/s.aspect;if(sb.y+newH>s.dispH){newH=s.dispH-sb.y;newW=newH*s.aspect;}}
      b.w=newW; b.h=newH; b.x=sb.x+sb.w-newW;
    } else if (h==='ne') {
      newW=Math.max(minS,sb.w+dx); newH=isAv?newW:Math.max(minS,sb.h-dy);
      if(!isAv){newW=Math.min(newW,newH*s.aspect);newH=newW/s.aspect;}
      newW=Math.min(newW,s.dispW-sb.x);
      if(isAv){newH=newW=Math.min(newW,sb.y+sb.h);}else{newH=newW/s.aspect;if(newH>sb.y+sb.h){newH=sb.y+sb.h;newW=newH*s.aspect;}}
      b.w=newW; b.h=newH; b.y=sb.y+sb.h-newH;
    } else if (h==='nw') {
      newW=Math.max(minS,sb.w-dx); newH=isAv?newW:Math.max(minS,sb.h-dy);
      if(!isAv){newW=Math.min(newW,newH*s.aspect);newH=newW/s.aspect;}
      newW=Math.min(newW,sb.x+sb.w);
      if(isAv){newH=newW=Math.min(newW,sb.y+sb.h);}else{newH=newW/s.aspect;if(newH>sb.y+sb.h){newH=sb.y+sb.h;newW=newH*s.aspect;}}
      b.w=newW; b.h=newH; b.x=sb.x+sb.w-newW; b.y=sb.y+sb.h-newH;
    }
    b.x=Math.max(0,b.x); b.y=Math.max(0,b.y);
    if(!isAv){
      if(b.x+b.w>s.dispW){b.w=s.dispW-b.x;b.h=b.w/s.aspect;}
      if(b.y+b.h>s.dispH){b.h=s.dispH-b.y;b.w=b.h*s.aspect;}
    } else {
      if(b.x+b.w>s.dispW) b.w=s.dispW-b.x;
      if(b.y+b.h>s.dispH) b.h=s.dispH-b.y;
    }
  }
  state[drag.type].box = b;
  renderOverlay(drag.type);
  liveUpdate(drag.type);
}

document.addEventListener('mousemove', function(e){ if(drag.active) doMove(e.clientX,e.clientY); });
document.addEventListener('touchmove', function(e){ if(drag.active){e.preventDefault();doMove(e.touches[0].clientX,e.touches[0].clientY);} },{passive:false});
document.addEventListener('mouseup', function(){ drag.active=false; });
document.addEventListener('touchend', function(){ drag.active=false; });

function buildRotatedSrc(type) {
  var s = state[type];
  if (!s.originalImg) return document.getElementById(type+'-img');
  if (s.rotation === 0) return s.originalImg;
  var ang = s.rotation * Math.PI / 180;
  var cos = Math.abs(Math.cos(ang)), sin = Math.abs(Math.sin(ang));
  var rotW = Math.round(s.naturalW * cos + s.naturalH * sin);
  var rotH = Math.round(s.naturalW * sin + s.naturalH * cos);
  var off = document.createElement('canvas');
  off.width = rotW; off.height = rotH;
  var ctx = off.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.translate(rotW/2, rotH/2);
  ctx.rotate(ang);
  ctx.drawImage(s.originalImg, -s.naturalW/2, -s.naturalH/2, s.naturalW, s.naturalH);
  return off;
}

function cropToURL(src, sx, sy, sw, sh, outW, outH, circle) {
  var off = document.createElement('canvas');
  off.width = outW; off.height = outH;
  var ctx = off.getContext('2d');
  if (circle) { ctx.save(); ctx.beginPath(); ctx.arc(outW/2,outH/2,outW/2,0,Math.PI*2); ctx.clip(); }
  ctx.drawImage(src, sx, sy, sw, sh, 0, 0, outW, outH);
  if (circle) ctx.restore();
  return off.toDataURL('image/png');
}

function downloadCrop(type) {
  var s=state[type]; var b=s.box;
  var hiSrc=buildRotatedSrc(type);
  var rotSrcW = hiSrc.width || hiSrc.naturalWidth || s.naturalW;
  var rotSrcH = hiSrc.height || hiSrc.naturalHeight || s.naturalH;
  var scX = rotSrcW / s.dispW, scY = rotSrcH / s.dispH;
  var sx=b.x*scX, sy=b.y*scY, sw=b.w*scX, sh=b.h*scY;
  var isAv=type==='av';
  var outW,outH;
  if(isAv){outW=outH=512;}
  else{outW=Math.min(Math.round(sw),2400);outH=Math.round(outW*(sh/sw));}
  var off=document.createElement('canvas');
  off.width=outW; off.height=outH;
  off.getContext('2d').drawImage(hiSrc,sx,sy,sw,sh,0,0,outW,outH);
  var a=document.createElement('a');
  a.href=off.toDataURL('image/png');
  a.download=isAv?'discord-avatar.png':'discord-banner.png';
  a.click();
}

function setRotation(type, val) {
  val = parseFloat(val);
  var s = state[type];
  s.rotation = val;
  document.getElementById(type+'-rot-val').textContent = val.toFixed(1) + '°';
  applyRotation(type);
}

function resetRotation(type) {
  state[type].rotation = 0;
  var rotEl = document.getElementById(type+'-rotation');
  if (rotEl) rotEl.value = 0;
  document.getElementById(type+'-rot-val').textContent = '0°';
  applyRotation(type);
}

function applyRotation(type) {
  var s = state[type];
  if (!s.originalImg) return;
  var prevDispW = s.dispW, prevDispH = s.dispH;
  var prevBox = { x: s.box.x, y: s.box.y, w: s.box.w, h: s.box.h };
  var rotSrc = buildRotatedSrc(type);
  var srcW = rotSrc.width || rotSrc.naturalWidth || s.naturalW;
  var srcH = rotSrc.height || rotSrc.naturalHeight || s.naturalH;
  var maxW = type === 'av' ? 480 : 560;
  var maxH = type === 'av' ? 420 : 240;
  var sc = Math.min(maxW / srcW, maxH / srcH, 1);
  s.dispW = Math.max(60, Math.round(srcW * sc));
  s.dispH = Math.max(40, Math.round(srcH * sc));
  s.scaleX = srcW / s.dispW;
  s.scaleY = srcH / s.dispH;
  var img = document.getElementById(type+'-img');
  var dpr = window.devicePixelRatio || 1;
  var dispCanvas = document.getElementById(type+'-disp-canvas');
  if (!dispCanvas) {
    dispCanvas = document.createElement('canvas');
    dispCanvas.id = type+'-disp-canvas';
    dispCanvas.style.display = 'block';
    img.parentNode.insertBefore(dispCanvas, img);
    img.style.display = 'none';
  }
  dispCanvas.width = s.dispW * dpr;
  dispCanvas.height = s.dispH * dpr;
  dispCanvas.style.width = s.dispW + 'px';
  dispCanvas.style.height = s.dispH + 'px';
  var dctx = dispCanvas.getContext('2d');
  dctx.scale(dpr, dpr);
  dctx.drawImage(rotSrc, 0, 0, srcW, srcH, 0, 0, s.dispW, s.dispH);
  var wrap = document.getElementById(type+'-wrap');
  wrap.style.width = s.dispW + 'px';
  wrap.style.height = s.dispH + 'px';
  var oc = document.getElementById(type+'-canvas');
  oc.width = s.dispW; oc.height = s.dispH;
  oc.style.width = s.dispW + 'px'; oc.style.height = s.dispH + 'px';
  if (prevDispW > 0 && prevDispH > 0) {
    var relX = prevBox.x / prevDispW;
    var relY = prevBox.y / prevDispH;
    var relW = prevBox.w / prevDispW;
    var relH = prevBox.h / prevDispH;
    var newW = Math.round(relW * s.dispW);
    var newH = Math.round(relH * s.dispH);
    var newX = Math.round(relX * s.dispW);
    var newY = Math.round(relY * s.dispH);
    newW = Math.min(newW, s.dispW); newH = Math.min(newH, s.dispH);
    newX = Math.max(0, Math.min(s.dispW - newW, newX));
    newY = Math.max(0, Math.min(s.dispH - newH, newY));
    if (type === 'av') {
      var sq = Math.min(newW, newH, s.dispW, s.dispH);
      newW = newH = sq;
      newX = Math.max(0, Math.min(s.dispW - newW, newX));
      newY = Math.max(0, Math.min(s.dispH - newH, newY));
    }
    s.box = { x: newX, y: newY, w: newW, h: newH };
  } else {
    initBox(type);
  }
  renderOverlay(type);
  liveUpdate(type);
}

// WASD / setas
(function() {
  var keys = {};
  var rafId = null;
  var STEP = 0.4;
  var accumX = 0, accumY = 0;

  function activeType() {
    var avVisible = document.getElementById('av-editor') && document.getElementById('av-editor').style.display !== 'none';
    var bnVisible = document.getElementById('bn-editor') && document.getElementById('bn-editor').style.display !== 'none';
    if (avVisible && bnVisible) return _lastHovered || 'av';
    if (avVisible) return 'av';
    if (bnVisible) return 'bn';
    return null;
  }

  var _lastHovered = null;
  ['av','bn'].forEach(function(t){
    var wrap = document.getElementById(t+'-wrap');
    if (wrap) wrap.addEventListener('mouseenter', function(){ _lastHovered = t; });
  });

  function isArrowOrWASD(key) {
    return ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d','W','A','S','D'].indexOf(key) !== -1;
  }

  function getDelta(key) {
    if (key === 'ArrowUp'    || key === 'w' || key === 'W') return [0, -STEP];
    if (key === 'ArrowDown'  || key === 's' || key === 'S') return [0,  STEP];
    if (key === 'ArrowLeft'  || key === 'a' || key === 'A') return [-STEP, 0];
    if (key === 'ArrowRight' || key === 'd' || key === 'D') return [ STEP, 0];
    return [0, 0];
  }

  function moveStep() {
    var type = activeType();
    if (!type) return;
    var dx = 0, dy = 0;
    Object.keys(keys).forEach(function(k){
      if (!keys[k]) return;
      var d = getDelta(k);
      dx += d[0]; dy += d[1];
    });
    if (dx === 0 && dy === 0) { accumX = 0; accumY = 0; return; }
    accumX += dx; accumY += dy;
    var moveX = Math.trunc(accumX);
    var moveY = Math.trunc(accumY);
    if (moveX === 0 && moveY === 0) return;
    accumX -= moveX; accumY -= moveY;
    var s = state[type];
    var b = s.box;
    b.x = Math.max(0, Math.min(s.dispW - b.w, b.x + moveX));
    b.y = Math.max(0, Math.min(s.dispH - b.h, b.y + moveY));
    renderOverlay(type);
    liveUpdate(type);
  }

  function loop() { moveStep(); rafId = requestAnimationFrame(loop); }

  function stopAll() {
    keys = {}; accumX = 0; accumY = 0;
    if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
  }

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Shift') { stopAll(); return; }
    var tag = document.activeElement && document.activeElement.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (!isArrowOrWASD(e.key)) return;
    e.preventDefault();
    keys[e.key] = true;
    if (rafId === null) rafId = requestAnimationFrame(loop);
  });

  document.addEventListener('keyup', function(e) {
    if (e.key === 'Shift') { stopAll(); return; }
    delete keys[e.key];
    var anyActive = Object.keys(keys).some(function(k){ return isArrowOrWASD(k); });
    if (!anyActive && rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
  });

  window.addEventListener('blur', stopAll);
  document.addEventListener('visibilitychange', function(){ if (document.hidden) stopAll(); });
})();
