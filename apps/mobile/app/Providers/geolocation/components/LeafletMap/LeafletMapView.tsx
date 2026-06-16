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
<style>
*{margin:0;padding:0;box-sizing:border-box;}
html,body,#map{width:100%;height:100%;background:#0a0a0a;}

/* ── User location animated pin ── */
.uloc-wrap{width:34px;height:46px;position:relative;}
.uloc-pulse{
  position:absolute;top:-6px;left:-6px;
  width:36px;height:36px;
  border-radius:50% 50% 50% 0;
  transform:rotate(-45deg);
  border:3px solid rgba(74,144,217,0.7);
  animation:upulse 2s ease-out infinite;
}
.uloc-pin{
  width:24px;height:24px;
  background:#4A90D9;
  border:3px solid #fff;
  border-radius:50% 50% 50% 0;
  transform:rotate(-45deg);
  position:absolute;top:0;left:0;
  box-shadow:0 3px 10px rgba(74,144,217,0.6);
}
.uloc-inner{
  width:8px;height:8px;
  background:#fff;border-radius:50%;
  position:absolute;top:8px;left:8px;
  transform:rotate(45deg);
}
.uloc-shadow{
  width:10px;height:4px;
  background:rgba(0,0,0,0.22);
  border-radius:50%;
  position:absolute;bottom:0;left:7px;
}
@keyframes upulse{
  0%{transform:rotate(-45deg) scale(1);opacity:.8;}
  100%{transform:rotate(-45deg) scale(2.8);opacity:0;}
}

/* ── Sede pin ── */
.sede-wrap{width:24px;height:34px;position:relative;}
.sede-pin{
  width:22px;height:22px;
  border-radius:50% 50% 50% 0;
  transform:rotate(-45deg);
  border:2.5px solid rgba(255,255,255,0.35);
  position:absolute;top:0;left:0;
  box-shadow:0 2px 6px rgba(0,0,0,0.4);
}
.sede-dot{
  width:7px;height:7px;
  background:rgba(255,255,255,0.85);border-radius:50%;
  position:absolute;top:7px;left:7px;
  transform:rotate(45deg);
}
.sede-shadow{
  width:8px;height:4px;
  background:rgba(0,0,0,0.18);
  border-radius:50%;
  position:absolute;bottom:0;left:7px;
}

/* ── Popup dark base ── */
.leaflet-popup-content-wrapper{
  background:#1a1a2e!important;
  border-radius:12px!important;
  border:1px solid #2a2a4a!important;
  padding:0!important;
  box-shadow:0 4px 20px rgba(0,0,0,.6)!important;
}
.leaflet-popup-tip{background:#1a1a2e!important;}
.leaflet-popup-content{margin:0!important;}
.leaflet-popup-close-button{display:none!important;}

/* staff popup */
.pp-staff .leaflet-popup-content-wrapper{background:#111!important;border-color:#2a2a2a!important;}
.pp-staff .leaflet-popup-tip{background:#111!important;}

/* visited popup */
.pp-visited .leaflet-popup-content-wrapper{background:#111!important;border-color:#FF5E00!important;}
.pp-visited .leaflet-popup-tip{background:#111!important;}

/* ── Popup content ── */
.pbox{padding:12px;font-family:system-ui,-apple-system,sans-serif;}
.ptitle{color:#fff;font-size:14px;font-weight:700;margin-bottom:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:210px;}
.prow{display:flex;align-items:center;gap:4px;margin-bottom:4px;font-size:12px;color:#a0a0b8;}
.pbadge{display:inline-block;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;background:#1C1C1E;margin-left:auto;}
.phint{color:#e94560;font-size:10px;text-align:right;margin-top:4px;}
.paddr{color:#888;font-size:11px;margin-bottom:4px;}
.paforo{color:#aaa;font-size:11px;display:flex;align-items:center;gap:4px;margin-bottom:2px;}
.pbar-bg{background:#1a1a1a;height:4px;border-radius:2px;width:100%;margin-top:2px;overflow:hidden;}
.pbar-fill{height:100%;border-radius:2px;}
.pgym-badge{padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;background:#1C1C1E;border:1px solid #FF5E00;color:#f05b22;display:inline-block;margin-bottom:4px;}
.pclosed-badge{padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;background:#1C1C1E;border:1px solid #8e8e93;color:#8e8e93;display:inline-block;margin-bottom:4px;}
.pvisited-row{display:flex;align-items:center;gap:5px;color:#f05b22;font-size:11px;font-weight:700;margin-bottom:6px;}

/* ── Controls ── */
.leaflet-control-attribution{background:rgba(0,0,0,.55)!important;color:#aaa!important;font-size:9px!important;}
.leaflet-control-attribution a{color:#aaa!important;}
.leaflet-control-zoom a{background:#111!important;color:#fff!important;border-color:#333!important;}
.leaflet-control-zoom a:hover{background:#222!important;}
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
var MODE='${mode}';
var map=L.map('map',{
  center:[${lat},${lng}],
  zoom:${zoom},
  zoomControl:${interactive},
  attributionControl:true,
  dragging:${interactive},
  touchZoom:${interactive},
  doubleClickZoom:${interactive},
  scrollWheelZoom:${interactive},
  boxZoom:${interactive},
  keyboard:${interactive},
  tap:${interactive},
});
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
  maxZoom:19,
  attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

/* ── User location marker ── */
var userMarker=null;
function setUserLocation(ulat,ulng){
  if(userMarker){userMarker.setLatLng([ulat,ulng]);return;}
  var icon=L.divIcon({
    html:'<div class="uloc-wrap"><div class="uloc-pulse"></div><div class="uloc-pin"><div class="uloc-inner"></div></div><div class="uloc-shadow"></div></div>',
    className:'',iconSize:[34,46],iconAnchor:[12,46],
  });
  userMarker=L.marker([ulat,ulng],{icon:icon,zIndexOffset:2000}).addTo(map);
}

/* ── Sede markers ── */
var sedeMarkers={};

function buildClientPopup(s){
  var pin=s.isClosed?'#8e8e93':(s.isAvailable?'#2ecc71':'#e74c3c');
  var lbl=s.isClosed?'Cerrado':(s.isAvailable?'Abierto':'Lleno');
  var h='<div class="pbox">'
    +'<div class="ptitle">'+s.nombre+'</div>'
    +'<div class="prow">📍 '+(s.distancia||'')
    +'<span class="pbadge" style="border:1px solid '+pin+';color:'+pin+';">'+lbl+'</span></div>'
    +'<div class="prow">👥 Aforo: '+(s.aforoActual||0)+' / '+(s.aforoMaximo||0)+'</div>'
    +(s.capacidadMaquinas>0?'<div class="prow">⚙️ Máquinas: '+s.capacidadMaquinas+'</div>':'')
    +'<div class="phint">Toca para más info →</div>'
    +'</div>';
  return h;
}

function buildStaffPopup(s){
  var pin=s.isClosed?'#8e8e93':(s.isAvailable?'#2ecc71':'#e74c3c');
  var pct=s.pct||0;
  var h='<div class="pbox">';
  if(s.isUserGym) h+='<span class="pgym-badge">Tu sucursal</span> ';
  if(s.isClosed)  h+='<span class="pclosed-badge">Cerrada ahora</span>';
  h+='<div class="ptitle">'+s.nombre+'</div>';
  if(s.address) h+='<div class="paddr">📍 '+s.address+'</div>';
  if(!s.isClosed){
    h+='<div class="paforo">👥 '+(s.aforoActual||0)+'/'+(s.aforoMaximo||0)+' ('+pct+'% ocupación)</div>'
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

function addSede(s){
  var pin=s.isClosed?'#8e8e93':(s.isAvailable?'#2ecc71':'#e74c3c');
  if(MODE==='visited'||s.isUserGym) pin='#f05b22';

  var icon=L.divIcon({
    html:'<div class="sede-wrap"><div class="sede-pin" style="background:'+pin+';"></div><div class="sede-dot"></div><div class="sede-shadow"></div></div>',
    className:'',iconSize:[24,34],iconAnchor:[12,34],popupAnchor:[0,-36],
  });

  var popHtml=MODE==='staff'?buildStaffPopup(s):MODE==='visited'?buildVisitedPopup(s):buildClientPopup(s);
  var popCls=MODE==='staff'?'pp-staff':MODE==='visited'?'pp-visited':'';

  var m=L.marker([s.lat,s.lng],{icon:icon,zIndexOffset:s.isUserGym?999:1})
    .bindPopup(popHtml,{closeButton:false,maxWidth:260,className:popCls})
    .on('click',function(){sendRN({type:'MARKER_PRESS',sedeId:s.id});})
    .addTo(map);
  sedeMarkers[String(s.id)]=m;
}

function setSedes(list){
  Object.values(sedeMarkers).forEach(function(m){map.removeLayer(m);});
  sedeMarkers={};
  list.forEach(addSede);
}

/* ── Commands from RN ── */
function handleCommand(cmd){
  if(!cmd||!cmd.type)return;
  if(cmd.type==='SET_USER_LOCATION'){setUserLocation(cmd.lat,cmd.lng);}
  else if(cmd.type==='SET_SEDES'){setSedes(cmd.sedes);}
  else if(cmd.type==='FLY_TO'){map.flyTo([cmd.lat,cmd.lng],cmd.zoom||15,{animate:true,duration:1});}
  else if(cmd.type==='OPEN_POPUP'){var m=sedeMarkers[String(cmd.sedeId)];if(m)m.openPopup();}
}

document.addEventListener('message',function(e){try{handleCommand(JSON.parse(e.data));}catch(e){}});
window.addEventListener('message',function(e){try{handleCommand(JSON.parse(e.data));}catch(e){}});

function sendRN(obj){try{window.ReactNativeWebView.postMessage(JSON.stringify(obj));}catch(e){}}
sendRN({type:'MAP_READY'});
</script>
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
    // Keep latest props in refs to avoid stale closures in onMessage
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

    // Push sedes when they change (only if map already ready)
    useEffect(() => {
      if (!isReadyRef.current) return;
      send({ type: 'SET_SEDES', sedes });
    }, [sedes, send]);

    // Push user location when it changes (only if map already ready)
    useEffect(() => {
      if (!isReadyRef.current || !userLocation) return;
      send({ type: 'SET_USER_LOCATION', lat: userLocation.lat, lng: userLocation.lng });
    }, [userLocation, send]);

    const onMessage = useCallback((e: WebViewMessageEvent) => {
      try {
        const msg = JSON.parse(e.nativeEvent.data);

        if (msg.type === 'MAP_READY') {
          isReadyRef.current = true;

          // Flush queued commands (e.g. early flyTo calls)
          const pending = [...pendingRef.current];
          pendingRef.current = [];
          pending.forEach(cmd => send(cmd));

          // Push current data
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
