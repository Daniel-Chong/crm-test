import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-project-ref') &&
  !supabaseAnonKey.includes('your-anon-public-key')
);
const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;

const statusMap = {
  lead: { text: '초기 상담', class: 'lead' },
  progress: { text: '진행 중', class: 'progress' },
  contracting: { text: '계약 진행 중', class: 'contracting' },
  success: { text: '계약 완료', class: 'success' }
};

let salesData = [];
let editingId = null;
let editingActivityId = null;
let editingActivityClientId = null;
let currentPage = '대시보드';
const editablePages = ['고객사 관리'];

const elements = {
  tableBody: document.getElementById('table-body'),
  showLeadForm: document.getElementById('show-lead-form'),
  leadModal: document.getElementById('lead-modal'),
  leadForm: document.getElementById('lead-form'),
  editModal: document.getElementById('edit-modal'),
  editForm: document.getElementById('edit-form'),
  dashboardSummary: document.getElementById('dashboard-summary'),
  totalClients: document.getElementById('total-clients'),
  activeLeads: document.getElementById('active-leads'),
  successContracts: document.getElementById('success-contracts'),
  pipelineLead: document.getElementById('pipeline-lead'),
  pipelineProgress: document.getElementById('pipeline-progress'),
  pipelineContracting: document.getElementById('pipeline-contracting'),
  pipelineSuccess: document.getElementById('pipeline-success'),
  headerTitle: document.querySelector('.header h1'),
  titleLabel: document.querySelector('.table-header h2'),
  dbStatus: document.getElementById('db-status'),
  actionHeader: document.querySelector('.action-header'),
  tableSection: document.querySelector('.table-section'),
  closeLeadModal: document.getElementById('close-lead-modal'),
  closeEditModal: document.getElementById('close-edit-modal'),
  cancelNew: document.getElementById('cancel-new'),
  cancelEdit: document.getElementById('cancel-edit'),
  salesStatusSection: document.getElementById('sales-status-section'),
  ssLeadCount: document.getElementById('ss-lead-count'),
  ssProgressCount: document.getElementById('ss-progress-count'),
  ssContractingCount: document.getElementById('ss-contracting-count'),
  ssSuccessCount: document.getElementById('ss-success-count'),
  ssPotentialList: document.getElementById('ss-potential-list'),
  ssActivityList: document.getElementById('ss-activity-list'),
  showActivityForm: document.getElementById('show-activity-form'),
  activityModal: document.getElementById('activity-modal'),
  closeActivityModal: document.getElementById('close-activity-modal'),
  cancelActivity: document.getElementById('cancel-activity'),
  activityForm: document.getElementById('activity-form'),
  activityClient: document.getElementById('activity-client'),
  activityDate: document.getElementById('activity-date'),
  activityType: document.getElementById('activity-type'),
  activityDesc: document.getElementById('activity-desc'),
  activityModalTitle: document.querySelector('#activity-modal .modal-header h3'),
  
  // 로그인 및 사용자 관리 관련 요소 추가
  loginScreen: document.getElementById('login-screen'),
  loginForm: document.getElementById('login-form'),
  loginEmail: document.getElementById('login-email'),
  loginPassword: document.getElementById('login-password'),
  loginError: document.getElementById('login-error'),
  logoutBtn: document.getElementById('logout-btn'),
  userManagementSection: document.getElementById('user-management-section'),
  showUserForm: document.getElementById('show-user-form'),
  userModal: document.getElementById('user-modal'),
  closeUserModal: document.getElementById('close-user-modal'),
  cancelUser: document.getElementById('cancel-user'),
  userCreationForm: document.getElementById('user-creation-form'),
  newUserEmail: document.getElementById('new-user-email'),
  newUserPassword: document.getElementById('new-user-password'),
  userTableBody: document.getElementById('user-table-body')
};

function createContactHTML(contact = {}) {
  return `
    <div class="contact-item">
      <button type="button" class="remove-contact-btn" aria-label="담당자 삭제">&times;</button>
      <div class="form-group">
        <label>담당자명</label>
        <input type="text" class="contact-name" required placeholder="예: 홍길동" value="${contact.name || ''}">
      </div>
      <div class="form-group">
        <label>직책</label>
        <input type="text" class="contact-title" placeholder="예: 팀장, 대표" value="${contact.title || ''}">
      </div>
      <div class="form-group">
        <label>휴대폰</label>
        <input type="tel" class="contact-mobile" placeholder="예: 010-1234-5678" value="${contact.mobile || ''}">
      </div>
      <div class="form-group">
        <label>이메일</label>
        <input type="email" class="contact-email" placeholder="예: contact@company.com" value="${contact.email || ''}">
      </div>
      <div class="form-group full-width" style="grid-column: 1 / -1;">
        <label>메모</label>
        <textarea class="contact-memo" rows="2" placeholder="담당자 관련 특이사항이나 메모를 남겨주세요." style="padding: 10px; border: 1px solid #ccc; border-radius: 4px; font-family: inherit; resize: vertical;">${contact.memo || ''}</textarea>
      </div>
    </div>
  `;
}

function getContactsFromContainer(container) {
  const contacts = [];
  container.querySelectorAll('.contact-item').forEach(item => {
    contacts.push({
      name: item.querySelector('.contact-name').value.trim(),
      title: item.querySelector('.contact-title').value.trim(),
      mobile: item.querySelector('.contact-mobile').value.trim(),
      email: item.querySelector('.contact-email').value.trim(),
      memo: item.querySelector('.contact-memo').value.trim()
    });
  });
  return contacts;
}

function hasSupabaseConfig() {
  return Boolean(isSupabaseConfigured && supabase);
}

function setDbStatus(type, text) {
  if (!elements.dbStatus) return;
  elements.dbStatus.textContent = text;
  elements.dbStatus.classList.remove('success', 'warning', 'error');
  if (type) elements.dbStatus.classList.add(type);
}

function mapClient(item) {
  return {
    id: item.id,
    company: item.company,
    address: item.address || '',
    companyPhone: item.company_phone || '',
    contact: item.contact_person,
    title: item.title || '',
    memo: item.memo || '',
    mobile: item.mobile_phone || '',
    email: item.email || '',
    contacts: item.contacts && item.contacts.length > 0 ? item.contacts : [{ name: item.contact_person || '', title: item.title || '', mobile: item.mobile_phone || '', email: item.email || '', memo: item.memo || '' }],
    activities: item.activities || [],
    date: item.registered_at ? new Date(item.registered_at).toISOString().split('T')[0] : '',
    status: item.status
  };
}

function initDummyData() {
  salesData = [
    { id: 1, company: '글로벌 아이티(주)', address: '서울 강남구 역삼동 123', companyPhone: '02-1234-5678', contacts: [{name: '김철수', title: '팀장', memo: 'VIP 고객사, 빠른 대응 필요', mobile: '010-1111-2222', email: 'kim@globalit.com'}], activities: [{ id: 1, date: '2023-10-10', type: '미팅', desc: '최종 계약서 날인 완료' }], date: '2023-10-01', status: 'success' },
    { id: 2, company: '스타트업 팩토리', address: '서울 마포구 상암동 456', companyPhone: '02-8765-4321', contacts: [{name: '이영희', title: '매니저', memo: '', mobile: '010-3333-4444', email: 'lee@startupfactory.com'}], activities: [{ id: 2, date: '2023-10-16', type: '이메일', desc: '서비스 제안서 및 견적서 송부' }], date: '2023-10-15', status: 'progress' },
    { id: 3, company: '제일물산', address: '인천 남동구 구월동 789', companyPhone: '032-999-8888', contacts: [{name: '박민수', title: '대리', memo: '첫 미팅 완료', mobile: '010-5555-6666', email: 'park@jeil.com'}], activities: [], date: '2023-10-20', status: 'lead' }
  ];
}

function setPage(page) {
  currentPage = page;
  const title = page === '대시보드' ? '영업관리 대시보드' : page;
  elements.headerTitle.textContent = title;
  elements.titleLabel.textContent = `${title} 리스트`;

  const canEdit = editablePages.includes(page);
  elements.showLeadForm.classList.toggle('hidden', !canEdit);
  editingId = null;
  elements.leadModal.classList.add('hidden');
  elements.editForm.reset();
  elements.editModal.classList.add('hidden');

  const isDashboard = page === '대시보드';
  const isClientManage = page === '고객사 관리';
  const isSalesStatus = page === '영업 현황';
  const isUserManage = page === '사용자 관리';

  document.querySelector('.dashboard-cards').style.display = isDashboard ? 'grid' : 'none';
  elements.dashboardSummary.classList.toggle('hidden', !isDashboard);

  if (elements.tableSection) {
    elements.tableSection.style.display = (isDashboard || isClientManage) ? 'block' : 'none';
  }
  if (elements.salesStatusSection) {
    elements.salesStatusSection.style.display = isSalesStatus ? 'flex' : 'none';
  }
  if (elements.userManagementSection) {
    elements.userManagementSection.style.display = isUserManage ? 'flex' : 'none';
  }

  document.querySelectorAll('.nav-menu li').forEach(item => {
    item.classList.toggle('active', item.textContent.trim() === page);
  });

  elements.actionHeader.classList.toggle('hidden', !canEdit);
  updateDashboard();
}


function formatClientPayload(payload) {
  return {
    company: payload.company,
    address: payload.address,
    company_phone: payload.companyPhone,
    contacts: payload.contacts,
    contact_person: payload.contacts[0]?.name || '',
    title: payload.contacts[0]?.title || '',
    memo: payload.contacts[0]?.memo || '',
    mobile_phone: payload.contacts[0]?.mobile || '',
    email: payload.contacts[0]?.email || '',
    activities: payload.activities || [],
    status: payload.status
  };
}

function updateSalesStatus() {
  if (!elements.ssLeadCount) return;
  let leadCount = 0, progressCount = 0, contractingCount = 0, successCount = 0;
  const potentialList = [];
  let allActivities = [];

  salesData.forEach(client => {
    if (client.status === 'lead') {
      leadCount++;
      potentialList.push(client);
    }
    if (client.status === 'progress') progressCount++;
    if (client.status === 'contracting') contractingCount++;
    if (client.status === 'success') successCount++;

    if (client.activities && client.activities.length > 0) {
      client.activities.forEach(act => {
        allActivities.push({ ...act, company: client.company, clientId: client.id });
      });
    }
  });

  elements.ssLeadCount.textContent = `${leadCount}건`;
  elements.ssProgressCount.textContent = `${progressCount}건`;
  if (elements.ssContractingCount) elements.ssContractingCount.textContent = `${contractingCount}건`;
  elements.ssSuccessCount.textContent = `${successCount}건`;

  elements.ssPotentialList.innerHTML = potentialList.map(c => `
    <tr>
      <td><strong>${c.company}</strong><br><span style="font-size:11px; color:#7f8c8d;">${c.companyPhone || ''}</span></td>
      <td>${c.contacts[0]?.name || '-'}</td>
      <td>${c.date}</td>
    </tr>
  `).join('') || '<tr><td colspan="3" style="text-align:center; color:#999; padding: 20px;">📭 잠재 고객사가 없습니다.</td></tr>';

  allActivities.sort((a, b) => new Date(b.date) - new Date(a.date));
  elements.ssActivityList.innerHTML = allActivities.length ? allActivities.map(act => `
    <div style="padding: 15px; border: 1px solid #ddd; border-radius: 8px; background: #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.05);" data-act-id="${act.id}" data-client-id="${act.clientId}">
      <div style="display:flex; justify-content:space-between; align-items: flex-start; margin-bottom:8px; flex-wrap: wrap; gap: 8px;">
        <span style="font-weight:bold; color:#2c3e50; font-size:15px;">${act.company}</span>
        <span style="font-size:12px; font-weight:bold; color:#fff; background-color:#34495e; padding:4px 10px; border-radius:12px;">${act.type}</span>
      </div>
      <div style="font-size:13px; color:#555; margin-bottom:8px;"><strong>일자:</strong> ${act.date}</div>
      <div style="font-size:13px; color:#333; white-space: pre-wrap; background:#f4f7f6; padding:12px; border-radius:6px; margin-bottom: 12px; border: 1px solid #eee;">${act.desc}</div>
      <div style="display:flex; justify-content: flex-end; gap:8px; border-top: 1px dashed #eee; padding-top: 10px;">
        <button type="button" class="btn small secondary edit-activity-btn" style="padding:6px 12px; font-size:13px; margin:0;">✏️ 수정</button>
        <button type="button" class="btn small danger delete-activity-btn" style="padding:6px 12px; font-size:13px; margin:0;">🗑️ 삭제</button>
      </div>
    </div>
  `).join('') : '<div style="text-align:center; color:#999; padding:20px;">📭 등록된 영업 활동이 없습니다.</div>';
}

function updateDashboard() {
  elements.tableBody.innerHTML = '';

  let leadCount = 0;
  let progressCount = 0;
  let contractingCount = 0;
  let successCount = 0;

  salesData.forEach(data => {
    const row = document.createElement('tr');
    row.dataset.rowId = data.id;
    const statusInfo = statusMap[data.status] || statusMap.lead;

    const contactsHTML = data.contacts.map(c => `
      <div style="margin-bottom: 5px; padding-bottom: 5px; border-bottom: 1px dashed #eee;">
        ${c.name} ${c.title ? `<span style="color:#666; font-size:12px;">(${c.title})</span>` : ''}
        <span class="small-text">${c.mobile ? c.mobile + ' / ' : ''}${c.email}</span>
      </div>
    `).join('').replace(/<div[^>]*>([\s\S]*?)<\/div>$/, '<div style="margin-bottom: 0; padding-bottom: 0; border-bottom: none;">$1</div>');

    if (editablePages.includes(currentPage)) {
      row.innerHTML = `
        <td><strong>${data.company}</strong><span class="small-text">${data.address}</span></td>
        <td>${contactsHTML}</td>
        <td>${data.companyPhone || '-'}</td>
        <td>${data.date}</td>
        <td><span class="status ${statusInfo.class}">${statusInfo.text}</span></td>
        <td class="action-cell">
          <button type="button" class="btn small secondary edit-btn">수정</button>
          <button type="button" class="btn small danger delete-btn">삭제</button>
        </td>
      `;
    } else {
      row.innerHTML = `
        <td><strong>${data.company}</strong><span class="small-text">${data.address}</span></td>
        <td>${contactsHTML}</td>
        <td>${data.companyPhone || '-'}</td>
        <td>${data.date}</td>
        <td><span class="status ${statusInfo.class}">${statusInfo.text}</span></td>
      `;
    }

    elements.tableBody.appendChild(row);

    if (data.status === 'lead') leadCount += 1;
    if (data.status === 'progress') progressCount += 1;
    if (data.status === 'contracting') contractingCount += 1;
    if (data.status === 'success') successCount += 1;
  });

  elements.totalClients.innerText = `${salesData.length}곳`;
  elements.activeLeads.innerText = `${progressCount + contractingCount}건`;
  elements.successContracts.innerText = `${successCount}건`;
  elements.pipelineLead.innerText = `${leadCount}건`;
  elements.pipelineProgress.innerText = `${progressCount}건`;
  if (elements.pipelineContracting) elements.pipelineContracting.innerText = `${contractingCount}건`;
  elements.pipelineSuccess.innerText = `${successCount}건`;
  updateSalesStatus();
}

async function loadClients() {
  if (!hasSupabaseConfig()) {
    setDbStatus('error', 'Supabase 설정 필요');
    initDummyData();
    updateDashboard();
    return;
  }

  setDbStatus('warning', 'Supabase 연결 중...');
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('registered_at', { ascending: false });

  if (error) {
    console.error('Supabase load error:', error.message);
    setDbStatus('error', 'Supabase 연결 실패');
    initDummyData();
  } else {
    salesData = data.map(mapClient);
    setDbStatus('success', 'Supabase 연결됨');
  }
  updateDashboard();
}

async function insertClient(payload) {
  if (!hasSupabaseConfig()) {
    salesData.unshift(payload);
    updateDashboard();
    return;
  }

  const { data, error } = await supabase
    .from('clients')
    .insert([formatClientPayload(payload)])
    .select();

  if (error) {
    console.error('Supabase insert error:', error.message);
    alert('데이터 저장에 실패했습니다. 콘솔을 확인하세요.');
    return;
  }

  salesData.unshift(mapClient(data[0]));
  updateDashboard();
}

async function updateClient(id, payload) {
  if (!hasSupabaseConfig()) {
    const item = salesData.find(entry => entry.id === id);
    Object.assign(item, payload);
    updateDashboard();
    return;
  }

  const { data, error } = await supabase
    .from('clients')
    .update(formatClientPayload(payload))
    .eq('id', id)
    .select();

  if (error) {
    console.error('Supabase update error:', error.message);
    alert('데이터 수정에 실패했습니다. 콘솔을 확인하세요.');
    return;
  }

  const index = salesData.findIndex(entry => entry.id === id);
  if (index !== -1) {
    salesData[index] = mapClient(data[0]);
    updateDashboard();
  }
}

async function deleteClient(id) {
  if (!hasSupabaseConfig()) {
    salesData = salesData.filter(entry => entry.id !== id);
    updateDashboard();
    return;
  }

  const { error } = await supabase.from('clients').delete().eq('id', id);
  if (error) {
    console.error('Supabase delete error:', error.message);
    alert('삭제에 실패했습니다. 콘솔을 확인하세요.');
    return;
  }

  salesData = salesData.filter(entry => entry.id !== id);
  updateDashboard();
}

function attachEvents() {
  const menuList = document.querySelector('.nav-menu');
  if (menuList) {
    menuList.addEventListener('click', event => {
      const menuItem = event.target.closest('li');
      if (!menuItem || menuItem.classList.contains('disabled')) return;
      setPage(menuItem.textContent.trim());
    });
  }

  document.addEventListener('click', event => {
    if (event.target.classList.contains('add-contact-btn')) {
      const container = event.target.closest('.form-group').querySelector('.contacts-container');
      container.insertAdjacentHTML('beforeend', createContactHTML());
    }
    if (event.target.classList.contains('remove-contact-btn')) {
      const item = event.target.closest('.contact-item');
      const container = item.parentElement;
      if (container.children.length > 1) {
        item.remove();
      } else {
        alert('최소 1명의 담당자가 필요합니다.');
      }
    }
  });

  elements.showLeadForm.addEventListener('click', () => {
    elements.leadModal.classList.remove('hidden');
    elements.showLeadForm.classList.add('hidden');
    document.querySelector('#lead-contacts-group .contacts-container').innerHTML = createContactHTML();
    document.getElementById('company-name').focus();
  });

  const closeLeadModal = () => {
    elements.leadModal.classList.add('hidden');
    elements.showLeadForm.classList.remove('hidden');
    elements.leadForm.reset();
  };
  elements.cancelNew?.addEventListener('click', closeLeadModal);
  elements.closeLeadModal?.addEventListener('click', closeLeadModal);

  elements.leadForm.addEventListener('submit', async event => {
    event.preventDefault();

    const container = document.querySelector('#lead-contacts-group .contacts-container');
    const contacts = getContactsFromContainer(container);

    if (contacts.length === 0 || !contacts[0].name) {
      alert('최소 1명의 담당자명을 입력해주세요.');
      return;
    }

    const payload = {
      company: document.getElementById('company-name').value.trim(),
      address: document.getElementById('address').value.trim(),
      companyPhone: document.getElementById('company-phone').value.trim(),
      contacts: contacts,
      status: document.getElementById('status').value,
      activities: [],
      date: new Date().toISOString().split('T')[0]
    };

    if (!payload.company) {
      alert('고객사명을 입력해주세요.');
      return;
    }

    await insertClient(payload);
    elements.leadForm.reset();
    elements.leadModal.classList.add('hidden');
    elements.showLeadForm.classList.remove('hidden');
  });

  elements.tableBody.addEventListener('click', async event => {
    const row = event.target.closest('tr');
    if (!row) return;
    const id = Number(row.dataset.rowId);
    const item = salesData.find(entry => entry.id === id);
    if (!item) return;

    if (event.target.closest('.edit-btn')) {
      editingId = id;
      document.getElementById('edit-company-name').value = item.company;
      document.getElementById('edit-address').value = item.address;
      document.getElementById('edit-company-phone').value = item.companyPhone;
      document.getElementById('edit-status').value = item.status;
      
      const container = document.querySelector('#edit-contacts-group .contacts-container');
      container.innerHTML = '';
      if (item.contacts && item.contacts.length > 0) {
        item.contacts.forEach(contact => {
          container.insertAdjacentHTML('beforeend', createContactHTML(contact));
        });
      } else {
        container.insertAdjacentHTML('beforeend', createContactHTML());
      }
      
      elements.editModal.classList.remove('hidden');
      document.getElementById('edit-company-name').focus();
    }

    if (event.target.closest('.delete-btn')) {
      if (confirm('해당 고객사를 삭제하시겠습니까?')) {
        await deleteClient(id);
      }
    }
  });

  elements.editForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (editingId === null) return;

    const container = document.querySelector('#edit-contacts-group .contacts-container');
    const contacts = getContactsFromContainer(container);

    if (contacts.length === 0 || !contacts[0].name) {
      alert('최소 1명의 담당자명을 입력해주세요.');
      return;
    }

    const item = salesData.find(entry => entry.id === editingId);

    const payload = {
      company: document.getElementById('edit-company-name').value.trim(),
      address: document.getElementById('edit-address').value.trim(),
      companyPhone: document.getElementById('edit-company-phone').value.trim(),
      contacts: contacts,
      activities: item ? item.activities : [],
      status: document.getElementById('edit-status').value
    };

    if (!payload.company) {
      alert('고객사명을 입력해주세요.');
      return;
    }

    await updateClient(editingId, payload);
    elements.editModal.classList.add('hidden');
    elements.editForm.reset();
    editingId = null;
  });

  const closeEditModal = () => {
    editingId = null;
    elements.editModal.classList.add('hidden');
    elements.editForm.reset();
  };
  elements.cancelEdit?.addEventListener('click', closeEditModal);
  elements.closeEditModal?.addEventListener('click', closeEditModal);

  // --- 활동 내역 등록/수정/삭제 이벤트 ---
  elements.ssActivityList?.addEventListener('click', async event => {
    const btn = event.target.closest('button');
    if (!btn) return;
    
    const item = btn.closest('div[data-act-id]');
    if (!item) return;
    
    const actId = Number(item.dataset.actId);
    const clientId = Number(item.dataset.clientId);
    const client = salesData.find(c => c.id === clientId);
    if (!client) return;

    if (btn.classList.contains('delete-activity-btn')) {
      if (confirm('해당 영업 활동을 삭제하시겠습니까?')) {
        const updatedActivities = (client.activities || []).filter(a => a.id !== actId);
        await updateClient(clientId, { ...client, companyPhone: client.companyPhone, activities: updatedActivities });
      }
    }

    if (btn.classList.contains('edit-activity-btn')) {
      const act = (client.activities || []).find(a => a.id === actId);
      if (!act) return;

      editingActivityId = actId;
      editingActivityClientId = clientId;

      elements.activityClient.innerHTML = `<option value="${clientId}">${client.company}</option>`;
      elements.activityClient.value = clientId;
      elements.activityClient.disabled = true;
      
      elements.activityDate.value = act.date;
      elements.activityType.value = act.type;
      elements.activityDesc.value = act.desc;
      
      if(elements.activityModalTitle) elements.activityModalTitle.textContent = '영업 활동 수정';
      elements.activityModal.classList.remove('hidden');
    }
  });

  elements.showActivityForm?.addEventListener('click', () => {
    editingActivityId = null;
    editingActivityClientId = null;
    elements.activityClient.disabled = false;
    if(elements.activityModalTitle) elements.activityModalTitle.textContent = '영업 활동 등록';

    elements.activityClient.innerHTML = salesData.map(c => `<option value="${c.id}">${c.company}</option>`).join('');
    elements.activityDate.value = new Date().toISOString().split('T')[0];
    elements.activityModal.classList.remove('hidden');
  });

  const closeActivityModal = () => {
    elements.activityModal.classList.add('hidden');
    elements.activityForm.reset();
    editingActivityId = null;
    editingActivityClientId = null;
    elements.activityClient.disabled = false;
  };

  elements.closeActivityModal?.addEventListener('click', closeActivityModal);
  elements.cancelActivity?.addEventListener('click', closeActivityModal);

  elements.activityForm?.addEventListener('submit', async event => {
    event.preventDefault();
    const clientId = editingActivityClientId !== null ? editingActivityClientId : Number(elements.activityClient.value);
    const client = salesData.find(c => c.id === clientId);
    if (!client) return;

    let updatedActivities = [...(client.activities || [])];
    
    if (editingActivityId !== null) {
      const index = updatedActivities.findIndex(a => a.id === editingActivityId);
      if (index !== -1) {
        updatedActivities[index] = {
          ...updatedActivities[index],
          date: elements.activityDate.value,
          type: elements.activityType.value,
          desc: elements.activityDesc.value.trim()
        };
      }
    } else {
      const newActivity = { id: Date.now(), date: elements.activityDate.value, type: elements.activityType.value, desc: elements.activityDesc.value.trim() };
      updatedActivities.push(newActivity);
    }

    const payload = { ...client, companyPhone: client.companyPhone, activities: updatedActivities };
    await updateClient(clientId, payload);
    closeActivityModal();
  });

  // --- 로그인 처리 이벤트 ---
  elements.loginForm?.addEventListener('submit', async event => {
    event.preventDefault();
    if (elements.loginError) elements.loginError.style.display = 'none';
    
    const email = elements.loginEmail.value;
    const password = elements.loginPassword.value;
    
    if (!hasSupabaseConfig()) {
      if (elements.loginScreen) elements.loginScreen.style.display = 'none';
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (elements.loginError) {
        elements.loginError.style.display = 'block';
        elements.loginError.textContent = '로그인 실패: 이메일과 비밀번호를 확인해주세요.';
      }
    } else {
      elements.loginForm.reset();
    }
  });

  // --- 로그아웃 이벤트 ---
  elements.logoutBtn?.addEventListener('click', async () => {
    if (hasSupabaseConfig()) {
      await supabase.auth.signOut();
    } else {
      if (elements.loginScreen) elements.loginScreen.style.display = 'flex';
    }
  });

  // --- 사용자 생성 모달 이벤트 ---
  elements.showUserForm?.addEventListener('click', () => {
    elements.userModal?.classList.remove('hidden');
  });

  const closeUserModal = () => {
    elements.userModal?.classList.add('hidden');
    elements.userCreationForm?.reset();
  };
  elements.closeUserModal?.addEventListener('click', closeUserModal);
  elements.cancelUser?.addEventListener('click', closeUserModal);

  elements.userCreationForm?.addEventListener('submit', async event => {
    event.preventDefault();

    const email = elements.newUserEmail.value;
    const password = elements.newUserPassword.value;

    if (hasSupabaseConfig()) {
      // 관리자 세션 유지 트릭: 가입 전 현재 세션 백업
      const { data: { session: oldSession } } = await supabase.auth.getSession();

      // 프론트엔드에서 회원가입(signUp) API 호출
      const { error } = await supabase.auth.signUp({ email, password });
      
      if (error) {
        alert('사용자 생성 실패: ' + error.message);
        return;
      }

      // 새롭게 가입된 유저의 세션으로 덮어씌워진 것을 기존 관리자 세션으로 복구 (자동 로그아웃 방지)
      if (oldSession) {
        await supabase.auth.setSession({
          access_token: oldSession.access_token,
          refresh_token: oldSession.refresh_token
        });
      }
    }

    alert('사용자 생성이 완료되었습니다!');
    
    // 화면 목록(Table)에 추가하여 즉시 반영된 것을 보여줌
    const tr = document.createElement('tr');
    const today = new Date().toISOString().split('T')[0];
    tr.innerHTML = `<td>${email}</td><td>방금 전</td><td>${today}</td>`;
    if (elements.userTableBody) elements.userTableBody.appendChild(tr);
    
    closeUserModal();
  });
}

function initAuth() {
  if (!hasSupabaseConfig() || !elements.loginScreen) return;

  supabase.auth.getSession().then(({ data: { session } }) => {
    elements.loginScreen.style.display = session ? 'none' : 'flex';
  });

  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
      elements.loginScreen.style.display = 'none';
    } else if (event === 'SIGNED_OUT') {
      elements.loginScreen.style.display = 'flex';
    }
  });
}

attachEvents();
initAuth();
setPage(currentPage);
setDbStatus(isSupabaseConfigured ? 'warning' : 'error', isSupabaseConfigured ? 'Supabase 연결 준비중...' : 'Supabase 설정 필요');
loadClients();

// 초기 사용자 목록 로드 (프론트엔드 UI 표시용)
// 주의: 실제 서비스에서는 보안상 auth.users를 직접 조회할 수 없으므로 Edge Function이나 profiles 테이블을 사용해야 합니다.
function loadUsers() {
  if (elements.userTableBody) {
    elements.userTableBody.innerHTML = `
      <tr><td>admin@example.com (관리자)</td><td>최근</td><td>2024-01-01</td></tr>
    `;
  }
}
loadUsers();
