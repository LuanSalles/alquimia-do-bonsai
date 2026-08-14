const DB={get(k){try{return JSON.parse(localStorage.getItem('adb_'+k));}catch{return null;}},set(k,v){localStorage.setItem('adb_'+k,JSON.stringify(v));}};
const SUPABASE_URL='https://fmerpowodhrgfdzjcckm.supabase.co';
const SUPABASE_KEY='sb_publishable_IgkFCy47fAKzZ-EjaR_flg_sqEqnyHL';
const supabaseClient=window.supabase?window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY):null;
let remoteProducts=null;
let remoteVideos=null;
function escapeHTML(value){
  return String(value??'').replace(/[&<>"']/g,(char)=>({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":'&#39;'
  }[char]));
}
function safeUrl(value,{fallback='#',allowedProtocols=['https:','http:','mailto:','tel:']}={}){
  const raw=String(value??'').trim();
  if(!raw)return fallback;
  try{
    const url=new URL(raw,window.location.origin);
    return allowedProtocols.includes(url.protocol)?url.href:fallback;
  }catch{
    return fallback;
  }
}
function safeImageUrl(value){
  const raw=String(value??'').trim();
  if(/^\/?assets\//.test(raw))return raw;
  return safeUrl(value,{fallback:'',allowedProtocols:['https:','http:']});
}
function safeYoutubeUrl(value){
  let raw=String(value??'').trim();
  if(!raw)return '#';
  const found=raw.match(/(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com|youtu\.be|youtube-nocookie\.com)\/[^\s<>"']+/i);
  raw=found?found[0]:raw;
  if(/^www\./i.test(raw)||/^m\./i.test(raw)||/^(youtube\.com|youtu\.be|youtube-nocookie\.com)\//i.test(raw))raw='https://'+raw;
  const url=safeUrl(raw,{fallback:'#',allowedProtocols:['https:']});
  if(url==='#')return '#';
  try{
    const parsed=new URL(url);
    const host=parsed.hostname.replace(/^www\./,'').replace(/^m\./,'');
    return ['youtube.com','youtu.be','youtube-nocookie.com'].includes(host)?parsed.href:'#';
  }catch{
    return '#';
  }
}
function rowToProduct(row){
  const fallbackPt=`https://wa.me/5521964109840?text=${encodeURIComponent('Olá! Tenho interesse em '+row.name_pt+' do catálogo Alquimia do Bonsai. Pode me passar disponibilidade, valor e envio?')}`;
  const fallbackEn=`https://wa.me/17869780745?text=${encodeURIComponent('Hello! I am interested in '+(row.name_en||row.name_pt)+' from the Bonsai Alchemy catalog. Could you send availability, price, and shipping details?')}`;
  return {
    id:row.id,
    namePt:row.name_pt,
    nameEn:row.name_en||row.name_pt,
    species:row.species_pt||'—',
    speciesEn:row.species_en||row.species_pt||'—',
    category:row.category||'bonsai',
    market:row.locale||row.market||'pt',
    price:Number(row.price_brl||0),
    priceUsd:Number(row.price_usd||0),
    stock:Number(row.stock||0),
    height:row.height_pt||'—',
    heightEn:row.height_en||row.height_pt||'—',
    age:row.age_pt||'—',
    ageEn:row.age_en||row.age_pt||'—',
    style:row.style_pt||'—',
    styleEn:row.style_en||row.style_pt||'—',
    pot:row.pot_pt||'—',
    potEn:row.pot_en||row.pot_pt||'—',
    imageUrl:row.image_url||'',
    buyUrl:row.whatsapp_pt||fallbackPt,
    buyUrlEn:row.whatsapp_en||fallbackEn,
    emoji:'🌳',
    descPt:row.description_pt||'',
    descEn:row.description_en||row.description_pt||'',
    carePt:row.care_pt||'',
    careEn:row.care_en||row.care_pt||'',
    created:row.created_at||new Date().toISOString()
  };
}
function productToRow(p){
  return {
    active:true,
    locale:p.market||'pt',
    category:p.category||'bonsai',
    name_pt:p.namePt,
    name_en:p.nameEn||p.namePt,
    species_pt:p.species||null,
    species_en:p.speciesEn||p.species||null,
    description_pt:p.descPt||null,
    description_en:p.descEn||null,
    care_pt:p.carePt||null,
    care_en:p.careEn||null,
    price_brl:Number(p.price||0),
    price_usd:Number(p.priceUsd||0),
    stock:Number(p.stock||0),
    height_pt:p.height||null,
    height_en:p.heightEn||p.height||null,
    age_pt:p.age||null,
    age_en:p.ageEn||p.age||null,
    style_pt:p.style||null,
    style_en:p.styleEn||p.style||null,
    pot_pt:p.pot||null,
    pot_en:p.potEn||p.pot||null,
    image_url:p.imageUrl||null,
    whatsapp_pt:p.buyUrl||null,
    whatsapp_en:p.buyUrlEn||null
  };
}
function rowToVideo(row){
  return {
    id:row.id,
    titlePt:row.title_pt||'',
    titleEn:row.title_en||row.title_pt||'',
    descPt:row.description_pt||'',
    descEn:row.description_en||row.description_pt||'',
    url:row.youtube_url||'',
    locale:row.locale||'pt',
    sort:Number(row.sort_order||100),
    created:row.created_at||new Date().toISOString()
  };
}
function videoToRow(v){
  return {
    active:true,
    locale:v.locale||'pt',
    title_pt:v.titlePt||v.titleEn,
    title_en:v.titleEn||v.titlePt,
    description_pt:v.descPt||null,
    description_en:v.descEn||null,
    youtube_url:v.url,
    sort_order:Number(v.sort||100)
  };
}
const SITE_VERSION='real-catalog-work-copy-2026-07-22-market-catalog';
if(DB.get('siteVersion')!==SITE_VERSION){
  localStorage.removeItem('adb_products');
  localStorage.removeItem('adb_users');
  localStorage.removeItem('adb_cart');
  localStorage.removeItem('adb_wishlist');
  localStorage.removeItem('adb_orders');
  DB.set('siteVersion',SITE_VERSION);
}
function initDB(){
  const catalogWhats='5521964109840';
  const catalogImageByAge={
    'Bonsai 2 anos':'',
    'Bonsai 3 anos':'',
    'Bonsai 4 anos':'',
    'Bonsai 5 anos':'',
    'Bonsai 6 anos':'',
    'Bonsai 7 anos':'',
    'Bonsai 10 anos':'',
    'Bonsai 12 anos':'',
    'Bonsai 15 anos':'',
    'Bonsai 16 anos':'',
    'Pré bonsai':''
  };
  const brl=v=>v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const speciesEn={
    'Cerejeira':'Cherry blossom',
    'Serissa Chinesa':'Chinese Serissa',
    'Serissa Variagata':'Variegated Serissa',
    'Amora':'Blackberry',
    'Piracanta':'Firethorn',
    'Buxinho':'Boxwood',
    'Oliveira':'Olive tree',
    'Caliandra':'Calliandra',
    'Caliandra Vermelha':'Red Calliandra',
    'Caliandra Rosa':'Pink Calliandra'
  };
  const ageEn=age=>age.replace('Bonsai 2 anos','2-year bonsai').replace('Bonsai 3 anos','3-year bonsai').replace('Bonsai 4 anos','4-year bonsai').replace('Bonsai 5 anos','5-year bonsai').replace('Bonsai 6 anos','6-year bonsai').replace('Bonsai 7 anos','7-year bonsai').replace('Bonsai 10 anos','10-year bonsai').replace('Bonsai 12 anos','12-year bonsai').replace('Bonsai 15 anos','15-year bonsai').replace('Bonsai 16 anos','16-year bonsai').replace('Pré bonsai','Pre-bonsai');
  const catalogProduct=(id,name,age,price,category='bonsai')=>({
    id,namePt:`${name} - ${age}`,nameEn:`${speciesEn[name]||name} - ${ageEn(age)}`,species:name,speciesEn:speciesEn[name]||name,category,price,stock:1,height:'Sob consulta',heightEn:'Ask for details',age,ageEn:ageEn(age),style:category==='prebonsai'?'Pré-bonsai':'Bonsai',styleEn:category==='prebonsai'?'Pre-bonsai':'Bonsai',pot:'Conforme disponibilidade',potEn:'Subject to availability',emoji:'🌳',
    imageUrl:catalogImageByAge[age]||'',
    buyUrl:`https://wa.me/${catalogWhats}?text=${encodeURIComponent('Olá! Tenho interesse em '+name+' ('+age+') do catálogo Alquimia do Bonsai.')}`,
    buyUrlEn:`https://wa.me/17869780745?text=${encodeURIComponent('Hello! I am interested in '+(speciesEn[name]||name)+' ('+ageEn(age)+') from the Bonsai Alchemy catalog.')}`,
    descPt:`${name} disponível no catálogo Alquimia do Bonsai. Valor: ${brl(price)}. Confirme foto atual e disponibilidade pelo WhatsApp.`,
    descEn:`${speciesEn[name]||name} available in the Bonsai Alchemy catalog. Price: ${brl(price)}. Confirm current photo and availability through WhatsApp.`,
    carePt:'Produto vivo. Valores, envio e disponibilidade podem variar conforme a peça.',
    careEn:'Living product. Pricing, shipping and availability may vary by piece.',
    created:new Date().toISOString()
  });
  const catalogInquiry=(namePt,nameEn)=>({
    buyUrl:`https://wa.me/${catalogWhats}?text=${encodeURIComponent('Olá! Tenho interesse em '+namePt+' do catálogo Alquimia do Bonsai. Pode me passar disponibilidade, valor e envio?')}`,
    buyUrlEn:`https://wa.me/17869780745?text=${encodeURIComponent('Hello! I am interested in '+nameEn+' from the Bonsai Alchemy catalog. Could you send availability, price, and shipping details?')}`
  });
  const realProduct=(id,item,namePt,nameEn,img,category='bonsai',price=0,ageLabel='Peça selecionada',ageLabelEn='Selected piece',market='pt',priceUsd=0)=>{
    const lote=item<=10?'Lote 1':'Lote 2';
    const labelPt=namePt||`Bonsai ${lote} · Item ${String(item).padStart(2,'0')}`;
    const labelEn=nameEn||`Bonsai ${lote} · Item ${String(item).padStart(2,'0')}`;
    return {
      id,namePt:labelPt,nameEn:labelEn,species:namePt||'Bonsai',speciesEn:nameEn||'Bonsai',category,market,price,priceUsd,stock:1,height:'Sob consulta',heightEn:'Ask for details',age:ageLabel,ageEn:ageLabelEn,style:category==='prebonsai'?'Pré-bonsai':'Peça única',styleEn:category==='prebonsai'?'Pre-bonsai':'One-of-a-kind piece',pot:'Conforme foto',potEn:'As pictured',emoji:'🌳',imageUrl:img,
      ...catalogInquiry(labelPt,labelEn),
      descPt:`Peça real do catálogo Alquimia do Bonsai: ${labelPt}. Consulte disponibilidade, valor atualizado e envio pelo WhatsApp.`,
      descEn:`Real catalog piece from Bonsai Alchemy: ${labelEn}. Check availability, current price, and shipping through WhatsApp.`,
      carePt:'Produto vivo. Envio, valor e disponibilidade são confirmados pelo WhatsApp.',
      careEn:'Living product. Shipping, price, and availability are confirmed through WhatsApp.',
      created:new Date().toISOString()
    };
  };
  const catalogProducts=[
    realProduct('real-01',1,'Procumbens Bonsai','Procumbens Bonsai','assets/catalogo-real-01.jpg','bonsai',149,'Bonsai 2 anos','2-year bonsai'),
    realProduct('real-02',2,'Procumbens Bonsai','Procumbens Bonsai','assets/catalogo-real-02.jpg','bonsai',239,'Bonsai 3 anos','3-year bonsai'),
    realProduct('real-03',3,'Serissa Chinesa Bonsai','Chinese Serissa Bonsai','assets/catalogo-real-03.jpg','bonsai',259,'Bonsai 4 anos','4-year bonsai'),
    realProduct('real-04',4,'Serissa Variagata Bonsai','Variegated Serissa Bonsai','assets/catalogo-real-04.jpg','bonsai',259,'Bonsai 4 anos','4-year bonsai'),
    realProduct('real-05',5,'Buxinho Bonsai','Boxwood Bonsai','assets/catalogo-real-05.jpg','bonsai',289,'Bonsai 5 anos','5-year bonsai'),
    realProduct('real-06',6,'Procumbens Bonsai','Procumbens Bonsai','assets/catalogo-real-06.jpg','bonsai',329,'Bonsai 6 anos','6-year bonsai'),
    realProduct('real-07',7,'Oliveira Bonsai','Olive Tree Bonsai','assets/catalogo-real-07.jpg','bonsai',389,'Bonsai 7 anos','7-year bonsai'),
    realProduct('real-08',8,'Cerejeira Bonsai','Cherry Blossom Bonsai','assets/catalogo-real-08.jpg','bonsai',289,'Bonsai 5 anos','5-year bonsai'),
    realProduct('real-09',9,'Procumbens Bonsai','Procumbens Bonsai','assets/catalogo-real-09.jpg','bonsai',429,'Bonsai 10 anos','10-year bonsai'),
    realProduct('real-10',10,'Caliandra Bonsai','Calliandra Bonsai','assets/catalogo-real-10.jpg','bonsai',389,'Bonsai 7 anos','7-year bonsai'),
    realProduct('real-11',11,'Jabuticabeira Bonsai','Jabuticaba Bonsai','assets/catalogo-real-11-jabuticabeira.jpg'),
    realProduct('real-12',12,'Pinheiro Negro Bonsai','Black Pine Bonsai','assets/catalogo-real-12-pinheiro-negro.jpg'),
    realProduct('real-13',13,'Ficus Bonsai','Ficus Bonsai','assets/catalogo-real-13-ficus.jpg','bonsai',629,'Bonsai 15 anos','15-year bonsai'),
    realProduct('real-14',14,'Primavera Bonsai','Bougainvillea Bonsai','assets/catalogo-real-14-primavera.jpg','bonsai',629,'Bonsai 15 anos','15-year bonsai'),
    realProduct('real-15',15,'Serissa Chinesa Bonsai','Chinese Serissa Bonsai','assets/catalogo-real-15-serissa.jpg','bonsai',389,'Bonsai 7 anos','7-year bonsai'),
    realProduct('real-16',16,'Azaleia Bonsai','Azalea Bonsai','assets/catalogo-real-16-azaleia.jpg'),
    realProduct('real-17',17,'Pitangueira Bonsai','Brazilian Cherry Bonsai','assets/catalogo-real-17-pitangueira.jpg'),
    realProduct('real-18',18,'Romãzeira Bonsai','Pomegranate Bonsai','assets/catalogo-real-18-roma.jpg'),
    realProduct('real-19',19,'Pau-brasil Pré-Bonsai','Brazilwood Pre-Bonsai','assets/catalogo-real-19-pau-brasil-pre.jpg','prebonsai'),
    realProduct('real-20',20,'Ipê Amarelo Pré-Bonsai','Yellow Ipe Pre-Bonsai','assets/catalogo-real-20-ipe-amarelo-pre.jpg','prebonsai')
  ];
  const seedProducts=[...catalogProducts];
  const currentProducts=DB.get('products');
  if(!currentProducts) DB.set('products',seedProducts);
  else{
    const badCatalogIds=['p7','p8','p9','p10','p11'];
    const merged=currentProducts.filter(p=>!badCatalogIds.includes(p.id));
    seedProducts.forEach(seed=>{
      const i=merged.findIndex(p=>p.id===seed.id);
      if(i<0) merged.push(seed);
      else merged[i]={...merged[i],...seed,created:merged[i].created||seed.created};
    });
    DB.set('products',merged);
  }
  if(!DB.get('siteContent')) DB.set('siteContent',{taglinePt:'Transformando árvores. Inspirando vidas.',taglineEn:'Transforming trees. Inspiring lives.',waBr:'5521964109840',waUsa:'17869780745',igBr:'alquimiadobonsai',igUsa:'bonsaialchemy',aboutPt:'Somos Alexandre Braga e Luane Salles.',aboutEn:'We are Alexandre Braga and Luane Salles.'});
}
initDB();
let currentLang='en';
function setLang(l){
  currentLang=l;
  document.body.className=document.body.className.replace(/lang-\w+/,'')+' lang-'+l;
  document.documentElement.lang=l==='en'?'en':'pt';
  document.title=l==='en'?'Bonsai Alchemy':'Alquimia do Bonsai';
  document.querySelectorAll('#lang-toggle button').forEach((b,i)=>b.classList.toggle('active',(i===0&&l==='pt')||(i===1&&l==='en')));
  renderHomeProducts();
  renderHomeVideos();
  if(currentPage==='shop')renderShop();
}
let currentPage='home';
function closeMobileNav(){document.getElementById('topbar')?.classList.remove('nav-open');}
function toggleMobileNav(){document.getElementById('topbar')?.classList.toggle('nav-open');}
const SEO={
  '/':{
    title:'Bonsai Alchemy | Alquimia do Bonsai',
    description:'Live bonsai catalog, bonsai education, courses, and the book Take Care of Your Soul / Cuide da Sua Alma.'
  },
  '/shop':{
    title:'Live Bonsai Catalog | Bonsai Alchemy',
    description:'Real bonsai and pre-bonsai pieces with photos, prices, descriptions, and direct purchase inquiries.'
  },
  '/book':{
    title:'Take Care of Your Soul | Bonsai Lessons',
    description:'The book Take Care of Your Soul / Cuide da Sua Alma and the 7 Transformations Method inspired by bonsai.'
  },
  '/courses':{
    title:'Bonsai Courses and School | Bonsai Alchemy',
    description:'Bonsai courses, mentoring, workshops, care guides, and educational content.'
  },
  '/videos':{
    title:'Bonsai Care Videos | Bonsai Alchemy',
    description:'Short bonsai care videos about pruning, watering, repotting, and daily maintenance.'
  },
  '/about':{
    title:'About Bonsai Alchemy | Alquimia do Bonsai',
    description:'The story of Luane Salles and Alexandre Braga, connecting bonsai, education, transformation, and nature.'
  },
  '/contact':{
    title:'Contact | Bonsai Alchemy',
    description:'Contact Bonsai Alchemy / Alquimia do Bonsai through WhatsApp, Instagram, Facebook, and official channels.'
  },
  '/admin':{
    title:'Admin Area | Bonsai Alchemy',
    description:'Restricted administrative area for Bonsai Alchemy catalog and YouTube video management.'
  }
};
function updateSeo(path){
  const normalized=path.replace(/\/$/,'')||'/';
  const data=SEO[normalized]||SEO['/'];
  document.title=data.title;
  const description=document.querySelector('meta[name="description"]');
  if(description)description.setAttribute('content',data.description);
  const canonical=document.querySelector('link[rel="canonical"]');
  if(canonical)canonical.setAttribute('href','https://www.alquimiadobonsai.com'+normalized);
  const ogUrl=document.querySelector('meta[property="og:url"]');
  if(ogUrl)ogUrl.setAttribute('content','https://www.alquimiadobonsai.com'+normalized);
  const ogTitle=document.querySelector('meta[property="og:title"]');
  if(ogTitle)ogTitle.setAttribute('content',data.title);
  const ogDesc=document.querySelector('meta[property="og:description"]');
  if(ogDesc)ogDesc.setAttribute('content',data.description);
  const twitterTitle=document.querySelector('meta[name="twitter:title"]');
  if(twitterTitle)twitterTitle.setAttribute('content',data.title);
  const twitterDesc=document.querySelector('meta[name="twitter:description"]');
  if(twitterDesc)twitterDesc.setAttribute('content',data.description);
}
function syncRoute(page,section){
  const routes={home:'/',shop:'/shop',book:'/book',courses:'/courses',videos:'/videos',about:'/about',contact:'/contact'};
  const next=page==='shop'?routes.shop:(routes[section]||routes.home);
  if(window.location.pathname!==next)history.pushState({page,section},'',next);
  updateSeo(next);
}
function showPage(p){
  closeMobileNav();
  document.querySelectorAll('.page').forEach(el=>el.classList.remove('active'));
  const el=document.getElementById('page-'+p);if(el){el.classList.add('active');window.scrollTo(0,0);}
  currentPage=p;
  if(p==='shop')syncRoute('shop');
  if(p==='shop')renderShop();
  if(p==='admin')renderAdmin();
  if(p==='home'){renderHomeProducts();renderHomeVideos();}
}
function doScroll(sel){setTimeout(()=>{const el=document.querySelector(sel);if(el)el.scrollIntoView({behavior:'smooth'});},100);}
function routeKeyFromSection(sel){
  return {'#book-section':'book','#learn-section':'courses','#youtube-section':'videos','#about-section':'about','#contact-section':'contact','#hero':'home'}[sel]||'home';
}
function navigateHome(sel){showPage('home');syncRoute('home',routeKeyFromSection(sel||'#hero'));doScroll(sel||'#hero');}
function applyInitialRoute(){
  const path=window.location.pathname.replace(/\/$/,'')||'/';
  const routeMap={
    '/shop':()=>showPage('shop'),
    '/catalog':()=>showPage('shop'),
    '/catalogo':()=>showPage('shop'),
    '/book':()=>navigateHome('#book-section'),
    '/livro':()=>navigateHome('#book-section'),
    '/courses':()=>navigateHome('#learn-section'),
    '/cursos':()=>navigateHome('#learn-section'),
    '/videos':()=>navigateHome('#youtube-section'),
    '/about':()=>navigateHome('#about-section'),
    '/sobre':()=>navigateHome('#about-section'),
    '/contact':()=>navigateHome('#contact-section'),
    '/contato':()=>navigateHome('#contact-section'),
    '/admin':()=>openAdminLogin()
  };
  if(routeMap[path])routeMap[path]();
  else if(window.location.hash)navigateHome(window.location.hash);
  else updateSeo('/');
}
window.addEventListener('popstate',applyInitialRoute);
let toastT;
function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('show'),3000);}
function openModal(id){document.getElementById(id).classList.remove('hidden');}
function closeModal(id){document.getElementById(id).classList.add('hidden');}
document.querySelectorAll('.modal-overlay').forEach(ov=>ov.addEventListener('click',e=>{if(e.target===ov)ov.classList.add('hidden');}));
let currentUser=null;
try{currentUser=JSON.parse(sessionStorage.getItem('adb_session'));}catch{}
function handleAccount(){openAdminLogin();}
function openAdminLogin(){if(currentUser&&currentUser.role==='admin'){showPage('admin');return;}showAuthPanel('login');openModal('modal-auth');}
function showAuthPanel(){document.getElementById('auth-login').classList.remove('hidden');}
async function doLogin(){
  const email=document.getElementById('login-email').value.trim(),pass=document.getElementById('login-pass').value;
  const err=document.getElementById('login-error');
  if(supabaseClient&&email&&pass){
    const {data,error}=await supabaseClient.auth.signInWithPassword({email,password:pass});
    if(!error&&data.user){
      const {data:profile}=await supabaseClient.from('admin_profiles').select('role,email').eq('user_id',data.user.id).maybeSingle();
      if(profile&&profile.role==='admin'){
        currentUser={id:data.user.id,name:data.user.user_metadata?.name||profile.email||email,email:profile.email||email,role:'admin',created:data.user.created_at,address:{}};
        sessionStorage.setItem('adb_session',JSON.stringify(currentUser));
        err.classList.add('hidden');closeModal('modal-auth');toast('Painel administrativo liberado.');showPage('admin');return;
      }
      await supabaseClient.auth.signOut();
    }
  }
  err.textContent='Acesso permitido apenas para administradores cadastrados no Supabase.';
  err.classList.remove('hidden');
}
async function logout(){if(supabaseClient)await supabaseClient.auth.signOut();currentUser=null;sessionStorage.removeItem('adb_session');showPage('home');toast('Até logo! 🌳');}
function getProducts(){return remoteProducts||DB.get('products')||[];}
const SHOP_CATEGORIES=['bonsai','prebonsai','produto'];
function productVisibleForLang(p){
  const market=p.market||'pt';
  return market==='both'||market===currentLang;
}
function getShopProducts(){return getProducts().filter(p=>SHOP_CATEGORIES.includes(p.category)&&productVisibleForLang(p));}
function getVideos(){return remoteVideos||DB.get('youtubeVideos')||[];}
function videoVisibleForLang(v){const locale=v.locale||'pt';return locale==='both'||locale===currentLang;}
function youtubeId(url){
  const safe=safeYoutubeUrl(url);
  if(safe==='#')return '';
  try{
    const parsed=new URL(safe);
    const host=parsed.hostname.replace(/^www\./,'').replace(/^m\./,'');
    if(host==='youtu.be')return parsed.pathname.split('/').filter(Boolean)[0]||'';
    if(host==='youtube.com'||host==='youtube-nocookie.com'){
      const watchId=parsed.searchParams.get('v');
      if(watchId)return watchId;
      const parts=parsed.pathname.split('/').filter(Boolean);
      const markerIndex=parts.findIndex(part=>['shorts','embed','live'].includes(part));
      if(markerIndex>=0&&parts[markerIndex+1])return parts[markerIndex+1];
    }
  }catch{}
  const fallback=String(url||'').match(/([A-Za-z0-9_-]{11})(?:[?&#/\s]|$)/);
  return fallback?fallback[1]:'';
}
function youtubeThumb(url){const id=youtubeId(url);return id?`https://img.youtube.com/vi/${id}/hqdefault.jpg`:'';}
function videoCard(v){
  const thumb=youtubeThumb(v.url);
  const titlePt=escapeHTML(v.titlePt||v.titleEn||'Vídeo no YouTube');
  const titleEn=escapeHTML(v.titleEn||v.titlePt||'YouTube video');
  const descPt=escapeHTML(v.descPt||'Assista no canal Alquimia do Bonsai.');
  const descEn=escapeHTML(v.descEn||v.descPt||'Watch on the Bonsai Alchemy channel.');
  const href=safeYoutubeUrl(v.url);
  return `<a class="video-card" href="${href}" target="_blank" rel="noopener">
    <div class="video-thumb">${thumb?`<img src="${safeImageUrl(thumb)}" alt="${titlePt}" loading="lazy" decoding="async"/>`:''}<span class="video-play">▶</span></div>
    <div class="video-body">
      <h3><span data-pt>${titlePt}</span><span data-en>${titleEn}</span></h3>
      <p><span data-pt>${descPt}</span><span data-en>${descEn}</span></p>
      <span class="btn btn-gold btn-sm"><span data-pt>Assistir</span><span data-en>Watch</span></span>
    </div>
  </a>`;
}
function renderHomeVideos(){
  const g=document.getElementById('youtube-video-grid');
  const e=document.getElementById('youtube-empty');
  if(!g)return;
  const videos=getVideos().filter(videoVisibleForLang).sort((a,b)=>(a.sort||100)-(b.sort||100));
  g.innerHTML=videos.map(videoCard).join('');
  if(e)e.classList.toggle('hidden',videos.length>0);
}
function productImage(p){
  const img=safeImageUrl(p.imageUrl);
  return img?`<div class="product-img-placeholder has-image"><img src="${img}" alt="${escapeHTML(p.namePt||p.nameEn||'Bonsai')}" loading="lazy" decoding="async"/></div>`:`<div class="product-img-placeholder">${escapeHTML(p.emoji||'🌳')}</div>`;
}
function productDetailImage(p){
  const img=safeImageUrl(p.imageUrl);
  return img?`<div class="product-detail-img has-image"><img src="${img}" alt="${escapeHTML(p.namePt||p.nameEn||'Bonsai')}" loading="lazy" decoding="async"/></div>`:`<div class="product-detail-img">${escapeHTML(p.emoji||'🌳')}</div>`;
}
function moneyLabel(p){
  const value=Number(p.price||0).toLocaleString(p.currency==='USD'?'en-US':'pt-BR',{minimumFractionDigits:2});
  return p.currency==='USD'?'US$ '+value:'R$ '+value;
}
function brlLabel(value){return 'R$ '+Number(value||0).toLocaleString('pt-BR',{minimumFractionDigits:2});}
function usdLabel(value){return 'US$ '+Number(value||0).toLocaleString('en-US',{minimumFractionDigits:2});}
function productPriceLabels(p){
  if(p.category==='material') return {pt:'Pedir no WhatsApp',en:'Request on WhatsApp'};
  if(p.category==='curso') return {pt:'Valor sob consulta',en:'Ask for price'};
  const ptPrice=Number(p.price||0);
  const enPrice=Number(p.priceUsd||0);
  return {
    pt:ptPrice>0?brlLabel(ptPrice):'Sob consulta',
    en:enPrice>0?usdLabel(enPrice):(ptPrice>0&&p.market==='both'?'Ask current US price':'Ask for price')
  };
}
function productPriceHtml(p,cls='product-price-card'){
  const label=productPriceLabels(p);
  return `<div class="${escapeHTML(cls)}"><span data-pt>${escapeHTML(label.pt)}</span><span data-en>${escapeHTML(label.en)}</span></div>`;
}
function productSpeciesHtml(p,cls='product-species'){
  const pt=p.species&&p.species!=='—'?p.species:p.category;
  const en=p.speciesEn||pt;
  return `<p class="${escapeHTML(cls)}"><span data-pt>${escapeHTML(pt)}</span><span data-en>${escapeHTML(en)}</span></p>`;
}
function productAccessAction(p,small=true){
  const btnClass=small?'btn btn-gold btn-sm':'btn btn-gold';
  const label=small?'<span data-pt>Consultar</span><span data-en>Ask</span>':'<span data-pt>Consultar no WhatsApp</span><span data-en>Ask on WhatsApp</span> →';
  const ptUrl=safeUrl(p.buyUrl||productWhatsappPt(p));
  const enUrl=safeUrl(p.buyUrlEn||productWhatsappEn(p));
  if(enUrl&&enUrl!==ptUrl){
    return `<a class="${btnClass}" data-pt href="${ptUrl}" target="_blank" onclick="event.stopPropagation()">${small?'Consultar':'Consultar no WhatsApp →'}</a><a class="${btnClass}" data-en href="${enUrl}" target="_blank" onclick="event.stopPropagation()">${small?'Ask':'Ask on WhatsApp →'}</a>`;
  }
  return `<a class="${btnClass}" href="${ptUrl}" target="_blank" onclick="event.stopPropagation()">${label}</a>`;
}
function productCard(p){
  const price=productPriceHtml(p);
  const mainAction=productAccessAction(p,true);
  const descPt=escapeHTML((p.descPt||'').substring(0,90));
  const descEn=escapeHTML((p.descEn||p.descPt||'').substring(0,90));
  return`<div class="product-card" data-id="${escapeHTML(p.id)}" data-cat="${escapeHTML(p.category)}">
    ${productImage(p)}
    ${productSpeciesHtml(p)}
    <h3 class="product-name-card"><span data-pt>${escapeHTML(p.namePt)}</span><span data-en>${escapeHTML(p.nameEn||p.namePt)}</span></h3>
    <p class="product-desc-card"><span data-pt>${descPt}${descPt?'...':''}</span><span data-en>${descEn}${descEn?'...':''}</span></p>
    ${price}
    <div class="product-card-btns">
      <button class="btn btn-ghost btn-sm" onclick="openProductDetail('${escapeHTML(p.id)}')"><span data-pt>Detalhes</span><span data-en>Details</span></button>
      ${mainAction}
    </div>
  </div>`;
}
function renderHomeProducts(){const g=document.getElementById('home-products-grid');if(g)g.innerHTML=getShopProducts().slice(0,6).map(productCard).join('');}
renderHomeProducts();
renderHomeVideos();
async function loadRemoteCatalog(){
  if(!supabaseClient)return false;
  const {data,error}=await supabaseClient.from('catalog_items').select('*').order('sort_order',{ascending:true}).order('created_at',{ascending:false});
  if(error){console.warn('Catalogo Supabase indisponivel:',error.message);return false;}
  remoteProducts=(data||[]).map(rowToProduct);
  renderHomeProducts();
  if(currentPage==='shop')renderShop();
  if(currentUser&&currentUser.role==='admin'){renderAdminProducts();renderDashboard();}
  return true;
}
async function loadRemoteVideos(){
  if(!supabaseClient)return false;
  const {data,error}=await supabaseClient.from('youtube_videos').select('*').order('sort_order',{ascending:true}).order('created_at',{ascending:false});
  if(error){console.warn('Videos Supabase indisponiveis:',error.message);return false;}
  remoteVideos=(data||[]).map(rowToVideo);
  renderHomeVideos();
  if(currentUser&&currentUser.role==='admin'){renderAdminVideos();renderDashboard();}
  return true;
}
let curFilter='all';
function renderShop(f){if(f)curFilter=f;const base=getShopProducts();const prods=base.filter(p=>curFilter==='all'||p.category===curFilter);const g=document.getElementById('shop-products-grid');const e=document.getElementById('shop-empty');if(!g)return;if(prods.length===0){g.innerHTML='';e.classList.remove('hidden');}else{e.classList.add('hidden');g.innerHTML=prods.map(productCard).join('');}}
function filterShop(cat,btn){document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));if(btn)btn.classList.add('active');renderShop(cat);}
function openProductDetail(id){
  const p=getShopProducts().find(x=>x.id===id);if(!p)return;
  const price=productPriceHtml(p,'product-detail-price');
  const descPt=escapeHTML(p.descPt||'');
  const descEn=escapeHTML(p.descEn||p.descPt||'');
  document.getElementById('product-detail-content').innerHTML=`
    ${productDetailImage(p)}
    <div class="product-detail-info">
      ${productSpeciesHtml(p,'product-detail-species')}
      <h2><span data-pt>${escapeHTML(p.namePt)}</span><span data-en>${escapeHTML(p.nameEn||p.namePt)}</span></h2>
      ${price}
      <p style="font-size:.85rem;color:var(--muted);margin-bottom:1.2rem;"><span data-pt>${descPt}</span><span data-en>${descEn}</span></p>
      <div>
        ${p.height!=='—'?`<div class="spec-row"><span class="spec-label"><span data-pt>Altura</span><span data-en>Height</span></span><span class="spec-value"><span data-pt>${escapeHTML(p.height)}</span><span data-en>${escapeHTML(p.heightEn||p.height)}</span></span></div>`:''}
        ${p.age!=='—'?`<div class="spec-row"><span class="spec-label"><span data-pt>Idade</span><span data-en>Age</span></span><span class="spec-value"><span data-pt>${escapeHTML(p.age)}</span><span data-en>${escapeHTML(p.ageEn||p.age)}</span></span></div>`:''}
        ${p.style!=='—'?`<div class="spec-row"><span class="spec-label"><span data-pt>Estilo</span><span data-en>Style</span></span><span class="spec-value"><span data-pt>${escapeHTML(p.style)}</span><span data-en>${escapeHTML(p.styleEn||p.style)}</span></span></div>`:''}
        ${p.pot!=='—'?`<div class="spec-row"><span class="spec-label"><span data-pt>Vaso</span><span data-en>Pot</span></span><span class="spec-value"><span data-pt>${escapeHTML(p.pot)}</span><span data-en>${escapeHTML(p.potEn||p.pot)}</span></span></div>`:''}
        ${p.stock?`<div class="spec-row"><span class="spec-label"><span data-pt>Disponível</span><span data-en>Available</span></span><span class="spec-value" style="color:var(--success)">${escapeHTML(p.stock)} <span data-pt>un.</span><span data-en>pc.</span></span></div>`:''}
        ${p.carePt&&p.carePt!=='—'?`<div class="spec-row"><span class="spec-label"><span data-pt>Cuidados</span><span data-en>Care</span></span><span class="spec-value"><span data-pt>${escapeHTML(p.carePt)}</span><span data-en>${escapeHTML(p.careEn||p.carePt)}</span></span></div>`:''}
      </div>
      <div class="product-detail-btns">
        ${productAccessAction(p,false)}
      </div>
    </div>`;
  openModal('modal-product');
}
function addToCart(){toast(currentLang==='en'?'Please use WhatsApp to check availability.':'Consulte disponibilidade pelo WhatsApp.');}
function removeFromCart(){}
function changeQty(){}
function renderCart(){}
function finalizarPedido(){showPage('shop');}
function toggleWish(){toast(currentLang==='en'?'Favorites are not used on this site.':'Favoritos não são usados neste site.');}
function renderWishlist(){}
function updateBadges(){}
function renderProfile(){showPage(currentUser&&currentUser.role==='admin'?'admin':'home');}
function showProfileTab(){}
function saveAddress(){}
function saveSettings(){}
function renderAdmin(){
  if(!currentUser||currentUser.role!=='admin'){showPage('home');return;}
  renderDashboard();renderAdminProducts();renderAdminVideos();loadSiteContent();
}
function showAdminTab(tab,btn){
  document.querySelectorAll('.admin-tab').forEach(t=>t.classList.remove('active'));
  document.getElementById('atab-'+tab).classList.add('active');
  document.querySelectorAll('.admin-nav button').forEach(b=>b.classList.remove('active'));
  if(btn)btn.classList.add('active');
}
function renderDashboard(){
  const prods=getProducts();
  const vids=getVideos();
  document.getElementById('dash-products').textContent=prods.length;
  document.getElementById('dash-orders').textContent='WhatsApp';
  document.getElementById('dash-users').textContent='Supabase';
  document.getElementById('dash-revenue').textContent=vids.length;
  document.getElementById('dash-recent-orders').innerHTML='<p style="color:var(--muted);font-size:.82rem;">As vendas fecham pelo WhatsApp. Use este painel para manter fotos, valores, descrições, links do catálogo e vídeos do YouTube atualizados.</p>';
}
let apf='';
function filterAdminProducts(v){apf=v.toLowerCase();renderAdminProducts();}
function renderAdminProducts(){
  const prods=getProducts().filter(p=>!apf||p.namePt.toLowerCase().includes(apf)||(p.nameEn||'').toLowerCase().includes(apf)||p.species.toLowerCase().includes(apf));
  const t=document.getElementById('admin-products-table');if(!t)return;
  t.innerHTML=prods.map(p=>`<tr><td>${escapeHTML(p.emoji||'🌳')} ${escapeHTML(p.namePt||p.nameEn)}</td><td style="color:var(--muted);font-style:italic">${escapeHTML(p.species)}</td><td><span class="tag">${escapeHTML(p.category)}</span> <span class="tag">${p.market==='en'?'EUA/EN':p.market==='both'?'PT+EN':'BR/PT'}</span></td><td style="color:var(--gold)">${p.market==='en'?usdLabel(p.priceUsd):brlLabel(p.price)}${p.market==='both'&&p.priceUsd?` / ${usdLabel(p.priceUsd)}`:''}</td><td>${escapeHTML(p.stock)}</td><td><div class="table-actions"><button class="btn btn-ghost btn-sm" onclick="openProductModal('${escapeHTML(p.id)}')">✏️</button><button class="btn btn-danger btn-sm" onclick="deleteProduct('${escapeHTML(p.id)}')">🗑️</button></div></td></tr>`).join('');
}
let avf='';
function filterAdminVideos(v){avf=v.toLowerCase();renderAdminVideos();}
function renderAdminVideos(){
  const videos=getVideos().filter(v=>!avf||(v.titlePt||'').toLowerCase().includes(avf)||(v.titleEn||'').toLowerCase().includes(avf)||(v.url||'').toLowerCase().includes(avf));
  const t=document.getElementById('admin-videos-table');if(!t)return;
  t.innerHTML=videos.length?videos.map(v=>`<tr><td>${escapeHTML(v.titlePt||v.titleEn)}</td><td><span class="tag">${v.locale==='en'?'EN':v.locale==='both'?'PT+EN':'PT'}</span></td><td><div class="admin-video-url">${escapeHTML(v.url)}</div></td><td>${escapeHTML(v.sort||100)}</td><td><div class="table-actions"><button class="btn btn-ghost btn-sm" onclick="openVideoModal('${escapeHTML(v.id)}')">✏️</button><button class="btn btn-danger btn-sm" onclick="deleteVideo('${escapeHTML(v.id)}')">🗑️</button></div></td></tr>`).join(''):'<tr><td colspan="5" style="color:var(--muted);padding:1.2rem;">Nenhum vídeo cadastrado ainda.</td></tr>';
}
function openVideoModal(id){
  document.getElementById('video-edit-title').textContent=id?'Editar vídeo':'Adicionar vídeo';
  document.getElementById('edit-video-id').value=id||'';
  ['title-pt','title-en','url','desc-pt','desc-en'].forEach(f=>{document.getElementById('ev-'+f).value='';});
  document.getElementById('ev-locale').value='pt';
  document.getElementById('ev-sort').value='100';
  if(id){
    const v=getVideos().find(x=>x.id===id);
    if(v){
      document.getElementById('ev-title-pt').value=v.titlePt||'';
      document.getElementById('ev-title-en').value=v.titleEn||'';
      document.getElementById('ev-locale').value=v.locale||'pt';
      document.getElementById('ev-sort').value=v.sort||100;
      document.getElementById('ev-url').value=v.url||'';
      document.getElementById('ev-desc-pt').value=v.descPt||'';
      document.getElementById('ev-desc-en').value=v.descEn||'';
    }
  }
  openModal('modal-video-edit');
}
async function saveVideo(){
  const id=document.getElementById('edit-video-id').value;
  const videos=getVideos();
  const videoUrl=safeYoutubeUrl(document.getElementById('ev-url').value.trim());
  const v={
    id:id||'v'+Date.now(),
    titlePt:document.getElementById('ev-title-pt').value.trim(),
    titleEn:document.getElementById('ev-title-en').value.trim(),
    locale:document.getElementById('ev-locale').value,
    sort:parseInt(document.getElementById('ev-sort').value)||100,
    url:videoUrl,
    descPt:document.getElementById('ev-desc-pt').value.trim(),
    descEn:document.getElementById('ev-desc-en').value.trim(),
    created:id?(videos.find(x=>x.id===id)||{}).created||new Date().toISOString():new Date().toISOString()
  };
  if(v.url==='#'){toast('Cole um link válido do YouTube.');return;}
  if((v.locale==='pt'||v.locale==='both')&&!v.titlePt){toast('Título PT é obrigatório.');return;}
  if((v.locale==='en'||v.locale==='both')&&!v.titleEn){toast('Título EN é obrigatório.');return;}
  if(currentUser&&currentUser.role==='admin'&&supabaseClient){
    const payload=videoToRow(v);
    let result;
    if(id&&/^[0-9a-f-]{36}$/i.test(id)) result=await supabaseClient.from('youtube_videos').update(payload).eq('id',id);
    else result=await supabaseClient.from('youtube_videos').insert(payload);
    if(result.error){toast('Erro ao salvar vídeo: '+result.error.message);return;}
    closeModal('modal-video-edit');await loadRemoteVideos();toast(id?'Vídeo atualizado! ✅':'Vídeo adicionado! ▶️');return;
  }
  if(id){const idx=videos.findIndex(x=>x.id===id);if(idx>=0)videos[idx]=v;else videos.unshift(v);}else videos.unshift(v);
  DB.set('youtubeVideos',videos);
  closeModal('modal-video-edit');renderHomeVideos();renderAdminVideos();renderDashboard();toast(id?'Vídeo atualizado! ✅':'Vídeo adicionado! ▶️');
}
async function deleteVideo(id){
  if(!confirm('Remover este vídeo?'))return;
  if(currentUser&&currentUser.role==='admin'&&supabaseClient&&/^[0-9a-f-]{36}$/i.test(id)){
    const {error}=await supabaseClient.from('youtube_videos').delete().eq('id',id);
    if(error){toast('Erro ao remover vídeo: '+error.message);return;}
    await loadRemoteVideos();toast('Vídeo removido.');return;
  }
  DB.set('youtubeVideos',getVideos().filter(v=>v.id!==id));
  renderHomeVideos();renderAdminVideos();renderDashboard();toast('Vídeo removido.');
}
function openProductModal(id){
  document.getElementById('product-edit-title').textContent=id?'Editar item':'Adicionar item';
  document.getElementById('edit-product-id').value=id||'';
  ['name-pt','name-en','species','price','price-usd','stock','height','age','style','pot','image','link','desc-pt','desc-en','care-pt','care-en'].forEach(f=>{const el=document.getElementById('ep-'+f);if(el)el.value='';});
  const file=document.getElementById('ep-file');if(file)file.value='';
  document.getElementById('ep-emoji').value='🌳';document.getElementById('ep-category').value='bonsai';document.getElementById('ep-market').value='pt';
  if(id){const p=getProducts().find(x=>x.id===id);if(p){document.getElementById('ep-name-pt').value=p.namePt||'';document.getElementById('ep-name-en').value=p.nameEn||'';document.getElementById('ep-species').value=p.species||'';document.getElementById('ep-category').value=p.category||'produto';document.getElementById('ep-market').value=p.market||'pt';document.getElementById('ep-price').value=p.price||0;document.getElementById('ep-price-usd').value=p.priceUsd||0;document.getElementById('ep-stock').value=p.stock||0;document.getElementById('ep-height').value=p.height||'';document.getElementById('ep-age').value=p.age||'';document.getElementById('ep-style').value=p.style||'';document.getElementById('ep-pot').value=p.pot||'';document.getElementById('ep-image').value=p.imageUrl||'';document.getElementById('ep-link').value=p.buyUrl||'';document.getElementById('ep-emoji').value=p.emoji||'🌳';document.getElementById('ep-desc-pt').value=p.descPt||'';document.getElementById('ep-desc-en').value=p.descEn||'';document.getElementById('ep-care-pt').value=p.carePt||'';document.getElementById('ep-care-en').value=p.careEn||'';}}
  openModal('modal-product-edit');
}
async function uploadCatalogImage(){
  const fileInput=document.getElementById('ep-file');
  const file=fileInput&&fileInput.files?fileInput.files[0]:null;
  if(!file||!supabaseClient)return safeImageUrl(document.getElementById('ep-image').value.trim());
  const safeName=file.name.toLowerCase().replace(/[^a-z0-9._-]+/g,'-');
  const path=`catalog/${Date.now()}-${safeName}`;
  const {error}=await supabaseClient.storage.from('catalog-images').upload(path,file,{cacheControl:'3600',upsert:false});
  if(error)throw error;
  const {data}=supabaseClient.storage.from('catalog-images').getPublicUrl(path);
  return data.publicUrl;
}
function productWhatsappPt(p){return `https://wa.me/5521964109840?text=${encodeURIComponent('Olá! Tenho interesse em '+p.namePt+' do catálogo Alquimia do Bonsai. Pode me passar disponibilidade, valor e envio?')}`;}
function productWhatsappEn(p){return `https://wa.me/17869780745?text=${encodeURIComponent('Hello! I am interested in '+(p.nameEn||p.namePt)+' from the Bonsai Alchemy catalog. Could you send availability, price, and shipping details?')}`;}
async function saveProduct(){
  const id=document.getElementById('edit-product-id').value;const prods=getProducts();
  let imageUrl;
  try{imageUrl=await uploadCatalogImage();}catch(error){toast('Erro ao enviar imagem: '+error.message);return;}
  const p={id:id||'p'+Date.now(),namePt:document.getElementById('ep-name-pt').value.trim(),nameEn:document.getElementById('ep-name-en').value.trim(),species:document.getElementById('ep-species').value||'—',category:document.getElementById('ep-category').value,market:document.getElementById('ep-market').value,price:parseFloat(document.getElementById('ep-price').value)||0,priceUsd:parseFloat(document.getElementById('ep-price-usd').value)||0,stock:parseInt(document.getElementById('ep-stock').value)||0,height:document.getElementById('ep-height').value||'—',age:document.getElementById('ep-age').value||'—',style:document.getElementById('ep-style').value||'—',pot:document.getElementById('ep-pot').value||'—',imageUrl,emoji:document.getElementById('ep-emoji').value||'🌳',descPt:document.getElementById('ep-desc-pt').value,descEn:document.getElementById('ep-desc-en').value,carePt:document.getElementById('ep-care-pt').value,careEn:document.getElementById('ep-care-en').value,created:id?(prods.find(x=>x.id===id)||{}).created||new Date().toISOString():new Date().toISOString()};
  p.buyUrl=safeUrl(document.getElementById('ep-link').value.trim()||productWhatsappPt(p));
  p.buyUrlEn=productWhatsappEn(p);
  if((p.market==='pt'||p.market==='both')&&!p.namePt){toast('Nome PT é obrigatório para itens do Brasil.');return;}
  if((p.market==='en'||p.market==='both')&&!p.nameEn){toast('Nome EN é obrigatório para itens dos EUA.');return;}
  if(currentUser&&currentUser.role==='admin'&&supabaseClient){
    const payload=productToRow(p);
    let result;
    if(id&&/^[0-9a-f-]{36}$/i.test(id)) result=await supabaseClient.from('catalog_items').update(payload).eq('id',id);
    else result=await supabaseClient.from('catalog_items').insert(payload);
    if(result.error){toast('Erro ao salvar no Supabase: '+result.error.message);return;}
    closeModal('modal-product-edit');await loadRemoteCatalog();toast(id?'Item atualizado! ✅':'Item adicionado! 🌳');return;
  }
  if(id){const idx=prods.findIndex(x=>x.id===id);if(idx>=0)prods[idx]=p;else prods.unshift(p);}else prods.unshift(p);
  DB.set('products',prods);closeModal('modal-product-edit');renderAdminProducts();renderHomeProducts();renderDashboard();toast(id?'Item atualizado! ✅':'Item adicionado! 🌳');
}
async function deleteProduct(id){
  if(!confirm('Remover este item?'))return;
  if(currentUser&&currentUser.role==='admin'&&supabaseClient&&/^[0-9a-f-]{36}$/i.test(id)){
    const {error}=await supabaseClient.from('catalog_items').delete().eq('id',id);
    if(error){toast('Erro ao remover: '+error.message);return;}
    await loadRemoteCatalog();toast('Item removido.');return;
  }
  DB.set('products',getProducts().filter(p=>p.id!==id));renderAdminProducts();renderHomeProducts();renderDashboard();toast('Item removido.');
}
function loadSiteContent(){const sc=DB.get('siteContent')||{};[['taglinePt','site-tagline-pt'],['taglineEn','site-tagline-en'],['waBr','site-wabr'],['waUsa','site-wausa'],['igBr','site-igbr'],['igUsa','site-igusa'],['aboutPt','site-about-pt'],['aboutEn','site-about-en']].forEach(([k,id])=>{const el=document.getElementById(id);if(el)el.value=sc[k]||'';});}
function saveSiteContent(){DB.set('siteContent',{taglinePt:document.getElementById('site-tagline-pt').value,taglineEn:document.getElementById('site-tagline-en').value,waBr:document.getElementById('site-wabr').value,waUsa:document.getElementById('site-wausa').value,igBr:document.getElementById('site-igbr').value,igUsa:document.getElementById('site-igusa').value,aboutPt:document.getElementById('site-about-pt').value,aboutEn:document.getElementById('site-about-en').value});toast('Conteúdo salvo! ✅');}
// PARTICLES
const cv=document.getElementById('particles');const cx=cv.getContext('2d');let W,H,pt=[];
function rsz(){W=cv.width=window.innerWidth;H=cv.height=window.innerHeight;}rsz();window.addEventListener('resize',rsz);
function mkP(){return{x:Math.random()*W,y:H+5,sz:Math.random()*1.8+.4,sx:(Math.random()-.5)*.35,sy:-(Math.random()*.6+.2),op:Math.random()*.5+.1,gold:Math.random()>.45};}
for(let i=0;i<65;i++){const p=mkP();p.y=Math.random()*H;pt.push(p);}
(function loop(){cx.clearRect(0,0,W,H);pt.forEach((p,i)=>{p.x+=p.sx;p.y+=p.sy;p.op-=.0007;if(p.y<-10||p.op<=0)pt[i]=mkP();cx.beginPath();cx.arc(p.x,p.y,p.sz,0,Math.PI*2);cx.fillStyle=p.gold?`rgba(201,168,76,${p.op})`:`rgba(74,122,48,${p.op})`;cx.fill();});requestAnimationFrame(loop);})();
// SCROLL REVEAL
const io=new IntersectionObserver(e=>{e.forEach(x=>{if(x.isIntersecting){x.target.style.opacity='1';x.target.style.transform='translateY(0)';}});},{threshold:.1});
document.querySelectorAll('.transform-step,.value-item,.location-item,.contact-link,.feature-card').forEach(el=>{el.style.opacity='0';el.style.transform='translateY(18px)';el.style.transition='opacity .6s ease,transform .6s ease';io.observe(el);});
async function bootSupabase(){
  if(!supabaseClient)return;
  const {data}=await supabaseClient.auth.getSession();
  const user=data&&data.session&&data.session.user;
  if(user&&!currentUser){
    const {data:profile}=await supabaseClient.from('admin_profiles').select('role,email').eq('user_id',user.id).maybeSingle();
    if(profile&&profile.role==='admin'){
      currentUser={id:user.id,name:user.user_metadata?.name||profile.email||user.email,email:profile.email||user.email,role:'admin',created:user.created_at,address:{}};
      sessionStorage.setItem('adb_session',JSON.stringify(currentUser));
    }
  }
  await loadRemoteCatalog();
  await loadRemoteVideos();
  applyInitialRoute();
}
bootSupabase();
