var e=new(typeof MutationObserver<`u`?class extends MutationObserver{pendingMounts=new Set;activeUnmounts=new Map;constructor(){super(()=>{this.processLifecycle()})}processLifecycle(){for(let e of this.pendingMounts){let{node:t,callback:n}=e;if(t.isConnected){let r=n();if(typeof r==`function`){let e=this.activeUnmounts.get(t);e||(e=new Set,this.activeUnmounts.set(t,e)),e.add(r)}this.pendingMounts.delete(e)}}for(let[e,t]of this.activeUnmounts)if(!e.isConnected){for(let e of t)e();this.activeUnmounts.delete(e)}}start(e){this.observe(e,{childList:!0,subtree:!0})}trackMount(e,t){this.pendingMounts.add({node:e,callback:t})}trackUnmount(e,t){let n=this.activeUnmounts.get(e);n||(n=new Set,this.activeUnmounts.set(e,n)),n.add(t)}}:class{start(){}trackUnmount(){}trackMount(){}disconnect(){}}),t=e=>{for(let t of e)t.remove()},n=(t,{to:n})=>{if(!n||!(n instanceof DocumentFragment||n instanceof Element))throw ReferenceError(`Target element is undefined or not an Element`);let r=new Comment,i=document.createDocumentFragment();return i.appendChild(r),e.start(n),t().hydrate(r),n.replaceChildren(i),()=>{e.disconnect()}},r=/<!--(nø-.{6})-->/g,i=()=>{let e=``;return{fragmentId:!0,create:t=>{e=`n\xF8-${t.padStart(6,`0`)}`},get:()=>e}},a=Symbol.for(`nord.component`),o=new WeakMap,s=new Set([`allowfullscreen`,`async`,`autofocus`,`autoplay`,`checked`,`controls`,`default`,`defer`,`disabled`,`formnovalidate`,`hidden`,`inert`,`ismap`,`itemscope`,`loop`,`multiple`,`muted`,`nomodule`,`novalidate`,`open`,`playsinline`,`readonly`,`required`,`reversed`,`selected`]),c=(e,t,n)=>{if(!s.has(t.toLowerCase())){e.setAttribute(t,String(n));return}n===`false`||!n?e.removeAttribute(t):e.setAttribute(t,``)},l=(e,t,n,r)=>{let i=o.get(e);i||(i=new Map,o.set(e,i));let a=i.get(t);a||(a=r,i.set(t,a));let s=a.indexOf(n);return s===-1?()=>{}:n=>{a[s]=String(n),c(e,t,a.join(``))}},u=(e,t)=>{let n=e=>e.nodeType===1||e.nodeType===8;n(e)&&t(e);let r=e.firstChild;for(;r;){if(n(r)&&t(r),r.firstChild){r=r.firstChild;continue}for(;r&&r!==e;){if(r.nextSibling){r=r.nextSibling;break}r=r.parentNode}if(r===e)return}},d=(e,t,n)=>{let i=[];return u(e,e=>{if(e instanceof Comment){let n=e.data;if(n.startsWith(`nø-`)){let r=n.slice(3),a=t[Number.parseInt(r,10)];a&&i.push({fragment:a,args:[e]})}}if(e instanceof Element){let a=[...e.attributes];for(let{name:n,value:o}of a){if(n.startsWith(`nø-`)){let r=t[Number.parseInt(n.slice(3),10)];r&&(i.push({fragment:r,args:[e]}),e.removeAttribute(n));continue}if(!o.includes(`nø-`))continue;let a=o.split(r);for(let r of a)if(r.startsWith(`nø-`)){let o=t[Number.parseInt(r.slice(3),10)];if(o){let t=l(e,n,r,a);i.push({fragment:o,args:[e,{binding:t}]})}}}n&&e.setAttribute(n,``)}}),i},f=new Map,p=e=>{let t=f.get(e);if(t&&t.ownerDocument===document)return t;let n=document.createElement(`template`);return n.innerHTML=e,f.set(e,n),n},m=(e,t)=>{let n=e.join(``),r=i();return{fragmentId:r,[a]:!0,resolve:()=>`<!--${r.get()}-->`,render:()=>e.filter((e,t)=>t%2==0).flatMap((e,n)=>[e,t[n]?.render()??``]).join(``),hydrate:(e,r)=>{if(!(e instanceof Comment))return;let i=p(n).content.cloneNode(!0);for(let{fragment:e,args:n}of d(i,t,r?.scope))e.hydrate(...n);e.replaceWith(i)}}},h=e=>{let t=i();return{fragmentId:t,resolve:()=>`<!--${t.get()}-->`,render:()=>String(e),hydrate:(t,{binding:n}={})=>{if(t instanceof Comment)return t.replaceWith(new Text(String(e)));t instanceof Element&&n?.(e)}}},ee=t=>{let n=i();return{fragmentId:n,resolve:()=>`<!--${n.get()}-->`,render:()=>String(t()??``),hydrate:(n,{binding:r}={})=>{if(n instanceof Comment){let r=new Text(String(t()??``));n.replaceWith(r);let i=t.subscribe(e=>{r.textContent=String(e??``)});i&&e.trackUnmount(r,i)}if(n instanceof Element){r?.(t()??``);let i=t.subscribe(e=>{r?.(e??``)});i&&e.trackUnmount(n,i)}}}},te=e=>[`string`,`boolean`,`number`,`bigint`].includes(typeof e),g=e=>e!==null&&typeof e==`function`&&`subscribe`in e,_=e=>{switch(!0){case g(e):return ee(e);case te(e)||e==null:return h(e??``);default:return e}},v=(e,...t)=>{let n=[];return m(e.flatMap((e,r)=>[e,(()=>{let e=_(t[r]);return`fragmentId`in e&&e.fragmentId.create(String(r)),n.push(e),e.resolve()})()]).flat(),n)},y=t=>{let n=i();return{fragmentId:n,resolve:()=>n.get(),render:()=>``,hydrate:n=>{if(n instanceof Element){let r=t(n);r&&e.trackUnmount(n,r)}}}},b=(e,t,n)=>{let r=e=>t(e);return y(t=>(t.addEventListener(e,r,n),()=>t.removeEventListener(e,r,n)))},x=e=>{let t=document.createElement(`template`),n=new Comment;return t.content.append(n),e.hydrate(n),Array.from(t.content.childNodes)},S=(t,n=()=>``)=>{let r=i();return{fragmentId:r,resolve:()=>`<!--${r.get()}-->`,render:()=>n(),hydrate:n=>{if(n instanceof Comment){let r=t(n);r&&e.trackUnmount(n,r)}}}},C=e=>{let t=e,n=new Set;return Object.assign(()=>t,{subscribe:e=>(n.add(e),()=>n.delete(e)),set:e=>{if(!Object.is(t,e)){t=e;for(let e of Array.from(n.values()))e(t)}}})},w=e=>{let t=(t,n)=>S(r=>{let i=new Map,a=new Map,o=[],s=(e,r,a)=>{let o=C(r);return i.set(t(e),o),{nodes:x(n(e,o,a))}},c=(e,t)=>{let n=t.parentNode,r=document.createDocumentFragment();r.append(...e),n?.insertBefore(r,t)},l=e=>{for(let t of e)t.parentNode?.removeChild(t)},u=e=>{let n=e.map(t),u=new Map;for(let e=0;e<o.length;e++)u.set(o[e],e);let d=new Int32Array(n.length).fill(-1);for(let e=0;e<n.length;e++){let t=u.get(n[e]);d[e]=t===void 0?-1:t}let f=new Set(n);for(let e of o)if(!f.has(e)){let t=a.get(e);t&&l(t.nodes),a.delete(e),i.delete(e)}let p=ne(d),m=p.length-1,h=r;for(let t=n.length-1;t>=0;t--){let r=n[t],o=a.get(r);d[t]===-1?(o=s(e[t],t,e),a.set(r,o),c(o.nodes,h)):m<0||t!==p[m]?o&&c(o.nodes,h):m--,i.get(r)?.set(t),o&&(h=o.nodes[0])}o=n};if(u(e()),g(e)){let t=e.subscribe(u);return()=>{t?.(),a.forEach(({nodes:e})=>{l(e)})}}},()=>e().map((e,t,r)=>n(e,C(t),r).render()).join(``));return{$as:e=>t(e=>e,e),$withKey:e=>({$as:n=>t(e,n)})}};function ne(e){let t=new Int32Array(e.length),n=[];t.fill(-1);for(let r=0;r<e.length;r++){let i=e[r];if(i===-1)continue;let a=0,o=n.length;for(;a<o;){let t=a+o>>1;e[n[t]]<i?a=t+1:o=t}a>0&&(t[r]=n[a-1]),n[a]=r}if(n.length===0)return[];let r=Array(n.length),i=n[n.length-1];for(let e=n.length-1;e>=0;e--)r[e]=i,i=t[i];return r}var re=e=>{let n=new Map,r=r=>{n.set(!0,()=>x(r()));let i=e();return r=>{let a=n.get(i),o=i,s=a?.()??[];if(r.before(...s),g(e))return e.subscribe(e=>{e!==o&&(o=e,t(s),s=n.get(e)?.()??[],r.before(...s))})}};return{$then:t=>{let i=()=>e()?t().render():``,a=r(t);return Object.assign(S(a,i),{$else:r=>(n.set(!1,()=>x(r())),S(a,()=>e()?t().render():r().render()))})}}},T=(e,t)=>Object.assign(()=>t(e()),{subscribe(n){return e.subscribe(e=>{n(t(e))})}}),ie=(e,t)=>Object.is(e,t),E=(e,t=ie)=>{let n=e,r=new Set,i=()=>{for(let e of Array.from(r))e(n)},a=e=>{t(n,e)||(n=e,i())};return Object.assign(()=>n,{set:a,update:e=>a(e(n)),subscribe:e=>(r.add(e),()=>r.delete(e))})},D=e=>Object.assign(()=>e(),{subscribe:e.subscribe}),O=[`Smart`,`Ergonomic`,`Portable`,`Durable`,`Sleek`,`Eco`,`Advanced`,`Compact`,`Efficient`,`Wireless`],ae=[`Watch`,`Chair`,`Speaker`,`Monitor`,`Drone`,`Phone`,`Camera`,`TV`,`Router`,`Lamp`],k=e=>e[Math.floor(Math.random()*e.length)],A=0,oe=[`In Stock`,`Low Stock`,`Out of Stock`];function j(){return k(oe)}function se(e){let t=Array(e);for(let n=0;n<e;n++){let e=Math.random()*50+5,r=Math.random()*80+10,i=Math.random()*30+3;t[n]={id:A++,name:`${k(O)} ${k(ae)} ${Math.floor(Math.random()*900)+100}`,weight:Math.random()*20+.1,dimensions:{width:e,height:r,depth:i},powerConsumption:Math.random()*1e3+5,price:Math.random()*1e3+50,availabilityStatus:j(),rating:Math.random()*2+3}}return t}var M={weight:{imperial:`lbs`,metric:`kg`},power:{imperial:`hp`,metric:`w`},length:{imperial:`in`,metric:`cm`}};function ce(e){let t;function n(){for(let t=0;t<10;t++){let t={id:Math.floor(Math.random()*25)+A-25},n=Math.random();n<.33?t.price=Math.random()*1e3+50:(n<.66||(t.price=Math.random()*1e3+50),t.availabilityStatus=j()),e(t)}}return t=setInterval(n,10),()=>clearInterval(t)}var N=E([]),P=e=>se(e).map(e=>({...e,price:E(e.price),availabilityStatus:E(e.availabilityStatus)})),F=e=>{N.update(t=>t.filter(t=>t.id!==e))},I=()=>{N.update(e=>e.toReversed())},L=()=>{N.update(e=>[...e.slice(0,10),...P(1),...e.slice(10)])},R=()=>{N.update(e=>[...P(1),...e])},z=()=>{N.update(e=>[...e,...P(1)])},B=()=>{N.update(e=>e.toSorted((e,t)=>e.name.localeCompare(t.name)))},V=()=>{N.update(e=>e.filter(e=>e.id%2))},H=()=>{N().forEach(e=>{e.availabilityStatus()===`Out of Stock`&&e.availabilityStatus.set(`In Stock`)})},U=E(null),W=e=>U.set(e),G=E(`metric`),le=()=>{G.set(G()===`metric`?`imperial`:`metric`)},K=null,q=E(!1),J=e=>q.set(e),Y={state:{isStreaming:D(q),rows:D(N),selectedId:D(U),unitSystem:D(G)},actions:{setIsStreaming:J,setSelectedId:W,toggleUnitSystem:le,calculateWeight:({weight:e})=>t=>`${(e*(t===`metric`?1:2.20462)).toFixed(1)} ${M.weight[t]}`,calculateDimensions:({dimensions:e})=>{let{width:t,height:n,depth:r}=e;return e=>{let i=t=>((e===`metric`?1:.393701)*t).toFixed(1);return`${i(n)} x ${i(t)} x ${i(r)} ${M.length[e]}`}},calculatePowerConsumption:({powerConsumption:e})=>t=>`${(e*(t===`metric`?1:.00134102)).toFixed(1)} ${M.power[t]}`,deleteRow:F,reverseRows:I,restockRows:H,insertRow:L,prependRow:R,appendRow:z,sortRows:B,filterRows:V,create:()=>{K&&(K(),K=null,J(!1)),N.set(P(1e3))},stream:()=>{if(K){K(),K=null,J(!1);return}let e=P(25);J(!0),N.set(e);let t=new Map(e.map(e=>[e.id,e]));K=ce(e=>{let n=t.get(e.id);n&&(e.price&&n.price.set(e.price),e.availabilityStatus&&n.availabilityStatus.set(e.availabilityStatus))})},clear:()=>{K&&(K(),K=null,J(!1)),N.set([])}}},{state:X,actions:Z}=Y,ue=e=>y(t=>X.selectedId.subscribe(n=>{t.classList.toggle(`selected`,e===n)})),de=e=>v`
        <tr ${ue(e.id)} ${b(`click`,()=>!X.isStreaming()&&Z.setSelectedId(e.id))}>
            <td>${e.id}</td>
            <td>${e.name}</td>

            <td>${T(X.unitSystem,Z.calculateWeight(e))}</td>
            <td>${T(X.unitSystem,Z.calculateDimensions(e))}</td>
            <td>${T(X.unitSystem,Z.calculatePowerConsumption(e))}</td>

            <td>${T(e.price,e=>e.toFixed(2))}</td>
            <td>${e.availabilityStatus}</td>
            <td>${e.rating.toFixed(1)}</td>
            <td>
                <button class="small" disabled="${X.isStreaming}" ${b(`click`,()=>Z.deleteRow(e.id))}>
                    delete
                </button>
            </td>
        </tr>
    `,{actions:Q,state:$}=Y;n(()=>v`
        <main>
            <div class="header">
                <h1>Nørd</h1>
                <div class="actions">
                    <button id="create" disabled="${$.isStreaming}" ${b(`click`,Q.create)}>Create</button>
                    <button id="stream" ${b(`click`,Q.stream)}>
                        ${T($.isStreaming,e=>e?`Stop`:`Stream`)}
                    </button>
                    <button id="reverse" disabled="${$.isStreaming}" ${b(`click`,Q.reverseRows)}>
                        Reverse
                    </button>
                    <button id="insert" disabled="${$.isStreaming}" ${b(`click`,Q.insertRow)}>
                        Insert
                    </button>
                    <button id="prepend" disabled="${$.isStreaming}" ${b(`click`,Q.prependRow)}>
                        Prepend
                    </button>
                    <button id="append" disabled="${$.isStreaming}" ${b(`click`,Q.appendRow)}>
                        Append
                    </button>
                    <button id="sort" disabled="${$.isStreaming}" ${b(`click`,Q.sortRows)}>Sort</button>
                    <button id="filter" disabled="${$.isStreaming}" ${b(`click`,Q.filterRows)}>
                        Filter
                    </button>
                    <button id="units" disabled="${$.isStreaming}" ${b(`click`,Q.toggleUnitSystem)}>
                        Units
                    </button>
                    <button id="restock" disabled="${$.isStreaming}" ${b(`click`,Q.restockRows)}>
                        Restock
                    </button>
                    <button id="clear" disabled="${$.isStreaming}" ${b(`click`,Q.clear)}>Clear</button>
                </div>
            </div>

            ${re(T($.rows,e=>!!e.length)).$then(()=>v`
                        <table>
                            <thead>
                                <tr>
                                    <th>id</th>
                                    <th>name</th>
                                    <th>weight</th>
                                    <th>dimensions</th>
                                    <th>power consumption</th>
                                    <th>price</th>
                                    <th>availability status</th>
                                    <th>rating</th>
                                    <th>actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${w($.rows).$withKey(e=>e.id).$as(de)}
                            </tbody>
                        </table>
                    `).$else(()=>v`<h2 class="text-center">No rows to show</h2> `)}
        </main>
    `,{to:document.querySelector(`#app`)});