/* Libris Vastatus — generic renderer. Reads global SITE and paints #app. No dependencies; works from file://. */
(function(){
  "use strict";
  var S = window.SITE || {};
  var app = document.getElementById("app");
  if(!app) return;
  var DM = S.tier === "dm";

  function esc(s){ return String(s==null?"":s).replace(/[&<>]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;"}[c];}); }
  function el(tag, cls, html){ var e=document.createElement(tag); if(cls)e.className=cls; if(html!=null)e.innerHTML=html; return e; }
  function uniq(arr){ var seen={},out=[]; arr.forEach(function(v){ if(v!=null&&v!=="" && !seen[v]){seen[v]=1;out.push(v);} }); return out; }
  function opt(val, label){ var o=document.createElement("option"); o.value=val; o.textContent=label; return o; }

  function filterBar(fields, onChange){
    var bar = el("div","filters");
    var search = el("input"); search.type="search"; search.placeholder="Search…"; bar.appendChild(search);
    var selects = {};
    fields.forEach(function(f){
      var s=document.createElement("select"); s.appendChild(opt("", f.all));
      f.values.forEach(function(v){ s.appendChild(opt(v, v)); });
      bar.appendChild(s); selects[f.key]=s;
    });
    var count = el("span","count"); bar.appendChild(count);
    function read(){ var st={q:search.value.trim().toLowerCase()}; fields.forEach(function(f){st[f.key]=selects[f.key].value;}); return st; }
    search.addEventListener("input",function(){onChange(read());});
    Object.keys(selects).forEach(function(k){ selects[k].addEventListener("change",function(){onChange(read());}); });
    bar._count = count;
    return bar;
  }

  /* ---------- POIs ---------- */
  function renderPOIs(){
    var items = S.items||[];
    var grid = el("div","grid");
    var bar = filterBar([
      {key:"region",all:"All regions",values:uniq(items.map(function(p){return p.region;})).sort()},
      {key:"type",all:"All types",values:uniq(items.map(function(p){return p.type;})).sort()},
      {key:"era",all:"All eras",values:uniq(items.map(function(p){return p.era;})).sort()}
    ], apply);
    app.appendChild(bar); app.appendChild(grid);
    function card(p){
      var c = el("div","card");
      c.appendChild(el("h3",null,esc(p.name)));
      c.appendChild(el("div","meta", esc(p.region)+'<span class="dot">•</span>'+esc(p.type)+'<span class="dot">•</span>'+esc(p.era)));
      if(p.terrain) c.appendChild(el("p","terrain",esc(p.terrain)));
      if(p.holder) c.appendChild(el("div",null,'<span class="pill house">'+esc(p.holder)+'</span>'));
      if(p.now) c.appendChild(el("p",null,esc(p.now)));
      if(p.threads && p.threads.length) c.appendChild(el("p","terrain","Hooks: "+p.threads.map(esc).join(" / ")));
      if(p.connections && p.connections.length) c.appendChild(el("div","meta","Linked: "+p.connections.map(esc).join(", ")));
      
      return c;
    }
    function apply(st){
      st = st||{q:""};
      grid.innerHTML="";
      var n=0;
      items.forEach(function(p){
        if(st.region && p.region!==st.region) return;
        if(st.type && p.type!==st.type) return;
        if(st.era && p.era!==st.era) return;
        if(st.q){ var hay=((p.name||"")+" "+(p.terrain||"")+" "+(p.now||"")).toLowerCase(); if(hay.indexOf(st.q)<0) return; }
        grid.appendChild(card(p)); n++;
      });
      if(n===0) grid.appendChild(el("div","empty","No locations match."));
      bar._count.textContent = n+" of "+items.length;
    }
    apply();
  }

  /* ---------- NPCs ---------- */
  function renderNPCs(){
    var items = S.items||[];
    var grid = el("div","grid");
    var bar = filterBar([
      {key:"house",all:"All Houses",values:uniq(items.map(function(p){return p.house;}))},
      {key:"tier",all:"All tiers",values:uniq(items.map(function(p){return p.tier;}))},
      {key:"region",all:"All regions",values:uniq(items.map(function(p){return p.region;})).sort()}
    ], apply);
    app.appendChild(bar); app.appendChild(grid);
    function card(p){
      var c = el("div","card");
      c.appendChild(el("h3",null,esc(p.name)));
      c.appendChild(el("div","meta", esc(p.house)+'<span class="dot">•</span>'+esc(p.tier)+'<span class="dot">•</span>'+esc(p.region)));
      if(p.title) c.appendChild(el("div",null,'<span class="pill">'+esc(p.title)+'</span>'));
      if(p.public) c.appendChild(el("p",null,esc(p.public)));
      
      return c;
    }
    function apply(st){
      st = st||{q:""};
      grid.innerHTML="";
      var n=0;
      items.forEach(function(p){
        if(st.house && p.house!==st.house) return;
        if(st.tier && p.tier!==st.tier) return;
        if(st.region && p.region!==st.region) return;
        if(st.q){ var hay=((p.name||"")+" "+(p.public||"")+" "+(p.title||"")).toLowerCase(); if(hay.indexOf(st.q)<0) return; }
        grid.appendChild(card(p)); n++;
      });
      if(n===0) grid.appendChild(el("div","empty","No figures match."));
      bar._count.textContent = n+" of "+items.length;
    }
    apply();
  }

  /* ---------- Lore ---------- */
  function renderLore(){
    var wrap = el("div","prose");
    (S.public||[]).forEach(function(s){
      var e=el("div","lore-entry"); e.appendChild(el("h3",null,esc(s.title))); e.appendChild(el("p",null,esc(s.body))); wrap.appendChild(e);
    });
    
    app.appendChild(wrap);
  }

  /* ---------- Dinos ---------- */
  function renderDinos(){
    var wrap = el("div");
    if(S.intro) wrap.appendChild(el("p","prose",esc(S.intro)));
    (S.classes||[]).forEach(function(k){
      var c=el("div","classcard");
      c.appendChild(el("h3",null,esc(k.name)+' <span class="ep">'+esc(k.epithet)+'</span>'));
      c.appendChild(el("div","role",esc(k.role)));
      c.appendChild(el("div","stats",
        "<span>AC <b>"+esc(k.ac)+"</b></span><span>Save <b>"+esc(k.save)+"</b></span>"+
        "<span>Atk <b>"+esc(k.atk)+"</b></span><span>Dmg <b>"+esc(k.dmg)+"</b></span>"+
        "<span>Blocks <b>"+esc(k.blocks)+"</b></span><span>Knack <b>"+esc(k.knack)+"</b></span>"+
        "<span>1/day <b>"+esc(k.oncePerDay)+"</b></span><span>Heals <b>"+esc(k.heals)+"</b></span>"+
        "<span>Ride <b>"+esc(k.ride)+"</b></span>"));
      c.appendChild(el("div","species","Fits: "+esc(k.species)));
      wrap.appendChild(c);
    });
    if(S.healing){
      wrap.appendChild(el("h3",null,'<span style="font-variant:small-caps;letter-spacing:.04em">The med kit</span>'));
      if(S.healing.note) wrap.appendChild(el("p","prose",esc(S.healing.note)));
      var t=el("table","heals"); t.innerHTML="<tr><th>Rider level</th><th>Grade</th><th>Each heal</th><th>Avg</th></tr>";
      (S.healing.grades||[]).forEach(function(g){ t.innerHTML+="<tr><td>"+esc(g.level)+"</td><td>"+esc(g.grade)+"</td><td>"+esc(g.dice)+"</td><td>"+esc(g.avg)+"</td></tr>"; });
      wrap.appendChild(t);
    }
    app.appendChild(wrap);
  }

  var pages = {pois:renderPOIs, npcs:renderNPCs, lore:renderLore, dinos:renderDinos};
  (pages[S.page]||function(){})();
})();
