import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import WebView, { WebViewMessageEvent } from 'react-native-webview';

// ─── Public types ────────────────────────────────────────────────────────────

export interface LeafletSede {
  id:                string | number;
  nombre:            string;
  lat:               number;
  lng:               number;
  distancia?:        string;
  aforoActual?:      number;
  aforoMaximo?:      number;
  capacidadMaquinas?: number;
  isClosed?:         boolean;
  isAvailable?:      boolean;
  isUserGym?:        boolean;
  address?:          string;
  pct?:              number;
}

export interface LeafletMapHandle {
  flyTo:           (lat: number, lng: number, zoom?: number) => void;
  openPopup:       (sedeId: string | number) => void;
  setUserLocation: (lat: number, lng: number) => void;
}

export interface LeafletMapProps {
  sedes?:        LeafletSede[];
  userLocation?: { lat: number; lng: number } | null;
  initialCenter: { lat: number; lng: number };
  initialZoom?:  number;
  interactive?:  boolean;
  mode?:         'client' | 'staff' | 'visited' | 'preview';
  onMarkerPress?: (sedeId: string | number) => void;
  onMapReady?:    () => void;
  style?:        ViewStyle;
}

// ─── HTML template ───────────────────────────────────────────────────────────

const buildHTML = (
  lat:   number,
  lng:   number,
  zoom:  number,
  interactive: boolean,
  mode:  string,
) => `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css"/>
<style>
*{margin:0;padding:0;box-sizing:border-box;}
html,body,#map{width:100%;height:100%;background:#0a0a0a;}

/* ── User location — radar pulse ── */
.uloc{width:44px;height:44px;position:relative;}
.uloc-ring1,.uloc-ring2{
  position:absolute;inset:0;border-radius:50%;
  border:2px solid rgba(56,189,248,0.35);
}
.uloc-ring1{animation:radar 2.4s cubic-bezier(0,.6,.5,1) infinite;}
.uloc-ring2{animation:radar 2.4s cubic-bezier(0,.6,.5,1) .8s infinite;}
.uloc-core{
  width:16px;height:16px;border-radius:50%;
  background:#38BDF8;border:2.5px solid #fff;
  position:absolute;top:14px;left:14px;
}
@keyframes radar{0%{transform:scale(.6);opacity:.9;}100%{transform:scale(2.8);opacity:0;}}

/* ── Sede pin — SVG teardrop ── */
.pin-wrap{width:30px;height:40px;filter:drop-shadow(0 3px 4px rgba(0,0,0,.55));position:relative;}
.pin-wrap svg{display:block;}

/* ── Cluster — concentric rings ── */
.marker-cluster{background:transparent!important;border:none!important;}
.marker-cluster div{background:transparent!important;margin:0!important;width:auto!important;height:auto!important;line-height:normal!important;}
.cl-wrap{position:relative;width:48px;height:48px;}
.cl-halo{
  position:absolute;inset:-4px;border-radius:50%;
  background:rgba(255,94,0,.15);
  border:2px solid rgba(255,94,0,.3);
}
.cl-core{
  position:absolute;inset:4px;border-radius:50%;
  background:#FF5E00;
  display:flex;align-items:center;justify-content:center;
  font:800 13px/1 system-ui,-apple-system,sans-serif;color:#fff;
}
.cl-lg .cl-wrap{width:56px;height:56px;}
.cl-lg .cl-halo{inset:-5px;}
.cl-lg .cl-core{font-size:15px;}

/* ── Popup dark ── */
.leaflet-popup-content-wrapper{
  background:#141414!important;border-radius:12px!important;
  border:1px solid #2a2a2a!important;padding:0!important;
}
.leaflet-popup-tip{background:#141414!important;}
.leaflet-popup-content{margin:0!important;}
.leaflet-popup-close-button{display:none!important;}
.pp-staff .leaflet-popup-content-wrapper{border-color:#2a2a2a!important;}
.pp-staff .leaflet-popup-tip{background:#141414!important;}
.pp-visited .leaflet-popup-content-wrapper{border-color:#FF5E00!important;}
.pp-visited .leaflet-popup-tip{background:#141414!important;}

/* ── Popup content ── */
.pbox{padding:12px 14px;font-family:system-ui,-apple-system,sans-serif;}
.ptitle{color:#fff;font-size:13px;font-weight:700;margin-bottom:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px;}
.prow{display:flex;align-items:center;gap:5px;margin-bottom:4px;font-size:12px;color:#999;}
.pbadge{display:inline-block;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;margin-left:auto;}
.pbar-bg{background:#1a1a1a;height:4px;border-radius:2px;width:100%;margin-top:6px;overflow:hidden;}
.pbar-fill{height:100%;border-radius:2px;transition:width .3s;}
.phint{color:#666;font-size:10px;text-align:right;margin-top:6px;}
.paddr{color:#777;font-size:11px;margin-bottom:4px;}
.paforo{color:#999;font-size:11px;display:flex;align-items:center;gap:4px;margin-bottom:2px;}
.pgym-badge{padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;background:#1C1C1E;border:1px solid #FF5E00;color:#FF5E00;display:inline-block;margin-bottom:4px;}
.pclosed-badge{padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;background:#1C1C1E;border:1px solid #555;color:#888;display:inline-block;margin-bottom:4px;}
.pvisited-row{display:flex;align-items:center;gap:5px;color:#FF5E00;font-size:11px;font-weight:700;margin-bottom:6px;}

/* ── Controls — hidden for mobile immersion ── */
.leaflet-control-zoom{display:none!important;}
.leaflet-control-attribution{background:rgba(0,0,0,.5)!important;color:#555!important;font-size:8px!important;padding:2px 5px!important;}
.leaflet-control-attribution a{color:#555!important;}
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
<script src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js"><\/script>
<script>
var MODE='${mode}';
var map=L.map('map',{
  center:[${lat},${lng}],
  zoom:${zoom},
  zoomControl:false,
  attributionControl:true,
  dragging:${interactive},
  touchZoom:${interactive},
  doubleClickZoom:${interactive},
  scrollWheelZoom:${interactive},
  boxZoom:${interactive},
  keyboard:${interactive},
  tap:${interactive},
});

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{
  maxZoom:19,
  attribution:'© <a href="https://www.openstreetmap.org/copyright">OSM</a> · <a href="https://carto.com/">CARTO</a>',
  subdomains:'abcd',
}).addTo(map);

/* ── Aforo color helper ── */
function aforoColor(s){
  if(s.isClosed) return '#555';
  var max=s.aforoMaximo||1;
  var pct=Math.round((s.aforoActual||0)/max*100);
  if(pct>=85) return '#FF3B30';
  if(pct>=60) return '#FF9500';
  return '#34C759';
}
function aforoPct(s){
  var max=s.aforoMaximo||1;
  return Math.min(100,Math.round((s.aforoActual||0)/max*100));
}

/* ── User location marker — radar pulse ── */
var userMarker=null;
function setUserLocation(ulat,ulng){
  if(userMarker){userMarker.setLatLng([ulat,ulng]);return;}
  var icon=L.divIcon({
    html:'<div class="uloc"><div class="uloc-ring1"></div><div class="uloc-ring2"></div><div class="uloc-core"></div></div>',
    className:'',iconSize:[44,44],iconAnchor:[22,22],
  });
  userMarker=L.marker([ulat,ulng],{icon:icon,zIndexOffset:2000,interactive:false}).addTo(map);
}

/* ── Cluster group ── */
var clusterGroup=L.markerClusterGroup({
  maxClusterRadius:45,
  spiderfyOnMaxZoom:true,
  showCoverageOnHover:false,
  zoomToBoundsOnClick:true,
  disableClusteringAtZoom:16,
  iconCreateFunction:function(cluster){
    var count=cluster.getChildCount();
    var lg=count>=20?'cl-lg':'';
    var sz=lg?56:48;
    return L.divIcon({
      html:'<div class="'+lg+'"><div class="cl-wrap"><div class="cl-halo"></div><div class="cl-core">'+count+'</div></div></div>',
      className:'marker-cluster',
      iconSize:L.point(sz,sz),
      iconAnchor:L.point(sz/2,sz/2),
    });
  }
});
map.addLayer(clusterGroup);

/* ── Sede markers ── */
var sedeMarkers={};

function buildClientPopup(s){
  var pin=aforoColor(s);
  var pct=aforoPct(s);
  var lbl=s.isClosed?'Cerrado':pct>=85?'Lleno':pct>=60?'Alto':'Disponible';
  return '<div class="pbox">'
    +'<div class="ptitle">'+s.nombre+'</div>'
    +'<div class="prow">📍 '+(s.distancia||'')
    +'<span class="pbadge" style="border:1px solid '+pin+';color:'+pin+';">'+lbl+'</span></div>'
    +'<div class="prow">👥 '+(s.aforoActual||0)+' / '+(s.aforoMaximo||0)+' ('+pct+'%)</div>'
    +'<div class="pbar-bg"><div class="pbar-fill" style="width:'+pct+'%;background:'+pin+';"></div></div>'
    +(s.capacidadMaquinas>0?'<div class="prow" style="margin-top:4px;">⚙️ '+s.capacidadMaquinas+' máquinas</div>':'')
    +'<div class="phint">Toca para ver detalles</div>'
    +'</div>';
}

function buildStaffPopup(s){
  var pin=aforoColor(s);
  var pct=s.pct||aforoPct(s);
  var h='<div class="pbox">';
  if(s.isUserGym) h+='<span class="pgym-badge">Tu sucursal</span> ';
  if(s.isClosed) h+='<span class="pclosed-badge">Cerrada</span>';
  h+='<div class="ptitle">'+s.nombre+'</div>';
  if(s.address) h+='<div class="paddr">📍 '+s.address+'</div>';
  if(!s.isClosed){
    h+='<div class="paforo">👥 '+(s.aforoActual||0)+'/'+(s.aforoMaximo||0)+' ('+pct+'%)</div>'
      +'<div class="pbar-bg"><div class="pbar-fill" style="width:'+Math.min(pct,100)+'%;background:'+pin+';"></div></div>';
  }
  h+='</div>';
  return h;
}

function buildVisitedPopup(s){
  return '<div class="pbox">'
    +'<div class="pvisited-row">✅ Marca visitada</div>'
    +'<div class="ptitle">'+s.nombre+'</div>'
    +'</div>';
}

function pinSVG(fill){
  var dark=fill.replace(/[0-9a-f]/gi,function(c){var n=Math.max(0,parseInt(c,16)-3);return n.toString(16);});
  return '<div class="pin-wrap"><svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">'
    +'<path d="M15 38 C15 38 2 22 2 14 C2 6.82 7.82 1 15 1 C22.18 1 28 6.82 28 14 C28 22 15 38 15 38Z" fill="'+fill+'" stroke="'+dark+'" stroke-width="1.5"/>'
    +'<circle cx="15" cy="14" r="5" fill="rgba(255,255,255,0.9)"/>'
    +'</svg></div>';
}

function addSede(s){
  var pin=aforoColor(s);
  if(MODE==='visited'||s.isUserGym) pin='#FF5E00';

  var icon=L.divIcon({
    html:pinSVG(pin),
    className:'',iconSize:[30,40],iconAnchor:[15,40],popupAnchor:[0,-38],
  });

  var popHtml=MODE==='staff'?buildStaffPopup(s):MODE==='visited'?buildVisitedPopup(s):buildClientPopup(s);
  var popCls=MODE==='staff'?'pp-staff':MODE==='visited'?'pp-visited':'';

  var m=L.marker([s.lat,s.lng],{icon:icon,zIndexOffset:s.isUserGym?999:1})
    .bindPopup(popHtml,{closeButton:false,maxWidth:240,className:popCls})
    .on('click',function(){sendRN({type:'MARKER_PRESS',sedeId:s.id});});
  clusterGroup.addLayer(m);
  sedeMarkers[String(s.id)]=m;
}

function setSedes(list){
  clusterGroup.clearLayers();
  sedeMarkers={};
  list.forEach(addSede);
}

/* ── Commands from RN ── */
function handleCommand(cmd){
  if(!cmd||!cmd.type)return;
  if(cmd.type==='SET_USER_LOCATION'){setUserLocation(cmd.lat,cmd.lng);}
  else if(cmd.type==='SET_SEDES'){setSedes(cmd.sedes);}
  else if(cmd.type==='FLY_TO'){map.flyTo([cmd.lat,cmd.lng],cmd.zoom||15,{animate:true,duration:1});}
  else if(cmd.type==='OPEN_POPUP'){var m=sedeMarkers[String(cmd.sedeId)];if(m){clusterGroup.zoomToShowLayer(m,function(){m.openPopup();});}}
}

document.addEventListener('message',function(e){try{handleCommand(JSON.parse(e.data));}catch(e){}});
window.addEventListener('message',function(e){try{handleCommand(JSON.parse(e.data));}catch(e){}});

function sendRN(obj){try{window.ReactNativeWebView.postMessage(JSON.stringify(obj));}catch(e){}}
sendRN({type:'MAP_READY'});
<\/script>
</body>
</html>`;

// ─── Component ────────────────────────────────────────────────────────────────

export const LeafletMapView = forwardRef<LeafletMapHandle, LeafletMapProps>(
  (
    {
      sedes        = [],
      userLocation,
      initialCenter,
      initialZoom  = 14,
      interactive  = true,
      mode         = 'client',
      onMarkerPress,
      onMapReady,
      style,
    },
    ref,
  ) => {
    const webViewRef  = useRef<WebView>(null);
    const isReadyRef  = useRef(false);
    const pendingRef  = useRef<object[]>([]);
    const sedesRef         = useRef(sedes);
    const userLocationRef  = useRef(userLocation);
    sedesRef.current        = sedes;
    userLocationRef.current = userLocation;

    const send = useCallback((cmd: object) => {
      const script = `(function(){try{handleCommand(${JSON.stringify(cmd)});}catch(e){}})();true;`;
      if (isReadyRef.current && webViewRef.current) {
        webViewRef.current.injectJavaScript(script);
      } else {
        pendingRef.current.push(cmd);
      }
    }, []);

    useImperativeHandle(ref, () => ({
      flyTo:           (lat, lng, zoom = 15)    => send({ type: 'FLY_TO', lat, lng, zoom }),
      openPopup:       (sedeId)                  => send({ type: 'OPEN_POPUP', sedeId }),
      setUserLocation: (lat, lng)                => send({ type: 'SET_USER_LOCATION', lat, lng }),
    }));

    useEffect(() => {
      if (!isReadyRef.current) return;
      send({ type: 'SET_SEDES', sedes });
    }, [sedes, send]);

    useEffect(() => {
      if (!isReadyRef.current || !userLocation) return;
      send({ type: 'SET_USER_LOCATION', lat: userLocation.lat, lng: userLocation.lng });
    }, [userLocation, send]);

    const onMessage = useCallback((e: WebViewMessageEvent) => {
      try {
        const msg = JSON.parse(e.nativeEvent.data);

        if (msg.type === 'MAP_READY') {
          isReadyRef.current = true;

          const pending = [...pendingRef.current];
          pendingRef.current = [];
          pending.forEach(cmd => send(cmd));

          const currentSedes = sedesRef.current;
          const currentLoc   = userLocationRef.current;
          if (currentSedes.length) send({ type: 'SET_SEDES', sedes: currentSedes });
          if (currentLoc)          send({ type: 'SET_USER_LOCATION', lat: currentLoc.lat, lng: currentLoc.lng });

          onMapReady?.();
        } else if (msg.type === 'MARKER_PRESS') {
          onMarkerPress?.(msg.sedeId);
        }
      } catch {}
    }, [send, onMapReady, onMarkerPress]);

    const html = buildHTML(
      initialCenter.lat,
      initialCenter.lng,
      initialZoom,
      interactive,
      mode,
    );

    return (
      <View style={[s.container, style]}>
        <WebView
          ref={webViewRef}
          source={{ html }}
          style={s.webview}
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={['*']}
          mixedContentMode="always"
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          onMessage={onMessage}
          allowsInlineMediaPlayback
          cacheEnabled
          setSupportMultipleWindows={false}
        />
      </View>
    );
  },
);

LeafletMapView.displayName = 'LeafletMapView';

const s = StyleSheet.create({
  container: { flex: 1 },
  webview:   { flex: 1, backgroundColor: '#0a0a0a' },
});
