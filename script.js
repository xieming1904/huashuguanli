// --- Global State ---
const LOCAL_STORAGE_KEY_TALK_TRACKS = 'salesPitchApp_talkTracks'; // Renamed for clarity
const LOCAL_STORAGE_KEY_CHAT_HISTORIES = 'salesPitchApp_chatHistories';

let talkTracks = []; // Stores all talk track objects
let customerChatHistories = {}; // { customerName: [messageObject] }
let editingTrackId = null; // ID of the track being edited, or null if adding new
let currentChatCustomer = 'Customer A'; // Tracks the currently active chat
let currentView = 'talkTracks'; // Tracks the current visible view

// --- DOM Elements ---
// Views
const talkTrackManagementView = document.getElementById('talkTrackManagementView');
const facebookChatView = document.getElementById('facebookChatView');
const dataAnalysisView = document.getElementById('dataAnalysisView');

// Sidebar Navigation
const sidebar = document.getElementById('sidebar');
const navTalkTrackManagement = document.getElementById('navTalkTrackManagement');
const navFacebookChat = document.getElementById('navFacebookChat');
const navDataAnalysis = document.getElementById('navDataAnalysis');
const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');


// Talk Track Management Elements
const addTalkTrackBtn = document.getElementById('addTalkTrackBtn');
const talkTrackModal = document.getElementById('talkTrackModal'); // Add/Edit modal
const closeModalBtn = document.getElementById('closeModalBtn'); // New close button for modal
const cancelModalBtn = document.getElementById('cancelModalBtn'); // Cancel in modal
const talkTrackForm = document.getElementById('talkTrackForm'); // Form in modal
const talkTracksContainer = document.getElementById('talkTracksContainer'); // Cards container
const modalTitle = document.getElementById('modalTitle'); // Title of the modal
const trackTitleInput = document.getElementById('trackTitle');
const trackContentInput = document.getElementById('trackContent');
const trackCategoryInput = document.getElementById('trackCategory');
const trackKeywordsInput = document.getElementById('trackKeywords');
const searchTalkTracksInput = document.getElementById('searchTalkTracks');
const filterFavoritesCheckbox = document.getElementById('filterFavorites');
const sortTalkTracksSelect = document.getElementById('sortTalkTracks');

// Facebook Chat View Elements
const customerList = document.getElementById('customerList');
const currentChatCustomerName = document.getElementById('currentChatCustomerName');
const currentChatCustomerIcon = document.getElementById('currentChatCustomerIcon'); // Added for chat header icon
const chatMessages = document.getElementById('chatMessages'); // Message display area
const chatInput = document.getElementById('chatInput'); // Message typing input
const sendChatMessageBtn = document.getElementById('sendChatMessageBtn');
const selectTalkTrackChatBtn = document.getElementById('selectTalkTrackChatBtn');
const chatTalkTrackDropdown = document.getElementById('chatTalkTrackDropdown'); // Dropdown for talk tracks in chat
const mainHeaderTitle = document.getElementById('mainHeaderTitle');


// --- NAVIGATION / VIEW SWITCHING ---
function showView(viewId) {
    currentView = viewId;
    // Hide all views
    [talkTrackManagementView, facebookChatView, dataAnalysisView].forEach(view => {
        if (view) view.classList.add('hidden');
    });

    // Remove active class from all nav items
    [navTalkTrackManagement, navFacebookChat, navDataAnalysis].forEach(nav => {
        if (nav) nav.classList.remove('sidebar-nav-active');
    });

    let currentHeaderTitle = '销售话术管理助手'; // Default title

    if (viewId === 'talkTracks') {
        if (talkTrackManagementView) talkTrackManagementView.classList.remove('hidden');
        if (navTalkTrackManagement) navTalkTrackManagement.classList.add('sidebar-nav-active');
        currentHeaderTitle = '我的话术库';
    } else if (viewId === 'facebookChat') {
        if (facebookChatView) facebookChatView.classList.remove('hidden');
        if (navFacebookChat) navFacebookChat.classList.add('sidebar-nav-active');
        currentHeaderTitle = 'Facebook 聊天';
        populateTalkTrackDropdownForChat();
        if (!currentChatCustomer && customerList && customerList.querySelector('li')) {
            selectCustomer(customerList.querySelector('li').dataset.customer);
        } else if (currentChatCustomer) {
            selectCustomer(currentChatCustomer); // Refresh current customer view
        }
    } else if (viewId === 'dataAnalysis') {
        if (dataAnalysisView) dataAnalysisView.classList.remove('hidden');
        if (navDataAnalysis) navDataAnalysis.classList.add('sidebar-nav-active');
        currentHeaderTitle = '数据洞察';
        updateDataAnalysisMetrics();
    }

    mainHeaderTitle.textContent = currentHeaderTitle;

    // Close sidebar on navigation for mobile
    if (sidebar && sidebar.classList.contains('md:static')) { // only if sidebar is in mobile mode
         if (!sidebar.classList.contains('-translate-x-full')) {
            sidebar.classList.add('-translate-x-full');
        }
    }
}

navTalkTrackManagement.addEventListener('click', (e) => {
    e.preventDefault();
    showView('talkTracks');
});

navFacebookChat.addEventListener('click', (e) => {
    e.preventDefault();
    showView('facebookChat');
});

navDataAnalysis.addEventListener('click', (e) => {
    e.preventDefault();
    // For now, just indicate it's not implemented or show a placeholder
    // alert('数据分析功能尚未实现。');
    showView('dataAnalysis');
});

if (sidebarToggleBtn && sidebar) {
    sidebarToggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('-translate-x-full');
    });
}

// --- Data Analysis Metrics Elements ---
const metricTotalTalkTracks = document.getElementById('metricTotalTalkTracks');
const metricFavoriteTalkTracks = document.getElementById('metricFavoriteTalkTracks');
const metricAddedThisMonth = document.getElementById('metricAddedThisMonth');
const metricAvgKeywords = document.getElementById('metricAvgKeywords');
const metricPercentFavorited = document.getElementById('metricPercentFavorited');
// const metricPlaceholder = document.getElementById('metricPlaceholder'); // If needed later

// --- DATA ANALYSIS ---
function updateDataAnalysisMetrics() {
    if (currentView !== 'dataAnalysis') return; // Only run if view is active

    const totalTracks = talkTracks.length;
    const favoriteTracksCount = talkTracks.filter(track => track.favorite).length;

    // Added This Month
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed
    const addedThisMonthCount = talkTracks.filter(track => {
        if (!track.createdAt) return false;
        const createdAtDate = new Date(track.createdAt);
        return createdAtDate.getFullYear() === currentYear && createdAtDate.getMonth() === currentMonth;
    }).length;

    // Average Keywords
    let totalKeywords = 0;
    talkTracks.forEach(track => {
        totalKeywords += track.keywords ? track.keywords.length : 0;
    });
    const avgKeywords = totalTracks > 0 ? (totalKeywords / totalTracks).toFixed(1) : '0';

    // Percentage Favorited
    const percentFavorited = totalTracks > 0 ? ((favoriteTracksCount / totalTracks) * 100).toFixed(1) : '0';

    // Update DOM
    if (metricTotalTalkTracks) metricTotalTalkTracks.textContent = totalTracks;
    if (metricFavoriteTalkTracks) metricFavoriteTalkTracks.textContent = favoriteTracksCount;
    if (metricAddedThisMonth) metricAddedThisMonth.textContent = addedThisMonthCount;
    if (metricAvgKeywords) metricAvgKeywords.textContent = avgKeywords;
    if (metricPercentFavorited) metricPercentFavorited.textContent = `${percentFavorited}%`;
    // if (metricPlaceholder) metricPlaceholder.textContent = 'N/A';
}

// --- TALK TRACK CRUD MODAL ---
function showTalkTrackModal(isEdit = false, track = null) {
    editingTrackId = isEdit && track ? track.id : null;
    modalTitle.textContent = isEdit ? '编辑话术' : '添加新话术';
    talkTrackForm.reset();
    if (isEdit && track) {
        trackTitleInput.value = track.title;
        trackContentInput.value = track.content;
        trackCategoryInput.value = track.category;
        trackKeywordsInput.value = track.keywords.join(', ');
    }
    talkTrackModal.classList.remove('hidden', 'modal-hidden');
    talkTrackModal.classList.add('modal-visible');
}

function hideTalkTrackModal() {
    talkTrackModal.classList.add('modal-hidden');
    talkTrackModal.classList.remove('modal-visible');
    // Wait for transition to finish before fully hiding
    setTimeout(() => {
        talkTrackModal.classList.add('hidden');
        talkTrackForm.reset();
        editingTrackId = null;
    }, 300); // Match transition duration in style.css if any, or Tailwind's default
}

// --- TALK TRACK DATA & RENDERING ---
function renderTalkTracks() {
    if (!talkTracksContainer) return;

    const searchTerm = searchTalkTracksInput ? searchTalkTracksInput.value.toLowerCase() : '';
    const showOnlyFavorites = filterFavoritesCheckbox ? filterFavoritesCheckbox.checked : false;
    const sortOption = sortTalkTracksSelect ? sortTalkTracksSelect.value : 'date_desc';

    let tracksToDisplay = [...talkTracks]; // Use a copy for sorting and filtering

    // Sorting
    switch (sortOption) {
        case 'title_asc':
            tracksToDisplay.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'title_desc':
            tracksToDisplay.sort((a, b) => b.title.localeCompare(a.title));
            break;
        case 'date_asc':
            tracksToDisplay.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            break;
        case 'date_desc':
        default: // Default to newest first
            tracksToDisplay.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
    }

    // Filtering
    if (showOnlyFavorites) {
        tracksToDisplay = tracksToDisplay.filter(track => track.favorite);
    }

    if (searchTerm) {
        tracksToDisplay = tracksToDisplay.filter(track => {
            const titleMatch = track.title.toLowerCase().includes(searchTerm);
            const contentMatch = track.content.toLowerCase().includes(searchTerm);
            const keywordsMatch = track.keywords.some(kw => kw.toLowerCase().includes(searchTerm));
            return titleMatch || contentMatch || keywordsMatch;
        });
    }

    talkTracksContainer.innerHTML = ''; // Clear previous cards

    if (tracksToDisplay.length === 0) {
        let message = '暂无匹配的话术。';
        if (talkTracks.length === 0) {
            message = '暂无话术，请点击右上角按钮添加新的话术。';
        } else if (searchTerm && showOnlyFavorites) {
            message = '没有符合当前搜索词的收藏话术。';
        } else if (searchTerm) {
            message = '没有找到符合当前搜索词的话术。';
        } else if (showOnlyFavorites) {
            message = '您还没有收藏任何话术。';
        }
        talkTracksContainer.innerHTML = `<p class="text-gray-500 col-span-full text-center py-10">${message}</p>`;
        return;
    }

    tracksToDisplay.forEach(track => {
        const card = document.createElement('div');
        card.className = 'talk-track-card glass-effect p-5 rounded-xl shadow-lg flex flex-col justify-between transition-all duration-300 ease-in-out min-h-[220px]';
        card.innerHTML = `
            <div class="flex-grow">
                <h3 class="text-xl font-semibold text-gray-800 mb-2 break-all">${track.title}</h3>
                <p class="text-gray-600 text-sm mb-1"><strong>分类:</strong> ${track.category || '无分类'}</p>
                <p class="text-gray-700 text-sm mb-3 whitespace-pre-wrap break-words max-h-28 overflow-y-auto custom-scrollbar">${track.content}</p>
                <div class="mb-3">
                    ${track.keywords && track.keywords.length > 0 ? track.keywords.map(kw => `<span class="inline-block bg-primary-light text-primary-darker text-xs font-semibold mr-2 px-2.5 py-1 rounded-full">${kw}</span>`).join('') : '<span class="text-gray-400 text-xs">无关键词</span>'}
                </div>
            </div>
            <div class="flex justify-end space-x-2 mt-auto pt-3 border-t border-gray-200/50">
                <button class="btn-edit text-xs py-1 px-3 rounded-md flex items-center" data-id="${track.id}"><i class="fas fa-edit mr-1"></i>编辑</button>
                <button class="btn-danger text-xs py-1 px-3 rounded-md flex items-center" data-id="${track.id}"><i class="fas fa-trash mr-1"></i>删除</button>
                <button class="fav-btn text-xs ${track.favorite ? 'bg-pink-500 hover:bg-pink-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'} py-1 px-3 rounded-md flex items-center transition-colors duration-200" data-id="${track.id}">
                    <i class="fas ${track.favorite ? 'fa-heart' : 'fa-heart-o'} mr-1"></i> ${track.favorite ? '已收藏' : '收藏'}
                </button>
            </div>
        `;
        talkTracksContainer.appendChild(card);
        card.querySelector('.edit-btn').addEventListener('click', (e) => { e.stopPropagation(); handleEditTrack(track.id); });
        card.querySelector('.delete-btn').addEventListener('click', (e) => { e.stopPropagation(); handleDeleteTrack(track.id); });
        card.querySelector('.fav-btn').addEventListener('click', (e) => { e.stopPropagation(); handleFavoriteTrack(track.id); });
    });
}

// --- CRUD EVENT HANDLERS & FILTERS ---
if (addTalkTrackBtn) {
    addTalkTrackBtn.addEventListener('click', () => showTalkTrackModal());
}
if (closeModalBtn) {
    closeModalBtn.addEventListener('click', hideTalkTrackModal);
}
if (cancelModalBtn) {
    cancelModalBtn.addEventListener('click', hideTalkTrackModal);
}
if (searchTalkTracksInput) {
    searchTalkTracksInput.addEventListener('input', renderTalkTracks);
}
if (filterFavoritesCheckbox) {
    filterFavoritesCheckbox.addEventListener('change', renderTalkTracks);
}
if (sortTalkTracksSelect) {
    sortTalkTracksSelect.addEventListener('change', renderTalkTracks);
}

if (talkTrackForm) {
    talkTrackForm.addEventListener('submit', function (event) {
        event.preventDefault();
        const title = trackTitleInput.value.trim();
        const content = trackContentInput.value.trim();
        const category = trackCategoryInput.value.trim();
        const keywords = trackKeywordsInput.value.trim().split(',').map(kw => kw.trim()).filter(kw => kw && kw.length > 0);

        if (!title || !content) {
            alert('标题和内容不能为空！');
            return;
        }

        if (editingTrackId !== null) {
            const trackIndex = talkTracks.findIndex(t => t.id === editingTrackId);
            if (trackIndex > -1) {
                talkTracks[trackIndex] = { ...talkTracks[trackIndex], title, content, category, keywords };
            }
        } else {
            const newTrack = {
                id: Date.now(),
                title,
                content,
                category,
                keywords,
                favorite: false,
                createdAt: new Date().toISOString() // Add creation timestamp
            };
            talkTracks.push(newTrack);
        }

        renderTalkTracks(); // Re-render cards
        populateTalkTrackDropdownForChat(); // Update chat dropdown
        if (currentView === 'dataAnalysis') {
            updateDataAnalysisMetrics(); // Update metrics if view is active
        }
        hideTalkTrackModal(); // Hide modal
        saveTalkTracksToLocalStorage(); // Save changes
    });
}

function handleEditTrack(trackId) {
    const trackToEdit = talkTracks.find(t => t.id === trackId);
    if (trackToEdit) {
        showTalkTrackModal(true, trackToEdit); // Show modal for editing
    }
}

function handleDeleteTrack(trackId) {
    if (confirm('确定要删除这条话术吗？')) {
        talkTracks = talkTracks.filter(t => t.id !== trackId);
        renderTalkTracks();
        populateTalkTrackDropdownForChat();
        if (currentView === 'dataAnalysis') {
            updateDataAnalysisMetrics();
        }
        saveTalkTracksToLocalStorage(); // Save changes
    }
}

function handleFavoriteTrack(trackId) {
    const trackIndex = talkTracks.findIndex(t => t.id === trackId);
    if (trackIndex > -1) {
        talkTracks[trackIndex].favorite = !talkTracks[trackIndex].favorite;
        renderTalkTracks();
        if (currentView === 'dataAnalysis') {
            updateDataAnalysisMetrics();
        }
        saveTalkTracksToLocalStorage(); // Save changes
    }
}

// --- FACEBOOK CHAT FUNCTIONALITY ---
function populateTalkTrackDropdownForChat() {
    if (!chatTalkTrackDropdown) return;
    chatTalkTrackDropdown.innerHTML = ''; // Clear existing items

    const tracksForDropdown = talkTracks.filter(track => track.title && track.content);

    if (tracksForDropdown.length === 0) {
        chatTalkTrackDropdown.innerHTML = '<div class="p-2 text-sm text-gray-500 text-center">无可用话术</div>';
        return;
    }

    tracksForDropdown.forEach(track => {
        const item = document.createElement('div');
        item.className = 'p-2 hover:bg-primary-light/50 cursor-pointer text-sm truncate rounded-md transition-colors';
        item.textContent = track.title;
        item.title = track.title; // Show full title on hover
        item.addEventListener('click', () => {
            const messageText = track.content;
            addMessageToHistory(currentChatCustomer, messageText, 'user'); // Add talk track content as user message
            // chatInput.value = track.content; // Or populate input, but sending directly is better UX for this button
            chatTalkTrackDropdown.classList.add('hidden');
            if(chatInput) chatInput.focus();
            simulateCustomerReply(currentChatCustomer); // Simulate reply after sending talk track
        });
        chatTalkTrackDropdown.appendChild(item);
    });
}


if (selectTalkTrackChatBtn) {
    selectTalkTrackChatBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        populateTalkTrackDropdownForChat(); // Re-populate to ensure it's fresh
        chatTalkTrackDropdown.classList.toggle('hidden');
    });
}

// Hide dropdown if clicked outside
document.addEventListener('click', (event) => {
    if (chatTalkTrackDropdown && !chatTalkTrackDropdown.classList.contains('hidden')) {
        if (selectTalkTrackChatBtn && !selectTalkTrackChatBtn.contains(event.target) && !chatTalkTrackDropdown.contains(event.target)) {
            chatTalkTrackDropdown.classList.add('hidden');
        }
    }
});

// --- CHAT FUNCTIONALITY ---
function renderChatMessages(customerName) {
    if (!chatMessages || !customerChatHistories[customerName]) {
        if (chatMessages) chatMessages.innerHTML = '<p class="text-center text-gray-400 p-4">暂无消息</p>';
        return;
    }

    chatMessages.innerHTML = ''; // Clear existing messages
    const history = customerChatHistories[customerName];

    if(history.length === 0) {
        chatMessages.innerHTML = '<p class="text-center text-gray-400 p-4">开始聊天吧！</p>';
        return;
    }

    history.forEach(msg => {
        const messageDiv = document.createElement('div');
        const bubbleDiv = document.createElement('div');

        messageDiv.classList.add('flex', 'mb-3', 'max-w-full');
        bubbleDiv.classList.add('p-3', 'rounded-xl', 'text-sm', 'shadow', 'break-words', 'max-w-[80%]', 'leading-relaxed');

        bubbleDiv.textContent = msg.text;

        if (msg.sender === 'user') {
            messageDiv.classList.add('justify-end');
            bubbleDiv.classList.add('bg-primary', 'text-on-primary', 'rounded-br-none');
        } else if (msg.sender === 'system') {
            messageDiv.classList.add('justify-center', 'my-2'); // System messages centered
            bubbleDiv.classList.add('bg-gray-200', 'text-gray-600', 'italic', 'text-xs', 'max-w-[90%]');
        }
        else { // Customer message
            messageDiv.classList.add('justify-start');
            bubbleDiv.classList.add('bg-white', 'text-gray-800', 'rounded-bl-none', 'border', 'border-gray-200');
        }
        messageDiv.appendChild(bubbleDiv);
        chatMessages.appendChild(messageDiv);
    });
    chatMessages.scrollTop = chatMessages.scrollHeight;
}


function addMessageToHistory(customerName, text, sender) {
    if (!text.trim()) return;

    const newMessage = {
        text: text.trim(),
        sender: sender,
        timestamp: new Date().toISOString()
    };

    if (!customerChatHistories[customerName]) {
        customerChatHistories[customerName] = [];
    }
    customerChatHistories[customerName].push(newMessage);
    renderChatMessages(customerName);
    saveChatHistoriesToLocalStorage();
}

function simulateCustomerReply(customerName) {
    setTimeout(() => {
        const replies = [
            "好的，我明白了。", "感谢您的回复！", "听起来不错。", "让我想想...",
            "这个我需要确认一下。", "您还有其他问题吗？", "很高兴能帮助您。"
        ];
        const suitableTalkTracks = talkTracks.filter(t => t.content.length < 100 && t.content.length > 10);
        if (suitableTalkTracks.length > 0 && Math.random() > 0.3) { // 70% chance to use a short talk track as reply
             replies.push(suitableTalkTracks[Math.floor(Math.random() * suitableTalkTracks.length)].content);
        }

        const randomReply = replies[Math.floor(Math.random() * replies.length)];
        addMessageToHistory(customerName, randomReply, customerName);
    }, 1000 + Math.random() * 1500);
}


if (sendChatMessageBtn) {
    sendChatMessageBtn.addEventListener('click', () => {
        const messageText = chatInput.value.trim();
        if (messageText) {
            addMessageToHistory(currentChatCustomer, messageText, 'user');
            chatInput.value = '';
            simulateCustomerReply(currentChatCustomer);
        }
    });
}

if (chatInput) {
    chatInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            const messageText = chatInput.value.trim();
            if (messageText) {
                addMessageToHistory(currentChatCustomer, messageText, 'user');
                chatInput.value = '';
                simulateCustomerReply(currentChatCustomer);
            }
        }
    });
}

function selectCustomer(customerName) {
    currentChatCustomer = customerName;
    if(currentChatCustomerName) currentChatCustomerName.textContent = customerName;

    if (customerList) {
        Array.from(customerList.children).forEach(li => {
            if (li.dataset.customer === customerName) {
                li.classList.add('bg-primary-light/80', 'font-semibold', 'text-primary-darker');
                li.classList.remove('hover:bg-primary-light/50');
                const iconElement = li.querySelector('i');
                if (iconElement && currentChatCustomerIcon) {
                    currentChatCustomerIcon.className = iconElement.className.replace('mr-3', 'mr-0').replace('text-lg','text-xl');
                }
            } else {
                li.classList.remove('bg-primary-light/80', 'font-semibold', 'text-primary-darker');
                li.classList.add('hover:bg-primary-light/50');
            }
        });
    }

    if (!customerChatHistories[customerName]) {
        customerChatHistories[customerName] = [];
        addMessageToHistory(customerName, `开始与 ${customerName} 的聊天。`, 'system');
    }

    renderChatMessages(customerName);

    if (chatInput) chatInput.focus();
}

if (customerList) {
    customerList.addEventListener('click', (event) => {
        let targetLi = event.target;
        // Traverse up to find the LI if a child element (like icon or text) was clicked
        while (targetLi && targetLi.tagName !== 'LI' && targetLi !== customerList) {
            targetLi = targetLi.parentElement;
        }

        if (targetLi && targetLi.dataset.customer) {
            const selectedCustomerName = targetLi.dataset.customer;
            if (selectedCustomerName !== currentChatCustomer) {
                 selectCustomer(selectedCustomerName);
            }
        }
    });
}


// --- LOCAL STORAGE ---
function saveTalkTracksToLocalStorage() {
    localStorage.setItem(LOCAL_STORAGE_KEY_TALK_TRACKS, JSON.stringify(talkTracks));
}

function loadTalkTracksFromLocalStorage() {
    const storedTracks = localStorage.getItem(LOCAL_STORAGE_KEY_TALK_TRACKS);
    if (storedTracks) {
        try {
            const parsedTracks = JSON.parse(storedTracks);
            // Ensure createdAt is valid, might need to re-parse if stored as string and then re-stringified weirdly
            // However, new Date(isoString) in sorting should handle it.
            return parsedTracks;
        } catch (error) {
            console.error("Error parsing talk tracks from local storage:", error);
            return null;
        }
    }
    return null;
}

function saveChatHistoriesToLocalStorage() {
    localStorage.setItem(LOCAL_STORAGE_KEY_CHAT_HISTORIES, JSON.stringify(customerChatHistories));
}

function loadChatHistoriesFromLocalStorage() {
    const storedHistories = localStorage.getItem(LOCAL_STORAGE_KEY_CHAT_HISTORIES);
    if (storedHistories) {
        try {
            return JSON.parse(storedHistories);
        } catch (error) {
            console.error("Error parsing chat histories from local storage:", error);
            return null;
        }
    }
    return null;
}


// --- INITIALIZATION ---
function initializeApp() {
    const loadedTalkTracks = loadTalkTracksFromLocalStorage();
    // Add some dummy talk tracks for initial testing and diverse content length
    // Ensure dummy data also has createdAt timestamps
    const now = Date.now();
    const defaultTalkTracks = [
        { id: now + 1, title: "通用开场白", content: "您好！非常感谢您联系我们。请问有什么可以为您效劳的吗？我们很乐意协助您。", category: "通用", keywords: ["问候", "开场", "咨询"], favorite: true, createdAt: new Date(now - 86400000 * 5).toISOString() },
        { id: now + 2, title: "产品A特性介绍", content: "我们的A产品是一款行业领先的创新解决方案，它具备[特性1]、[特性2]以及[特性3]。这些独特设计旨在高效解决您在[具体场景]中遇到的痛点，并显著提升您的工作效率。许多客户反馈，使用后体验非常好。", category: "产品介绍", keywords: ["产品A", "特性", "解决方案"], favorite: false, createdAt: new Date(now - 86400000 * 3).toISOString() },
        { id: now + 3, title: "价格与套餐咨询", content: "关于价格方面，我们提供了多种灵活的套餐以满足不同需求。例如，基础版每月X元，高级版每月Y元，企业版则有定制方案。我可以根据您的具体情况，为您推荐最合适的选择。您对哪个套餐比较感兴趣呢？", category: "销售策略", keywords: ["价格", "套餐", "订阅"], favorite: false, createdAt: new Date(now - 86400000 * 1).toISOString() },
        { id: now + 4, title: "售后服务说明", content: "我们提供全面的售后服务支持，包括7x24小时在线客服、详细的产品文档以及定期的免费培训。我们的目标是确保您使用愉快，无后顾之忧。", category: "客户关怀", keywords: ["售后", "支持", "服务"], favorite: true, createdAt: new Date(now - 86400000 * 2).toISOString() },
        { id: now + 5, title: "引导成交话术", content: "了解了您的需求后，我认为我们的[产品/套餐名称]非常适合您。现在购买还可以享受[优惠活动]。您看是现在直接下单，还是需要我再为您演示一下具体操作呢？", category: "销售策略", keywords: ["成交", "购买", "优惠"], favorite: false, createdAt: new Date(now).toISOString() },
        { id: now + 6, title: "感谢与期待", content: "非常感谢您的宝贵时间与咨询！期待未来能有机会与您达成合作，共同发展。祝您生活愉快！", category: "通用", keywords: ["感谢", "结束", "期待合作"], favorite: false, createdAt: new Date(now - 86400000 * 4).toISOString() }
    ];

    talkTracks = loadedTalkTracks && loadedTalkTracks.length > 0 ? loadedTalkTracks : defaultTalkTracks;
    if (!loadedTalkTracks || loadedTalkTracks.length === 0) {
        saveTalkTracksToLocalStorage(); // Save default tracks if local storage was empty
    }

    // Load chat histories
    const loadedChatHistories = loadChatHistoriesFromLocalStorage();
    if (loadedChatHistories) {
        customerChatHistories = loadedChatHistories;
    } // No default chat histories, will be created on demand.

    renderTalkTracks();
    populateTalkTrackDropdownForChat();
    showView('talkTracks'); // Show talk track management by default

    // Set up initial customer chat
    if (customerList && customerList.querySelector('li')) {
        selectCustomer(customerList.querySelector('li').dataset.customer); // This will also render initial messages
    } else {
        // If no customers, perhaps clear the chat view or show a placeholder
        if (chatMessages) chatMessages.innerHTML = '<p class="text-center text-gray-500 p-4">请选择一个客户开始聊天。</p>';
        if (currentChatCustomerName) currentChatCustomerName.textContent = '无客户';
    }

    // Global click listener to close sidebar on outside click on mobile
    document.addEventListener('click', function(event) {
        if (sidebar && !sidebar.contains(event.target) && sidebarToggleBtn && !sidebarToggleBtn.contains(event.target)) {
            if (!sidebar.classList.contains('-translate-x-full') && sidebar.classList.contains('fixed')) { // Only if sidebar is open and in mobile view
                sidebar.classList.add('-translate-x-full');
            }
        }
    });
}

initializeApp();
