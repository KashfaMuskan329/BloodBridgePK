/* BloodBridge PK — complete app.js. No real patients or live blood inventory. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const cfg = window.BLOODBRIDGE_SETTINGS || {};
  const features = window.BLOODBRIDGE_GEOJSON?.features || [];
  const aws = Boolean(cfg.apiKey && cfg.apiKey.trim() && !cfg.apiKey.includes('PASTE'));
  const region = cfg.awsRegion || 'ap-south-1';
  const coord = f => f.geometry.coordinates;
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const setText = (id, text) => { if ($(id)) $(id).textContent = text; };
  const distance = (a, b) => {
    const r = Math.PI / 180, dLat = (b[1] - a[1]) * r, dLng = (b[0] - a[0]) * r;
    const h = Math.sin(dLat/2)**2 + Math.cos(a[1]*r)*Math.cos(b[1]*r)*Math.sin(dLng/2)**2;
    return 12742 * Math.asin(Math.min(1, Math.sqrt(h)));
  };
  const formatKm = n => `${n.toFixed(n < 10 ? 1 : 0)} km`;
  const people = {
    lahore: [
      {id:'areeba',name:'Areeba',age:8,theme:'girl',area:'Township, Lahore',point:[74.292,31.447],blood:'B+',story:'Areeba has a recurring transfusion appointment. Her family wants to know which services they can contact before travelling.'},
      {id:'hamza',name:'Hamza',age:12,theme:'boy',area:'Shahdara, Lahore',point:[74.295,31.633],blood:'O+',story:'Hamza lives across the river. His family wants to compare care contacts and travelling distance.'},
      {id:'zoya',name:'Zoya',age:6,theme:'girl',area:'Johar Town, Lahore',point:[74.266,31.463],blood:'A+',story:'Zoya needs regular transfusion support. Her family knows the nearest pin may not be the right service.'}
    ],
    islamabad: [
      {id:'hira',name:'Hira',age:9,theme:'girl',area:'I-10, Islamabad',point:[73.040,33.650],blood:'B+',story:'Hira’s family is exploring thalassaemia support in Islamabad and Rawalpindi.'},
      {id:'bilal',name:'Bilal',age:11,theme:'boy',area:'Bahria Town Phase 7, Rawalpindi',point:[73.089,33.547],blood:'O+',story:'Bilal’s family wants to compare support contacts across the city.'},
      {id:'noor',name:'Noor',age:7,theme:'girl',area:'G-11, Islamabad',point:[72.997,33.668],blood:'A+',story:'Noor’s caregiver is identifying possible blood-support contacts without relying on unverified stock claims.'}
    ]
  };
  const neighborhoods = {
    lahore: [
      ['Township',74.293,31.450],['Johar Town',74.253,31.450],['Faisal Town',74.291,31.472],
      ['Model Town',74.328,31.480],['Garden Town',74.311,31.505],['Shadman',74.332,31.544],
      ['Gulberg',74.350,31.516],['Iqbal Town',74.292,31.513],['Samanabad',74.292,31.535],
      ['Shahdara',74.295,31.633],['Ravi Road',74.311,31.591],['Mughalpura',74.372,31.572],
      ['Shalimar',74.383,31.583],['Gulshan-e-Ravi',74.272,31.543],['Misri Shah',74.353,31.600],
      ['Wapda Town',74.260,31.428],['DHA Phase 5',74.415,31.454],['Raiwind Road',74.212,31.411]
    ],
    islamabad: [
      ['G-11',72.997,33.667],['G-9',73.041,33.698],['I-10',73.037,33.650],['F-10',73.009,33.695],
      ['F-8',73.033,33.713],['Blue Area',73.055,33.717],['G-6',73.084,33.725],
      ['H-12',72.994,33.651],['Bani Gala',73.162,33.694],['Chak Shahzad',73.154,33.672],
      ['Satellite Town',73.063,33.649],['Saddar Rawalpindi',73.044,33.595],
      ['Chaklala',73.082,33.568],['Bahria Town',73.090,33.542]
    ]
  };
  const campPoints = {
    lahore:{shahdara:[74.291,31.628],township:[74.279,31.443],raiwind:[74.218,31.410]},
    islamabad:{shahdara:[72.997,33.667],township:[73.039,33.650],raiwind:[73.094,33.559]}
  };
  const campNames = {lahore:['Shahdara','Township','Raiwind Road'],islamabad:['G-11','I-10','Chaklala']};
  let city='lahore', person=people.lahore[0], type='all', selected=null, camp=null;
  let map=null, markers=[], line=[], routeKind='preview', sequence=0, placing=false, dark=false, storyTimer=null;
  let ambulanceMarker=null, rideFrame=null, ridePath=[], rideMode='preview';
  let routeMeta={km:null,minutes:null}, storyRun=0, storyActive=false, storyDelay=null;
  const cityPlaces=()=>features.filter(f=>f.properties.city===city);
  const visible=()=>cityPlaces().filter(f=>type==='all'||f.properties.category===type);
  const nearby=()=>visible().map(f=>({feature:f,km:distance(person.point,coord(f))})).sort((a,b)=>a.km-b.km);
  const cityLabel=()=>city==='lahore'?'Lahore':'Islamabad / Rawalpindi';
  const mapStyle=()=>aws
    ? `https://maps.geo.${region}.amazonaws.com/v2/styles/${dark?'Monochrome':(cfg.awsMapStyle||'Standard')}/descriptor?key=${encodeURIComponent(cfg.apiKey)}`
    : {version:8,sources:{osm:{type:'raster',tiles:['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],tileSize:256,attribution:'© OpenStreetMap contributors'}},layers:[{id:'osm',type:'raster',source:'osm'}]};
  function flash(message){const el=$('mapToast');if(!el)return;el.textContent=message;el.classList.add('visible');clearTimeout(flash.timer);flash.timer=setTimeout(()=>el.classList.remove('visible'),4500);}
  function installStyles(){
    if($('bb-custom-css'))return;
    const sheet=document.createElement('style');sheet.id='bb-custom-css';
    sheet.textContent=`
      .bb-cluster{border:3px solid #fff;border-radius:50%;background:#263e61;color:#fff;min-width:42px;height:42px;font:bold 15px system-ui;box-shadow:0 5px 18px #263e6166;cursor:pointer;z-index:5}
      .bb-cluster:hover{background:#425c86}
      .bb-area-label{pointer-events:none;white-space:nowrap;border:1px solid #bdcada;border-radius:6px;padding:4px 7px;background:#fffffff0;color:#293c59;font:700 11px system-ui;box-shadow:0 2px 9px #1b345922}
      .bb-marker.bb-highlight{outline:5px solid #e56d7844;z-index:9}
      .bb-human-pin{position:relative;width:60px;height:72px;display:flex;flex-direction:column;
        align-items:center;justify-content:flex-start;cursor:pointer;background:none;border:0;padding:0;
        filter:drop-shadow(0 4px 8px #28334b70)}
      .bb-human-art{width:51px;height:51px;border-radius:50%;border:3px solid #fff;
        background:#fff1f0;box-shadow:0 0 0 4px #e46c85aa;display:grid;place-items:center;overflow:hidden}
      .bb-human-art svg{width:45px;height:45px;display:block}
      .bb-human-tag{position:absolute;top:52px;white-space:nowrap;background:#8a3c5f;color:white;
        font:800 9px system-ui;padding:3px 7px;border:2px solid #fff;border-radius:6px}
      .bb-human-pin:focus-visible{outline:3px solid #d7476c;outline-offset:5px;border-radius:10px}
      .bb-hospital-arrival{animation:bb-arrive-pulse 1.3s 2 ease-out}
      @keyframes bb-arrive-pulse{50%{filter:drop-shadow(0 0 14px #16a085)}}
      .bb-arrival-note[hidden]{display:none!important}
      .bb-arrival-note{display:flex;align-items:center;gap:9px;margin:11px 0 4px;padding:11px 13px;
        border:1px solid #87ddb9;border-radius:12px;background:#173d3b;color:#eafff2;
        font:750 12px system-ui;animation:bb-arrival-appear .55s ease both}
      .bb-arrival-heart{font-size:22px;line-height:1;animation:bb-arrival-heartbeat 1s ease-in-out 2}
      .bb-arrival-detail{font:500 10px/1.5 system-ui;color:#d0eadd}
      @keyframes bb-arrival-appear{from{opacity:0;transform:translateY(9px)}to{opacity:1;transform:translateY(0)}}
      @keyframes bb-arrival-heartbeat{50%{transform:scale(1.22)}}
      .bb-sim-visual{margin-top:13px;padding:14px;border:1px solid #e5e0ea;border-radius:14px;
        background:#fff;box-shadow:0 6px 16px #25365608;font-family:system-ui}
      .bb-sim-visual-head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px}
      .bb-sim-visual-title{font:800 11px system-ui;color:#34435a}
      .bb-sim-delta{font:800 12px system-ui;color:#317f66;background:#e8f8ef;padding:5px 8px;border-radius:20px}
      .bb-sim-row{display:grid;grid-template-columns:66px 1fr 58px;gap:9px;align-items:center;margin:7px 0;
        font:700 10px system-ui;color:#66768d}
      .bb-sim-track{height:12px;background:#f0f1f6;border-radius:10px;overflow:hidden}
      .bb-sim-bar{height:100%;display:block;border-radius:10px;transition:width .5s ease}
      .bb-sim-before{background:#d9a3a9}.bb-sim-after{background:#53b99e}
      .bb-sim-value{text-align:right;font-variant-numeric:tabular-nums;color:#35445e}
      .bb-sim-hint{font:500 10px/1.5 system-ui;color:#778599;margin:9px 0 0}
      .bb-impact-line{display:block;margin:15px 0 0;color:#ffe0e6;font:700 13px/1.55 system-ui}
      @media(prefers-reduced-motion:reduce){.bb-arrival-note,.bb-arrival-heart,.bb-sim-bar,.bb-hospital-arrival{animation:none!important;transition:none!important}}

      .bb-cluster-menu{min-width:200px;max-height:240px;overflow:auto;font-family:system-ui}
      .bb-cluster-menu button{display:block;width:100%;text-align:left;background:white;border:0;border-top:1px solid #eee;padding:9px 3px;cursor:pointer;color:#263e61;font-size:11px}
      .bb-cluster-menu button:hover{background:#fff5f5}
      .bb-cluster-menu small{display:block;color:#8792a4;font-size:10px;margin-top:3px}

      .bb-ambulance{width:45px;height:45px;border:3px solid #fff;background:#fff;border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:26px;filter:drop-shadow(0 4px 9px #8c344455);box-shadow:0 0 0 5px #eb617333;pointer-events:none;z-index:12}
      .bb-ambulance::after{content:'DEMO';position:absolute;bottom:-15px;left:50%;transform:translateX(-50%);font:800 8px system-ui;color:#8b3344;background:#fff;border-radius:5px;padding:2px 5px;letter-spacing:.04em;box-shadow:0 2px 6px #263e6133}
      .bb-ambulance img{display:none}
      .bb-drive-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:10px}
      .bb-drive-button{border:0!important;border-radius:9px;background:#e45c6b;color:white!important;font:700 11px system-ui;padding:10px 12px;cursor:pointer;box-shadow:0 4px 9px #e45c6b22}
      .bb-drive-button:hover{background:#bc485b}
      .bb-drive-status{font:600 10px system-ui;color:#596c85}

      /* Cinematic patient journey HUD - illustrative, never live tracking */
      .bb-story-hud[hidden]{display:none!important}
      .bb-story-hud{position:relative;z-index:2;top:auto;right:auto;width:calc(100% - 22px);
        margin:10px 11px 0;background:#14243c;color:white;border:1px solid #324766;border-radius:13px;
        padding:11px 14px;box-shadow:0 6px 20px #14243c24;font-family:system-ui,sans-serif}
      .bb-story-top{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}
      .bb-story-kicker{font:800 9px system-ui;letter-spacing:.16em;color:#ffc0ca}
      .bb-story-close{background:transparent;border:1px solid #8190a4;border-radius:50%;width:26px;height:26px;
        color:#fff;font:700 16px system-ui;cursor:pointer}
      .bb-story-hud h3{font:750 18px/1.25 system-ui;margin:0 0 5px}
      .bb-story-copy{font:400 11px/1.5 system-ui;color:#e1e8f4;margin:0 0 11px}
      .bb-story-stats{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0}
      .bb-story-stat{border:1px solid #455570;border-radius:10px;padding:8px;background:#253650}
      .bb-story-stat small{display:block;color:#b2c2d6;font:700 9px system-ui;margin-bottom:3px}
      .bb-story-stat strong{font:800 17px system-ui;color:#fff}
      .bb-story-bar{height:7px;background:#40546d;border-radius:12px;overflow:hidden}
      .bb-story-fill{height:100%;width:0%;background:linear-gradient(90deg,#fbc2a5,#fa7085);transition:width .08s linear;border-radius:12px}
      .bb-story-footer{display:flex;justify-content:space-between;align-items:center;gap:6px;margin-top:9px}
      .bb-story-footnote{font:10px/1.4 system-ui;color:#bdd0e2;max-width:195px}
      .bb-story-replay{font:750 10px system-ui;color:#fff;background:#da6174;border:0;border-radius:8px;
        padding:7px 10px;cursor:pointer}
      .bb-story-side-button{width:100%;margin-top:8px;padding:12px 10px;border:1px solid #df7380;
        background:#fff8f9;color:#9d364b;border-radius:10px;font:800 12px system-ui;cursor:pointer}
      .bb-story-side-button:hover{background:#ffe9ed}
      @media(max-width:650px){.bb-story-hud{width:calc(100% - 18px);margin:8px 9px 0;padding:10px}}
      .bb-map-heading{position:absolute;top:10px;left:12px;z-index:2;background:#ffffffed;border:1px solid #d5dfeb;padding:7px 10px;border-radius:9px;font:bold 10px system-ui;pointer-events:none;color:#263e61}
    `;
    document.head.appendChild(sheet);
    const heading=document.createElement('div');heading.className='bb-map-heading';heading.textContent='CLICK NUMBERED GROUPS TO EXPLORE CENTRES';$('map').appendChild(heading);

    // Add the story overlay without requiring changes to index.html.
    if(!$('bb-story-hud')){
      const hud=document.createElement('div');
      hud.id='bb-story-hud';hud.className='bb-story-hud';hud.hidden=true;
      hud.setAttribute('aria-label','Fictional patient journey playback');
      hud.innerHTML=`
        <div class="bb-story-top"><span class="bb-story-kicker" id="bb-story-step">CHAPTER 01 / 04</span>
        <button type="button" class="bb-story-close" id="bb-story-close" aria-label="Close story">×</button></div>
        <h3 id="bb-story-title">A journey to care</h3>
        <p id="bb-story-copy" class="bb-story-copy"></p>
        <div class="bb-story-stats">
          <div class="bb-story-stat"><small>DISTANCE COVERED</small><strong id="bb-story-distance">0.0 km</strong></div>
          <div class="bb-story-stat"><small id="bb-story-type">ROUTE TYPE</small><strong id="bb-story-total">—</strong></div>
        </div>
        <div class="bb-story-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" id="bb-story-meter"><div class="bb-story-fill" id="bb-story-fill"></div></div>
        <div class="bb-story-footer"><span class="bb-story-footnote" id="bb-story-note">Illustrative only · no actual ambulance is dispatched.</span>
        <button type="button" class="bb-story-replay" id="bb-story-replay">↻ Replay</button></div>
        <div id="bb-arrival-note" class="bb-arrival-note" role="status" aria-live="polite" hidden>
          <span class="bb-arrival-heart" aria-hidden="true">❤️</span>
          <span><strong>Journey completed — arrived at mapped centre</strong>
          <span class="bb-arrival-detail" style="display:block">This is an illustrative journey. Contact the centre to confirm services.</span></span>
        </div>`;
      $('map').insertAdjacentElement('beforebegin', hud); // In normal layout ABOVE canvas, never over the animated vehicle
      $('bb-story-close').addEventListener('click',cancelStory);
      $('bb-story-replay').addEventListener('click',playStories);
    }
    if(!$('bb-play-story') && $('findHelpBtn')){
      const button=document.createElement('button');
      button.type='button';button.id='bb-play-story';button.className='bb-story-side-button';
      button.textContent='▶ Watch patient journey + distance';
      $('findHelpBtn').insertAdjacentElement('afterend',button);
      button.addEventListener('click',playStories);
    }
    // Comparison remains explicitly illustrative and uses sampled neighbourhoods only.
    if(!$('bb-sim-visual') && $('simMetrics')){
      const visual=document.createElement('div');
      visual.id='bb-sim-visual';visual.className='bb-sim-visual';
      visual.setAttribute('aria-live','polite');
      visual.innerHTML=`
        <div class="bb-sim-visual-head"><span class="bb-sim-visual-title">AVERAGE ACCESS DISTANCE</span>
          <span class="bb-sim-delta" id="bb-sim-delta">Choose a location</span></div>
        <div class="bb-sim-row"><span>Before</span><span class="bb-sim-track"><span class="bb-sim-bar bb-sim-before" id="bb-before-bar" style="width:100%"></span></span><span class="bb-sim-value" id="bb-before-value">—</span></div>
        <div class="bb-sim-row"><span>After</span><span class="bb-sim-track"><span class="bb-sim-bar bb-sim-after" id="bb-after-bar" style="width:0%"></span></span><span class="bb-sim-value" id="bb-after-value">—</span></div>
        <p class="bb-sim-hint" id="bb-sim-hint">Illustrative straight-line comparison across sample neighbourhoods. No real blood stock or operating camp is assumed.</p>`;
      $('simMetrics').insertAdjacentElement('afterend',visual);
    }
    // Closing impact line appears even when only the JS file is replaced.
    const mission=document.querySelector('.mission-quote');
    if(mission && !$('bb-impact-line')){
      const impact=document.createElement('span');
      impact.id='bb-impact-line';impact.className='bb-impact-line';
      impact.textContent='For families managing thalassaemia, finding support shouldn\'t be another struggle.';
      mission.insertAdjacentElement('afterend',impact);
    }
  }
  function fit(animated=true){
    if(!map)return;
    const points=[...cityPlaces().map(coord),...people[city].map(p=>p.point),...(camp?[camp.point]:[])];
    const bounds=new maplibregl.LngLatBounds(points[0],points[0]);points.forEach(p=>bounds.extend(p));
    map.fitBounds(bounds,{padding:{top:60,bottom:50,left:40,right:40},maxZoom:12.2,duration:animated?700:0});
  }
  function makeMarker(point,category,glyph,label,action,highlight=false){
    const btn=document.createElement('button');btn.type='button';btn.className=`bb-marker bb-${category}${highlight?' bb-highlight':''}`;
    btn.innerHTML=glyph;btn.title=label;btn.setAttribute('aria-label',label);
    btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();action();});
    markers.push(new maplibregl.Marker({element:btn,anchor:'bottom'}).setLngLat(point).addTo(map));
  }
  function makeHumanMarker(){
    // Clear human portrait; unlike blood-bank symbols this actually depicts a person.
    // This is a fictional character, not a real patient's location.
    if(!map)return;
    const el=document.createElement('button');
    el.type='button';el.className='bb-human-pin';
    el.title=`Fictional patient: ${person.name}, ${person.age}`;
    el.setAttribute('aria-label',el.title);
    const shirt=person.theme==='boy'?'#389b96':'#d75b79';
    const hair=person.theme==='boy'?'#39304c':'#38283c';
    el.innerHTML=`<span class="bb-human-art"><svg viewBox="0 0 48 48" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="25" r="23" fill="#ffe6e1"/>
      <path d="M8 48c1-13 7-18 16-18s15 5 16 18" fill="${shirt}"/>
      <path d="M13 20c-1-12 5-17 12-17s14 7 11 20l-6 6H16z" fill="${hair}"/>
      <ellipse cx="24" cy="23" rx="11" ry="13" fill="#f0b58d"/>
      <path d="M12 19c1-10 8-15 15-14 7 1 9 5 10 13-7-1-10-6-12-8-3 6-7 9-13 9z" fill="${hair}"/>
      <circle cx="20" cy="23" r="1.2" fill="#513441"/><circle cx="28" cy="23" r="1.2" fill="#513441"/>
      <path d="M21 28q3 3 6 0" fill="none" stroke="#9e4858" stroke-width="1.4" stroke-linecap="round"/>
    </svg></span><span class="bb-human-tag">${esc(person.name)} · PATIENT</span>`;
    el.addEventListener('click',e=>{e.stopPropagation();flash(`${person.name}'s fictional starting point`);});
    markers.push(new maplibregl.Marker({element:el,anchor:'bottom'}).setLngLat(person.point).addTo(map));
  }
  function groupPlaces(places){
    const pixels=places.map(f=>({feature:f,p:map.project(coord(f))}));
    const used=new Set(), groups=[],radius=map.getZoom()<11?48:map.getZoom()<13?37:29;
    for(let i=0;i<pixels.length;i++){
      if(used.has(i))continue;
      const ids=[i];used.add(i);
      for(let k=0;k<ids.length;k++)for(let j=0;j<pixels.length;j++){
        if(used.has(j))continue;
        const a=pixels[ids[k]].p,b=pixels[j].p;
        if(Math.hypot(a.x-b.x,a.y-b.y)<radius){used.add(j);ids.push(j);}
      }
      const entries=ids.map(n=>pixels[n].feature);
      groups.push({entries,center:[entries.reduce((s,f)=>s+coord(f)[0],0)/entries.length,entries.reduce((s,f)=>s+coord(f)[1],0)/entries.length]});
    }
    return groups;
  }
  function addCluster(group){
    const el=document.createElement('button');el.className='bb-cluster';el.type='button';el.textContent=group.entries.length;
    el.title=`${group.entries.length} nearby centres — click to explore`;
    el.addEventListener('click',e=>{
      e.preventDefault();e.stopPropagation();
      const menu=document.createElement('div');menu.className='bb-cluster-menu';
      const title=document.createElement('strong');title.textContent=`${group.entries.length} support centres`;menu.appendChild(title);
      const popup=new maplibregl.Popup({offset:24,maxWidth:'280px'}).setLngLat(group.center).setDOMContent(menu).addTo(map);
      group.entries.forEach(f=>{
        const b=document.createElement('button');b.type='button';b.textContent=f.properties.name;
        const area=document.createElement('small');area.textContent=f.properties.area;b.appendChild(area);
        b.addEventListener('click',()=>{popup.remove();choose(f);});menu.appendChild(b);
      });
      if(map.getZoom()<12.8)map.easeTo({center:group.center,zoom:Math.min(13.2,map.getZoom()+1),duration:500});
    });
    markers.push(new maplibregl.Marker({element:el,anchor:'center'}).setLngLat(group.center).addTo(map));
  }
  function addLabels(blocks){
    if(map.getZoom()<10.2)return;
    const stage=$('map'),width=stage.clientWidth,height=stage.clientHeight;
    const names=[...neighborhoods[city]];
    const known=new Set(names.map(x=>x[0].toLowerCase()));
    cityPlaces().forEach(f=>{const name=f.properties.area;if(name&&!known.has(name.toLowerCase())){known.add(name.toLowerCase());names.push([name,...coord(f)]);}});
    const home=person.area.split(',')[0].trim().toLowerCase();
    names.sort((a,b)=>Number(b[0].toLowerCase().includes(home))-Number(a[0].toLowerCase().includes(home)));
    let added=0,max=map.getZoom()<11.2?10:map.getZoom()<13?17:25;
    for(const [name,lng,lat] of names){
      if(added>=max)break;
      const p=map.project([lng,lat]),w=Math.max(55,Math.min(160,name.length*6.5+16)),h=24;
      if(!Number.isFinite(p.x)||p.x<10||p.x>width-10||p.y<12||p.y>height-12)continue;
      for(const [dx,dy] of [[0,36],[0,-38],[62,0],[-62,0],[48,43],[-48,-43],[0,60]]){
        const box={x:p.x+dx-w/2,y:p.y+dy-h/2,w,h};
        if(box.x<7||box.y<46||box.x+w>width-7||box.y+h>height-65)continue;
        if(blocks.some(b=>box.x<b.x+b.w+4&&box.x+w+4>b.x&&box.y<b.y+b.h+4&&box.y+h+4>b.y))continue;
        const label=document.createElement('div');label.className='bb-area-label';label.textContent=name;
        label.title='Approximate neighbourhood label';
        markers.push(new maplibregl.Marker({element:label,anchor:'center',offset:[dx,dy]}).setLngLat([lng,lat]).addTo(map));
        blocks.push(box);added++;break;
      }
    }
  }
  function refresh(){
    if(!map)return;
    markers.forEach(m=>m.remove());markers=[];
    const blocks=[];const block=(p,w=46,h=46)=>{const v=map.project(p);blocks.push({x:v.x-w/2,y:v.y-h/2,w,h});};
    for(const group of groupPlaces(visible().filter(f=>f.properties.id!==selected?.properties.id))){
      if(group.entries.length>1){addCluster(group);block(group.center,52,52);}
      else{
        const f=group.entries[0],kind=f.properties.category;
        const icon=kind==='thalassemia'?'♥':kind==='bloodbank'?'✚':'✦';
        makeMarker(coord(f),kind,`<span>${icon}</span>`,f.properties.name,()=>choose(f));block(coord(f));
      }
    }
    if(selected&&visible().some(f=>f.properties.id===selected.properties.id)){
      const kind=selected.properties.category;
      makeMarker(coord(selected),kind,`<span>${kind==='thalassemia'?'♥':'✦'}</span>`,selected.properties.name,()=>choose(selected),true);
      block(coord(selected),52,52);
    }
    makeHumanMarker();
    block(person.point,68,76);
    if(camp){makeMarker(camp.point,'camp','<span>✚</span>','Simulated donation camp',()=>flash('Proposed camp — not a real operating centre'));block(camp.point);}
    addLabels(blocks);
  }
  // A fictional patient journey, never live ambulance tracking or actual dispatch.
  function routeFeature(coordinates){
    return {type:'FeatureCollection',features:coordinates.length>1?[{
      type:'Feature',properties:{illustrative:true},
      geometry:{type:'LineString',coordinates}
    }]:[]};
  }
  function updateRideTrail(coordinates){
    if(map?.isStyleLoaded() && map.getSource('bb-ride-trail')){
      map.getSource('bb-ride-trail').setData(routeFeature(coordinates));
    }
  }
  function routeToMappedHospital(rawRoute, destination){
    // AWS roads snap to nearby driveable segments; mapped facility coordinates are approximate.
    // Clamp animation at the selected centre; never continue past it or off the route canvas.
    if(!Array.isArray(rawRoute)||rawRoute.length<2)return null;
    const path=rawRoute.filter(p=>Array.isArray(p)&&p.length>=2&&Number.isFinite(p[0])&&Number.isFinite(p[1]))
      .map(p=>[p[0],p[1]]);
    if(path.length<2)return null;
    const from=person.point;
    // Correct a reversed route only if its last point is closer to the fictional origin.
    if(distance(path[0],from)>distance(path[path.length-1],from))path.reverse();
    // Find the final approach within 200 meters, otherwise accept only close endpoint.
    let cut=-1;
    for(let i=1;i<path.length;i++){
      if(distance(path[i],destination)<=0.20){cut=i;break;}
    }
    if(cut>=1)path.splice(cut+1);
    if(distance(path[path.length-1],destination)>1.0)return null;
    // Actual final position is EXACTLY the selected centre, never the next roadway vertex.
    path.push([...destination]);
    return path;
  }
  function stopRide(){
    if(rideFrame!==null)cancelAnimationFrame(rideFrame);
    rideFrame=null;
    if(ambulanceMarker){ambulanceMarker.remove();ambulanceMarker=null;}
    ridePath=[];
    updateRideTrail([]);
  }
  function createAmbulance(point){
    if(!map || !window.maplibregl)return;
    if(ambulanceMarker)ambulanceMarker.remove();
    const el=document.createElement('div');el.className='bb-ambulance';
    el.title='Illustrative ambulance — no real vehicle dispatched';
    el.setAttribute('role','img');el.setAttribute('aria-label','Animated ambulance, fictional journey');
    el.innerHTML='<span aria-hidden="true">🚑</span>';
    ambulanceMarker=new maplibregl.Marker({element:el,anchor:'center'}).setLngLat(point).addTo(map);
  }
  function fitJourney(points){
    if(!map||points.length<2)return;
    const bounds=new maplibregl.LngLatBounds(points[0],points[0]);
    for(const point of points)bounds.extend(point);
    map.resize();
    map.fitBounds(bounds,{padding:{top:55,bottom:75,left:65,right:65},maxZoom:12.3,duration:650});
  }
  function storyStage(number,title,copy){
    if(!storyActive)return;
    setText('bb-story-step',`CHAPTER 0${number} / 04`);
    setText('bb-story-title',title);
    setText('bb-story-copy',copy);
    const arrival=$('bb-arrival-note');
    if(arrival) arrival.hidden=(number!==4);
    if(number===4){
      // Gentle visual celebration; no claim that blood was found or treatment delivered.
      arrival?.classList.remove('bb-arrival-note');
      void arrival?.offsetWidth;
      arrival?.classList.add('bb-arrival-note');
      const selectedMarker=document.querySelector('.bb-marker.bb-highlight');
      if(selectedMarker){
        selectedMarker.classList.remove('bb-hospital-arrival');
        void selectedMarker.offsetWidth;
        selectedMarker.classList.add('bb-hospital-arrival');
      }
    }
  }
  function storyMeter(progress,traveled,total,mode){
    if(!storyActive)return;
    setText('bb-story-distance',`${traveled.toFixed(1)} km`);
    setText('bb-story-total',`${total.toFixed(1)} km`);
    setText('bb-story-type',mode==='aws'?'AWS ROAD ROUTE':'STRAIGHT-LINE DEMO');
    if($('bb-story-fill'))$('bb-story-fill').style.width=`${Math.round(progress*100)}%`;
    if($('bb-story-meter'))$('bb-story-meter').setAttribute('aria-valuenow',String(Math.round(progress*100)));
    setText('bb-story-note',mode==='aws'
      ? 'Animated replay of an AWS-calculated route — not live ambulance tracking.'
      : 'Illustrative straight-line path only — not a road route or travel-time estimate.');
  }
  function startRide(route,mode='preview',onComplete=null){
    stopRide();
    if(!map||!Array.isArray(route)||route.length<2)return;
    const path=route.filter(p=>Array.isArray(p)&&p.length>=2&&Number.isFinite(p[0])&&Number.isFinite(p[1]));
    if(path.length<2)return;
    ridePath=path;rideMode=mode;
    const lengths=[];let geometricKm=0;
    for(let i=1;i<path.length;i++){
      const segment=distance(path[i-1],path[i]);lengths.push(segment);geometricKm+=segment;
    }
    const displayKm=mode==='aws' && Number.isFinite(routeMeta.km)
      ? routeMeta.km : geometricKm;
    createAmbulance(path[0]);updateRideTrail([path[0],path[0]]);
    storyMeter(0,0,displayKm,mode);
    const duration=Math.max(5800,Math.min(8500,6300+geometricKm*80));
    const started=performance.now();
    const status=$('bb-drive-status');
    const frame=now=>{
      if(!ambulanceMarker)return;
      const progress=Math.min(1,(now-started)/duration);
      const traveled=geometricKm*progress;
      let at=0,segment=0;
      while(segment<lengths.length-1 && at+lengths[segment]<traveled){at+=lengths[segment];segment++;}
      const a=path[segment],b=path[segment+1];
      const local=lengths[segment]>0?Math.min(1,(traveled-at)/lengths[segment]):1;
      const position=[a[0]+(b[0]-a[0])*local,a[1]+(b[1]-a[1])*local];
      ambulanceMarker.setLngLat(position);
      updateRideTrail([...path.slice(0,segment+1),position]);
      storyMeter(progress,displayKm*progress,displayKm,mode);
      if(status)status.textContent=progress<1
        ? `${mode==='aws'?'AWS road':'Straight-line demo'} · ${(displayKm*progress).toFixed(1)} / ${displayKm.toFixed(1)} km`
        : `Arrived at mapped location · ${mode==='aws'?'AWS road':'straight-line'} illustration`;
      if(progress<1)rideFrame=requestAnimationFrame(frame);
      else{
        rideFrame=null;
        ambulanceMarker?.setLngLat(path[path.length-1]); // deterministic stop at mapped destination
        updateRideTrail(path);
        if(typeof onComplete==='function')onComplete();
      }
    };
    rideFrame=requestAnimationFrame(frame);
  }
  function setupRideControls(){
    const replay=$('bb-replay-ride');
    if(replay)replay.onclick=()=>{
      if(storyActive)cancelStory();
      startRide(line,routeKind);
    };
  }
  function startRideIfAllowed(){
    if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){
      setText('bb-drive-status','Reduced motion preference: select Replay journey to play');
      return;
    }
    startRide(line,routeKind);
  }
  function cancelStory(){
    storyRun++;storyActive=false;
    if(storyDelay!==null)clearTimeout(storyDelay);
    storyDelay=null;
    stopRide();
    if($('bb-story-hud'))$('bb-story-hud').hidden=true;
    if($('bb-arrival-note'))$('bb-arrival-note').hidden=true;
    if(map)requestAnimationFrame(()=>map.resize());
    if($('watchStoryBtn'))$('watchStoryBtn').innerHTML='▶ &nbsp;Play the story';
  }
  function laterStory(ms,id,callback){
    if(storyDelay!==null)clearTimeout(storyDelay);
    storyDelay=setTimeout(()=>{storyDelay=null;if(storyActive&&id===storyRun)callback();},ms);
  }
  function drawLine(){
    if(!map||!map.isStyleLoaded())return;
    if(!map.getSource('bb-route'))map.addSource('bb-route',{type:'geojson',data:{type:'FeatureCollection',features:[]}});
    if(!map.getLayer('bb-route-bg'))map.addLayer({id:'bb-route-bg',type:'line',source:'bb-route',paint:{'line-color':'#fff','line-width':8}});
    if(!map.getLayer('bb-route'))map.addLayer({id:'bb-route',type:'line',source:'bb-route',layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#dd6170','line-width':5,'line-dasharray':routeKind==='aws'?[2,.2]:[2,2]}});
    map.getSource('bb-route').setData({type:'FeatureCollection',features:line.length>1?[{type:'Feature',geometry:{type:'LineString',coordinates:line},properties:{}}]:[]});
    map.setPaintProperty('bb-route','line-dasharray',routeKind==='aws'?[2,.2]:[2,2]);
    if(!map.getSource('bb-ride-trail'))map.addSource('bb-ride-trail',{type:'geojson',data:routeFeature([])});
    if(!map.getLayer('bb-ride-trail'))map.addLayer({
      id:'bb-ride-trail',type:'line',source:'bb-ride-trail',
      layout:{'line-cap':'round','line-join':'round'},
      paint:{'line-color':'#e85164','line-width':7,'line-opacity':.88}
    });
  }
  function clearSelection(){cancelStory();sequence++;selected=null;line=[];routeKind='preview';routeMeta={km:null,minutes:null};drawLine();$('routeCard').classList.remove('active');$('routeCard').innerHTML='<div class="route-icon">⤳</div><div><b>Your next step</b><p>Select a support point to see contact information. Call before visiting.</p></div>';}
  function renderPerson(){
    $('patientSelect').innerHTML=people[city].map(p=>`<option value="${p.id}">${esc(p.name)} · ${esc(p.area.split(',')[0])}</option>`).join('');
    $('patientSelect').value=person.id;
    setText('patientName',`${person.name}, ${person.age}`);setText('patientSubtitle',`A fictional family's journey through ${cityLabel()}`);
    setText('patientStory',person.story);setText('patientArea',person.area);$('bloodType').value=person.blood;
    $('patientPortrait').setAttribute('data-theme',person.theme);
  }
  function renderResults(){
    const list=nearby();setText('resultsCount',`${list.length} places`);setText('totalCentersTop',String(cityPlaces().length));
    setText('resultsIntro',`Showing public directory listings near ${person.area}. Sorted by straight-line distance, not verified availability.`);
    $('resultsList').innerHTML=list.slice(0,6).map(({feature:f,km})=>{
      const p=f.properties,icon=p.category==='thalassemia'?'♥':p.category==='bloodbank'?'✚':'✦';
      return `<button type="button" class="result ${p.category==='bloodbank'?'bank':p.category} ${selected?.properties.id===p.id?'selected':''}" data-center="${esc(p.id)}"><span class="result-icon">${icon}</span><span class="result-text"><span class="result-name">${esc(p.name)}</span><span class="result-area">${esc(p.area)} · directory listing</span></span><span class="result-km">${formatKm(km)}<small>straight-line</small></span></button>`;
    }).join('')||'<p class="empty-state">No listings for this filter.</p>';
    $('resultsList').querySelectorAll('[data-center]').forEach(b=>b.addEventListener('click',()=>{const f=list.find(x=>x.feature.properties.id===b.dataset.center)?.feature;if(f)choose(f);}));
  }
  async function choose(f,options={}){
    if(storyActive&&!options.storyMode)cancelStory();
    stopRide();routeMeta={km:null,minutes:null};selected=f;const token=++sequence;renderResults();refresh();
    const p=f.properties,to=coord(f),straight=distance(person.point,to);
    line=[person.point,to];routeKind='preview';drawLine();
    fitJourney([person.point,to]);
    const url=`https://www.google.com/maps/dir/?api=1&origin=${person.point[1]},${person.point[0]}&destination=${to[1]},${to[0]}&travelmode=driving`;
    $('routeCard').classList.add('active');
    $('routeCard').innerHTML=`<div class="route-icon">⤳</div><div><b>${esc(p.name)}</b><p>${esc(p.area)} · ${formatKm(straight)} straight-line from fictional starting point.<br>Blood stock and service availability: <strong>unverified</strong>.</p><a href="${esc(p.sourceUrl||'#')}" target="_blank" rel="noopener noreferrer">Check public source ↗</a> &nbsp; <a href="${url}" target="_blank" rel="noopener noreferrer">Open directions ↗</a><p id="routeCalculation">${aws?'Requesting AWS road route…':'Dashed line is a straight-line preview, not a road route.'}</p><div class="bb-drive-actions"><button type="button" id="bb-replay-ride" class="bb-drive-button">🚑 Replay journey</button><span id="bb-drive-status" class="bb-drive-status">${aws?'Preparing road journey…':'Straight-line illustration only'}</span></div></div>`;
    setupRideControls();
    if(!aws){if(options.autoPlay!==false)startRideIfAllowed();return;}
    try{
      const response=await fetch(`https://routes.geo.${region}.amazonaws.com/v2/routes?key=${encodeURIComponent(cfg.apiKey)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({Origin:person.point,Destination:to,TravelMode:'Car',LegGeometryFormat:'Simple'})});
      if(!response.ok)throw Error(`HTTP ${response.status}`);
      const route=(await response.json()).Routes?.[0];if(!route)throw Error('No available route');
      if(token!==sequence)return;
      const geometry=route.Legs?.flatMap(leg=>leg.Geometry?.LineString||[])||[];
      const mappedPath=routeToMappedHospital(geometry,to);
      if(mappedPath){line=mappedPath;routeKind='aws';drawLine();fitJourney(line);}
      else{routeKind='preview';line=[person.point,to];drawLine();fitJourney(line);}
      const d=route.Summary?.Distance,t=route.Summary?.Duration;
      if(routeKind==='aws')routeMeta={km:typeof d==='number'?d/1000:null,minutes:typeof t==='number'?Math.ceil(t/60):null};
      if(options.autoPlay!==false)startRideIfAllowed();
      setText('routeCalculation',routeKind==='aws'
        ? `✓ AWS road route: ${typeof d==='number'?(d/1000).toFixed(1)+' km':'distance unavailable'}${typeof t==='number'?' · '+Math.ceil(t/60)+' min':''}. Approximate coordinates; call before visiting.`
        : 'Route geometry could not be matched to this mapped facility. Showing straight-line simulation only.');
    }catch(err){if(token===sequence){setText('routeCalculation',`AWS route unavailable (${err.message}). Dashed direct-line preview only; no travel time inferred.`);if(options.autoPlay!==false)startRideIfAllowed();}}
  }
  function selectPerson(id){const found=people[city].find(p=>p.id===id);if(!found)return;person=found;clearSelection();renderPerson();renderResults();refresh();map?.flyTo({center:person.point,zoom:11.7,duration:600});}
  function updateCity(value){
    city=value;person=people[city][0];type='all';camp=null;placing=false;$('centerType').value='all';$('citySelect').value=city;
    clearSelection();renderPerson();renderResults();renderSimulator();updateCampLabels();refresh();fit();
    document.querySelector('.map-title > span:nth-child(2)')?.replaceChildren(document.createTextNode(`${city==='lahore'?'LAHORE':'ISLAMABAD + RAWALPINDI'} CARE NETWORK`));
    const heading=document.querySelector('.art-label b');if(heading)heading.textContent=cityLabel()+', Pakistan';
    flash('Directory locations shown; medical services must be confirmed.');
  }
  function averageNearest(points,locations){return points.reduce((sum,p)=>sum+Math.min(...locations.map(x=>distance([p[1],p[2]],x))),0)/points.length;}
  function renderSimulator(){
    const points=neighborhoods[city],base=cityPlaces().map(coord),before=averageNearest(points,base);
    const after=camp?averageNearest(points,[...base,camp.point]):null;
    const reduced=after===null?null:Math.max(0,before-after);
    const percent=after===null||before<=0?0:100*reduced/before;
    setText('beforeMetric',formatKm(before));
    setText('afterMetric',after===null?'—':formatKm(after));
    setText('simNote',camp
      ?`Illustrative mean straight-line distance from ${points.length} sampled neighbourhoods: ${formatKm(before)} before, ${formatKm(after)} with hypothetical outreach point. A donation camp is NOT equivalent to a transfusion centre; no real blood availability or clinical care improvement is implied.`
      :`Place a hypothetical outreach point to compare distances from ${points.length} sampled neighbourhoods. This is a geographic exercise, not a statement about blood stock or clinical access.`);
    setText('bb-before-value',formatKm(before));
    setText('bb-after-value',after===null?'—':formatKm(after));
    setText('bb-sim-delta',after===null?'Choose a location':`−${reduced.toFixed(1)} km (−${percent.toFixed(1)}%)`);
    if($('bb-after-bar')) $('bb-after-bar').style.width=after===null?'0%':`${before>0?Math.min(100,100*after/before):100}%`;
    setText('bb-sim-hint',camp
      ?`Shorter is better · ${points.length} sample origins · hypothetical outreach only. Donation does not confirm transfusion availability.`
      :'Choose a proposed camp above to compare mean straight-line distances (shorter is better).');
  }
  function updateCampLabels(){document.querySelectorAll('[data-camp]').forEach((btn,i)=>{btn.innerHTML=`${campNames[city][i]} <span>↗</span>`;btn.classList.remove('active');});}
  function setCamp(point,name){
    if(storyActive)cancelStory();
    camp={point,name};renderSimulator();refresh();map?.flyTo({center:point,zoom:11.7,duration:600});
    document.querySelectorAll('[data-camp]').forEach(b=>b.classList.toggle('active',b.textContent.includes(name)));
    flash('Hypothetical camp placed — simulation only, not a real blood service.');
  }
  function initMap(){
    if(!window.maplibregl){$('map').textContent='Map library could not load. Check internet connection.';return;}
    $('map').querySelector('.map-skeleton')?.remove();
    map=new maplibregl.Map({container:'map',style:mapStyle(),center:city==='lahore'?[74.30,31.53]:[73.065,33.657],zoom:10.9,attributionControl:true});
    map.addControl(new maplibregl.NavigationControl({showCompass:false}),'bottom-right');installStyles();renderSimulator();refresh();
    let didFit=false;const firstFit=()=>{if(!didFit){didFit=true;fit(false);}};
    map.on('load',()=>{refresh();firstFit();drawLine();});
    map.on('style.load',()=>{refresh();drawLine();updateRideTrail(ridePath);});
    map.once('idle',()=>{refresh();firstFit();});
    setTimeout(()=>{if(map){refresh();firstFit();}},900);
    map.on('moveend',refresh);
    map.on('click',e=>{if(!placing)return;placing=false;$('placeCampBtn').classList.remove('placing');$('placeCampBtn').textContent='⌖   Place by clicking map';setCamp([e.lngLat.lng,e.lngLat.lat],'Custom map location');});
    map.on('error',e=>{if(aws && /401|403|Unauthorized|Forbidden/i.test(String(e.error)))setText('mapSourceLabel','AWS key or referrer authorization error');});
    setText('mapSourceLabel',aws?'Amazon Location Service':'OpenStreetMap preview · configure AWS key');
  }
  function playStories(){
    if(!map){flash('The map is still loading. Please try again.');return;}
    // Story mode always uses the geographically nearest mapped hospital/thalassaemia
    // care centre, NOT a previously selected faraway listing or a blood bank pin.
    // "Nearest" is based on straight-line distance between approximate coordinates,
    // not verified stock, clinical suitability or fastest route.
    const target=cityPlaces()
      .filter(f=>['hospital','thalassemia'].includes(f.properties.category))
      .map(f=>({f,km:distance(person.point,coord(f))}))
      .sort((a,b)=>a.km-b.km)[0]?.f;
    if(!target){flash('No support point was found for this filter.');return;}
    cancelStory();
    storyActive=true;
    const id=storyRun;
    const hud=$('bb-story-hud');if(hud)hud.hidden=false;
    requestAnimationFrame(()=>map?.resize());
    if($('watchStoryBtn'))$('watchStoryBtn').textContent='▶ Playing patient journey';
    $('experience').scrollIntoView({behavior:'smooth',block:'start'});
    const firstName=person.name,origin=person.area.split(',')[0];
    storyMeter(0,0,distance(person.point,coord(target)),'preview');
    storyStage(1,`Meet ${firstName}, ${person.age}`,
      `${firstName} is a fictional thalassaemia patient in ${origin}. The family is planning access to transfusion support.`);
    map.flyTo({center:person.point,zoom:12.2,duration:550});
    laterStory(1700,id,async()=>{
      if(id!==storyRun||!storyActive)return;
      storyStage(2,'Nearest mapped care centre',
        `By approximate straight-line distance, ${target.properties.name} is the closest mapped hospital or thalassaemia centre. Blood availability is not verified.`);
      await choose(target,{autoPlay:false,storyMode:true});
      if(id!==storyRun||!storyActive)return;
      const travelText=routeKind==='aws'&&Number.isFinite(routeMeta.minutes)
        ? `AWS estimates ${routeMeta.minutes} minutes for this route. This replay is accelerated, not real driving time.`
        : 'AWS driving directions are unavailable; showing a straight-line illustration instead.';
      storyStage(3,`🚑 Travelling to ${target.properties.name}`,travelText);
      fitJourney(line);
      laterStory(650,id,()=>startRide(line,routeKind,()=>{
        if(id!==storyRun||!storyActive)return;
        storyStage(4,'Arrived — journey complete',
          `The illustrated journey ends at ${target.properties.name}. The family must call to confirm services, screening and suitability before travelling.`);
        if($('watchStoryBtn'))$('watchStoryBtn').innerHTML='▶ &nbsp;Play the story again';
      }));
    });
  }
  function bindEvents(){
    $('citySelect').addEventListener('change',e=>updateCity(e.target.value));
    $('patientSelect').addEventListener('change',e=>selectPerson(e.target.value));
    $('centerType').addEventListener('change',e=>{type=e.target.value;clearSelection();renderResults();refresh();});
    $('findHelpBtn').addEventListener('click',()=>{const first=nearby()[0];if(first)choose(first.feature);});
    $('fitMapBtn').addEventListener('click',()=>fit());
    $('satelliteBtn').addEventListener('click',()=>{if(storyActive)cancelStory();if(!aws){flash('AWS key needed for the alternate map style.');return;}dark=!dark;map?.setStyle(mapStyle());});
    document.querySelectorAll('[data-camp]').forEach((btn,i)=>btn.addEventListener('click',()=>setCamp(campPoints[city][btn.dataset.camp],campNames[city][i])));
    $('placeCampBtn').addEventListener('click',()=>{placing=!placing;$('placeCampBtn').classList.toggle('placing',placing);$('placeCampBtn').textContent=placing?'Click anywhere on the map…':'⌖   Place by clicking map';if(placing)flash('Click the map to propose a donation outreach camp.');});
    $('resetCampBtn').addEventListener('click',()=>{camp=null;placing=false;$('placeCampBtn').textContent='⌖   Place by clicking map';$('placeCampBtn').classList.remove('placing');document.querySelectorAll('[data-camp]').forEach(b=>b.classList.remove('active'));renderSimulator();refresh();});
    $('watchStoryBtn').addEventListener('click',playStories);
    const modal=$('modalOverlay');const open=()=>{modal.hidden=false;document.body.style.overflow='hidden';};const close=()=>{modal.hidden=true;document.body.style.overflow='';};
    $('aboutBtn').addEventListener('click',open);$('modalClose').addEventListener('click',close);$('modalOkay').addEventListener('click',close);
    modal.addEventListener('click',e=>{if(e.target===modal)close();});
    window.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden)close();});
    $('backTopBtn').addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
  }
  function init(){
    if(!features.length){alert('centers.js did not load. Check app/data/centers.js');return;}
    renderPerson();renderResults();renderSimulator();updateCampLabels();bindEvents();initMap();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
