/**
 * Authenticas Marketing Site - JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
  // Stage tabs interaction
  const stageTabs = document.querySelectorAll('.stage-tab');
  const stageImages = document.querySelectorAll('.stage-image');

  stageTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const stage = tab.dataset.stage;
      
      // Update tabs
      stageTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Update images
      stageImages.forEach(img => {
        img.classList.remove('active');
        if (img.dataset.stage === stage) {
          img.classList.add('active');
        }
      });
    });
  });

  // Testimonials carousel
  const testimonialCards = document.querySelectorAll('.testimonial-card');
  const prevBtn = document.querySelector('.carousel-btn.prev');
  const nextBtn = document.querySelector('.carousel-btn.next');
  let currentTestimonial = 0;

  function showTestimonial(index) {
    testimonialCards.forEach((card, i) => {
      card.classList.remove('active');
      if (i === index) {
        card.classList.add('active');
      }
    });
  }

  if (prevBtn && nextBtn) {
    prevBtn.addEventListener('click', () => {
      currentTestimonial = (currentTestimonial - 1 + testimonialCards.length) % testimonialCards.length;
      showTestimonial(currentTestimonial);
    });

    nextBtn.addEventListener('click', () => {
      currentTestimonial = (currentTestimonial + 1) % testimonialCards.length;
      showTestimonial(currentTestimonial);
    });

    // Auto-rotate testimonials
    setInterval(() => {
      currentTestimonial = (currentTestimonial + 1) % testimonialCards.length;
      showTestimonial(currentTestimonial);
    }, 5000);
  }

  // Code tabs
  const codeTabBtns = document.querySelectorAll('.code-tab-btn');
  const codeContent = document.getElementById('code-content');

  const codeExamples = {
    curl: `<span class="code-keyword">curl</span> -X POST https://api.authenticas.se/verifyPurchase \\
  -H <span class="code-string">"Authorization: Bearer DIN_API_NYCKEL"</span> \\
  -H <span class="code-string">"Content-Type: application/json"</span> \\
  -d <span class="code-string">'{
    "email": "anstald@foretag.se",
    "amount": 2500,
    "currency": "SEK"
  }'</span>`,
    
    node: `<span class="code-keyword">const</span> response = <span class="code-keyword">await</span> fetch(<span class="code-string">'https://api.authenticas.se/verifyPurchase'</span>, {
  method: <span class="code-string">'POST'</span>,
  headers: {
    <span class="code-string">'Authorization'</span>: <span class="code-string">\`Bearer \${API_NYCKEL}\`</span>,
    <span class="code-string">'Content-Type'</span>: <span class="code-string">'application/json'</span>
  },
  body: JSON.stringify({
    email: <span class="code-string">'anstald@foretag.se'</span>,
    amount: 2500,
    currency: <span class="code-string">'SEK'</span>
  })
});`,
    
    python: `<span class="code-keyword">import</span> requests

response = requests.post(
    <span class="code-string">'https://api.authenticas.se/verifyPurchase'</span>,
    headers={
        <span class="code-string">'Authorization'</span>: <span class="code-string">f'Bearer {API_NYCKEL}'</span>,
        <span class="code-string">'Content-Type'</span>: <span class="code-string">'application/json'</span>
    },
    json={
        <span class="code-string">'email'</span>: <span class="code-string">'anstald@foretag.se'</span>,
        <span class="code-string">'amount'</span>: 2500,
        <span class="code-string">'currency'</span>: <span class="code-string">'SEK'</span>
    }
)`,
    
    csharp: `<span class="code-keyword">var</span> client = <span class="code-keyword">new</span> HttpClient();
client.DefaultRequestHeaders.Add(<span class="code-string">"Authorization"</span>, <span class="code-string">$"Bearer {ApiNyckel}"</span>);

<span class="code-keyword">var</span> response = <span class="code-keyword">await</span> client.PostAsJsonAsync(
    <span class="code-string">"https://api.authenticas.se/verifyPurchase"</span>,
    <span class="code-keyword">new</span> {
        email = <span class="code-string">"anstald@foretag.se"</span>,
        amount = 2500,
        currency = <span class="code-string">"SEK"</span>
    }
);`
  };

  codeTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.dataset.lang;
      
      codeTabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      if (codeContent && codeExamples[lang]) {
        codeContent.innerHTML = codeExamples[lang];
      }
    });
  });

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      
      e.preventDefault();
      const target = document.querySelector(href);
      
      if (target) {
        const navHeight = document.querySelector('.nav').offsetHeight;
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight - 20;
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // Nav scroll effect
  const nav = document.querySelector('.nav');
  window.addEventListener('scroll', () => {
    if (window.pageYOffset > 50) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  });

  // Animate elements on scroll
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.feature-block, .hero-card, .stage-tab').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
  });

  console.log('Authenticas marketing site loaded');
});
