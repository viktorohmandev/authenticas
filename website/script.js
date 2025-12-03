/**
 * Authenticas Landing Page - JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
  // =====================================================
  // Navigation
  // =====================================================
  const nav = document.getElementById('nav');
  const navToggle = document.getElementById('nav-toggle');
  const navMenu = document.getElementById('nav-menu');
  
  // Scroll effect
  const handleScroll = () => {
    if (window.scrollY > 50) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  };
  
  window.addEventListener('scroll', handleScroll);
  handleScroll();
  
  // Mobile menu toggle
  navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('open');
    navMenu.classList.toggle('open');
  });
  
  // Close menu on link click
  navMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navToggle.classList.remove('open');
      navMenu.classList.remove('open');
    });
  });
  
  // =====================================================
  // Code Tabs
  // =====================================================
  const codeTabs = document.querySelectorAll('.code-tab');
  
  codeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabId = tab.dataset.tab;
      
      // Update active tab
      codeTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Show corresponding content
      document.querySelectorAll('.code-content').forEach(content => {
        content.classList.add('hidden');
      });
      document.getElementById(`code-${tabId}`).classList.remove('hidden');
    });
  });
  
  // =====================================================
  // Contact Form
  // =====================================================
  const contactForm = document.getElementById('contact-form');
  
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(contactForm);
    const data = Object.fromEntries(formData.entries());
    
    // Simulate form submission
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg class="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" stroke-dasharray="31.4" stroke-dashoffset="10"/>
      </svg>
      <span>Sending...</span>
    `;
    
    // Simulate API call
    setTimeout(() => {
      submitBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 13l4 4L19 7"/>
        </svg>
        <span>Request Sent!</span>
      `;
      submitBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
      
      console.log('Form submitted:', data);
      
      // Reset form after delay
      setTimeout(() => {
        contactForm.reset();
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        submitBtn.style.background = '';
      }, 3000);
    }, 1500);
  });
  
  // =====================================================
  // Smooth Scroll for Anchor Links
  // =====================================================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      
      if (href === '#') return;
      
      e.preventDefault();
      
      const target = document.querySelector(href);
      if (target) {
        const offset = 80; // Account for fixed nav
        const targetPosition = target.getBoundingClientRect().top + window.scrollY - offset;
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
  
  // =====================================================
  // Intersection Observer for Animations
  // =====================================================
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);
  
  // Observe elements that should animate on scroll
  document.querySelectorAll('.step, .feature-card, .doc-card, .integration-step').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });
  
  // Add in-view styles
  const style = document.createElement('style');
  style.textContent = `
    .in-view {
      opacity: 1 !important;
      transform: translateY(0) !important;
    }
    
    .animate-spin {
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
  
  // =====================================================
  // Terminal Typing Effect (Optional Enhancement)
  // =====================================================
  const terminal = document.querySelector('.terminal-body code');
  if (terminal) {
    // Store original content
    terminal.dataset.original = terminal.innerHTML;
  }
  
  // =====================================================
  // Statistics Counter Animation
  // =====================================================
  const statValues = document.querySelectorAll('.stat-value');
  
  const animateValue = (element, start, end, duration, suffix = '') => {
    const startTimestamp = Date.now();
    const step = () => {
      const progress = Math.min((Date.now() - startTimestamp) / duration, 1);
      const current = Math.floor(progress * (end - start) + start);
      element.textContent = current + suffix;
      
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        element.textContent = end + suffix;
      }
    };
    requestAnimationFrame(step);
  };
  
  // Observe stats section
  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const statEl = entry.target;
        const text = statEl.textContent;
        
        // Parse different stat formats
        if (text.includes('ms')) {
          animateValue(statEl, 0, 50, 1000, 'ms');
        } else if (text.includes('%')) {
          animateValue(statEl, 0, 99.9, 1500, '.9%');
        } else if (text.includes('bit')) {
          statEl.textContent = '256-bit';
        }
        
        statsObserver.unobserve(statEl);
      }
    });
  }, { threshold: 0.5 });
  
  statValues.forEach(stat => {
    statsObserver.observe(stat);
  });
  
  console.log('🔐 Authenticas landing page loaded');
});

