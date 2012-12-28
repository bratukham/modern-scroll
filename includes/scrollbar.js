// ==UserScript==
// @name          modern scroll
// @description	  takes scrolling in Opera to a whole new level
// @author        Christoph D.
// @exclude http://acid3.acidtests.org/
// @exclude http://www.megalab.it/*
// @exclude *://mail.google.*
// @exclude *://maps.google.*
// @exclude http://docs.sencha.com/*
// ==/UserScript==

var timeout;				// scrolling animation
var hide_timeout;			// hide bars
var w = widget.preferences;	// \
var vbar;					//  | pass by reference!
var hbar;					// /

window.opera.addEventListener("BeforeEvent.DOMContentLoaded", call_on_load, false);
window.addEventListener("DOMContentLoaded", function(){ // local files except options page:
	if(!vbar && document.URL.substr(0,9) !== "widget://") call_on_load();
}, false);

function call_on_load(){
	if(window.matchMedia("all and (view-mode: minimized)").matches) return; // don't do anything if it's a speed dial
	if(window.self != window.top){ // only treat main & iframes
		try{
			if(window.self.frameElement == "[object HTMLIFrameElement]"/* && window.self.frameElement.scrolling != "no"*/)
				if(!document.URL.match("//translate.google.")) window.self.frameElement.scrolling = "no";
			else return;
		}catch(e){ return; /* window.self.frameElement == protected variable */ }
	}
	
	inject_css();
	
	if(w.fullscreen_only === "0" || window.screen.height === window.outerHeight){
		add_ui();
		window.opera.addEventListener("AfterEvent.DOMContentLoaded", resize_bars, false);
	}
	
	opera.extension.onmessage = function(){
		remove_ui();
		inject_css();
		add_or_remove_ui(); // re-adds it if appropriate
	}
	//alert(w.gap+": ==2: "+(w.gap==2)+"<-> ===2: "+(w.gap==="2"));
	opera.extension.postMessage("reset_contextmenu");
	window.addEventListener("mousedown", adjust_contextmenu, false);
	opera.contexts.menu.onclick = contextmenu_click;
}

function inject_css(){
	if(document.body.currentStyle.height == "100%") document.body.dataset.msHeightCorrect = 1; // save to body-tag to set it every time
	if(document.body.currentStyle.width == "100%") document.body.dataset.msWidthCorrect = 1;
	
	var ms_style =
		(document.body.dataset.msHeightCorrect?"body{ height:auto !important; min-height:100%; }":"")+
		(document.body.dataset.msWidthCorrect?"body{ width:auto !important; min-width:100%; }":"")+
		
		/* set back standard values (CSS values not necessarily used by modern scroll, but maybe altered by the website): */
		"#ms_v_container, #ms_h_container, #ms_vbar_bg, #ms_hbar_bg, #ms_vbar, #ms_hbar, #ms_superbar, #ms_page_cover, #ms_upbutton, #ms_downbutton, #ms_minipage_canvas{ position:fixed; z-index:2147483647; border:none; padding:0; margin:0; display:none; }"+
		"#ms_vbar_ui, #ms_hbar_ui, #ms_vbar_bg_ui, #ms_hbar_bg_ui{ border:none; padding:0; margin:0; }"+
		
		/* set values (most general first - can be overwritten by following rules): */
		"#ms_v_container{ height:100%; width:"+(w.container==="1"?w.container_size:"1")+"px; "+(w.vbar_at_left=="1"?"left":"right")+":0px; top:0px; background:rgba(0,0,0,0); }"+
		"#ms_h_container{ height:"+(w.container==="1"?w.container_size:"1")+"px; width:100%; left:0px; "+(w.hbar_at_top==="1"?"top":"bottom")+":0px; background:rgba(0,0,0,0); }"+
		"#ms_vbar_bg, #ms_hbar_bg{ opacity:"+((w.show_when==="3" && w.no_bar_bg != "1")?(w.opacity/100):"0")+"; transition:opacity 0.5s 1s; }"+
		"#ms_vbar_bg{ top:"+w.gap+"px; bottom:"+w.gap+"px; height:auto; width:auto; "+(w.vbar_at_left==="1"?"left":"right")+":0px; "+(w.vbar_at_left==="0"?"left":"right")+":auto; }"+
		"#ms_hbar_bg{ "+(w.vbar_at_left==="0"?"left":"right")+":0px; "+(w.vbar_at_left=="1"?"left":"right")+":"+(parseInt(w.hover_size)+parseInt(w.gap))+"px; "+(w.vbar_at_left==="0"?"left":"right")+":"+w.gap+"px; width:auto; height:auto; "+(w.hbar_at_top==="1"?"top":"bottom")+":0px; "+(w.hbar_at_top==="0"?"top":"bottom")+":auto; }"+
		"#ms_vbar_bg_ui, #ms_hbar_bg_ui{ background:"+w.color_bg+"; box-shadow:inset 0 0 "+w.border_blur+"px "+w.border_width+"px "+w.border_color_rgba+" !important; border-radius:"+w.border_radius+"px; }"+
		"#ms_vbar_bg_ui{ margin-"+(w.vbar_at_left==="1"?"left":"right")+":"+(w.gap)+"px; height:100%; width:"+w.size+"px; transition:width 0.25s; }"+
		"#ms_hbar_bg_ui{ margin-"+(w.hbar_at_top==="1"?"top":"bottom")+":"+(w.gap)+"px; width:100%; height:"+w.size+"px; transition:height 0.25s; }"+
		"#ms_vbar, #ms_hbar{ opacity:"+((w.show_when==="3")?(w.opacity/100):"0")+"; transition:opacity 0.5s 1s; }"+
		"#ms_vbar{ top:0px; height:"+(30+2*w.gap)+"px; min-height:"+(30+2*w.gap)+"px; width:auto; "+(w.vbar_at_left==="1"?"left":"right")+":0px; "+(w.vbar_at_left==="0"?"left":"right")+":auto; }"+
		"#ms_hbar{ left:0px; width:"+(30+2*w.gap)+"px; min-width:"+(30+2*w.gap)+"px; height:auto; "+(w.hbar_at_top==="1"?"top":"bottom")+":0px; "+(w.hbar_at_top==="0"?"top":"bottom")+":auto; }"+
		"#ms_vbar_ui, #ms_hbar_ui{ background:"+w.color+"; box-shadow:inset 0 0 "+w.border_blur+"px "+w.border_width+"px "+w.border_color_rgba+" !important; border-radius:"+w.border_radius+"px; }"+
		"#ms_vbar_ui{ height:30px; min-height:30px; width:"+w.size+"px; margin-top:"+w.gap+"px; margin-bottom:"+w.gap+"px; margin-"+(w.vbar_at_left=="1"?"left":"right")+":"+w.gap+"px; transition:width 0.25s; }"+
		"#ms_hbar_ui{ width:30px; min-width:30px; height:"+w.size+"px; margin-left:"+w.gap+"px; margin-right:"+w.gap+"px; margin-"+(w.hbar_at_top=="1"?"top":"bottom")+":"+(w.gap)+"px; transition:height 0.25s; }"+
		"#ms_superbar{ width:100px; background:"+(w.show_superbar_minipage==="0"?w.color:"rgba(0,0,0,0)")+"; opacity:"+((w.show_when==="3")?"0.5":"0")+"; box-shadow:inset 0 0 "+w.border_blur+"px "+w.border_width+"px "+w.border_color_rgba+" "+(w.show_superbar_minipage==="1"?", 0 0 200px 10px #999":"")+" !important; border-radius:"+w.border_radius+"px; transition:opacity 0.5s 1s; min-width:30px; min-height:30px; }"+
		"#ms_page_cover{ left:0px; top:0px; width:100%; height:100%; background:rgba(0,0,0,0); padding:0px; margin:0px; }"+
		"#ms_upbutton, #ms_downbutton{ height:"+w.button_height*2+"px; width:"+w.button_width+"px; left:"+w.buttonposition+"%; opacity:"+w.button_opacity/100+"; background:"+w.color+"; border-radius:50px; box-shadow:inset 0 0 0 2px rgba(255,255,255,0.5); transition:opacity 0.5s; }"+
		"#ms_upbutton{ top:-"+w.button_height+"px; }"+
		"#ms_downbutton{ bottom:-"+w.button_height+"px; }"+
		"#ms_minipage_canvas{ top:0px; left:0px; background:#000; }"+
		
		"#ms_v_container:hover #ms_vbar_ui, #ms_v_container:hover #ms_vbar_bg_ui{ width:"+w.hover_size+"px; transition:width 0.1s; }"+
		"#ms_h_container:hover #ms_hbar_ui, #ms_h_container:hover #ms_hbar_bg_ui{ height:"+w.hover_size+"px; transition:height 0.1s; }"+
		"#ms_v_container:hover #ms_vbar, #ms_h_container:hover #ms_hbar{ opacity:"+(w.opacity/100)+"; transition:opacity 0.1s 0s; }"+
		"#ms_v_container:hover #ms_vbar_bg, #ms_h_container:hover #ms_hbar_bg{ opacity:"+(w.no_bar_bg=="1"?"0":(w.opacity/100))+"; transition:opacity 0.1s 0s; }"+
		"#ms_v_container #ms_vbar:hover, #ms_h_container #ms_hbar:hover, #ms_upbutton:hover, #ms_downbutton:hover{ opacity:"+((parseInt(w.opacity)+20)/100)+"; transition:opacity 0.1s 0s; }"+
		"#ms_v_container #ms_vbar_bg:hover, #ms_h_container #ms_hbar_bg:hover{ opacity:"+(w.no_bar_bg==="1"?"0":((parseInt(w.opacity)+1)/100))+"; transition:opacity 0.1s 0s; }"+
		"#ms_superbar:hover{ opacity:"+w.superbar_opacity/100+"; transition:opacity 0.25s 0s; }"+
		
		".dragged #ms_vbar_bg, .dragged #ms_hbar_bg{ opacity:"+(w.no_bar_bg==="1"?"0":(w.opacity/100))+"; }"+
		".dragged #ms_vbar, .dragged #ms_hbar{ opacity:"+(w.opacity>80?"1":((parseInt(w.opacity)+20)/100))+"; }"+
		".dragged #ms_vbar_ui, .dragged #ms_vbar_bg_ui{ width:"+w.hover_size+"px; }"+
		".dragged #ms_hbar_ui, .dragged #ms_hbar_bg_ui{ height:"+w.hover_size+"px; }"+
		"#ms_superbar.dragged{ opacity:"+(w.show_superbar_minipage==="1"?1:(w.superbar_opacity/100))+"; }";
	
	if(document.getElementById("ms_style")) document.getElementById("ms_style").innerHTML = ms_style; // when options changed
	else{ // when website is initially loaded
		var style = document.createElement("style");
		style.setAttribute("type","text/css");
		style.id = "ms_style";
		style.innerHTML = ms_style;
		document.getElementsByTagName("head")[0].appendChild(style);
	}
}

function add_bars(){	
	var v_container = document.createElement("div");
	v_container.id = "ms_v_container";
	v_container.innerHTML = "<div id='ms_vbar_bg'><div id='ms_vbar_bg_ui'></div></div><div id='ms_vbar'><div id='ms_vbar_ui'></div></div>";
	
	var h_container = document.createElement("div");
	h_container.id = "ms_h_container";
	h_container.innerHTML = "<div id='ms_hbar_bg'><div id='ms_hbar_bg_ui'></div></div><div id='ms_hbar'><div id='ms_hbar_ui'></div></div>";
	
	var superbar = document.createElement("div");
	superbar.id = "ms_superbar";
	
	var page_cover = document.createElement("div"); // covers the page and thus prevents cursor changes when dragging
	page_cover.innerHTML = "<canvas id='ms_minipage_canvas' width='"+window.innerWidth+"' height='"+window.innerHeight+"'></canvas>";
	page_cover.id = "ms_page_cover";
	
	document.body.appendChild(page_cover);
	document.body.appendChild(superbar);
	document.body.appendChild(h_container);
	document.body.appendChild(v_container); // last in DOM gets displayed top
	
	vbar = document.getElementById("ms_vbar");
	hbar = document.getElementById("ms_hbar");
}

function add_functionality(){
	document.getElementById("ms_vbar_bg").addEventListener("mousedown", scroll_bg_v, true);
	document.getElementById("ms_hbar_bg").addEventListener("mousedown", scroll_bg_h, true);
	
	document.getElementById("ms_superbar").addEventListener("mousedown", drag_super, true);
	vbar.addEventListener("mousedown", drag_v, true);
	hbar.addEventListener("mousedown", drag_h, true);
	
	document.getElementById("ms_h_container").addEventListener("mousewheel", ms_mousescroll_x, true);
	document.getElementById("ms_hbar_bg").addEventListener("mousewheel", ms_mousescroll_x, true);
	hbar.addEventListener("mousewheel", ms_mousescroll_x, true);
	
	if(document.getElementById("ms_upbutton")){
		document.getElementById("ms_upbutton").addEventListener("mousedown", function(){ handle_button("up"); }, true);
		document.getElementById("ms_downbutton").addEventListener("mousedown", function(){ handle_button("down"); }, true);
	}
	
	window.addEventListener("DOMNodeInserted", onDOMNode, false);
	if(!document.URL.match("://vk.com")) window.addEventListener("DOMNodeRemoved", onDOMNode, false);
	if(window.self.frameElement || w.use_own_scroll_functions == "1"){
		window.addEventListener("keydown", ms_arrowkeyscroll, false);
		window.addEventListener("keydown", ms_otherkeyscroll, false);
		//window.addEventListener("mousewheel", ms_mousescroll_y, false); // -> set in resize_vbar()
	}
	
	window.addEventListener("resize", resize_bars, false);
	window.addEventListener("resize", add_or_remove_ui, false);
	window.addEventListener("mouseup", check_resize, false);
	if(w.move_bars_during_scroll == "1") window.addEventListener("scroll", reposition_bars, false);
	else window.addEventListener("scroll", onScroll, false);
}

function check_resize(){
	if(window.event.target.id.substr(0,3) === "ms_") return;
	last_clicked_element_is_scrollable = is_scrollable(window.event.target, 2) ? 1 : 0;
	window.setTimeout(resize_bars, 200); // needs some time to affect page height if click expands element
}
function resize_bars(){
	set_new_scrollMax_values();
	resize_vbar();
	resize_hbar();
	reposition_bars();
}
function set_new_scrollMax_values(){
	window.scrollMaxX = Math.max(document.body.scrollWidth, document.documentElement.scrollWidth, window.innerWidth) - window.innerWidth;
	window.scrollMaxY = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight, window.innerHeight) - window.innerHeight;
}
function resize_vbar(){
	//don't display if content fits into window:
	if(window.scrollMaxY === 0){
		if(vbar.style.display == "inline"){
			document.getElementById("ms_v_container").style.display = null;
			document.getElementById("ms_vbar_bg").style.display = null;
			vbar.style.display = null;
			window.removeEventListener("mousewheel", ms_mousescroll_y, false);
		}
		return;
	}
	var vbar_height_before = vbar.style.height;
	var vbar_new_height = Math.round(window.innerHeight/(Math.max(document.body.scrollHeight,document.documentElement.scrollHeight)/window.innerHeight));
	vbar.style.height = vbar_new_height+"px"; // resize it
	
	if(vbar.style.display != "inline"){
		document.getElementById("ms_vbar_ui").style.height = vbar_new_height-2*w.gap+"px";
		document.getElementById("ms_v_container").style.display = "inline";
		document.getElementById("ms_vbar_bg").style.display = "inline";
		vbar.style.display = "inline";
		show_bar("v");
		opera.extension.postMessage("reset_contextmenu");
		
		if(window.self.frameElement || w.use_own_scroll_functions_mouse === "1")
			window.addEventListener("mousewheel", ms_mousescroll_y, false);
	}
	else if(vbar_height_before != vbar_new_height+"px"){
		document.getElementById("ms_vbar_ui").style.height = vbar_new_height-2*w.gap+"px";
		show_bar("v");
	}
}

function resize_hbar(){
	//don't display if content fits into window:
	if(window.scrollMaxX === 0){
		if(hbar.style.display == "inline"){
			document.getElementById("ms_h_container").style.display = null;
			document.getElementById("ms_hbar_bg").style.display = null;
			hbar.style.display = null;
		}
		return;
	}
	var hbar_width_before = hbar.style.width;
	var hbar_new_width = Math.round(window.innerWidth/(Math.max(document.body.scrollWidth,document.documentElement.scrollWidth)/window.innerWidth));
	hbar.style.width = hbar_new_width+"px"; // resize it
	
	if(hbar.style.display != "inline"){
		document.getElementById("ms_hbar_ui").style.width = hbar_new_width-2*w.gap+"px";
		document.getElementById("ms_h_container").style.display = "inline";
		document.getElementById("ms_hbar_bg").style.display = "inline";
		hbar.style.display = "inline";
		show_bar("h");
		opera.extension.postMessage("reset_contextmenu");
	}
	else if(hbar_width_before != hbar_new_width+"px"){
		document.getElementById("ms_hbar_ui").style.width = hbar_new_width-2*w.gap+"px";
		show_bar("h");
	}
}

function drag_mode(which_bar){
	if(which_bar){
		window.removeEventListener("scroll", reposition_bars, false);
		window.removeEventListener("scroll", onScroll, false);
		document.getElementById("ms_page_cover").style.display = "inline";
		document.getElementById("ms_"+which_bar).className = "dragged";
	}
	else{
		if(w.move_bars_during_scroll === "1") window.addEventListener("scroll", reposition_bars, false);
		else window.addEventListener("scroll", onScroll, false);
		document.getElementById("ms_page_cover").style.display = null;
		document.getElementsByClassName("dragged")[0].className = null;
	}
}

function drag_v(){
	window.event.preventDefault();			// prevent focus-loss in site
	if(window.event.which !== 1) return;	// if it's not the left mouse button
	window.event.stopPropagation();			// prevent bubbling (e.g. prevent drag being triggered on separately opened images)
	
	drag_mode("v_container");
	
	var dragy = window.event.clientY - parseInt(vbar.style.top);
	document.onmousemove = function(){
		var posy = window.event.clientY;
		var new_top = Math.round((posy - dragy)<=0? 0 : ((posy - dragy)>=window.innerHeight-vbar.offsetHeight?window.innerHeight-vbar.offsetHeight : (posy - dragy)));
		vbar.style.top = new_top+"px";
		window.scroll(window.pageXOffset, Math.round(new_top/(window.innerHeight-vbar.offsetHeight)*window.scrollMaxY));
	}
	document.onmouseup = function(){
		drag_mode(0);		
		document.onmousemove = null;
		document.onmouseup = null;
	};
}

function drag_h(){
	window.event.preventDefault();			// prevent focus-loss in site
	if(window.event.which !== 1) return;	// if it's not the left mouse button
	window.event.stopPropagation();			// prevent bubbling (e.g. prevent drag being triggered on separately opened images)
	
	drag_mode("h_container");
		
	var dragx = window.event.clientX - parseInt(hbar.style.left);
	document.onmousemove = function(){
		var posx = window.event.clientX;
		
		if(w.vbar_at_left=="0"){
			var new_left = Math.round((posx - dragx)<=0 ? 0 : ((posx - dragx)>=window.innerWidth-hbar.offsetWidth-w.hover_size ? window.innerWidth-hbar.offsetWidth-w.hover_size : posx-dragx));
			hbar.style.left = new_left+"px";
		}else{
			var new_left = Math.round((posx - dragx)<=parseInt(w.hover_size) ? 0 : ((posx - dragx)>=window.innerWidth-hbar.offsetWidth ? window.innerWidth-hbar.offsetWidth-w.hover_size : posx-dragx-w.hover_size));
			hbar.style.left = new_left+parseInt(w.hover_size)+"px";
		}
		window.scroll(Math.round((new_left/(window.innerWidth-hbar.offsetWidth-w.hover_size)*window.scrollMaxX)), window.pageYOffset);
	}
	document.onmouseup = function(){
		drag_mode(0);
		document.onmousemove = null;
		document.onmouseup = null;
	};
}

function drag_super(){
	window.event.preventDefault();			// prevent focus-loss in site
	if(window.event.which !== 1) return;	// if it's not the left mouse button
	window.event.stopPropagation();			// prevent bubbling (e.g. prevent drag being triggered on separately opened images)
	
	if(w.show_superbar_minipage === "1") show_minipage();
	else show_bars();
	
	drag_mode("superbar");
	
	var superbar = document.getElementById("ms_superbar");
	var dragy = window.event.clientY - parseInt(superbar.style.top);
	var dragx = window.event.clientX - parseInt(superbar.style.left);
	document.onmousemove = function(){
		superbar.style.display = "inline";
		var posx = window.event.clientX;
		var posy = window.event.clientY;
		
		var new_top = Math.round((posy - dragy)<=0? 0 : ((posy - dragy)>=window.innerHeight-superbar.offsetHeight?window.innerHeight-superbar.offsetHeight : (posy - dragy)));
		superbar.style.top =  new_top+"px";
		
		if(w.show_superbar_minipage === "0"){
			if(w.vbar_at_left === "0"){
				var new_left = Math.round(((posx - dragx)<=0 ? 0 : ((posx - dragx)>=window.innerWidth-superbar.offsetWidth-w.hover_size ? window.innerWidth-superbar.offsetWidth-w.hover_size : posx-dragx)));
				superbar.style.left = new_left+"px";
			}else{
				var new_left = Math.round((posx - dragx)<=parseInt(w.hover_size) ? 0 : ((posx - dragx)>=window.innerWidth-superbar.offsetWidth ? window.innerWidth-superbar.offsetWidth-w.hover_size : posx-dragx-w.hover_size));
				superbar.style.left = new_left+parseInt(w.hover_size)+"px";
			}
			window.scroll(new_left/(window.innerWidth-superbar.offsetWidth-w.hover_size)*window.scrollMaxX, parseInt(superbar.style.top)/(window.innerHeight-superbar.offsetHeight)*window.scrollMaxY);
			
			vbar.style.top = superbar.style.top;
			hbar.style.left = superbar.style.left;
		}
		else
			superbar.style.left = ((posx - dragx)<=0? 0 : ((posx - dragx)>=window.innerWidth-superbar.offsetWidth?window.innerWidth-superbar.offsetWidth : (posx - dragx))) + "px";		
	};
	document.onmouseup = function(){
		if(w.show_superbar_minipage === "1"){
			window.scroll(parseInt(superbar.style.left)/(window.innerWidth-superbar.offsetWidth)*window.scrollMaxX, parseInt(superbar.style.top)/(window.innerHeight-superbar.offsetHeight)*window.scrollMaxY);
			if(window.pageXOffset == 0 && window.pageYOffset == 0){ // doesn't update position automatically cause of scrolling to 0,0 before screenshot
				vbar.style.top = "0px";
				hbar.style.left = "0px";
				show_bars();
			}
			document.getElementById("ms_vbar_bg").style.display = "inline";
			document.getElementById("ms_hbar_bg").style.display = "inline";
			vbar.style.display = "inline";
			hbar.style.display = "inline";
			document.getElementById("ms_minipage_canvas").style.display = null;
		}
		else hide_bars();
		
		drag_mode(0);
		document.onmousemove = null;
		document.onmouseup = null;
	};
}

function reposition_bars()
{
	document.getElementById("ms_vbar_bg").style.width = vbar.offsetWidth+"px"; //DSK-375403 (?)
	
	var vbar_top_before = vbar.style.top;
	var hbar_left_before = hbar.style.left;
	
	if(vbar.style.display == "inline")
		vbar.style.top = Math.round(window.pageYOffset/window.scrollMaxY*(window.innerHeight-vbar.offsetHeight))+"px";
	if(hbar.style.display == "inline"){
		var left = Math.round(window.pageXOffset/window.scrollMaxX*(window.innerWidth-hbar.offsetWidth));
		hbar.style.left = left-(parseInt(w.hover_size)*left/(window.innerWidth-hbar.offsetWidth))+(w.vbar_at_left=="1"?parseInt(w.hover_size):0)+"px";
	}
	if(window.pageYOffset > 0 && document.getElementById("ms_upbutton")) document.getElementById("ms_upbutton").style.display = "inline";
	else if(document.getElementById("ms_upbutton")) document.getElementById("ms_upbutton").style.display = null;
	if(window.pageYOffset < window.scrollMaxY && document.getElementById("ms_downbutton"))
		document.getElementById("ms_downbutton").style.display = "inline";
	else if(document.getElementById("ms_downbutton")) document.getElementById("ms_downbutton").style.display = null;
	
	if(vbar.style.display == "inline" && hbar.style.display == "inline" && w.show_superbar=="1"){
		document.getElementById("ms_superbar").style.top = vbar.style.top;
		document.getElementById("ms_superbar").style.height = vbar.style.height;
		document.getElementById("ms_superbar").style.left = hbar.style.left;
		document.getElementById("ms_superbar").style.width = hbar.style.width;
		if(w.show_superbar_minipage=="0"){
			document.getElementById("ms_superbar").style.transform = "scale("+(window.innerWidth/10)/parseInt(document.getElementById("ms_superbar").style.width)+","+(window.innerHeight/10)/parseInt(document.getElementById("ms_superbar").style.height)+")";
		}
		document.getElementById("ms_superbar").style.display = "inline";
	}
	else if(w.show_superbar === "1" && document.getElementById("ms_superbar").style.opacity != "1") //if superbar doesn't get dragged (minipage only -> no bars)
		window.setTimeout(function(){ document.getElementById("ms_superbar").style.display = null; }, 1500);
	
	if(vbar_top_before != vbar.style.top) show_bar("v");
	if(hbar_left_before != hbar.style.left) show_bar("h");
	
	document.getElementById("ms_vbar_bg").style.width = null; //DSK-375403 (hover-width not reset) (?)
	window.clearTimeout(hide_timeout);
	hide_timeout = window.setTimeout(hide_bars, 500);
}

function scroll_bg_v(){
	window.event.preventDefault();		// prevent focus-loss in site
	if(window.event.which !== 1) return;// if it's not the left mouse button
	window.event.stopPropagation();		// prevent bubbling (e.g. prevent drag being triggered on separately opened images)
	
	if		(window.event.clientY < 50 && w.bg_special_ends === "1")						scroll_Pos1();
	else if	((window.innerHeight-window.event.clientY) < 50 && w.bg_special_ends === "1")	scroll_End();
	else if	(window.event.clientY > parseInt(vbar.style.top))								scroll_PageDown();
	else																					scroll_PageUp();
}

function scroll_bg_h(){
	window.event.preventDefault();		// prevent focus-loss in site
	if(window.event.which !== 1) return;// if it's not the left mouse button
	window.event.stopPropagation();		// prevent bubbling (e.g. prevent drag being triggered on separately opened images)
	
	if(window.event.clientX < 50 && w.bg_special_ends === "1"){
		if(w.animate_scroll === "1") ms_scrollBy(-window.pageXOffset, 0);
		else window.scrollBy(-window.pageXOffset, 0);
	}
	else if((window.innerWidth-window.event.clientX) < 50 && w.bg_special_ends === "1"){
		if(w.animate_scroll === "1") ms_scrollBy(window.scrollMaxX-window.pageXOffset, 0);
		else window.scrollBy(window.scrollMaxX-window.pageXOffset, 0);
	}
	else if(window.event.clientX > parseInt(hbar.style.left)){
		if(w.animate_scroll === "1") ms_scrollBy(window.innerWidth, 0);
		else window.scrollBy(window.innerWidth, 0);
	}
	else if(w.animate_scroll === "1") ms_scrollBy(-window.innerWidth, 0);
	else window.scrollBy(-window.innerWidth, 0);
}

function show_bars(){ show_bar("v"); show_bar("h"); }
function hide_bars(){ if(document.getElementsByClassName("dragged").length > 0) return;	hide_bar("v"); hide_bar("h"); }

function show_bar(whichone){
	if(w.show_when === "1") return; // 1 = only onmouseover
	if(w.no_bar_bg !== "1"){
		document.getElementById("ms_"+whichone+"bar_bg").style.transition = "opacity 0.25s 0s";
		document.getElementById("ms_"+whichone+"bar_bg").style.opacity = w.opacity/100;
	}
	if(document.getElementById("ms_"+whichone+"_container").className == "dragged") return;
	document.getElementById("ms_"+whichone+"bar").style.transition = "opacity 0.25s 0s";
	document.getElementById("ms_"+whichone+"bar").style.opacity = w.opacity/100;
}
function hide_bar(whichone){
	document.getElementById("ms_"+whichone+"bar_bg").style.transition = null;
	document.getElementById("ms_"+whichone+"bar_bg").style.opacity = null;
	document.getElementById("ms_"+whichone+"bar").style.transition = null;
	document.getElementById("ms_"+whichone+"bar").style.opacity = null;
}

function add_buttons(){
	var upbutton = document.createElement("div");
	upbutton.id = "ms_upbutton";
	
	var downbutton = document.createElement("div");
	downbutton.id = "ms_downbutton";
	
	document.body.appendChild(upbutton);
	document.body.appendChild(downbutton);
}

function handle_button(whichone){
	window.event.preventDefault();	// prevent focus-loss in site
	if(window.event.which !== 1) return;	// if it's not the left mouse button
	
	if(document.URL.substr(0,9) !== "widget://") window.event.stopPropagation(); // prevent bubbling (e.g. prevent drag being triggered on separately opened images); provide event in options page (to save dragged button position)
		
	var button = document.getElementById("ms_"+whichone+"button");
	button.className = "dragged_button";
	var otherbutton = document.getElementById("ms_"+(whichone==="up"?"down":"up")+"button");
	var x_start = window.event.clientX - Math.floor(button.style.left?parseInt(button.style.left):w.buttonposition/100*window.innerWidth);
	document.onmousemove = function(){
		button.style.opacity = "0.5";
		otherbutton.style.opacity = "0.5";
		var posx = window.event.clientX;
		button.style.left = ((posx - x_start)<=-50? -50 : ((posx - x_start)>=window.innerWidth+50-button.offsetWidth?window.innerWidth+50-button.offsetWidth : (posx - x_start))) + "px";
		otherbutton.style.left = button.style.left;
		document.onmouseup = function(){
			document.onmousemove = null;
			document.onmouseup = null;
			button.style.opacity = null;
			otherbutton.style.opacity = null;
		};
	}
	document.onmouseup = function(){
		if(whichone === "up") scroll_Pos1();
		else scroll_End();
		button.className = null;
		document.onmousemove = null;
		document.onmouseup = null;
	};
}

function show_minipage(){
	document.getElementById("ms_vbar_bg").style.display = null;
	document.getElementById("ms_hbar_bg").style.display = null;
	vbar.style.display = null;
	hbar.style.display = null;
	if(document.getElementById("ms_upbutton")){
		document.getElementById("ms_upbutton").style.display = null;
		document.getElementById("ms_downbutton").style.display = null;
	}
	
	document.body.style.transformOrigin = "0% 0%";
	document.body.style.transform = "scale("+(window.innerWidth/Math.max(document.body.scrollWidth,document.documentElement.scrollWidth,window.innerWidth))+","+(window.innerHeight/Math.max(document.body.scrollHeight,document.documentElement.scrollHeight,window.innerHeight))+")";
	window.scrollBy(-window.pageXOffset, -window.pageYOffset);
	if(document.body.className == "zoom"){
		var img = document.body.firstChild;
		img.style.transformOrigin = "0% 0%";
		img.style.transform = "scale("+(window.innerWidth/img.scrollWidth)+","+(window.innerHeight/img.scrollHeight)+")";
		window.scroll(img.offsetLeft,img.offsetTop);
	}	
	document.getElementById("ms_superbar").style.display = null;
	
	opera.extension.getScreenshot(function(imageData){
		if(document.body.className=="zoom"){
			document.body.firstChild.style.transformOrigin = null;
			document.body.firstChild.style.transform = null;
		}
		document.body.style.transform = null;
		document.body.style.transformOrigin = null;
		document.getElementById("ms_superbar").style.display = "inline";
		document.getElementById("ms_minipage_canvas").getContext('2d').putImageData(imageData, 0, 0);
		document.getElementById("ms_minipage_canvas").style.display = "inline";
	});
}

function onDOMNode(){
	window.clearTimeout(timeout);
	timeout = window.setTimeout(resize_bars, 100);
}
function onScroll(){
	window.clearTimeout(timeout);
	timeout = window.setTimeout(reposition_bars, 100);
}

function adjust_contextmenu(){
	window.event.stopPropagation();	// prevent bubbling (e.g. prevent drag being triggered on separately opened images)
	if(window.event.which != 3 || w.contextmenu_show_when !== "2") return; // only right mouse button:
	if(window.event.target.id.substr(0,3) === "ms_") opera.extension.postMessage("show_contextmenu");
	else opera.extension.postMessage("hide_contextmenu");
}
	
function contextmenu_click(){
	if(document.getElementById("ms_v_container")) remove_ui();
	else add_ui();
}

function add_or_remove_ui(){ 
	//alert(window.outerHeight+"\n"+window.innerHeight);
	if		(w.fullscreen_only === "0" || window.screen.height === window.outerHeight) add_ui();
	else if	(w.fullscreen_only === "1" && window.screen.height !== window.outerHeight) remove_ui();
}

function add_ui(){
	if(document.getElementById("ms_v_container")) return; // stop if ui is already available
	add_bars();
	if(w.show_buttons === "1" && !window.self.frameElement) add_buttons(); // have to be inserted before resize_bars()
	resize_bars();	
	add_functionality();
}

function remove_ui(){
	if(!document.getElementById("ms_v_container")) return;
	window.removeEventListener("DOMNodeInserted", onDOMNode, false);
	window.removeEventListener("DOMNodeRemoved", onDOMNode, false);
	window.removeEventListener("resize", resize_bars, false);
	window.removeEventListener("resize", add_or_remove_ui, false);
	window.removeEventListener("keydown", ms_arrowkeyscroll, false);
	window.removeEventListener("keydown", ms_otherkeyscroll, false);
	window.removeEventListener("mousewheel", ms_mousescroll_y, false);
	window.removeEventListener("mouseup", check_resize, false);
	window.removeEventListener("scroll", onScroll, false);
	window.removeEventListener("scroll", reposition_bars, false);
	
	window.clearTimeout(timeout);
	window.clearTimeout(hide_timeout);
	
	document.body.removeChild(document.getElementById("ms_v_container"));
	document.body.removeChild(document.getElementById("ms_h_container"));
	document.body.removeChild(document.getElementById("ms_page_cover"));
	document.body.removeChild(document.getElementById("ms_superbar"));
	if(document.getElementById("ms_upbutton")){
		document.body.removeChild(document.getElementById("ms_upbutton"));
		document.body.removeChild(document.getElementById("ms_downbutton"));
	}
}

var scroll_timeout_id;
var scroll_timeout_id_x; var scroll_end_timeout_id_x; var by_x = 0;
var scroll_timeout_id_y; var scroll_end_timeout_id_y; var by_y = 0;

function ms_scrollTo(x, y){
	x = x - window.pageXOffset;
	y = y - window.pageYOffset;
	ms_scrollBy(x, y);
}
function ms_scrollBy(x, y){
	if((by_y >= 0 && y > 0) || (by_y <= 0 && y < 0)){
		by_y += y;
		if(window.pageYOffset + by_y < 0) by_y = -window.pageYOffset;
		else if(window.pageYOffset + by_y > window.scrollMaxY) by_y = window.scrollMaxY - window.pageYOffset;
	}
	else by_y = 0;
	if((by_x >= 0 && x > 0) || (by_x <= 0 && x < 0)){
		by_x += x;
		if(window.pageXOffset + by_x < 0) by_x = -window.pageXOffset;
		else if(window.pageXOffset + by_x > window.scrollMaxX) by_x = window.scrollMaxX - window.pageXOffset;
	}
	else by_x = 0;
	
	ms_scroll();
}

function ms_scroll(){
	window.event.preventDefault(); window.event.stopPropagation();
	window.removeEventListener("scroll", onScroll, false);
	window.removeEventListener("scroll", reposition_bars, false);
	window.clearTimeout(hide_timeout); // prevent earlier animations from canceling the current scrolling animations
	
	if(by_y !== 0){
		show_bar("v");
		vbar.style.transition = "top "+Math.abs(by_y)/w.scroll_velocity+"ms linear";
		vbar.style.top = (parseInt(vbar.style.top)+Math.round(by_y/window.scrollMaxY*(document.getElementById("ms_vbar_bg").offsetHeight-parseInt(vbar.style.height))))+"px";
		ms_scroll_inner_y(new Date().getTime());
	}
	if(by_x !== 0){
		show_bar("h");
		hbar.style.transition = "top "+Math.abs(by_x)/w.scroll_velocity+"ms linear";
		hbar.style.left = (parseInt(hbar.style.left)+Math.round(by_x/window.scrollMaxX*(document.getElementById("ms_hbar_bg").offsetWidth-parseInt(hbar.style.width))))+"px";
		ms_scroll_inner_x(new Date().getTime());
	}
}
function ms_scroll_inner_y(lastTick)
{
	var curTick = new Date().getTime();
	var scrollamount = (curTick - lastTick) * w.scroll_velocity;
	
	if		(by_y > 0){ if(scrollamount > by_y) scrollamount = by_y; }
	else if	(by_y < 0){ scrollamount = -scrollamount; if(scrollamount < by_y) scrollamount = by_y; }
	
	by_y -= scrollamount;
	window.scrollBy(0, scrollamount);
	
	if(by_y !== 0) scroll_timeout_id_y = window.setTimeout(function(){ ms_scroll_inner_y(curTick); }, 1);
	else ms_scroll_end("y");
}
function ms_scroll_inner_x(lastTick)
{
	var curTick = new Date().getTime();
	var scrollamount = (curTick - lastTick) * w.scroll_velocity;
	
	if		(by_x > 0){ if(scrollamount > by_x) scrollamount = by_x; }
	else if	(by_x < 0){ scrollamount = -scrollamount; if(scrollamount < by_x) scrollamount = by_x; }
	
	by_x -= scrollamount;
	window.scrollBy(scrollamount, 0);
	
	if(by_x !== 0) scroll_timeout_id_x = window.setTimeout(function(){ ms_scroll_inner_x(curTick); }, 1);
	else ms_scroll_end("x");
}
function ms_scroll_end(direction){
	if(direction == "y"){
		window.clearTimeout(scroll_timeout_id_y); scroll_timeout_id_y = null; // scrolling timeout
		if(window.self.frameElement || w.use_own_scroll_functions === "1") vbar.style.transition = null;
		scroll_end_timeout_id_y = null; // end timeout
	}
	else{
		window.clearTimeout(scroll_timeout_id_x); scroll_timeout_id_x = null;
		if(window.self.frameElement || w.use_own_scroll_functions === "1") hbar.style.transition = null;
		scroll_end_timeout_id_x = null;
	}
	reposition_bars();
	
	if(w.move_bars_during_scroll === "1") window.addEventListener("scroll", reposition_bars, false);
	else window.addEventListener("scroll", onScroll, false);
}

var last_clicked_element_is_scrollable;

function ms_arrowkeyscroll(){ //document.activeElement != "[object HTMLBodyElement]"
	var e = window.event;
	if(e.which < 37 || e.which > 40 || e.ctrlKey || e.altKey || e.shiftKey || e.target=="[object HTMLTextAreaElement]" || (e.target=="[object HTMLInputElement]" && (e.target.type == "text" || e.target.type == "number" || (e.target.type == "range" && e.which !== 38 && e.which !== 40))))
		return;
	if(scroll_timeout_id) window.clearTimeout(scroll_timeout_id); // stop arrowkeyscrollings in progress
	if(scroll_timeout_id_x) window.clearTimeout(scroll_timeout_id_x); scroll_timeout_id_x = 0;
	if(scroll_timeout_id_y) window.clearTimeout(scroll_timeout_id_y); scroll_timeout_id_y = 0;
	if(hide_timeout) window.clearTimeout(hide_timeout); // prevent cancelation of CSS transition (called by previous reposition_bars() on keyup)
	
	if(last_clicked_element_is_scrollable) window.addEventListener("scroll", element_finished_scrolling, false);
	else{
		window.event.preventDefault(); window.event.stopPropagation();
		window.removeEventListener("scroll", reposition_bars, false);
		window.removeEventListener("scroll", onScroll, false);
		
		if		(e.which === 40) ms_arrowkeyscroll_down(new Date().getTime());
		else if	(e.which === 38) ms_arrowkeyscroll_up(new Date().getTime());
		else if	(e.which === 39) ms_arrowkeyscroll_right(new Date().getTime());
		else					 ms_arrowkeyscroll_left(new Date().getTime());
		
		if(w.move_bars_during_scroll === "1"){
			if(e.which === 40){
				show_bar("v");
				vbar.style.transition = "top "+(window.scrollMaxY-window.pageYOffset)/w.keyscroll_velocity+"ms linear";
				vbar.style.top = window.innerHeight-parseInt(vbar.style.height)+"px";
			}
			else if(e.which === 38){
				show_bar("v");
				vbar.style.transition = "top "+window.pageYOffset/w.keyscroll_velocity+"ms linear";
				vbar.style.top = "0px";
			}
			else if(e.which === 39){
				show_bar("h");
				hbar.style.transition = "left "+(window.scrollMaxX-window.pageXOffset)/w.keyscroll_velocity+"ms linear";
				hbar.style.left = window.innerWidth-parseInt(hbar.style.width)-(w.vbar_at_left=="0"?parseInt(document.getElementById("ms_hbar_bg").currentStyle.right):0)+"px";
			}
			else{
				show_bar("h");
				hbar.style.transition = "left "+window.pageXOffset/w.keyscroll_velocity+"ms linear";
				hbar.style.left = (w.vbar_at_left=="1"?parseInt(document.getElementById("ms_hbar_bg").currentStyle.left):0)+"px";
			}
		}
	}
	
	window.removeEventListener("keydown", ms_arrowkeyscroll, false);
	
	window.onkeyup = function(){
		vbar.style.transition = null;
		hbar.style.transition = null;
		reposition_bars();
		window.clearTimeout(scroll_timeout_id);
		scroll_timeout_id = null;
		window.addEventListener("keydown", ms_arrowkeyscroll, false);
		if(w.move_bars_during_scroll == "1") window.addEventListener("scroll", reposition_bars, false);
		else window.addEventListener("scroll", onScroll, false);
		window.removeEventListener("scroll", element_finished_scrolling, false);
		window.onkeyup = null;
	}
}
function ms_arrowkeyscroll_down(lastTick)
{
	var curTick = new Date().getTime();
	var scrollamount = (curTick - lastTick) * w.keyscroll_velocity;
	window.scrollBy(0,scrollamount);
	scroll_timeout_id = window.setTimeout(function(){ ms_arrowkeyscroll_down(curTick); },1);
}
function ms_arrowkeyscroll_up(lastTick)
{
	var curTick = new Date().getTime();
	var scrollamount = (curTick - lastTick) * w.keyscroll_velocity;
	window.scrollBy(0,-scrollamount);
	scroll_timeout_id = window.setTimeout(function(){ ms_arrowkeyscroll_up(curTick); },1);
}
function ms_arrowkeyscroll_right(lastTick)
{
	var curTick = new Date().getTime();
	var scrollamount = (curTick - lastTick) * w.keyscroll_velocity;
	window.scrollBy(scrollamount,0);
	scroll_timeout_id = window.setTimeout(function(){ ms_arrowkeyscroll_right(curTick); },1);
}
function ms_arrowkeyscroll_left(lastTick)
{
	var curTick = new Date().getTime();
	var scrollamount = (curTick - lastTick) * w.keyscroll_velocity;
	window.scrollBy(-scrollamount,0);
	scroll_timeout_id = window.setTimeout(function(){ ms_arrowkeyscroll_left(curTick); },1);
}

function ms_otherkeyscroll()
{
	if(window.event.target == "[object HTMLTextAreaElement]" || window.event.which < 33 || window.event.which > 36) return;
	if(!window.self.frameElement && !(window.event.target == "[object HTMLInputElement]" && window.event.target.type == "text")){
		window.event.preventDefault(); window.event.stopPropagation();
	}
	
	if		(window.event.which === 34){ scroll_PageDown();	return; }
	else if	(window.event.which === 33){ scroll_PageUp();	return; }	
	if(window.event.target == "[object HTMLInputElement]" && window.event.target.type == "text") return;	
	if		(window.event.which === 36)	 scroll_Pos1();
	else								 scroll_End();
}
function scroll_PageDown(){
	if(w.animate_scroll === "1") ms_scrollBy(0, window.innerHeight);
	else window.scrollBy(0, window.innerHeight);
}
function scroll_PageUp(){
	if(w.animate_scroll === "1") ms_scrollBy(0, -window.innerHeight);
	else window.scrollBy(0, -window.innerHeight);
}
function scroll_Pos1(){
	if(w.animate_scroll === "1") ms_scrollBy(0, -window.pageYOffset);
	else window.scrollBy(0, -window.pageYOffset);
}
function scroll_End(){
	if(w.animate_scroll === "1") ms_scrollBy(0, window.scrollMaxY-window.pageYOffset);
	else window.scrollBy(0, window.scrollMaxY-window.pageYOffset);
}

//var variable_speeds;
function ms_mousescroll_x(){
	window.event.preventDefault(); window.event.stopPropagation();
	window.scrollBy(-window.event.wheelDelta,0);
}
function ms_mousescroll_y(){
	if(window.event.wheelDeltaY === 0 || is_scrollable(window.event.target, (window.event.wheelDeltaY < 0))) return;
	window.event.preventDefault(); window.event.stopPropagation();
	window.scrollBy(0, -window.event.wheelDeltaY);
	
	/*var curTick = new Date().getTime();
	if(variable_speeds)console.log(curTick - variable_speeds);
	variable_speeds = curTick;*/
	//ms_scrollBy(0,-window.event.wheelDeltaY);
	//element.scrollTop -= window.event.wheelDeltaY;
}
function is_scrollable(element, direction) // direction: 0 = up, 1 = down, 2 = all
{
	if(element == "[object HTMLBodyElement]" || element == "[object HTMLHtmlElement]" || element == "[object HTMLDocument]" || element.parentNode == "[object HTMLBodyElement]") return false;
	else if((element.currentStyle.overflow == "scroll" || element.currentStyle.overflow == "auto" || element.currentStyle.overflow == "" || element == "[object HTMLTextAreaElement]") && element.offsetHeight < element.scrollHeight){
		var max_scrollTop = element.scrollHeight + parseInt(element.currentStyle.borderTopWidth) + parseInt(element.currentStyle.borderBottomWidth) - element.offsetHeight; //+(element.offsetWidth < element.scrollWidth?0:0)
		if((!direction && element.scrollTop > 0) || (direction == 1 && parseInt(element.scrollTop) < max_scrollTop) || direction == 2)
			return true;
	}
	else return is_scrollable(element.parentNode, direction);
}

function element_finished_scrolling(){
	window.addEventListener("keydown", preventScrolling, false);
	window.removeEventListener("scroll", element_finished_scrolling, false);
}
function preventScrolling(){
	window.event.preventDefault(); window.event.stopPropagation();
	window.removeEventListener("keydown", preventScrolling, false);
}