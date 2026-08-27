(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const header = $('.site-header');
  const menuButton = $('#menuButton');
  const siteNav = $('#siteNav');
  const navLinks = $$('.site-nav a');
  const navIndicator = $('#navIndicator');
  const progress = $('#scrollProgress');
  const toast = $('#toast');
  const copyEmail = $('#copyEmail');

  function setNavIndicator(link) {
    if (!link || innerWidth <= 900) return;
    navIndicator.style.width = `${link.offsetWidth}px`;
    navIndicator.style.transform = `translateX(${link.offsetLeft}px)`;
  }

  function onScroll() {
    header.classList.toggle('scrolled', scrollY > 28);
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.width = `${max > 0 ? (scrollY / max) * 100 : 0}%`;
  }
  onScroll();
  addEventListener('scroll', onScroll, { passive: true });

  menuButton.addEventListener('click', () => {
    const open = !siteNav.classList.contains('open');
    siteNav.classList.toggle('open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('menu-open', open);
  });
  navLinks.forEach(link => link.addEventListener('click', () => {
    siteNav.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
  }));

  const sections = $$('main section[id]');
  const sectionObserver = new IntersectionObserver(entries => {
    const visible = entries.filter(e => e.isIntersecting).sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    const id = visible.target.id;
    navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${id}`));
    setNavIndicator(navLinks.find(link => link.classList.contains('active')));
  }, { threshold: [0.18, 0.35, 0.55], rootMargin: '-15% 0px -58%' });
  sections.forEach(section => sectionObserver.observe(section));
  addEventListener('resize', () => setNavIndicator(navLinks.find(link => link.classList.contains('active'))));

  const reveals = $$('.reveal-up,.reveal-left,.reveal-right,.reveal-scale');
  if (reduceMotion) reveals.forEach(el => el.classList.add('revealed'));
  else {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('revealed');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: .11, rootMargin: '0px 0px -50px' });
    reveals.forEach((el, i) => {
      el.style.transitionDelay = `${Math.min((i % 5) * 45, 180)}ms`;
      revealObserver.observe(el);
    });
  }

  const designData = [
    ['01 / ANALYZE','Start with the learner, not the tool.','Clarify who the learners are, what is getting in their way, what evidence already exists, and what success should look like before choosing content or technology.','Needs assessment · learner profile · problem statement'],
    ['02 / DESIGN','Turn the evidence into a learning blueprint.','Translate the need into objectives, content sequence, activities, assessment criteria, and a clear role for technology in the learning experience.','Learning objectives · content map · assessment plan'],
    ['03 / DEVELOP','Build what learners and facilitators will actually use.','Create content, digital assets, activities, learning materials, and facilitator resources with clarity, accessibility, and the delivery context in mind.','Learning materials · media · activities · facilitator resources'],
    ['04 / IMPLEMENT','Put the design into a real learning environment.','Coordinate delivery, participants, communication, facilitation, support, and documentation so the planned experience survives contact with reality.','Delivery plan · facilitation · learner support · documentation'],
    ['05 / EVALUATE','Use the outcome to improve the next version.','Review participation, feedback, evidence, and outcomes to understand what worked, what did not, and where the learning experience should change.','Evaluation findings · recommendations · next iteration']
  ];
  const designSteps = $$('.design-step');
  const designDetail = $('#designDetail');
  const designProgress = $('#designProgress');
  const designStageLabel = $('#designStageLabel');
  function selectDesign(index) {
    designSteps.forEach((step,i) => {
      step.classList.toggle('active', i === index);
      step.setAttribute('aria-selected', String(i === index));
    });
    const [code,title,text,output] = designData[index];
    designStageLabel.textContent = `STAGE ${String(index+1).padStart(2,'0')} / 05`;
    designProgress.style.width = `${10 + index * 22.5}%`;
    designDetail.animate([
      { opacity:.15, transform:'translateY(10px)', filter:'blur(5px)' },
      { opacity:1, transform:'none', filter:'none' }
    ], { duration:360, easing:'cubic-bezier(.22,1,.36,1)' });
    designDetail.innerHTML = `
      <div class="detail-signal"><span>INPUT</span><i></i></div>
      <div class="detail-copy"><p class="detail-code">${code}</p><h3>${title}</h3><p>${text}</p></div>
      <div class="detail-output"><span>OUTPUT</span><strong>${output}</strong></div>`;
  }
  designSteps.forEach((step,i) => step.addEventListener('click', () => selectDesign(i)));

  const expTabs = $$('.experience-tab');
  const expPanels = $$('.experience-panel');
  function selectExperience(name) {
    expTabs.forEach(tab => {
      const active = tab.dataset.panel === name;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
    });
    expPanels.forEach(panel => {
      const active = panel.dataset.panel === name;
      panel.hidden = !active;
      panel.classList.toggle('active', active);
    });
  }
  expTabs.forEach(tab => tab.addEventListener('click', () => selectExperience(tab.dataset.panel)));

  copyEmail.addEventListener('click', async () => {
    const email = copyEmail.dataset.email;
    try { await navigator.clipboard.writeText(email); showToast('Email copied'); }
    catch { location.href = `mailto:${email}`; }
  });
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove('show'), 1700);
  }

  if (!reduceMotion && !coarsePointer) {
    initCursor();
    initMagnetics();
    initTilt();
  }
  if (!reduceMotion) {
    createFloatingWorld();
    initNetwork();
  } else createFloatingWorld(true);

  function initCursor() {
    const dot = $('#cursorDot');
    const ring = $('#cursorRing');
    let mx = innerWidth/2, my = innerHeight/2, rx = mx, ry = my;
    let lastSpark = 0;
    addEventListener('pointermove', e => {
      mx = e.clientX; my = e.clientY;
      dot.style.left = `${mx}px`; dot.style.top = `${my}px`;
      const now = performance.now();
      if (now - lastSpark > 65 && Math.random() > .52) {
        lastSpark = now;
        const s = document.createElement('i');
        s.className = 'cursor-spark';
        s.style.left = `${mx}px`; s.style.top = `${my}px`;
        s.style.setProperty('--sx', `${(Math.random()-.5)*28}px`);
        s.style.setProperty('--sy', `${(Math.random()-.5)*28}px`);
        document.body.appendChild(s);
        setTimeout(() => s.remove(), 600);
      }
    }, { passive:true });
    function loop() {
      rx += (mx-rx)*.17; ry += (my-ry)*.17;
      ring.style.left = `${rx}px`; ring.style.top = `${ry}px`;
      requestAnimationFrame(loop);
    }
    loop();
    $$('a,button,[data-tilt]').forEach(el => {
      el.addEventListener('mouseenter', () => document.body.classList.add('cursor-active'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-active'));
    });
  }

  function initMagnetics() {
    $$('.magnetic').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width/2;
        const y = e.clientY - r.top - r.height/2;
        el.style.transform = `translate(${x*.10}px,${y*.10}px)`;
      });
      el.addEventListener('pointerleave', () => el.style.transform = '');
    });
  }

  function initTilt() {
    $$('[data-tilt]').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX-r.left)/r.width - .5;
        const py = (e.clientY-r.top)/r.height - .5;
        el.style.transform = `perspective(1000px) rotateX(${-py*4.6}deg) rotateY(${px*5.8}deg) translateY(-2px)`;
      });
      el.addEventListener('pointerleave', () => el.style.transform = '');
    });
  }

  function createFloatingWorld(staticOnly = false) {
    const layer = $('#floatingLayer');
    const terms = [
      ['Pedagogy','book'],['Learning Design','pen'],['Curriculum','layers'],['Assessment','chart'],
      ['Research','flask'],['NLP','code'],['BERT','nodes'],['Data','database'],['LMS','screen'],
      ['Accessibility','access'],['Analytics','chart'],['Training','screen'],['Content','pen'],['UX','layers'],
      ['Community','nodes'],['Evaluation','chart'],['Instruction','book'],['Evidence','flask']
    ];
    const pos = [[3,12],[29,7],[58,11],[82,7],[92,24],[10,31],[42,29],[72,34],[87,44],[5,51],[31,50],[61,54],[93,62],[18,67],[48,70],[76,73],[7,84],[39,88]];
    const icons = {
      book:'<svg viewBox="0 0 24 24"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Zm16 0A2.5 2.5 0 0 0 17.5 3H13v15h4.5A2.5 2.5 0 0 1 20 20.5v-15Z"/></svg>',
      pen:'<svg viewBox="0 0 24 24"><path d="m4 20 4.2-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Zm9.8-12.6 3 3"/></svg>',
      layers:'<svg viewBox="0 0 24 24"><path d="m12 3 9 5-9 5-9-5 9-5Zm-9 10 9 5 9-5M3 17l9 5 9-5"/></svg>',
      chart:'<svg viewBox="0 0 24 24"><path d="M4 20V10m6 10V4m6 16v-7m4 7H2"/></svg>',
      flask:'<svg viewBox="0 0 24 24"><path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3M8 15h8"/></svg>',
      code:'<svg viewBox="0 0 24 24"><path d="m8 7-5 5 5 5m8-10 5 5-5 5m-2-13-4 16"/></svg>',
      nodes:'<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="2.4"/><circle cx="17" cy="6" r="2.4"/><circle cx="19" cy="17" r="2.4"/><path d="m7.1 10.9 7.6-3.8M7.3 13l9.4 3.4M17.6 8.4l1 6.2"/></svg>',
      database:'<svg viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></svg>',
      screen:'<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8m-4-4v4"/></svg>',
      access:'<svg viewBox="0 0 24 24"><circle cx="12" cy="4.5" r="2"/><path d="M4 8h16M12 8v12M8 20l4-6 4 6"/></svg>'
    };
    terms.forEach(([label,icon],i) => {
      const el = document.createElement('span');
      el.className = `float-item ${i%4===1 ? 'accent' : ''}`;
      el.innerHTML = `${icons[icon]}<strong>${label}</strong>`;
      el.style.left = `${pos[i][0]}%`; el.style.top = `${pos[i][1]}%`;
      el.style.setProperty('--duration', staticOnly ? '0s' : `${13 + (i%7)*1.9}s`);
      el.style.setProperty('--delay', `${-(i%6)*1.6}s`);
      el.style.setProperty('--dx', `${(i%2 ? 1:-1)*(18+(i%5)*8)}px`);
      el.style.setProperty('--dy', `${-(20+(i%4)*9)}px`);
      el.style.setProperty('--r1', `${(i%3-1)*1.8}deg`);
      el.style.setProperty('--r2', `${(1-i%3)*2.8}deg`);
      layer.appendChild(el);
    });
  }

  function initNetwork() {
    const canvas = $('#networkCanvas');
    const ctx = canvas.getContext('2d');
    const glow = $('#mouseGlow');
    let w=0,h=0,dpr=1,nodes=[],raf=0;
    const pointer = {x:innerWidth*.5,y:innerHeight*.5,active:false};
    function resize() {
      w=innerWidth; h=innerHeight; dpr=Math.min(devicePixelRatio||1,2);
      canvas.width=Math.round(w*dpr); canvas.height=Math.round(h*dpr);
      canvas.style.width=`${w}px`; canvas.style.height=`${h}px`;
      ctx.setTransform(dpr,0,0,dpr,0,0);
      const count=Math.max(34,Math.min(72,Math.floor(w*h/22000)));
      while(nodes.length<count) nodes.push({x:Math.random()*w,y:Math.random()*h,vx:(Math.random()-.5)*.18,vy:(Math.random()-.5)*.18,r:.7+Math.random()*1.4});
      nodes.length=count;
    }
    addEventListener('pointermove', e => {
      pointer.x=e.clientX; pointer.y=e.clientY; pointer.active=true;
      glow.style.left=`${e.clientX}px`; glow.style.top=`${e.clientY}px`;
    }, {passive:true});
    function draw() {
      ctx.clearRect(0,0,w,h);
      const maxDist=Math.min(155,w*.15);
      nodes.forEach(n => {
        n.x+=n.vx; n.y+=n.vy;
        if(n.x<-20)n.x=w+20;if(n.x>w+20)n.x=-20;if(n.y<-20)n.y=h+20;if(n.y>h+20)n.y=-20;
        if(pointer.active){
          const dx=n.x-pointer.x,dy=n.y-pointer.y,d=Math.hypot(dx,dy);
          if(d<150 && d>0){const f=(150-d)/150*.03;n.vx+=dx/d*f;n.vy+=dy/d*f;n.vx*=.985;n.vy*=.985;}
        }
      });
      for(let i=0;i<nodes.length;i++){
        const a=nodes[i];
        for(let j=i+1;j<nodes.length;j++){
          const b=nodes[j],dx=a.x-b.x,dy=a.y-b.y,d=Math.hypot(dx,dy);
          if(d<maxDist){const alpha=(1-d/maxDist)*.16;ctx.strokeStyle=`rgba(33,101,160,${alpha})`;ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
        }
        const pd=Math.hypot(a.x-pointer.x,a.y-pointer.y);
        const near=pointer.active && pd<170;
        ctx.fillStyle=near?'rgba(18,104,243,.66)':'rgba(32,105,166,.31)';
        ctx.beginPath();ctx.arc(a.x,a.y,near?a.r*1.8:a.r,0,Math.PI*2);ctx.fill();
      }
      raf=requestAnimationFrame(draw);
    }
    resize(); draw();
    addEventListener('resize',resize);
    document.addEventListener('visibilitychange',()=>{ if(document.hidden)cancelAnimationFrame(raf); else draw(); });
  }
})();
