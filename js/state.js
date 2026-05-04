var state = {
  av: { naturalW:0,naturalH:0,dispW:0,dispH:0,scaleX:1,scaleY:1,box:{x:0,y:0,w:0,h:0},rotation:0,originalImg:null,rotatedCanvas:null,rotW:0,rotH:0 },
  bn: { naturalW:0,naturalH:0,dispW:0,dispH:0,scaleX:1,scaleY:1,box:{x:0,y:0,w:0,h:0},aspect:960/240,rotation:0,originalImg:null,rotatedCanvas:null,rotW:0,rotH:0 }
};

var drag = { active:false,type:null,mode:null,handle:null,sx:0,sy:0,startBox:null };
var DEFAULT_BANNER = '#23262a';
var DEFAULT_BODY   = '#111214';
var profileColor = DEFAULT_BANNER;
var profileColorActive = false;
var avatarDataURL = null;
