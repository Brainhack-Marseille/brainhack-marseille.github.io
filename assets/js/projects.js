/**
 * BrainHack Marseille 2026 - Projects Renderer with Full-Width Dropdown
 * Fixed version with proper URL parsing and conditional rendering
 */

(function() {
    'use strict';
  
    // Configuration
    const PROJECTS_JSON_URL = 'assets/data/projects_2026.json';
    const CONTAINER_ID = 'projects-container';
    const LOADING_ID = 'projects-loading';
    const DEFAULT_IMAGE = 'https://brainhack-marseille.github.io/BHM_2024/images/projects/project_template.png';
  
    /**
     * Main initialization function
     */
    async function init() {
      try {
        console.log('🚀 Loading BrainHack projects...');
        
        const projects = await loadProjects();
        console.log(`✅ Loaded ${projects.length} project(s)`);
        
        renderProjects(projects);
        
      } catch (error) {
        console.error('❌ Error loading projects:', error);
        showError();
      }
    }
  
    /**
     * Fetch projects JSON from server
     */
    async function loadProjects() {
      const response = await fetch(PROJECTS_JSON_URL);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const projects = await response.json();
      return projects;
    }
  
    /**
     * Render all projects to the DOM
     */
    function renderProjects(projects) {
      const container = document.getElementById(CONTAINER_ID);
      const loading = document.getElementById(LOADING_ID);
      
      if (!container) {
        console.error('Projects container not found');
        return;
      }
      
      // Remove loading indicator
      if (loading) {
        loading.remove();
      }
      
      // Clear container
      container.innerHTML = '';
      
      // Handle empty state
      if (projects.length === 0) {
        showEmptyState(container);
        return;
      }
      
      // Render each project
      projects.forEach((project, index) => {
        const elements = createProjectCard(project, index);
        container.appendChild(elements.column);
        container.appendChild(elements.details);
      });
      
      console.log(`✅ Rendered ${projects.length} project card(s)`);
    }
  
    /**
     * Check if a field has actual content
     */
    function hasContent(value) {
      if (!value) return false;
      const cleaned = value.trim().toLowerCase();
      return cleaned !== '' && 
             cleaned !== 'no response' && 
             cleaned !== '_no response_' &&
             cleaned !== 'not_applicable' &&
             cleaned !== 'not applicable';
    }
  
    /**
     * Extract multiple URLs from a text field
     * Handles: space-separated, markdown links, or plain URLs
     */
    function extractUrls(text) {
      if (!hasContent(text)) return [];
      
      const urls = [];
      
      // Pattern 1: Markdown links [text](url)
      const markdownPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
      let match;
      while ((match = markdownPattern.exec(text)) !== null) {
        urls.push({
          label: match[1].trim(),
          url: match[2].trim()
        });
      }
      
      // If we found markdown links, use those
      if (urls.length > 0) return urls;
      
      // Pattern 2: Plain URLs (http/https)
      const urlPattern = /(https?:\/\/[^\s]+)/g;
      const matches = text.match(urlPattern);
      
      if (matches) {
        matches.forEach((url, index) => {
          urls.push({
            label: `Repository ${urls.length > 0 ? index + 1 : ''}`.trim(),
            url: url.trim()
          });
        });
      }
      
      return urls;
    }
  
    /**
     * Create a project card element with full-width dropdown
     */
    function createProjectCard(project, index) {
      // Create column wrapper for compact view
      const col = document.createElement('div');
      col.className = 'col-lg-4 col-md-6 mb-4 project-card-column';
      col.setAttribute('data-aos', 'fade-up');
      col.setAttribute('data-aos-delay', (index % 3) * 100);
      
      // Generate unique ID
      const cardId = `project-${project.id || index}`;
      const detailsId = `details-${cardId}`;
      
      // Create compact card
      col.innerHTML = `
        <div class="project-card-2026" data-card-id="${cardId}">
          <div class="project-preview">
            <div class="project-image-wrapper">
              <img src="${getProjectImage(project)}" 
                   alt="${escapeHtml(project.title)}" 
                   class="project-image"
                   onerror="this.src='${DEFAULT_IMAGE}'">
            </div>
            
            <div class="project-header">
              <h4 class="project-title">${escapeHtml(project.title)}</h4>
              
              ${hasContent(project.leaders) ? `
                <p class="project-leaders">
                  <i class="icofont-user-alt-3"></i> 
                  <strong>Leaders:</strong> ${escapeHtml(project.leaders)}
                </p>
              ` : ''}
              
              ${hasContent(project.collaborators) ? `
                <p class="project-collaborators">
                  <i class="icofont-users-alt-4"></i> 
                  <strong>Collaborators:</strong> ${escapeHtml(project.collaborators)}
                </p>
              ` : ''}
            </div>
          </div>
          
          <div class="project-actions">
            <button class="btn-project-toggle" 
                    data-details-id="${detailsId}"
                    data-card-id="${cardId}">
              <span class="toggle-text">
                <i class="icofont-rounded-down"></i> Show Details
              </span>
            </button>
          </div>
        </div>
      `;
      
      // Parse repository URLs
      const repositoryUrls = extractUrls(project.repository);
      const communicationUrls = extractUrls(project.communication);
      
      // Create full-width details section
      const detailsRow = document.createElement('div');
      detailsRow.className = 'col-12 project-details-fullwidth';
      detailsRow.id = detailsId;
      detailsRow.style.display = 'none';
      detailsRow.setAttribute('data-card-id', cardId);
      
      detailsRow.innerHTML = `
        <div class="project-details-content-fullwidth">
          <div class="row">
            
            <!-- Left Column: Image & Basic Info -->
            <div class="col-lg-4">
              <div class="details-image-section">
                <img src="${getProjectImage(project)}" 
                     alt="${escapeHtml(project.title)}" 
                     class="img-fluid"
                     onerror="this.src='${DEFAULT_IMAGE}'">
                
                <h3 class="mt-3">${escapeHtml(project.title)}</h3>
                
                ${hasContent(project.leaders) ? `
                  <p class="detail-meta">
                    <i class="icofont-user-alt-3"></i> 
                    <strong>Leaders:</strong><br>
                    ${escapeHtml(project.leaders)}
                  </p>
                ` : ''}
                
                ${hasContent(project.collaborators) ? `
                  <p class="detail-meta">
                    <i class="icofont-users-alt-4"></i> 
                    <strong>Collaborators:</strong><br>
                    ${escapeHtml(project.collaborators)}
                  </p>
                ` : ''}
                
                ${hasContent(project.num_collaborators) ? `
                  <p class="detail-meta">
                    <i class="icofont-users"></i> 
                    <strong>Number of Collaborators:</strong><br>
                    ${escapeHtml(project.num_collaborators)}
                  </p>
                ` : ''}
                
                ${createMetadataList(project)}
                
                <div class="detail-links mt-3">
                  <!-- GitHub Issue (always present) -->
                  <a href="${escapeHtml(project.issue_url)}" 
                     target="_blank" 
                     rel="noopener"
                     class="btn btn-primary btn-block mb-2">
                    <i class="icofont-github"></i> View on GitHub
                  </a>
                  
                  <!-- Repository Links -->
                  ${repositoryUrls.map((repo, idx) => `
                    <a href="${escapeHtml(repo.url)}" 
                       target="_blank" 
                       rel="noopener"
                       class="btn btn-secondary btn-block mb-2">
                      <i class="icofont-code-alt"></i> ${escapeHtml(repo.label)}
                    </a>
                  `).join('')}
                  
                  <!-- Communication Links -->
                  ${communicationUrls.map((comm, idx) => `
                    <a href="${escapeHtml(comm.url)}" 
                       target="_blank" 
                       rel="noopener"
                       class="btn btn-info btn-block mb-2">
                      <i class="icofont-speech-comments"></i> ${escapeHtml(comm.label)}
                    </a>
                  `).join('')}
                  
                  <!-- Onboarding Documentation -->
                  ${hasContent(project.onboarding) ? extractUrls(project.onboarding).map((doc, idx) => `
                    <a href="${escapeHtml(doc.url)}" 
                       target="_blank" 
                       rel="noopener"
                       class="btn btn-success btn-block mb-2">
                      <i class="icofont-book-alt"></i> ${escapeHtml(doc.label)}
                    </a>
                  `).join('') : ''}
                </div>
              </div>
            </div>
            
            <!-- Right Column: Detailed Information -->
            <div class="col-lg-8">
              <div class="details-text-section">
                
                ${hasContent(project.description) ? `
                  <div class="detail-section-fullwidth">
                    <h5><i class="icofont-info-circle"></i> Description</h5>
                    <div class="detail-content">${formatMarkdown(project.description)}</div>
                  </div>
                ` : ''}
                
                ${hasContent(project.goals) ? `
                  <div class="detail-section-fullwidth">
                    <h5><i class="icofont-bullseye"></i> Goals for BrainHack Marseille 2026</h5>
                    <div class="detail-content">${formatMarkdown(project.goals)}</div>
                  </div>
                ` : ''}
                
                <div class="row">
                  ${hasContent(project.skills) ? `
                    <div class="col-md-6">
                      <div class="detail-section-fullwidth">
                        <h5><i class="icofont-tools-alt-2"></i> Skills Needed</h5>
                        <div class="detail-content">${formatMarkdown(project.skills)}</div>
                      </div>
                    </div>
                  ` : ''}
                  
                  ${hasContent(project.learning) ? `
                    <div class="col-md-6">
                      <div class="detail-section-fullwidth">
                        <h5><i class="icofont-graduate"></i> What You'll Learn</h5>
                        <div class="detail-content">${formatMarkdown(project.learning)}</div>
                      </div>
                    </div>
                  ` : ''}
                </div>
                
                ${hasContent(project.good_first_issues) ? `
                  <div class="detail-section-fullwidth">
                    <h5><i class="icofont-flag-alt-1"></i> Good First Issues</h5>
                    <div class="detail-content">${formatMarkdown(project.good_first_issues)}</div>
                  </div>
                ` : ''}
                
                ${hasContent(project.data) ? `
                  <div class="detail-section-fullwidth">
                    <h5><i class="icofont-database"></i> Data to Use</h5>
                    <div class="detail-content">${formatMarkdown(project.data)}</div>
                  </div>
                ` : ''}
                
                ${hasContent(project.type) ? `
                  <div class="detail-section-fullwidth">
                    <h5><i class="icofont-tag"></i> Project Type</h5>
                    <div class="detail-content">${formatMarkdown(project.type)}</div>
                  </div>
                ` : `
                  <div class="detail-section-fullwidth">
                    <h5><i class="icofont-tag"></i> Project Type</h5>
                    <div class="detail-content"><p>Not specified</p></div>
                  </div>
                `}
                
                ${hasContent(project.development_status) ? `
                  <div class="detail-section-fullwidth">
                    <h5><i class="icofont-chart-growth"></i> Development Status</h5>
                    <div class="detail-content">${formatMarkdown(project.development_status)}</div>
                  </div>
                ` : `
                  <div class="detail-section-fullwidth">
                    <h5><i class="icofont-chart-growth"></i> Development Status</h5>
                    <div class="detail-content"><p>Not specified</p></div>
                  </div>
                `}
                
              </div>
            </div>
            
          </div>
          
          <!-- Close Button -->
          <div class="text-center mt-4">
            <button class="btn-close-details" 
                    data-details-id="${detailsId}"
                    data-card-id="${cardId}">
              <i class="icofont-close-line"></i> Close Details
            </button>
          </div>
        </div>
      `;
      
      // Add event listeners
      const toggleBtn = col.querySelector('.btn-project-toggle');
      const closeBtn = detailsRow.querySelector('.btn-close-details');
      
      toggleBtn.addEventListener('click', function() {
        toggleDetails(detailsId, cardId);
      });
      
      closeBtn.addEventListener('click', function() {
        toggleDetails(detailsId, cardId);
      });
      
      return {
        column: col,
        details: detailsRow
      };
    }
  
    /**
     * Toggle project details visibility
     */
    function toggleDetails(detailsId, cardId) {
      const detailsElement = document.getElementById(detailsId);
      const cardColumn = document.querySelector(`[data-card-id="${cardId}"]`).closest('.project-card-column');
      const toggleBtn = document.querySelector(`.btn-project-toggle[data-details-id="${detailsId}"]`);
      const isVisible = detailsElement.style.display !== 'none';
      
      if (isVisible) {
        // Close this one
        closeDetails(detailsElement, cardColumn, toggleBtn);
      } else {
        // Close all others first
        closeAllDetails();
        
        // Open this one
        openDetails(detailsElement, cardColumn, toggleBtn);
      }
    }
  
    /**
     * Open project details
     */
    function openDetails(detailsElement, cardColumn, toggleBtn) {
      // Show details
      detailsElement.style.display = 'block';
      
      // Update button
      toggleBtn.classList.add('expanded');
      const icon = toggleBtn.querySelector('i');
      const text = toggleBtn.querySelector('.toggle-text');
      icon.className = 'icofont-rounded-up';
      text.innerHTML = '<i class="icofont-rounded-up"></i> Hide Details';
      
      // Expand column to full width
      cardColumn.classList.add('fullwidth-active');
      
      // Scroll to details
      setTimeout(() => {
        const offset = 100;
        const elementPosition = detailsElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }, 100);
    }
  
    /**
     * Close project details
     */
    function closeDetails(detailsElement, cardColumn, toggleBtn) {
      // Hide details
      detailsElement.style.display = 'none';
      
      // Update button
      toggleBtn.classList.remove('expanded');
      const icon = toggleBtn.querySelector('i');
      const text = toggleBtn.querySelector('.toggle-text');
      icon.className = 'icofont-rounded-down';
      text.innerHTML = '<i class="icofont-rounded-down"></i> Show Details';
      
      // Return column to normal width
      cardColumn.classList.remove('fullwidth-active');
    }
  
    /**
     * Close all open project details
     */
    function closeAllDetails() {
      const allDetails = document.querySelectorAll('.project-details-fullwidth');
      allDetails.forEach(detail => {
        if (detail.style.display !== 'none') {
          const cardId = detail.getAttribute('data-card-id');
          const cardColumn = document.querySelector(`[data-card-id="${cardId}"]`).closest('.project-card-column');
          const toggleBtn = document.querySelector(`.btn-project-toggle[data-card-id="${cardId}"]`);
          
          closeDetails(detail, cardColumn, toggleBtn);
        }
      });
    }
  
    /**
     * Get project image with fallback
     */
    function getProjectImage(project) {
      if (hasContent(project.image) && !project.image.includes('Leave this text')) {
        return escapeHtml(project.image);
      }
      return DEFAULT_IMAGE;
    }
  
    /**
     * Create metadata list (replacing badges)
     */
    function createMetadataList(project) {
      const metadata = [];
      
      // Git Skills
      if (hasContent(project.git_skills)) {
        metadata.push({
          icon: 'icofont-git',
          label: 'Git Skills',
          value: project.git_skills
        });
      } else {
        metadata.push({
          icon: 'icofont-git',
          label: 'Git Skills',
          value: 'Not specified'
        });
      }
      
      // Programming Languages
      if (hasContent(project.programming_languages)) {
        metadata.push({
          icon: 'icofont-code',
          label: 'Programming Languages',
          value: project.programming_languages.replace(/_/g, ' ').replace(/`/g, '')
        });
      } else {
        metadata.push({
          icon: 'icofont-code',
          label: 'Programming Languages',
          value: 'Not specified'
        });
      }
      
      // Tools
      if (hasContent(project.tools)) {
        metadata.push({
          icon: 'icofont-wrench',
          label: 'Tools',
          value: project.tools.replace(/_/g, ' ')
        });
      } else {
        metadata.push({
          icon: 'icofont-wrench',
          label: 'Tools',
          value: 'Not specified'
        });
      }
      
      // Modalities
      if (hasContent(project.modalities)) {
        metadata.push({
          icon: 'icofont-brain-alt',
          label: 'Modalities',
          value: project.modalities.replace(/_/g, ' ')
        });
      } else {
        metadata.push({
          icon: 'icofont-brain-alt',
          label: 'Modalities',
          value: 'Not specified'
        });
      }
      
      // Topics
      if (hasContent(project.topics)) {
        metadata.push({
          icon: 'icofont-tag',
          label: 'Topics',
          value: project.topics.replace(/_/g, ' ')
        });
      }
      
      if (metadata.length === 0) {
        return '';
      }
      
      return `
        <div class="detail-metadata-list mt-3">
          ${metadata.map(item => `
            <p class="detail-meta">
              <i class="${item.icon}"></i> 
              <strong>${item.label}:</strong><br>
              ${escapeHtml(item.value)}
            </p>
          `).join('')}
        </div>
      `;
    }
  
    /**
     * Format markdown text to HTML (simple conversion)
     */
    function formatMarkdown(text) {
      if (!hasContent(text)) return '';
      
      // Escape HTML first
      let html = escapeHtml(text);
      
      // Convert bold
      html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
      
      // Convert italic
      html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
      html = html.replace(/_(.+?)_/g, '<em>$1</em>');
      
      // Convert links [text](url)
      html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
      
      // Convert line breaks
      html = html.replace(/\n\n/g, '</p><p>');
      html = html.replace(/\n/g, '<br>');
      
      // Wrap in paragraph if not already
      if (!html.startsWith('<p>')) {
        html = '<p>' + html + '</p>';
      }
      
      return html;
    }
  
    /**
     * Escape HTML to prevent XSS
     */
    function escapeHtml(text) {
      if (!text) return '';
      
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  
    /**
     * Show empty state when no projects are available
     */
    function showEmptyState(container) {
      container.innerHTML = `
        <div class="col-12">
          <div class="alert alert-info text-center" role="alert" style="background: #f8f9fa; border: 2px dashed #e9c46a; border-radius: 10px; padding: 40px;">
            <i class="icofont-brain-alt" style="font-size: 64px; color: #e76f51; display: block; margin-bottom: 20px;"></i>
            <h4 style="color: #37517e;">No Projects Submitted Yet</h4>
            <p style="color: #666;">Projects will appear here once they are submitted and approved.</p>
            <p style="color: #666; font-style: italic;">Be the first to submit a project!</p>
          </div>
        </div>
      `;
    }
  
    /**
     * Show error state when loading fails
     */
    function showError() {
      const container = document.getElementById(CONTAINER_ID);
      const loading = document.getElementById(LOADING_ID);
      
      if (loading) {
        loading.remove();
      }
      
      if (container) {
        container.innerHTML = `
          <div class="col-12">
            <div class="alert alert-danger text-center" role="alert" style="border-radius: 10px; padding: 30px;">
              <i class="icofont-warning" style="font-size: 48px; display: block; margin-bottom: 15px;"></i>
              <h4>Error Loading Projects</h4>
              <p>Sorry, we couldn't load the projects. Please try refreshing the page.</p>
              <p class="small text-muted">If the problem persists, contact the organizers.</p>
            </div>
          </div>
        `;
      }
    }
  
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  
  })();