function srgbToLinear(c) {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function linearToSrgb(c) {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1/2.4) - 0.055;
}

function hexToOklch(hex) {
  var r = srgbToLinear(parseInt(hex.slice(1,3),16)/255);
  var g = srgbToLinear(parseInt(hex.slice(3,5),16)/255);
  var b = srgbToLinear(parseInt(hex.slice(5,7),16)/255);
  var X = 0.4122214708*r + 0.5363325363*g + 0.0514459929*b;
  var Y = 0.2119034982*r + 0.6806995451*g + 0.1073969566*b;
  var Z = 0.0883024619*r + 0.2817188376*g + 0.6299787005*b;
  var l = Math.cbrt(0.8189330101*X + 0.3618667424*Y - 0.1288597137*Z);
  var m = Math.cbrt(0.0329845436*X + 0.9293118715*Y + 0.0361456387*Z);
  var s = Math.cbrt(0.0482003018*X + 0.2643662691*Y + 0.6338517070*Z);
  var La = 0.2104542553*l + 0.7936177850*m - 0.0040720468*s;
  var a  = 1.9779984951*l - 2.4285922050*m + 0.4505937099*s;
  var bb = 0.0259040371*l + 0.7827717662*m - 0.8086757660*s;
  var C = Math.sqrt(a*a + bb*bb);
  var H = Math.atan2(bb, a) * 180 / Math.PI;
  if (H < 0) H += 360;
  return [La, C, H];
}

function oklchToHex(L, C, H) {
  var hr = H * Math.PI / 180;
  var a = C * Math.cos(hr), b = C * Math.sin(hr);
  var l = Math.pow(L + 0.3963377774*a + 0.2158037573*b, 3);
  var m = Math.pow(L - 0.1055613458*a - 0.0638541728*b, 3);
  var s = Math.pow(L - 0.0894841775*a - 1.2914855480*b, 3);
  var r =  4.0767416621*l - 3.3077115913*m + 0.2309699292*s;
  var g = -1.2684380046*l + 2.6097574011*m - 0.3413193965*s;
  var bv = -0.0041960863*l - 0.7034186147*m + 1.7076147010*s;
  r = Math.max(0, Math.min(1, linearToSrgb(r)));
  g = Math.max(0, Math.min(1, linearToSrgb(g)));
  bv = Math.max(0, Math.min(1, linearToSrgb(bv)));
  return '#' + [r,g,bv].map(function(v){ return Math.round(v*255).toString(16).padStart(2,'0'); }).join('');
}

function discordClampColor(hex) {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return hex;
  var lch = hexToOklch(hex);
  var L = lch[0], C = lch[1], H = lch[2];
  var TARGET_L = 0.40;
  if (C < 0.02) return oklchToHex(TARGET_L, 0, H);
  var newL, newC;
  if (L > TARGET_L) {
    var ratio = TARGET_L / L;
    newL = TARGET_L; newC = C * ratio * 0.9;
  } else if (L < 0.25) {
    newL = 0.35; newC = C;
  } else {
    newL = L; newC = C;
  }
  newC = Math.min(newC, 0.28);
  return oklchToHex(newL, newC, H);
}

function getLuminance(hex) {
  var r=parseInt(hex.slice(1,3),16)/255, g=parseInt(hex.slice(3,5),16)/255, b=parseInt(hex.slice(5,7),16)/255;
  var toL=function(c){return c<=0.04045?c/12.92:Math.pow((c+0.055)/1.055,2.4);};
  return 0.2126*toL(r)+0.7152*toL(g)+0.0722*toL(b);
}

function hexToHsl(hex) {
  var r=parseInt(hex.slice(1,3),16)/255, g=parseInt(hex.slice(3,5),16)/255, b=parseInt(hex.slice(5,7),16)/255;
  var max=Math.max(r,g,b), min=Math.min(r,g,b), h, s, l=(max+min)/2;
  if(max===min){ h=s=0; } else {
    var d=max-min; s=l>0.5?d/(2-max-min):d/(max+min);
    switch(max){ case r:h=((g-b)/d+(g<b?6:0))/6;break; case g:h=((b-r)/d+2)/6;break; case b:h=((r-g)/d+4)/6;break; }
  }
  return [h*360, s*100, l*100];
}

function hslToHex(h, s, l) {
  h/=360; s/=100; l/=100;
  var r,g,b;
  if(s===0){ r=g=b=l; } else {
    var hue2rgb=function(p,q,t){if(t<0)t+=1;if(t>1)t-=1;if(t<1/6)return p+(q-p)*6*t;if(t<1/2)return q;if(t<2/3)return p+(q-p)*(2/3-t)*6;return p;};
    var q=l<0.5?l*(1+s):l+s-l*s, p=2*l-q;
    r=hue2rgb(p,q,h+1/3); g=hue2rgb(p,q,h); b=hue2rgb(p,q,h-1/3);
  }
  return '#'+[r,g,b].map(function(v){return Math.round(v*255).toString(16).padStart(2,'0');}).join('');
}

function deriveCardBodyColor(bannerHex) {
  var lch = hexToOklch(bannerHex);
  var L = lch[0], C = lch[1], H = lch[2];
  var chromaScale = C < 0.06 ? (C / 0.06) * 0.08 : 0.25;
  var bodyC = C * chromaScale;
  if (L > 0.60) {
    if (bodyC < 0.004) return '#ffffff';
    return oklchToHex(Math.min(0.97, L * 1.15 + 0.06), bodyC, H);
  } else {
    return oklchToHex(Math.max(0.08, L * 0.42), C * 0.70, H);
  }
}

function isLightColor(hex) {
  return hexToOklch(hex)[0] > 0.75;
}

function buildColorPalette(imgOrCanvas, sx, sy, sw, sh) {
  var c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  var ctx = c.getContext('2d');
  if (sx !== undefined) {
    ctx.drawImage(imgOrCanvas, sx, sy, sw, sh, 0, 0, 64, 64);
  } else {
    ctx.drawImage(imgOrCanvas, 0, 0, 64, 64);
  }
  var d = ctx.getImageData(0, 0, 64, 64).data;
  var buckets = {};
  for (var i = 0; i < d.length; i += 4) {
    if (d[i+3] < 100) continue;
    var r = Math.round(d[i] / 16) * 16;
    var g = Math.round(d[i+1] / 16) * 16;
    var b = Math.round(d[i+2] / 16) * 16;
    var key = r+'_'+g+'_'+b;
    buckets[key] = (buckets[key] || {r:r,g:g,b:b,n:0});
    buckets[key].n++;
  }
  var sorted = Object.values(buckets).sort(function(a,b){return b.n-a.n;});
  var palette = [];
  for (var j = 0; j < sorted.length && palette.length < 6; j++) {
    var candidate = sorted[j];
    var distinct = true;
    for (var k = 0; k < palette.length; k++) {
      var dr = candidate.r - palette[k].r, dg = candidate.g - palette[k].g, db = candidate.b - palette[k].b;
      if (Math.sqrt(dr*dr + dg*dg + db*db) < 40) { distinct = false; break; }
    }
    if (distinct) palette.push(candidate);
  }
  return palette.map(function(c) {
    return '#' + [c.r,c.g,c.b].map(function(v){return Math.min(255,v).toString(16).padStart(2,'0');}).join('');
  });
}
