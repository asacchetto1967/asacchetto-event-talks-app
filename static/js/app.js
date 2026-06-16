// State Management
let releasesState = [];
let currentFilteredReleases = [];
let selectedId = null;
let activeFilters = {
    search: '',
    category: 'all',
    dateRange: 'all'
};

// DOM Elements
const loader = document.getElementById('loader');
const errorContainer = document.getElementById('error-container');
const errorMsg = document.getElementById('error-msg');
const emptyState = document.getElementById('empty-state');
const cardsGrid = document.getElementById('cards-grid');
const btnRefresh = document.getElementById('btn-refresh');
const btnRetry = document.getElementById('btn-retry');
const cacheTimeBadge = document.getElementById('cache-time');
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search');
const dateFilter = document.getElementById('date-filter');
const categoryFiltersContainer = document.getElementById('category-filters');
const tweetDrawer = document.getElementById('tweet-drawer');
const btnCloseDrawer = document.getElementById('btn-close-drawer');
const btnCopyTweet = document.getElementById('btn-copy-tweet');
const btnTweetIntent = document.getElementById('btn-tweet-intent');
const tweetTextarea = document.getElementById('tweet-text');
const charCounter = document.getElementById('char-counter');
const selectedTypeBadge = document.getElementById('selected-type-badge');
const selectedDateSpan = document.getElementById('selected-date');
const toastContainer = document.getElementById('toast-container');

// Stats Elements
const countAll = document.getElementById('count-all');
const countFeatures = document.getElementById('count-features');
const countDeprecations = document.getElementById('count-deprecations');
const countResolved = document.getElementById('count-resolved');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    fetchReleases(false);
    setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
    // Export CSV
    const btnExportCsv = document.getElementById('btn-export-csv');
    if (btnExportCsv) {
        btnExportCsv.addEventListener('click', () => exportToCSV(currentFilteredReleases));
    }

    // Refresh buttons
    btnRefresh.addEventListener('click', () => fetchReleases(true));
    btnRetry.addEventListener('click', () => fetchReleases(true));
    
    // Search
    searchInput.addEventListener('input', (e) => {
        activeFilters.search = e.target.value.toLowerCase();
        clearSearchBtn.style.display = activeFilters.search ? 'block' : 'none';
        filterAndRender();
    });
    
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        activeFilters.search = '';
        clearSearchBtn.style.display = 'none';
        filterAndRender();
    });
    
    // Date filter
    dateFilter.addEventListener('change', (e) => {
        activeFilters.dateRange = e.target.value;
        filterAndRender();
    });
    
    // Drawer Close
    btnCloseDrawer.addEventListener('click', closeDrawer);
    
    // Copy Tweet
    btnCopyTweet.addEventListener('click', copyTweetToClipboard);
    
    // Tweet Intent
    btnTweetIntent.addEventListener('click', launchTweetIntent);
    
    // Textarea character count on edit
    tweetTextarea.addEventListener('input', () => {
        const release = releasesState.find(r => r.id === selectedId);
        updateCharCount(tweetTextarea.value, release ? release.link : '');
    });

    // Stats card quick filters
    document.querySelectorAll('.stat-card').forEach(card => {
        card.addEventListener('click', () => {
            const filter = card.getAttribute('data-filter');
            activeFilters.category = filter;
            
            // Update UI pills
            document.querySelectorAll('.filter-pill').forEach(pill => {
                if (pill.getAttribute('data-category') === filter) {
                    pill.classList.add('active');
                } else {
                    pill.classList.remove('active');
                }
            });
            
            filterAndRender();
        });
    });
}

// Fetch Releases from Backend API
async function fetchReleases(forceRefresh = false) {
    showLoader();
    closeDrawer();
    
    // Animate spinner icon
    const spinnerIcon = btnRefresh.querySelector('.spinner-icon');
    if (spinnerIcon) spinnerIcon.classList.add('loading');
    
    try {
        const url = `/api/releases${forceRefresh ? '?refresh=true' : ''}`;
        const response = await fetch(url);
        const result = await response.json();
        
        if (!response.ok || !result.success) {
            throw new Error(result.error || 'Server error occurred');
        }
        
        releasesState = result.data;
        updateCacheTime(result.cached_at);
        updateStats();
        renderCategoryFilters();
        filterAndRender();
        
        showToast('Successfully fetched latest release notes', 'success');
    } catch (err) {
        console.error('Fetch error:', err);
        showError(err.message);
    } finally {
        if (spinnerIcon) spinnerIcon.classList.remove('loading');
    }
}

// Show/Hide States
function showLoader() {
    loader.style.display = 'flex';
    errorContainer.style.display = 'none';
    emptyState.style.display = 'none';
    cardsGrid.style.display = 'none';
}

function showError(msg) {
    loader.style.display = 'none';
    errorContainer.style.display = 'flex';
    errorMsg.textContent = msg;
    emptyState.style.display = 'none';
    cardsGrid.style.display = 'none';
}

function showEmpty() {
    loader.style.display = 'none';
    errorContainer.style.display = 'none';
    emptyState.style.display = 'flex';
    cardsGrid.style.display = 'none';
}

function showContent() {
    loader.style.display = 'none';
    errorContainer.style.display = 'none';
    emptyState.style.display = 'none';
    cardsGrid.style.display = 'flex';
}

// Format Cache Time Badge
function updateCacheTime(timestamp) {
    if (!timestamp) {
        cacheTimeBadge.textContent = 'Stale / Unknown';
        return;
    }
    const date = new Date(timestamp * 1000);
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    cacheTimeBadge.innerHTML = `<i class="fa-solid fa-cloud-arrow-down"></i> Synced at ${timeStr}`;
}

// Calculate Stats and Update Counters
function updateStats() {
    const total = releasesState.length;
    const features = releasesState.filter(r => r.type.toLowerCase().includes('feature')).length;
    const deprecations = releasesState.filter(r => r.type.toLowerCase().includes('deprecation')).length;
    const resolved = total - features - deprecations;
    
    countAll.textContent = total;
    countFeatures.textContent = features;
    countDeprecations.textContent = deprecations;
    countResolved.textContent = resolved;
}

// Render Category Sidebar Filters Dynamically
function renderCategoryFilters() {
    // Count items per category
    const categories = { 'all': releasesState.length };
    
    releasesState.forEach(release => {
        const cat = release.type;
        categories[cat] = (categories[cat] || 0) + 1;
    });
    
    // Build pills HTML
    categoryFiltersContainer.innerHTML = '';
    
    // Always put 'all' first
    const sortedCategories = Object.keys(categories).sort((a, b) => {
        if (a === 'all') return -1;
        if (b === 'all') return 1;
        return categories[b] - categories[a]; // Sort by count
    });
    
    sortedCategories.forEach(cat => {
        const count = categories[cat];
        const displayLabel = cat.charAt(0).toUpperCase() + cat.slice(1);
        
        const pill = document.createElement('div');
        pill.className = `filter-pill ${activeFilters.category === cat ? 'active' : ''}`;
        pill.setAttribute('data-category', cat);
        pill.innerHTML = `
            <span>${displayLabel}</span>
            <span class="pill-count">${count}</span>
        `;
        
        pill.addEventListener('click', () => {
            document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            activeFilters.category = cat;
            filterAndRender();
        });
        
        categoryFiltersContainer.appendChild(pill);
    });
}

// Filter and Render Cards
function filterAndRender() {
    let filtered = [...releasesState];
    
    // 1. Category Filter
    if (activeFilters.category !== 'all') {
        filtered = filtered.filter(r => r.type.toLowerCase() === activeFilters.category.toLowerCase());
    }
    
    // 2. Search Filter
    if (activeFilters.search) {
        filtered = filtered.filter(r => 
            r.description_text.toLowerCase().includes(activeFilters.search) ||
            r.type.toLowerCase().includes(activeFilters.search) ||
            r.date.toLowerCase().includes(activeFilters.search)
        );
    }
    
    // 3. Date Range Filter
    if (activeFilters.dateRange !== 'all') {
        const days = parseInt(activeFilters.dateRange);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        filtered = filtered.filter(r => {
            // Parse feed date formats like "June 15, 2026"
            const entryDate = new Date(r.date);
            return !isNaN(entryDate.getTime()) && entryDate >= cutoffDate;
        });
    }
    
    currentFilteredReleases = filtered;
    
    // Render
    if (filtered.length === 0) {
        showEmpty();
    } else {
        showContent();
        renderCards(filtered);
    }
}

// Render HTML Cards into Grid
function renderCards(releases) {
    cardsGrid.innerHTML = '';
    
    releases.forEach(release => {
        const card = document.createElement('div');
        const isSelected = release.id === selectedId;
        
        card.className = `release-card ${isSelected ? 'selected' : ''}`;
        card.setAttribute('data-id', release.id);
        
        const typeClass = release.type.toLowerCase().replace(/\s+/g, '-');
        
        card.innerHTML = `
            <div class="card-selector">
                <i class="fa-solid fa-check"></i>
            </div>
            <div class="card-header">
                <span class="badge ${typeClass}">${release.type}</span>
                <span class="card-date">${release.date}</span>
                <button class="btn-copy-card" title="Copiar descrição" data-id="${release.id}">
                    <i class="fa-regular fa-copy"></i>
                </button>
            </div>
            <div class="card-body">
                ${release.description_html}
            </div>
        `;
        
        // Setup copy card text listener
        const btnCopyCard = card.querySelector('.btn-copy-card');
        if (btnCopyCard) {
            btnCopyCard.addEventListener('click', async (e) => {
                e.stopPropagation(); // Prevent card selection toggle
                try {
                    await navigator.clipboard.writeText(release.description_text);
                    showToast('Descrição copiada!', 'success');
                } catch (err) {
                    console.error('Falha ao copiar:', err);
                    showToast('Erro ao copiar', 'error');
                }
            });
        }
        
        // Setup card select click listener
        card.addEventListener('click', (e) => {
            // Ignore if user clicked an actual link in the body or the copy button
            if (e.target.tagName.toLowerCase() === 'a' || e.target.closest('.btn-copy-card')) return;
            
            toggleCardSelection(release);
        });
        
        cardsGrid.appendChild(card);
    });
}

// Toggle selection state
function toggleCardSelection(release) {
    if (selectedId === release.id) {
        // Deselect
        selectedId = null;
        document.querySelectorAll('.release-card').forEach(c => c.classList.remove('selected'));
        closeDrawer();
    } else {
        // Select
        selectedId = release.id;
        document.querySelectorAll('.release-card').forEach(c => {
            if (c.getAttribute('data-id') === release.id) {
                c.classList.add('selected');
            } else {
                c.classList.remove('selected');
            }
        });
        openDrawer(release);
    }
}

// Open Tweet Drawer with Precomposed Content
function openDrawer(release) {
    selectedTypeBadge.className = `badge ${release.type.toLowerCase().replace(/\s+/g, '-')}`;
    selectedTypeBadge.textContent = release.type;
    selectedDateSpan.textContent = release.date;
    
    const precomposedText = generateTweetText(release);
    tweetTextarea.value = precomposedText;
    updateCharCount(precomposedText, release.link);
    
    tweetDrawer.classList.add('active');
}

// Close Tweet Drawer
function closeDrawer() {
    tweetDrawer.classList.remove('active');
    if (selectedId) {
        selectedId = null;
        document.querySelectorAll('.release-card').forEach(c => c.classList.remove('selected'));
    }
}

// Generate Twitter Intended text
function generateTweetText(release) {
    const type = release.type.toUpperCase();
    const date = release.date;
    const link = release.link || 'https://cloud.google.com/bigquery/docs/release-notes';
    const rawDesc = release.description_text;
    
    // Format: "BigQuery [TYPE] ([Date]): [Description] [Link] #BigQuery"
    const prefix = `BigQuery ${type} (${date}): `;
    const suffix = ` ${link} #BigQuery`;
    
    // URL takes exactly 23 characters on X/Twitter
    const prefixLen = prefix.length;
    const urlLen = 23;
    const hashtagLen = suffix.length - link.length + urlLen;
    const maxDescLen = 280 - prefixLen - hashtagLen;
    
    let desc = rawDesc;
    if (desc.length > maxDescLen) {
        desc = desc.substring(0, maxDescLen - 3) + '...';
    }
    
    return `${prefix}${desc}${suffix}`;
}

// Update Character Counter (adjusts URLs to 23 chars for Twitter counting)
function updateCharCount(text, link) {
    let displayLength = text.length;
    if (link) {
        // Safe regex escape
        const escapedLink = link.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const urlRegex = new RegExp(escapedLink, 'g');
        if (urlRegex.test(text)) {
            displayLength = text.replace(urlRegex, 'x'.repeat(23)).length;
        }
    }
    
    charCounter.textContent = `${displayLength}/280`;
    
    if (displayLength > 280) {
        charCounter.className = 'over-limit';
    } else if (displayLength > 255) {
        charCounter.className = 'near-limit';
    } else {
        charCounter.className = '';
    }
}

// Copy Text to Clipboard
async function copyTweetToClipboard() {
    const text = tweetTextarea.value;
    try {
        await navigator.clipboard.writeText(text);
        showToast('Copied tweet to clipboard!', 'success');
    } catch (err) {
        console.error('Copy failed:', err);
        showToast('Failed to copy text', 'error');
    }
}

// Launch Twitter Web Intent
function launchTweetIntent() {
    const text = tweetTextarea.value;
    const release = releasesState.find(r => r.id === selectedId);
    const link = release ? release.link : '';
    
    // Check if over limit
    let length = text.length;
    if (link) {
        const escapedLink = link.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const urlRegex = new RegExp(escapedLink, 'g');
        if (urlRegex.test(text)) {
            length = text.replace(urlRegex, 'x'.repeat(23)).length;
        }
    }
    
    if (length > 280) {
        showToast('Tweet is over the 280 character limit!', 'error');
        return;
    }
    
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
}

// Toast Notifications Helper
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation';
    toast.innerHTML = `
        <i class="fa-solid ${icon}"></i>
        <span>${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Export Filtered Releases to CSV
function exportToCSV(releases) {
    if (!releases || releases.length === 0) {
        showToast('Nenhum dado para exportar!', 'error');
        return;
    }
    
    const headers = ['ID', 'Date', 'Type', 'Link', 'Description'];
    const rows = releases.map(r => [
        r.id,
        r.date,
        r.type,
        r.link,
        r.description_text
    ]);
    
    // Convert to CSV format with proper escaping
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    try {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `bigquery_releases_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showToast('CSV exportado com sucesso!', 'success');
    } catch (err) {
        console.error('CSV export failed:', err);
        showToast('Erro ao exportar CSV', 'error');
    }
}
