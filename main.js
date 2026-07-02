window.addEventListener('load', () => {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        preloader.style.opacity = '0';
        setTimeout(() => {
            preloader.style.display = 'none';
            // Start animations after preloader
            document.body.classList.add('loaded');
        }, 700);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // Register ScrollTrigger plugin from GSAP
    gsap.registerPlugin(ScrollTrigger);

    // Initial Splash Animation
    const splashTl = gsap.timeline({ paused: true });
    
    // Play the splash timeline once the preloader finishes
    const checkLoaded = setInterval(() => {
        if (document.body.classList.contains('loaded')) {
            clearInterval(checkLoaded);
            splashTl.play();
        }
    }, 100);

    splashTl.from(
        ".water-drop",
        {
            opacity: 0,
            scale: 0.2,
            rotation: () => (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 10),
            x: (i, el) => {
                const heading = document.querySelector(".hero-content h1") || document.querySelector("h2"); // Fallback to h2 if no h1
                if (!heading) return 0;
                const headingRect = heading.getBoundingClientRect();
                const originX = headingRect.left + headingRect.width / 2;
                const rect = el.getBoundingClientRect();
                const elCenterX = rect.left + rect.width / 2;
                return originX - elCenterX + (Math.random() * 40 - 20);
            },
            y: (i, el) => {
                const heading = document.querySelector(".hero-content h1") || document.querySelector("h2"); // Fallback to h2 if no h1
                if (!heading) return 0;
                const headingRect = heading.getBoundingClientRect();
                const originY = headingRect.top + headingRect.height / 2;
                const rect = el.getBoundingClientRect();
                const elCenterY = rect.top + rect.height / 2;
                return originY - elCenterY + (Math.random() * 40 - 20);
            },
            duration: () => 1.2 + Math.random() * 0.3,
            stagger: 0.06,
            ease: "power4.out",
            force3D: true,
            onStart: function() {
                this.targets().forEach(el => el.style.animation = "none");
            },
            onComplete: function() {
                this.targets().forEach(el => el.style.animation = "");
            }
        },
        0
    );

    // ==========================
    // GSAP Scroll Animations
    // ==========================
    const bottle = ".hero-bottle";

    // Master pinning for the wrapper across all sections
    ScrollTrigger.create({
        trigger: ".hero",
        start: "top top",
        endTrigger: ".section-5", // Extended to Section 5
        end: "bottom bottom",
        pin: ".hero-bottle-wrapper",
        pinSpacing: false,
        invalidateOnRefresh: true,
    });

    let isDesktop = window.matchMedia("(min-width: 769px)").matches;
    
    // Helper to create smooth timeline chunks without overlap conflicts
    // We are replacing individual scroll triggers with a single master timeline for flawless math.
    
    // Pin Section 3 (The Stone) to freeze scroll during customization
    ScrollTrigger.create({
        trigger: ".section-3",
        start: "top top",
        end: "+=150%", // Pin for 1.5x viewport height
        pin: true,
        pinSpacing: true,
        refreshPriority: 1 // CRITICAL: Forces GSAP to calculate this pin's spacing BEFORE calculating the Master Pin's end point
    });

    // ==========================================
    // THE MASTER MOVEMENT TIMELINE
    // ==========================================
    // By using a single master timeline, we eliminate all 'handoff' jitter between sections.
    // The bottle will move in one continuous, buttery-smooth flow.
    // Total scroll distance is exactly 550vh (400vh sections + 150vh pin padding).
    
    const masterTl = gsap.timeline({
        scrollTrigger: {
            trigger: ".hero",
            start: "top top",
            endTrigger: ".section-5",
            end: "bottom bottom",
            scrub: 1, // Reduced from 1.5 for a tighter, less "bouncy" feel
            invalidateOnRefresh: true
        }
    });

    // 1. Hero to Intro (100vh)
    masterTl.to(bottle, { y: "5vh", rotation: 0, duration: 100, ease: "power1.inOut" });

    // 2. Intro to Stone (100vh)
    masterTl.to(bottle, { y: "15vh", x: isDesktop ? "5vw" : "0vw", duration: 100, ease: "power1.inOut" });

    // 3. The Stone Hold (150vh) - Holds perfectly still during the pin
    masterTl.to(bottle, { y: "15vh", x: isDesktop ? "5vw" : "0vw", duration: 150, ease: "none" });

    // 4. The River Glide (100vh)
    masterTl.to(bottle, { y: "0vh", x: "0vw", duration: 100, ease: "power1.inOut" });

    // 5. Landing on 02 Text (50vh)
    masterTl.to(bottle, { y: "5vh", x: "0vw", duration: 50, ease: "power1.out" });

    // 6. Final Hold until the end of Section 5 (50vh)
    masterTl.to(bottle, { y: "5vh", x: "0vw", duration: 50, ease: "none" });

    // Arrow Animation Trigger for Section 3
    let arrowTimeout;
    ScrollTrigger.create({
        trigger: ".section-3",
        start: "top top",
        onEnter: () => {
            arrowTimeout = setTimeout(() => {
                const wrapper = document.querySelector('.graph__wrapper');
                if(wrapper) wrapper.classList.add('start-anim');
                const anim = document.getElementById('arrow-anim');
                if(anim) anim.beginElement();
            }, 800);
        },
        onLeaveBack: () => {
            clearTimeout(arrowTimeout);
            const wrapper = document.querySelector('.graph__wrapper');
            if(wrapper) wrapper.classList.remove('start-anim');
        }
    });

    // Setup Bottle Customization (Click on Cards)
    setupBottleCustomization();

    // Refresh correctly on resize
    window.addEventListener('resize', () => {
        const wasDesktop = isDesktop;
        isDesktop = window.matchMedia("(min-width: 769px)").matches;
        
        if (wasDesktop !== isDesktop) {
            landingSections[1].bounceX = isDesktop ? 5 : 0;
            // Call ScrollTrigger.refresh() after layout changes so trigger positions remain accurate
            ScrollTrigger.refresh();
        }
    });

    // Keep the gallery cycling intact
    const cardsGallery = document.querySelectorAll('.gallery-card');
    const states = Array.from(cardsGallery).map(card => ({
        className: card.className,
        style: card.getAttribute('style')
    }));
    
    let currentIndex = 0;
    setInterval(() => {
        currentIndex = (currentIndex - 1 + states.length) % states.length;
        cardsGallery.forEach((card, i) => {
            const stateIndex = (i + currentIndex) % states.length;
            card.className = states[stateIndex].className;
            card.setAttribute('style', states[stateIndex].style);
        });
    }, 3000);

    // Feature Cards Stagger Animation in Leaf Section
    const leafSection = document.getElementById('leaf-section');
    if (leafSection) {
        const cards = leafSection.querySelectorAll('.feature-card');
        if (cards.length > 0) {
            gsap.from(cards, {
                scrollTrigger: {
                    trigger: leafSection,
                    start: "top 60%", // Start animation when the section is 60% in view
                    toggleActions: "play none none reverse"
                },
                x: 50,
                opacity: 0,
                duration: 0.8,
                stagger: 0.2, // Animate one by one
                ease: "power2.out"
            });
        }
    }
});

// Function to handle bottle customization clicks
function setupBottleCustomization() {
    const customCards = [
        { id: 'card-default', src: './image.png' }, // Default bottle image
        { id: 'card-black', src: './blackbottle.webp' },
        { id: 'card-blue', src: './bluebottle.webp' },
        { id: 'card-yellow', src: './yellowbottle.webp' }
    ];

    const bottleImg = document.querySelector('.hero-bottle');
    
    customCards.forEach(card => {
        const el = document.getElementById(card.id);
        if (!el) return;
        
        el.addEventListener('click', () => {
            // Remove active classes from all cards
            customCards.forEach(c => {
                const cardEl = document.getElementById(c.id);
                if (cardEl) {
                    cardEl.classList.remove('border-2', 'border-white', 'shadow-[0_0_15px_rgba(255,255,255,0.6)]', 'scale-105');
                    cardEl.classList.add('border', 'border-gray-600');
                    const indicator = cardEl.querySelector('.active-indicator');
                    if (indicator) indicator.classList.add('hidden');
                    const line = cardEl.nextElementSibling;
                    if (line && line.classList.contains('active-line')) line.classList.add('hidden');
                }
            });

            // Add active class to clicked card
            el.classList.remove('border', 'border-gray-600');
            el.classList.add('border-2', 'border-white', 'shadow-[0_0_15px_rgba(255,255,255,0.6)]', 'scale-105');
            const indicator = el.querySelector('.active-indicator');
            if (indicator) indicator.classList.remove('hidden');
            const line = el.nextElementSibling;
            if (line && line.classList.contains('active-line')) line.classList.remove('hidden');

            // Smoothly change the bottle image
            gsap.to(bottleImg, {
                opacity: 0,
                duration: 0.25,
                ease: "power2.inOut",
                onComplete: () => {
                    bottleImg.src = card.src;
                    gsap.to(bottleImg, { opacity: 1, duration: 0.25, ease: "power2.inOut" });
                }
            });
        });
    });
}
