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
            this.showError('Erreur lors du chargement des données');
        }
    }

    setupUI() {
        // Year slider
        const yearSlider = document.getElementById('year-slider');
        const yearLabel = document.getElementById('year-label');
        
        yearSlider.addEventListener('input', (e) => {
            const year = parseInt(e.target.value);
            yearLabel.textContent = year;
            this.graph.filterByYear(year);
        });

        // Search functionality
        const searchInput = document.getElementById('search');
        searchInput.addEventListener('input', (e) => {
            this.graph.searchNodes(e.target.value);
        });

        // Category filters
        this.setupCategoryFilters();

        // Link type filters
        this.setupLinkFilters();

        // Theme toggle
        this.setupThemeToggle();

        // Stats
        this.updateStats();

        // Footer date
        document.getElementById('footer-date').textContent = 
            new Date().toLocaleDateString('fr-FR', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
    }

    setupCategoryFilters() {
        const container = document.getElementById('category-legend');
        const categories = this.data.categories;

        Object.entries(categories).forEach(([key, category]) => {
            const item = document.createElement('div');
            item.className = 'flex items-center space-x-3 mb-2';
            
            item.innerHTML = `
                <div class="w-4 h-4 rounded-full" style="background-color: ${category.color}"></div>
                <span class="text-sm legend-text">${category.name}</span>
            `;
            
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

    setupThemeToggle() {
        const toggle = document.getElementById('theme-toggle');
        const body = document.body;
        let isLightMode = false;

        toggle.addEventListener('click', () => {
            isLightMode = !isLightMode;
            body.classList.toggle('light-mode', isLightMode);
            
            // Toggle icons
            document.getElementById('theme-icon-dark').classList.toggle('hidden', isLightMode);
            document.getElementById('theme-icon-light').classList.toggle('hidden', !isLightMode);
            
            // Update graph theme
            this.graph.updateTheme(isLightMode);
        });
    }

    updateStats() {
        const stats = document.getElementById('stats');
        const nodeCount = this.data.nodes.length;
        const linkCount = this.data.links.length;
        
        stats.textContent = `${nodeCount} modèles • ${linkCount} connexions`;
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
                    <p class="text-xl font-semibold mb-2">Erreur</p>
                    <p class="text-slate-400">${message}</p>
                </div>
            </div>
        `;
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app...');
    const app = new GenerativeModelsApp();
    app.initialize().catch(error => {
        console.error('App initialization failed:', error);
    });
});