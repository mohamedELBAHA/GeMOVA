// Graph visualization module
class GraphVisualization {
    constructor(containerId, data) {
        this.containerId = containerId;
        this.data = this.processData(data);
        this.container = document.getElementById(containerId);
        
        // D3 selections
        this.svg = null;
        this.g = null;
        this.simulation = null;
        this.link = null;
        this.node = null;
        
        // State
        this.selectedNode = null;
        this.activeCategories = new Set(Object.keys(data.categories));
        this.activeLinkTypes = new Set(Object.keys(data.linkTypes));
        this.currentYear = 2024;
        
        // Initialize
        this.init();
    }

    processData(rawData) {
        // Create node map for efficient lookup
        const nodeMap = new Map(rawData.nodes.map(node => [node.id, node]));
        
        // Process links to use node objects instead of IDs
        const processedLinks = rawData.links.map(link => ({
            ...link,
            source: nodeMap.get(link.source),
            target: nodeMap.get(link.target)
        }));
        
        return {
            ...rawData,
            links: processedLinks,
            nodeMap
        };
    }

    init() {
        this.setupSVG();
        this.setupSimulation();
        this.render();
        this.setupZoom();
    }

    setupSVG() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        this.svg = d3.select(`#${this.containerId}`)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .on('click', () => this.deselectNode());
        
        // Add arrow markers for links
        const defs = this.svg.append('defs');
        
        Object.entries(this.data.linkTypes).forEach(([type, config]) => {
            defs.append('marker')
                .attr('id', `arrow-${type}`)
                .attr('viewBox', '0 -5 10 10')
                .attr('refX', 25)
                .attr('refY', 0)
                .attr('markerWidth', 6)
                .attr('markerHeight', 6)
                .attr('orient', 'auto')
                .append('path')
                .attr('d', 'M0,-5L10,0L0,5')
                .attr('fill', config.color);
        });
        
        this.g = this.svg.append('g');
    }

    setupSimulation() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        this.simulation = d3.forceSimulation()
            .force('link', d3.forceLink()
                .id(d => d.id)
                .distance(200)
                .strength(0.8))
            .force('charge', d3.forceManyBody()
                .strength(-1200))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide()
                .radius(d => d.size + 15)
                .strength(0.9))
            .force('x', d3.forceX(width / 2).strength(0.02))
            .force('y', d3.forceY(height / 2).strength(0.02));
    }

    setupZoom() {
        const zoom = d3.zoom()
            .scaleExtent([0.3, 7])
            .on('zoom', (event) => {
                this.g.attr('transform', event.transform);
            });
        
        this.svg.call(zoom);
        
        // Initial zoom
        this.svg.call(zoom.transform, d3.zoomIdentity.scale(0.8));
    }

    render() {
        const filteredData = this.getFilteredData();
        
        // Update simulation
        this.simulation.nodes(filteredData.nodes);
        this.simulation.force('link').links(filteredData.links);
        
        // Render links
        this.renderLinks(filteredData.links);
        
        // Render nodes
        this.renderNodes(filteredData.nodes);
        
        // Restart simulation
        this.simulation.alpha(1).restart();
        
        // Setup tick handler
        this.simulation.on('tick', () => this.tick());
    }

    renderLinks(links) {
        this.link = this.g.selectAll('.link')
            .data(links, d => `${d.source.id}-${d.target.id}`);
        
        // Exit
        this.link.exit()
            .transition()
            .duration(300)
            .style('stroke-opacity', 0)
            .remove();
        
        // Enter + Update
        this.link = this.link.enter()
            .append('line')
            .attr('class', 'link')
            .style('stroke-opacity', 0)
            .merge(this.link);
        
        this.link
            .transition()
            .duration(300)
            .style('stroke-opacity', 0.5)
            .attr('stroke-width', 1.5)
            .attr('stroke', d => this.data.linkTypes[d.type].color)
            .attr('marker-end', d => `url(#arrow-${d.type})`);
    }

    renderNodes(nodes) {
        this.node = this.g.selectAll('.node')
            .data(nodes, d => d.id);
        
        // Exit
        this.node.exit()
            .transition()
            .duration(300)
            .style('opacity', 0)
            .remove();
        
        // Enter
        const nodeEnter = this.node.enter()
            .append('g')
            .attr('class', 'node')
            .style('opacity', 0);
        
        nodeEnter.append('circle');
        nodeEnter.append('text');
        
        // Merge
        this.node = nodeEnter.merge(this.node);
        
        // Update
        this.node.transition()
            .duration(300)
            .style('opacity', 1);
        
        this.node.select('circle')
            .attr('r', d => d.size)
            .attr('fill', d => this.data.categories[d.category].color)
            .attr('stroke', '#ffffff')
            .on('click', (event, d) => this.selectNode(event, d))
            .on('mouseover', (event, d) => this.highlightConnections(d))
            .on('mouseout', () => this.unhighlightConnections())
            .call(this.drag());
        
        this.node.select('text')
            .attr('class', 'node-label')
            .attr('dy', d => d.size + 15)
            .text(d => d.name);
    }

    drag() {
        return d3.drag()
            .on('start', (event, d) => {
                if (!event.active) this.simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            })
            .on('drag', (event, d) => {
                d.fx = event.x;
                d.fy = event.y;
            })
            .on('end', (event, d) => {
                if (!event.active) this.simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            });
    }

    tick() {
        if (this.link) {
            this.link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);
        }
        
        if (this.node) {
            this.node.attr('transform', d => `translate(${d.x || 0},${d.y || 0})`);
        }
    }

    getFilteredData() {
        // Filter nodes by year
        const filteredNodes = this.data.nodes.filter(d => 
            d.year <= this.currentYear && 
            this.activeCategories.has(d.category)
        );
        
        const filteredNodeIds = new Set(filteredNodes.map(d => d.id));
        
        // Filter links
        const filteredLinks = this.data.links.filter(l =>
            filteredNodeIds.has(l.source.id) &&
            filteredNodeIds.has(l.target.id) &&
            this.activeLinkTypes.has(l.type)
        );
        
        return { nodes: filteredNodes, links: filteredLinks };
    }

    selectNode(event, node) {
        event.stopPropagation();
        this.selectedNode = node;
        this.showInfoPanel(node);
    }

    deselectNode() {
        this.selectedNode = null;
        this.hideInfoPanel();
    }

    showInfoPanel(node) {
        const panel = document.getElementById('info-panel');
        const category = this.data.categories[node.category];
        
        // Build papers HTML
        let papersHTML = '';
        if (node.papers && node.papers.length > 0) {
            papersHTML = node.papers.map(paper => `
                <a href="${paper.url}" target="_blank" rel="noopener noreferrer" 
                   class="flex items-center gap-2 text-sky-500 hover:text-sky-600 hover:underline transition-colors duration-200 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>${paper.title} (${paper.year})</span>
                </a>
            `).join('');
        }
        
        // Build code links HTML
        let codeHTML = '';
        if (node.code && node.code.length > 0) {
            codeHTML = `
                <div class="mt-4">
                    <h3 class="font-semibold mb-2">Code</h3>
                    <div class="flex flex-wrap gap-2">
                        ${node.code.map(code => `
                            <a href="${code.url}" target="_blank" 
                               class="px-3 py-1 bg-slate-700 rounded text-xs hover:bg-slate-600 transition-colors">
                                ${code.language}
                            </a>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        // Build key contributions HTML
        let contributionsHTML = '';
        if (node.keyContributions && node.keyContributions.length > 0) {
            contributionsHTML = `
                <div class="mt-4">
                    <h3 class="font-semibold mb-2">Key Contributions</h3>
                    <ul class="list-disc list-inside space-y-1 text-sm text-slate-400">
                        ${node.keyContributions.map(c => `<li>${c}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
        
        panel.innerHTML = `
            <button id="close-panel" class="absolute top-4 right-4 text-slate-400 hover:text-white transition z-10">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
            
            <div class="flex flex-col gap-4 pt-8">
                <div>
                    <h2 class="text-2xl font-bold text-white">${node.fullName}</h2>
                    <p class="text-slate-400">${node.name} • ${node.year}</p>
                </div>
                
                <div>
                    <span class="text-sm font-semibold px-3 py-1 rounded-full text-white" 
                          style="background-color: ${category.color};">
                        ${category.name}
                    </span>
                </div>
                
                <p class="text-slate-300 leading-relaxed">${node.description}</p>
                
                <div class="bg-slate-900/50 p-4 rounded-lg border-l-4" 
                     style="border-color: ${category.color};">
                    <h3 class="font-semibold text-white mb-2">Main Idea</h3>
                    <p class="text-sm text-slate-400">${node.mainIdea}</p>
                </div>
                
                ${contributionsHTML}
                
                <div>
                    <h3 class="font-semibold text-white mb-3">Publications</h3>
                    <div class="flex flex-col gap-3">${papersHTML}</div>
                </div>
                
                ${codeHTML}
                
                ${node.tags ? `
                    <div class="flex flex-wrap gap-2 mt-4">
                        ${node.tags.map(tag => `
                            <span class="text-xs px-2 py-1 bg-slate-800 rounded text-slate-400">
                                #${tag}
                            </span>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
        
        // Show panel with consistent animation
        panel.classList.add('show');
        
        // Setup close button
        document.getElementById('close-panel').addEventListener('click', () => {
            this.deselectNode();
        });
    }

    hideInfoPanel() {
        const panel = document.getElementById('info-panel');
        panel.classList.remove('show');
    }

    highlightConnections(node) {
        const isConnected = (a, b) => {
            return this.data.links.some(l => 
                (l.source.id === a.id && l.target.id === b.id) ||
                (l.source.id === b.id && l.target.id === a.id)
            );
        };
        
        // Fade non-connected nodes
        this.node.classed('faded', n => n.id !== node.id && !isConnected(node, n));
        
        // Highlight connected links
        this.link
            .classed('highlighted', l => l.source.id === node.id || l.target.id === node.id)
            .classed('faded', l => l.source.id !== node.id && l.target.id !== node.id);
    }

    unhighlightConnections() {
        this.node.classed('faded', false);
        this.link.classed('highlighted', false).classed('faded', false);
    }

    filterByYear(year) {
        this.currentYear = year;
        this.render();
    }

    toggleLinkType(type, active) {
        if (active) {
            this.activeLinkTypes.add(type);
        } else {
            this.activeLinkTypes.delete(type);
        }
        this.render();
    }

    toggleCategory(category, active) {
        if (active) {
            this.activeCategories.add(category);
        } else {
            this.activeCategories.delete(category);
        }
        this.render();
    }

    searchNodes(query) {
        const lowerQuery = query.toLowerCase().trim();
        
        if (!query) {
            // Reset all nodes and links to normal opacity
            this.node.style('opacity', 1);
            this.link.style('opacity', 0.5);
            this.node.classed('search-highlighted', false);
            return;
        }
        
        // Find matching nodes
        const matchingNodes = new Set();
        
        // Fade nodes that don't match and highlight those that do
        this.node.style('opacity', d => {
            const matches = d.name.toLowerCase().includes(lowerQuery) ||
                          d.fullName.toLowerCase().includes(lowerQuery) ||
                          (d.description && d.description.toLowerCase().includes(lowerQuery)) ||
                          (d.tags && d.tags.some(tag => tag.toLowerCase().includes(lowerQuery))) ||
                          (d.keyContributions && d.keyContributions.some(contrib => 
                              contrib.toLowerCase().includes(lowerQuery)));
            
            if (matches) {
                matchingNodes.add(d.id);
            }
            
            return matches ? 1 : 0.2;
        }).classed('search-highlighted', d => {
            const matches = d.name.toLowerCase().includes(lowerQuery) ||
                          d.fullName.toLowerCase().includes(lowerQuery) ||
                          (d.description && d.description.toLowerCase().includes(lowerQuery)) ||
                          (d.tags && d.tags.some(tag => tag.toLowerCase().includes(lowerQuery))) ||
                          (d.keyContributions && d.keyContributions.some(contrib => 
                              contrib.toLowerCase().includes(lowerQuery)));
            return matches;
        });
        
        // Fade links accordingly - show connections between matching nodes
        this.link.style('opacity', l => {
            const sourceMatch = matchingNodes.has(l.source.id);
            const targetMatch = matchingNodes.has(l.target.id);
            
            if (sourceMatch && targetMatch) return 0.8; // Both nodes match
            if (sourceMatch || targetMatch) return 0.4; // One node matches
            return 0.05; // No matches
        });
    }

    updateTheme(isLightMode) {
        // Update node labels
        this.node.selectAll('text')
            .style('fill', isLightMode ? '#1e293b' : '#e0e0e0');
        
        // Update node strokes
        this.node.selectAll('circle')
            .style('stroke', isLightMode ? '#f8fafc' : '#ffffff');
        
        // Update link colors for light mode
        this.link
            .style('stroke', d => {
                const originalColor = this.data.linkTypes[d.type].color;
                return isLightMode ? this.adjustColorForLightMode(originalColor) : originalColor;
            });
        
        // Update arrow markers
        const linkTypes = this.data.linkTypes;
        const markers = this.svg.selectAll('marker path');
        markers.style('fill', function() {
            const markerId = d3.select(this.parentNode).attr('id');
            const type = markerId.replace('arrow-', '');
            const originalColor = linkTypes[type].color;
            return isLightMode ? '#64748b' : originalColor;
        });
        
        // Update SVG background
        this.svg.style('background-color', isLightMode ? '#f8fafc' : '#0f172a');
    }
    
    adjustColorForLightMode(color) {
        // Convert bright colors to darker versions for light mode
        const colorMap = {
            '#3b82f6': '#1d4ed8', // blue
            '#ef4444': '#dc2626', // red
            '#10b981': '#059669', // green
            '#f59e0b': '#d97706', // yellow
            '#8b5cf6': '#7c3aed', // purple
            '#f97316': '#ea580c', // orange
            '#06b6d4': '#0891b2', // cyan
            '#84cc16': '#65a30d', // lime
        };
        
        return colorMap[color] || '#64748b';
    }
}

export { GraphVisualization };