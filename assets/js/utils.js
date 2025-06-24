// Utility functions

export async function loadModelsData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return validateData(data);
    } catch (error) {
        console.error('Error loading models data:', error);
        throw error;
    }
}

export function validateData(data) {
    // Basic validation
    if (!data.nodes || !Array.isArray(data.nodes)) {
        throw new Error('Invalid data: missing nodes array');
    }
    
    if (!data.links || !Array.isArray(data.links)) {
        throw new Error('Invalid data: missing links array');
    }
    
    if (!data.categories || typeof data.categories !== 'object') {
        throw new Error('Invalid data: missing categories object');
    }
    
    if (!data.linkTypes || typeof data.linkTypes !== 'object') {
        throw new Error('Invalid data: missing linkTypes object');
    }
    
    // Validate node structure
    data.nodes.forEach((node, index) => {
        if (!node.id || !node.name || !node.category || !node.year) {
            throw new Error(`Invalid node at index ${index}: missing required fields`);
        }
    });
    
    // Validate links structure
    data.links.forEach((link, index) => {
        if (!link.source || !link.target || !link.type) {
            throw new Error(`Invalid link at index ${index}: missing required fields`);
        }
    });
    
    return data;
}

export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function downloadJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function calculateGraphMetrics(nodes, links) {
    // Calculate degree centrality
    const degreeMap = new Map();
    
    nodes.forEach(node => {
        degreeMap.set(node.id, 0);
    });
    
    links.forEach(link => {
        degreeMap.set(link.source.id || link.source,
            (degreeMap.get(link.source.id || link.source) || 0) + 1);
        degreeMap.set(link.target.id || link.target,
            (degreeMap.get(link.target.id || link.target) || 0) + 1);
    });
    
    // Find most connected nodes
    const sortedNodes = Array.from(degreeMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    return {
        totalNodes: nodes.length,
        totalLinks: links.length,
        averageDegree: (links.length * 2) / nodes.length,
        mostConnected: sortedNodes
    };
}

// Color utilities
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function adjustColor(color, amount) {
    const rgb = hexToRgb(color);
    if (!rgb) return color;
    
    const r = Math.max(0, Math.min(255, rgb.r + amount));
    const g = Math.max(0, Math.min(255, rgb.g + amount));
    const b = Math.max(0, Math.min(255, rgb.b + amount));
    
    return rgbToHex(r, g, b);
}

export function setupEventListeners() {
    // Placeholder for additional event listeners
    // This function can be extended as needed
}