const SUPABASE_URL='https://zbvicgxsstbebcgykitm.supabase.co';
const SUPABASE_KEY='sb_publishable__pkhBsx_5OB0TDRaCJZKTA_OUv_0f_3';
const db=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
let locations=[],requests=[];
const $=id=>document.getElementById(id);
function esc(v){const d=document.createElement('div');d.textContent=v??'';return d.innerHTML}
function fmt(t){return new Date(t).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}
async function load(){
 const [l,r,a]=await Promise.all([db.from('locations').select('*').order('name'),db.from('maintenance_requests').select('*,locations(name),vendors(name)').order('created_at',{ascending:false}),db.from('assets').select('*,locations(name)').order('name')]);
 if(l.error||r.error||a.error){$('notice').textContent='Connection error: '+(l.error||r.error||a.error).message;return}
 locations=l.data; requests=r.data; renderLocations(); renderRequests(); renderCampus(a.data);
}
function renderLocations(){ $('location').innerHTML=locations.map(x=>`<option value="${x.id}">${esc(x.name)} — ${esc(x.location_type.replaceAll('_',' '))}</option>`).join(''); }
function renderRequests(){
 const open=requests.filter(r=>!['resolved','closed','cancelled'].includes(r.status));
 $('openCount').textContent=open.length; $('urgentCount').textContent=open.filter(r=>r.priority==='urgent').length; $('slaCount').textContent=open.filter(r=>new Date(r.sla_due_at)>new Date()).length;
 const today=new Date().toDateString();$('resolvedCount').textContent=requests.filter(r=>r.resolved_at&&new Date(r.resolved_at).toDateString()===today).length;
 $('requests').innerHTML=requests.slice(0,30).map(r=>{const overdue=!['resolved','closed','cancelled'].includes(r.status)&&new Date(r.sla_due_at)<new Date();return `<article class="ticket ${overdue?'overdue':''}"><div><b>#${r.ticket_no} ${esc(r.title)}</b><span>${esc(r.locations?.name||'')}</span><small>${fmt(r.created_at)} • ${esc(r.issue_type.replaceAll('_',' '))}</small></div><div class="ticket-right"><strong class="badge ${r.status}">${esc(r.status.replaceAll('_',' '))}</strong><small>${overdue?'SLA OVERDUE':`30-min SLA: ${fmt(r.sla_due_at)}`}</small>${r.vendor_id?`<small>Vendor: ${esc(r.vendors?.name||'Assigned')}</small>`:''}</div></article>`}).join('')||'<div class="empty">No requests yet.</div>';
}
function renderCampus(assets){const term=$('search').value.toLowerCase();const groups={};locations.filter(l=>!term||l.name.toLowerCase().includes(term)||l.location_type.includes(term)).forEach(l=>groups[l.location_type]??=[]);locations.filter(l=>!term||l.name.toLowerCase().includes(term)||l.location_type.includes(term)).forEach(l=>groups[l.location_type].push(l));$('campus').innerHTML=Object.entries(groups).map(([type,ls])=>`<div class="group"><h3>${type.replaceAll('_',' ')}</h3>${ls.map(l=>`<div class="location"><b>${esc(l.name)}</b><span>${assets.filter(a=>a.location_id===l.id).map(a=>`${esc(a.name)} ×${a.quantity}`).join(' • ')||'No assets recorded'}</span></div>`).join('')}</div>`).join('')}
$('send').onclick=async()=>{const location_id=$('location').value,title=$('title').value.trim();if(!title){$('notice').textContent='Please describe what is needed.';return} $('send').disabled=true;$('notice').textContent='Sending…';const {error}=await db.from('maintenance_requests').insert({location_id,issue_type:$('issue').value,priority:$('priority').value,title,description:$('description').value,reported_by:'Teacher',reporter_role:'teacher'});$('send').disabled=false;if(error){$('notice').textContent=error.message}else{$('title').value='';$('description').value='';$('notice').textContent='Request sent. Facilities manager notified.';load()}};
$('refresh').onclick=load;$('search').oninput=()=>load();
db.channel('school-maintenance').on('postgres_changes',{event:'*',schema:'public',table:'maintenance_requests'},load).on('postgres_changes',{event:'*',schema:'public',table:'request_updates'},load).subscribe();
setInterval(()=>{$('clock').textContent=new Date().toLocaleString();renderRequests()},1000);load();