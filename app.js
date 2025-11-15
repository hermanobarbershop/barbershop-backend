// بسيط وعملي — يخزن كل شيء في localStorage
const LS_KEY = 'barbershop_v1';
const defaultData = {
  adminPin: '1234',
  barbers: [{id: 'b1', name: 'أي حلاق'}],
  services: [
    {id:'s1', name:'قص شعر', duration:30, price:10},
    {id:'s2', name:'تصفيف', duration:45, price:20}
  ],
  appointments: []
};

let DB = load();

function load(){
  const raw = localStorage.getItem(LS_KEY);
  if(raw) try{ return JSON.parse(raw);}catch(e){}
  localStorage.setItem(LS_KEY, JSON.stringify(defaultData));
  return JSON.parse(JSON.stringify(defaultData));
}

function save(){ localStorage.setItem(LS_KEY, JSON.stringify(DB)); renderAll(); }

function uid(prefix='id'){ return prefix + Math.random().toString(36).slice(2,9); }

/* --- helpers --- */
function formatDT(dt){
  const d = new Date(dt);
  return d.toLocaleString();
}
function overlaps(barberId, startISO, durationMin){
  const start = new Date(startISO);
  const end = new Date(start.getTime() + durationMin*60000);
  return DB.appointments.some(a=>{
    if(a.barberId !== barberId) return false;
    const s = new Date(a.startsAt);
    const e = new Date(new Date(a.startsAt).getTime() + a.duration*60000);
    return start < e && s < end;
  });
}

/* --- booking UI --- */
const serviceSelect = document.getElementById('serviceSelect');
const barberSelect = document.getElementById('barberSelect');
const bookBtn = document.getElementById('bookBtn');
const clientName = document.getElementById('clientName');
const clientPhone = document.getElementById('clientPhone');
const datetime = document.getElementById('datetime');
const bookMsg = document.getElementById('bookMsg');

bookBtn.addEventListener('click', ()=>{
  const name = clientName.value.trim();
  const phone = clientPhone.value.trim();
  const serviceId = serviceSelect.value;
  const barberId = barberSelect.value;
  const dt = datetime.value;
  if(!name || !phone || !dt){ bookMsg.textContent='املأ الاسم، الهاتف، والتاريخ.'; return; }
  const service = DB.services.find(s=>s.id===serviceId);
  if(!service){ bookMsg.textContent='اختر خدمة صحيحة.'; return; }
  if(overlaps(barberId, dt, service.duration)){ bookMsg.textContent='يوجد موعد متداخل للحلاق في هذا التوقيت.'; return; }
  DB.appointments.push({
    id: uid('a'),
    clientName: name,
    clientPhone: phone,
    barberId,
    serviceId,
    startsAt: dt,
    duration: service.duration,
    price: service.price,
    status: 'confirmed',
    createdAt: new Date().toISOString()
  });
  save();
  bookMsg.textContent = 'تم الحجز بنجاح!';
  clientName.value = clientPhone.value = '';
});

/* --- admin UI --- */
const adminPin = document.getElementById('adminPin');
const openAdminBtn = document.getElementById('openAdmin');
const adminArea = document.getElementById('adminArea');

openAdminBtn.addEventListener('click', ()=>{
  if(adminPin.value === DB.adminPin){ adminArea.hidden = false; adminPin.value=''; renderAdmin(); } else { alert('PIN خاطئ'); }
});

document.getElementById('addBarber').addEventListener('click', ()=>{
  const nm = document.getElementById('newBarberName').value.trim();
  if(!nm) return;
  DB.barbers.push({id: uid('b'), name: nm});
  document.getElementById('newBarberName').value='';
  save();
});
document.getElementById('addService').addEventListener('click', ()=>{
  const n = document.getElementById('newServiceName').value.trim();
  const d = parseInt(document.getElementById('newServiceDuration').value||0,10);
  const p = parseFloat(document.getElementById('newServicePrice').value||0);
  if(!n||!d) return;
  DB.services.push({id: uid('s'), name:n, duration:d, price: p||0});
  document.getElementById('newServiceName').value='';
  document.getElementById('newServiceDuration').value='';
  document.getElementById('newServicePrice').value='';
  save();
});
document.getElementById('exportCSV').addEventListener('click', ()=>{
  const rows = [['id,العميل,هاتف,حلاق,خدمة,تاريخ,مدة,سعر,حالة']];
  DB.appointments.forEach(a=>{
    const barber = DB.barbers.find(b=>b.id===a.barberId)?.name || '';
    const service = DB.services.find(s=>s.id===a.serviceId)?.name || '';
    rows.push([`${a.id},${a.clientName},${a.clientPhone},${barber},${service},${a.startsAt},${a.duration},${a.price},${a.status}`]);
  });
  const blob = new Blob([rows.join('\n')], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'appointments.csv'; a.click();
  URL.revokeObjectURL(url);
});
document.getElementById('clearAll').addEventListener('click', ()=>{
  if(confirm('هل تريد مسح كل البيانات المحلية؟')){ localStorage.removeItem(LS_KEY); DB = load(); save(); alert('تم المسح'); }
});

/* render */
function renderAll(){ renderSelects(); renderMyAppointments(); renderAdmin(); }

function renderSelects(){
  serviceSelect.innerHTML = '';
  DB.services.forEach(s=>{
    const opt = document.createElement('option'); opt.value = s.id; opt.textContent = `${s.name} — ${s.duration}د`; serviceSelect.appendChild(opt);
  });
  barberSelect.innerHTML = '';
  DB.barbers.forEach(b=>{
    const opt = document.createElement('option'); opt.value = b.id; opt.textContent = b.name; barberSelect.appendChild(opt);
  });
}

function renderMyAppointments(){
  const el = document.getElementById('myAppointments'); el.innerHTML='';
  const now = new Date();
  const upcoming = DB.appointments.filter(a=>new Date(a.startsAt) >= now).sort((a,b)=>new Date(a.startsAt)-new Date(b.startsAt));
  if(upcoming.length===0){ el.innerHTML = '<li class="muted">لا توجد مواعيد قادمة</li>'; return; }
  upcoming.forEach(a=>{
    const li = document.createElement('li');
    const svc = DB.services.find(s=>s.id===a.serviceId)?.name || '';
    const barber = DB.barbers.find(b=>b.id===a.barberId)?.name || '';
    li.innerHTML = `<div><strong>${a.clientName}</strong><br><span class="muted">${svc} — ${barber}</span></div>
      <div class="muted">${formatDT(a.startsAt)}</div>`;
    el.appendChild(li);
  });
}

function renderAdmin(){
  // barbers
  const bl = document.getElementById('barberList'); bl.innerHTML='';
  DB.barbers.forEach(b=>{
    const li = document.createElement('li');
    li.innerHTML = `<span>${b.name}</span><div><button data-id="${b.id}" class="delBarber">حذف</button></div>`;
    bl.appendChild(li);
  });
  document.querySelectorAll('.delBarber').forEach(btn=>{
    btn.addEventListener('click', ()=>{ const id = btn.dataset.id; DB.barbers = DB.barbers.filter(b=>b.id!==id); DB.appointments = DB.appointments.filter(a=>a.barberId!==id); save(); });
  });

  // services
  const sl = document.getElementById('serviceList'); sl.innerHTML='';
  DB.services.forEach(s=>{
    const li = document.createElement('li');
    li.innerHTML = `<span>${s.name} — ${s.duration}د — ${s.price}</span><div><button data-id="${s.id}" class="delService">حذف</button></div>`;
    sl.appendChild(li);
  });
  document.querySelectorAll('.delService').forEach(btn=>{
    btn.addEventListener('click', ()=>{ const id = btn.dataset.id; DB.services = DB.services.filter(s=>s.id!==id); DB.appointments = DB.appointments.filter(a=>a.serviceId!==id); save(); });
  });

  // appointments
  const al = document.getElementById('appointmentsList'); al.innerHTML='';
  DB.appointments.sort((a,b)=>new Date(a.startsAt)-new Date(b.startsAt)).forEach(a=>{
    const barber = DB.barbers.find(b=>b.id===a.barberId)?.name || '';
    const service = DB.services.find(s=>s.id===a.serviceId)?.name || '';
    const li = document.createElement('li');
    li.innerHTML = `<div><strong>${a.clientName}</strong><br><span class="muted">${service} — ${barber}</span></div>
      <div><span class="muted">${formatDT(a.startsAt)}</span><button data-id="${a.id}" class="delA">حذف</button></div>`;
    al.appendChild(li);
  });
  document.querySelectorAll('.delA').forEach(btn=>{
    btn.addEventListener('click', ()=>{ if(confirm('حذف الموعد؟')){ DB.appointments = DB.appointments.filter(x=>x.id!==btn.dataset.id); save(); }});
  });
}

renderAll();

/* PWA install prompt handling */
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e)=>{
  e.preventDefault();
  deferredPrompt = e;
  const installBtn = document.getElementById('installBtn');
  installBtn.hidden = false;
  installBtn.addEventListener('click', async ()=>{
    installBtn.hidden = true;
    deferredPrompt.prompt();
    deferredPrompt = null;
  });
});
