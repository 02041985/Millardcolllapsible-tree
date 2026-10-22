const treeData = {
  id: 'company', label: 'Company', icon: '🏢', description: 'Top-level organization', status: 'Active', children: [
    { id: 'finance', label: 'Finance', icon: '💰', description: 'Financial operations and reporting', status: 'Active', children: [
      { id: 'accounting', label: 'Accounting', icon: '📄', description: 'Accounts and financial records', status: 'Active', children: [] },
      { id: 'payroll', label: 'Payroll', icon: '📄', description: 'Employee payroll administration', status: 'Active', children: [] },
      { id: 'budget', label: 'Budget', icon: '📄', description: 'Planning and budget control', status: 'Active', children: [] }
    ]},
    { id: 'operations', label: 'Operations', icon: '⚙️', description: 'Day-to-day operational activities', status: 'Active', children: [
      { id: 'logistics', label: 'Logistics', icon: '📦', description: 'Movement and supply coordination', status: 'Active', children: [] },
      { id: 'manufacturing', label: 'Manufacturing', icon: '🏭', description: 'Production activities', status: 'Active', children: [] }
    ]},
    { id: 'hr', label: 'Human Resources', icon: '👥', description: 'People and talent management', status: 'Active', children: [
      { id: 'recruitment', label: 'Recruitment', icon: '📄', description: 'Hiring and onboarding', status: 'Active', children: [] },
      { id: 'training', label: 'Training', icon: '📄', description: 'Learning and development', status: 'Active', children: [] }
    ]}
  ]
};

const expanded = new Set(['company']);
const treeEl = document.getElementById('tree');
const detailsEl = document.getElementById('details');
const searchEl = document.getElementById('search');
let selectedId = null;

function flatten(node, path = []) {
  const currentPath = [...path, node.label];
  return [{ node, path: currentPath }, ...node.children.flatMap(child => flatten(child, currentPath))];
}

function renderNode(node, path = []) {
  const wrapper = document.createElement('div');
  wrapper.className = 'node';
  const row = document.createElement('div');
  row.className = `node-row${selectedId === node.id ? ' selected' : ''}`;
  row.dataset.id = node.id;
  const hasChildren = node.children.length > 0;
  const toggle = document.createElement('button');
  toggle.className = `toggle${hasChildren ? '' : ' empty'}`;
  toggle.textContent = expanded.has(node.id) ? '▼' : '▶';
  toggle.setAttribute('aria-label', expanded.has(node.id) ? 'Collapse' : 'Expand');
  const icon = document.createElement('span'); icon.className = 'icon'; icon.textContent = node.icon;
  const label = document.createElement('span'); label.className = 'label'; label.textContent = node.label;
  const meta = document.createElement('span'); meta.className = 'meta'; meta.textContent = hasChildren ? `${node.children.length} item${node.children.length === 1 ? '' : 's'}` : '';
  row.append(toggle, icon, label, meta);

  toggle.addEventListener('click', e => { e.stopPropagation(); if (!hasChildren) return; expanded.has(node.id) ? expanded.delete(node.id) : expanded.add(node.id); render(); });
  row.addEventListener('click', () => { selectedId = node.id; render(); });
  row.addEventListener('dblclick', () => showDetails(node, path));
  wrapper.appendChild(row);

  if (hasChildren && expanded.has(node.id)) {
    const children = document.createElement('div'); children.className = 'children';
    node.children.forEach(child => children.appendChild(renderNode(child, [...path, node.label])));
    wrapper.appendChild(children);
  }
  return wrapper;
}

function render() {
  treeEl.innerHTML = '';
  treeEl.appendChild(renderNode(treeData));
  applySearch();
}

function showDetails(node, path) {
  detailsEl.innerHTML = `<h2>${escapeHtml(node.icon)} ${escapeHtml(node.label)}</h2><div class="path">${path.concat(node.label).map(escapeHtml).join(' / ')}</div><div class="detail-grid"><div class="detail-item"><strong>Description</strong>${escapeHtml(node.description)}</div><div class="detail-item"><strong>Status</strong>${escapeHtml(node.status)}</div><div class="detail-item"><strong>Children</strong>${node.children.length}</div></div>`;
}

function escapeHtml(value) { const div = document.createElement('div'); div.textContent = value; return div.innerHTML; }

function applySearch() {
  const term = searchEl.value.trim().toLowerCase();
  document.querySelectorAll('.node-row').forEach(row => {
    const match = !term || row.querySelector('.label').textContent.toLowerCase().includes(term);
    row.style.display = match ? 'flex' : 'none';
    row.classList.toggle('search-match', Boolean(term && match));
  });
}

function setAll(node, value) { if (node.children.length) { value ? expanded.add(node.id) : expanded.delete(node.id); node.children.forEach(child => setAll(child, value)); } }

document.getElementById('expandAll').addEventListener('click', () => { setAll(treeData, true); render(); });
document.getElementById('collapseAll').addEventListener('click', () => { setAll(treeData, false); expanded.add(treeData.id); render(); });
searchEl.addEventListener('input', applySearch);
render();
