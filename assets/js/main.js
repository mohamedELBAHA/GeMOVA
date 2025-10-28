// Main application entry point
import { GraphVisualization } from './graph.js';
import { loadModelsData, setupEventListeners } from './utils.js';

class GenerativeModelsApp {
    constructor() {
        this.data = null;
        this.graph = null;
        this.config = {
            dataUrl: 'assets/data/models.json',
            defaultYear: 2024,
            animationDuration: 300
        };
    }

    async initialize() {
        try {
            console.log('Starting initialization...');
            // Show loading screen
            this.showLoading(true);

            console.log('Loading data from:', this.config.dataUrl);
            // Load data
            this.data = await loadModelsData(this.config.dataUrl);
            console.log('Data loaded successfully:', this.data);
            
            // Initialize graph visualization
            console.log('Initializing graph...');
            this.graph = new GraphVisualization('graph-container', this.data);
            
            // Setup UI event listeners
            console.log('Setting up UI...');
            this.setupUI();
            
            // Hide loading screen
            this.showLoading(false);
            
            // Fade in the main container
            document.getElementById('container').style.opacity = '1';
            
            console.log('Initialization complete!');
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError('Error loading data');
        }
    }

    setupUI() {
        // Dual range year sliders
        this.setupYearRangeSliders();

        // Search functionality
        const searchInput = document.getElementById('search');
        searchInput.addEventListener('input', (e) => {
            this.graph.searchNodes(e.target.value);
        });

        // Add keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Escape key to clear search
            if (e.key === 'Escape') {
                searchInput.value = '';
                this.graph.searchNodes('');
                searchInput.blur();
            }
            // Ctrl/Cmd + F to focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                searchInput.focus();
            }
        });

        // Category filters
        this.setupCategoryFilters();

        // Link type filters
        this.setupLinkFilters();

        // Reset buttons
        this.setupResetButtons();

        // Theme toggle
        this.setupThemeToggle();

        // Stats
        this.updateStats();

        // Footer date
        document.getElementById('footer-date').textContent = 
            new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
    }

    setupYearRangeSliders() {
        const minSlider = document.getElementById('year-min-slider');
        const maxSlider = document.getElementById('year-max-slider');
        const rangeLabel = document.getElementById('year-range-label');
        const rangeTrack = document.getElementById('year-range-track');
        
        const MIN_YEAR = 2013;
        const MAX_YEAR = 2024;
        
        let minValue = parseInt(minSlider.value);
        let maxValue = parseInt(maxSlider.value);
        let lastChanged = null; // Track which slider was last changed
        
        const updateRange = () => {
            // Ensure min is not greater than max
            if (minValue > maxValue) {
                if (lastChanged === 'min') {
                    maxValue = minValue;
                    maxSlider.value = maxValue;
                } else if (lastChanged === 'max') {
                    minValue = maxValue;
                    minSlider.value = minValue;
                }
            }
            
            // Update label
            rangeLabel.textContent = `${minValue} - ${maxValue}`;
            
            // Update visual track
            const minPercent = ((minValue - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100;
            const maxPercent = ((maxValue - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * 100;
            
            rangeTrack.style.left = `${minPercent}%`;
            rangeTrack.style.width = `${maxPercent - minPercent}%`;
            
            // Update graph
            this.graph.filterByYearRange(minValue, maxValue);
        };
        
        minSlider.addEventListener('input', (event) => {
            minValue = parseInt(event.target.value);
            lastChanged = 'min';
            updateRange();
        });
        
        maxSlider.addEventListener('input', (event) => {
            maxValue = parseInt(event.target.value);
            lastChanged = 'max';
            updateRange();
        });
        
        // Initial setup
        updateRange();
    }

    setupCategoryFilters() {
        const container = document.getElementById('category-legend');
        const categories = this.data.categories;

        Object.entries(categories).forEach(([key, category]) => {
            const item = document.createElement('label');
            item.className = 'flex items-center space-x-3 mb-2 cursor-pointer';
            
            item.innerHTML = `
                <input type="checkbox" checked class="filter-checkbox category-filter" 
                       style="--checkbox-color: ${category.color}"
                       data-category="${key}">
                <span class="text-sm legend-text">${category.name}</span>
            `;
            
            item.querySelector('input').addEventListener('change', (e) => {
                this.graph.toggleCategory(key, e.target.checked);
            });
            
            container.appendChild(item);
        });
    }

    setupLinkFilters() {
        const container = document.getElementById('link-legend');
        const linkTypes = this.data.linkTypes;

        Object.entries(linkTypes).forEach(([key, linkType]) => {
            const item = document.createElement('label');
            item.className = 'flex items-center space-x-3 cursor-pointer';
            
            item.innerHTML = `
                <input type="checkbox" checked class="filter-checkbox" 
                       style="--checkbox-color: ${linkType.color}"
                       data-link-type="${key}">
                <span class="text-sm legend-text">${linkType.label}</span>
            `;
            
            item.querySelector('input').addEventListener('change', (e) => {
                this.graph.toggleLinkType(key, e.target.checked);
            });
            
            container.appendChild(item);
        });
    }

    setupResetButtons() {
        // Reset categories
        document.getElementById('reset-categories').addEventListener('click', () => {
            const checkboxes = document.querySelectorAll('.category-filter');
            checkboxes.forEach(checkbox => {
                checkbox.checked = true;
                const category = checkbox.dataset.category;
                this.graph.toggleCategory(category, true);
            });
        });

        // Reset link types
        document.getElementById('reset-links').addEventListener('click', () => {
            const checkboxes = document.querySelectorAll('[data-link-type]');
            checkboxes.forEach(checkbox => {
                checkbox.checked = true;
                const linkType = checkbox.dataset.linkType;
                this.graph.toggleLinkType(linkType, true);
            });
        });
    }

    setupThemeToggle() {
        const toggle = document.getElementById('theme-toggle');
        const body = document.body;
        let isLightMode = false;

        toggle.addEventListener('click', () => {
            isLightMode = !isLightMode;
            
            // Add transition class for smooth switching
            body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
            
            body.classList.toggle('light-mode', isLightMode);
            
            // Toggle icons with smooth transition
            const darkIcon = document.getElementById('theme-icon-dark');
            const lightIcon = document.getElementById('theme-icon-light');
            
            if (isLightMode) {
                darkIcon.style.transform = 'rotate(180deg) scale(0)';
                lightIcon.style.transform = 'rotate(0deg) scale(1)';
                darkIcon.classList.add('hidden');
                lightIcon.classList.remove('hidden');
            } else {
                lightIcon.style.transform = 'rotate(180deg) scale(0)';
                darkIcon.style.transform = 'rotate(0deg) scale(1)';
                lightIcon.classList.add('hidden');
                darkIcon.classList.remove('hidden');
            }
            
            // Update graph theme
            this.graph.updateTheme(isLightMode);
            
            // Remove transition after animation completes
            setTimeout(() => {
                body.style.transition = '';
            }, 300);
        });
        
        // Set initial icon transitions
        const darkIcon = document.getElementById('theme-icon-dark');
        const lightIcon = document.getElementById('theme-icon-light');
        darkIcon.style.transition = 'transform 0.3s ease';
        lightIcon.style.transition = 'transform 0.3s ease';
    }

    updateStats() {
        const stats = document.getElementById('stats');
        const nodeCount = this.data.nodes.length;
        const linkCount = this.data.links.length;
        
        stats.textContent = `${nodeCount} models • ${linkCount} connections`;
    }

    showLoading(show) {
        const loadingEl = document.getElementById('loading');
        loadingEl.style.display = show ? 'flex' : 'none';
    }

    showError(message) {
        const container = document.getElementById('app');
        container.innerHTML = `
            <div class="flex items-center justify-center h-full">
                <div class="text-center">
                    <svg class="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <p class="text-xl font-semibold mb-2">Error</p>
                    <p class="text-slate-400">${message}</p>
                </div>
            </div>
        `;
    }
}

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Global error caught:', event.error);
    // Prevent default error handling in production
    // event.preventDefault();
});

// Global unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    // Optionally show user feedback
    const errorMessage = event.reason?.message || 'An unexpected error occurred';
    console.warn('Error details:', errorMessage);
});

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app...');
    const app = new GenerativeModelsApp();
    app.initialize().catch(error => {
        console.error('App initialization failed:', error);
        // Show user-friendly error message
        const loadingEl = document.getElementById('loading');
        if (loadingEl) {
            loadingEl.innerHTML = `
                <div class="text-center">
                    <svg class="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <p class="text-xl font-semibold mb-2 text-slate-300">Failed to Load</p>
                    <p class="text-slate-400 mb-4">${error.message || 'Unable to load the application'}</p>
                    <button onclick="location.reload()" 
                            class="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-colors">
                        Retry
                    </button>
                </div>
            `;
        }
    });
});