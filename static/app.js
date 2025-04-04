let currentData = {
    flips: [],
    crafts: [],
    best: [],
    stats: {}
};

let flipSort = 'margin';

async function loadData() {
    try {
        const response = await fetch('/api/data');
        const data = await response.json();
        
        if (data.error) {
            showError(data.error);
            return;
        }
        
        currentData = data;
        updateStats(data.stats);
        updateBestOpportunities(data.best);
        updateFlipOpportunities(data.flips);
        updateCraftOpportunities(data.crafts);
        updateTimestamp(data.timestamp);
        
    } catch (error) {
        showError("Failed to connect to server");
        console.error('Error:', error);
    }
}

function updateStats(stats) {
    document.getElementById('totalFlips').textContent = stats.total_flips;
    document.getElementById('totalCrafts').textContent = stats.total_crafts;
    document.getElementById('avgFlipMargin').textContent = stats.avg_flip_margin.toFixed(1) + '%';
    document.getElementById('avgCraftMargin').textContent = stats.avg_craft_margin.toFixed(1) + '%';
}

function updateBestOpportunities(items) {
    const container = document.getElementById('bestOpportunities');
    container.innerHTML = '';
    
    items.forEach(item => {
        const marginClass = getMarginClass(item.margin);
        const card = document.createElement('div');
        card.className = 'opportunity-card';
        
        card.innerHTML = `
            <div class="item-type">${item.type.toUpperCase()}</div>
            <h3 class="item-name">${item.name}</h3>
            
            <div class="item-detail">
                <span class="detail-label">Profit Per:</span>
                <span class="detail-value profit-value ${marginClass}">$${item.profit.toLocaleString()}</span>
            </div>
            
            <div class="item-detail">
                <span class="detail-label">Margin:</span>
                <span class="detail-value ${marginClass}">${item.margin.toFixed(1)}%</span>
            </div>
            
            <div class="item-detail">
                <span class="detail-label">Weekly Potential:</span>
                <span class="detail-value potential-value">$${Math.round(item.potential).toLocaleString()}</span>
            </div>
            
            ${item.materials ? `
            <div class="materials">
                <strong>Materials:</strong> ${item.materials}
            </div>` : ''}
        `;
        
        container.appendChild(card);
    });
}

function updateFlipOpportunities(flips) {
    const container = document.getElementById('flipOpportunities');
    container.innerHTML = '';
    
    // Apply sorting
    let sortedFlips = [...flips];
    if (flipSort === 'margin') {
        sortedFlips.sort((a, b) => b.margin - a.margin);
    } else if (flipSort === 'profit') {
        sortedFlips.sort((a, b) => b.profit - a.profit);
    } else if (flipSort === 'potential') {
        sortedFlips.sort((a, b) => b.potential - a.potential);
    }
    
    sortedFlips.forEach(item => {
        const marginClass = getMarginClass(item.margin);
        const card = document.createElement('div');
        card.className = 'item-card';
        
        card.innerHTML = `
            <div class="item-type">FLIP</div>
            <h3 class="item-name">${item.name}</h3>
            
            <div class="item-detail">
                <span class="detail-label">Buy:</span>
                <span class="detail-value">$${item.cost.toLocaleString()}</span>
            </div>
            
            <div class="item-detail">
                <span class="detail-label">Sell:</span>
                <span class="detail-value">$${item.sell.toLocaleString()}</span>
            </div>
            
            <div class="item-detail">
                <span class="detail-label">Profit:</span>
                <span class="detail-value profit-value ${marginClass}">$${item.profit.toLocaleString()}</span>
            </div>
            
            <div class="item-detail">
                <span class="detail-label">Margin:</span>
                <span class="detail-value ${marginClass}">${item.margin.toFixed(1)}%</span>
            </div>
            
            <div class="item-detail">
                <span class="detail-label">Volume:</span>
                <span class="detail-value">${formatVolume(item.volume)}</span>
            </div>
            
            <div class="item-detail">
                <span class="detail-label">Potential:</span>
                <span class="detail-value potential-value">$${Math.round(item.potential).toLocaleString()}</span>
            </div>
        `;
        
        container.appendChild(card);
    });
}

function updateCraftOpportunities(crafts) {
    const container = document.getElementById('craftOpportunities');
    container.innerHTML = '';
    
    crafts.forEach(item => {
        const marginClass = getMarginClass(item.margin);
        const card = document.createElement('div');
        card.className = 'item-card';
        
        card.innerHTML = `
            <div class="item-type">CRAFT</div>
            <h3 class="item-name">${item.name}</h3>
            
            <div class="item-detail">
                <span class="detail-label">Cost:</span>
                <span class="detail-value">$${item.cost.toLocaleString()}</span>
            </div>
            
            <div class="item-detail">
                <span class="detail-label">Sell:</span>
                <span class="detail-value">$${item.sell.toLocaleString()}</span>
            </div>
            
            <div class="item-detail">
                <span class="detail-label">Profit:</span>
                <span class="detail-value profit-value ${marginClass}">$${item.profit.toLocaleString()}</span>
            </div>
            
            <div class="item-detail">
                <span class="detail-label">Margin:</span>
                <span class="detail-value ${marginClass}">${item.margin.toFixed(1)}%</span>
            </div>
            
            <div class="item-detail">
                <span class="detail-label">Volume:</span>
                <span class="detail-value">${formatVolume(item.volume)}</span>
            </div>
            
            <div class="item-detail">
                <span class="detail-label">Potential:</span>
                <span class="detail-value potential-value">$${Math.round(item.potential).toLocaleString()}</span>
            </div>
            
            <div class="materials">
                <strong>Materials:</strong> ${item.materials}
            </div>
        `;
        
        container.appendChild(card);
    });
}

function updateTimestamp(timestamp) {
    const date = new Date(timestamp);
    document.getElementById('lastUpdated').textContent = 
        `Last updated: ${date.toLocaleTimeString()}`;
}

function getMarginClass(margin) {
    if (margin > 20) return 'margin-high';
    if (margin > 10) return 'margin-medium';
    return 'margin-low';
}

function formatVolume(volume) {
    if (volume >= 1000000) return `${(volume/1000000).toFixed(1)}M`;
    if (volume >= 1000) return `${(volume/1000).toFixed(1)}K`;
    return volume;
}

function showError(message) {
    const lastUpdated = document.getElementById('lastUpdated');
    lastUpdated.textContent = message;
    lastUpdated.style.color = '#e74c3c';
}

// Setup sort buttons
document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        flipSort = btn.dataset.sort;
        updateFlipOpportunities(currentData.flips);
    });
});

// Initial load
loadData();
setInterval(loadData, 60000); // Refresh every minute