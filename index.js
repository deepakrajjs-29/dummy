// Mobile device detection - define early
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
}

// ========== LETTER BY LETTER ANIMATION ==========
// Split the heading text into individual letters with animation
const headingText = "DotEco.";
const headingElement = document.getElementById('main-heading');

function animateHeading() {
    headingElement.innerHTML = '';
    let letterIndex = 0;

    // Simplified version for mobile
    if (isMobileDevice()) {
        const words = headingText.split(' ');
        words.forEach((word, wordIndex) => {
            const span = document.createElement('span');
            span.textContent = word;
            span.className = 'dot-era';
            span.style.opacity = '1';
            headingElement.appendChild(span);

            if (wordIndex < words.length - 1) {
                const space = document.createElement('span');
                space.textContent = '\u00A0';
                headingElement.appendChild(space);
            }
        });
        return;
    }

    // Full animation for desktop
    const words = headingText.split(' ');

    words.forEach((word, wordIndex) => {
        const letters = word.split('');

        letters.forEach((letter, index) => {
            const span = document.createElement('span');

            // All letters get the dot-era class
            span.className = 'letter dot-era';
            span.textContent = letter;
            span.style.animationDelay = `${0.8 + (letterIndex * 0.05)}s`;
            headingElement.appendChild(span);
            letterIndex++;
        });

        // Add space after each word except the last one
        if (wordIndex < words.length - 1) {
            const space = document.createElement('span');
            space.className = 'letter dot-era';
            space.textContent = '\u00A0';
            space.style.animationDelay = `${0.8 + (letterIndex * 0.05)}s`;
            headingElement.appendChild(space);
            letterIndex++;
        }
    });
}

// Initialize heading animation on page load
animateHeading();

// ========== CANVAS SETUP ==========
// Get the canvas element and its 2D drawing context
const canvas = document.getElementById('particles-canvas');
const ctx = canvas.getContext('2d');

// Set canvas size to match the full window dimensions
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// ========== VARIABLES ==========
// Array to store all particle objects
let particlesArray = [];

// Mouse position tracker for interactive effects
let mouse = {
    x: null,
    y: null,
    radius: 150  // Distance within which particles react to cursor
};

// ========== HELPER FUNCTION ==========
// Check if a point is within the diagonal left section
function isInLeftDiagonal(x, y) {
    // Diagonal boundary: from 60% width at top to 40% width at bottom
    let topBoundary = canvas.width * 0.6;
    let bottomBoundary = canvas.width * 0.4;
    // Calculate the diagonal line x-position at given y
    let diagonalX = topBoundary - ((topBoundary - bottomBoundary) * (y / canvas.height));
    return x < diagonalX;
}

// ========== EVENT LISTENERS ==========
// Track mouse movement across the entire screen
window.addEventListener('mousemove', function (event) {
    // Only track mouse if it's in the diagonal left section
    if (isInLeftDiagonal(event.x, event.y)) {
        mouse.x = event.x;  // Get horizontal position
        mouse.y = event.y;  // Get vertical position
    } else {
        mouse.x = null;
        mouse.y = null;
    }
});

// Reset mouse position when cursor leaves the window
window.addEventListener('mouseout', function () {
    mouse.x = null;
    mouse.y = null;
});

// Handle window resize - recalculate canvas and particles
window.addEventListener('resize', function () {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    init();  // Reinitialize particles for new screen size
});

// ========== PARTICLE CLASS ==========
// Each particle is an individual dot with its own properties and behavior
class Particle {
    constructor(x, y) {
        // Current position of the particle
        this.x = x;
        this.y = y;

        // Store original position for reference
        this.baseX = this.x;
        this.baseY = this.y;

        // Random size between 1 and 4 pixels
        this.size = Math.random() * 3 + 1;

        // Density affects how much particle reacts to mouse (1-31)
        this.density = (Math.random() * 30) + 1;

        // Random speed for continuous movement (-0.25 to 0.25 pixels per frame)
        this.speedX = Math.random() * 0.5 - 0.25;
        this.speedY = Math.random() * 0.5 - 0.25;

        // Color gradient - same as geometric shapes
        this.color = this.getColor();
    }

    // Get random gradient color - optimized
    getColor() {
        const colors = [
            'rgba(139, 92, 246, 0.7)',  // Purple
            'rgba(99, 102, 241, 0.7)',  // Indigo
            'rgba(59, 130, 246, 0.7)',  // Blue
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    // ========== DRAW PARTICLE - OPTIMIZED ==========
    // Render the particle as a simple colored circle
    draw() {
        // Simple particle with minimal glow
        ctx.shadowBlur = 8;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    // ========== UPDATE PARTICLE ==========
    // Calculate new position and handle interactions
    update() {
        // Apply continuous movement speed
        this.x += this.speedX;
        this.y += this.speedY;

        // ========== BOUNDARY COLLISION ==========
        // Bounce particles off screen edges to keep them visible
        if (this.x > canvas.width || this.x < 0) {
            this.speedX = -this.speedX;  // Reverse horizontal direction
        }
        if (this.y > canvas.height || this.y < 0) {
            this.speedY = -this.speedY;  // Reverse vertical direction
        }

        // ========== MOUSE INTERACTION ==========
        // Make particles move away from cursor when nearby
        if (mouse.x != null && mouse.y != null) {
            // Calculate distance between mouse and particle
            let distX = mouse.x - this.x;
            let distY = mouse.y - this.y;
            let distance = Math.sqrt(distX * distX + distY * distY);

            // If particle is within the mouse radius, apply repulsion force
            if (distance < mouse.radius) {
                // Calculate direction from particle to mouse
                let forceDirectionX = distX / distance;
                let forceDirectionY = distY / distance;

                // Calculate force strength (stronger when closer)
                let maxDistance = mouse.radius;
                let force = (maxDistance - distance) / maxDistance;

                // Apply force to push particle away from mouse
                let directionX = forceDirectionX * force * this.density * 0.6;
                let directionY = forceDirectionY * force * this.density * 0.6;

                // Move particle in opposite direction (away from mouse)
                this.x -= directionX;
                this.y -= directionY;
            }
        }

        // Render the particle at its new position
        this.draw();
    }
}

// ========== INITIALIZE PARTICLES ==========
// Create all particles and distribute them across the diagonal left section
function init() {
    particlesArray = [];  // Clear existing particles

    // Reduced number of particles for performance
    let numberOfParticles = (canvas.width * canvas.height) / 30000;

    // Create each particle at a random position within the diagonal area
    let attempts = 0;
    for (let i = 0; i < numberOfParticles && attempts < numberOfParticles * 10; i++) {
        let x = Math.random() * canvas.width * 0.6;  // Random x in left area
        let y = Math.random() * canvas.height;        // Random y position

        // Check if the position is within the diagonal boundary
        if (isInLeftDiagonal(x, y)) {
            particlesArray.push(new Particle(x, y));
        } else {
            i--; // Try again if outside boundary
        }
        attempts++;
    }
}

// ========== CONNECT PARTICLES - OPTIMIZED ==========
// Draw simple lines between nearby particles
function connect() {
    let opacityValue = 1;

    // Check every particle against every other particle
    for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a; b < particlesArray.length; b++) {
            // Calculate distance between two particles (using distance squared for performance)
            let distance = ((particlesArray[a].x - particlesArray[b].x) *
                (particlesArray[a].x - particlesArray[b].x))
                + ((particlesArray[a].y - particlesArray[b].y) *
                    (particlesArray[a].y - particlesArray[b].y));

            // If particles are close enough, draw a line between them
            if (distance < (canvas.width / 8) * (canvas.height / 8)) {
                // Line opacity fades with distance (closer = more visible)
                opacityValue = 1 - (distance / 20000);

                // Simple line without gradient for performance
                ctx.strokeStyle = 'rgba(139, 92, 246, ' + (opacityValue * 0.5) + ')';
                ctx.lineWidth = 1;

                // Draw line from particle A to particle B
                ctx.beginPath();
                ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                ctx.stroke();
            }
        }
    }
}

// ========== ANIMATION LOOP ==========
// Main animation function that runs continuously
function animate() {
    // Clear the entire canvas for new frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update and draw each particle
    for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
    }

    // Draw connection lines between nearby particles
    connect();

    // Request next animation frame (creates smooth 60fps loop)
    requestAnimationFrame(animate);
}

// ========== START THE ANIMATION ==========
// Only initialize animations on desktop devices
if (!isMobileDevice()) {
    init();      // Create all particles
    animate();   // Begin animation loop
} else {
    // Hide canvas on mobile
    canvas.style.display = 'none';
}

// ========== GEOMETRIC ANIMATION (RIGHT DIAGONAL) ==========
// Setup geometric canvas
const geoCanvas = document.getElementById('geometric-canvas');
const geoCtx = geoCanvas.getContext('2d');

geoCanvas.width = window.innerWidth;
geoCanvas.height = window.innerHeight;

let geometricShapes = [];
let mouseGeo = { x: null, y: null };

// Check if a point is within the diagonal right section
function isInRightDiagonal(x, y) {
    let topBoundary = geoCanvas.width * 0.6;
    let bottomBoundary = geoCanvas.width * 0.4;
    let diagonalX = topBoundary - ((topBoundary - bottomBoundary) * (y / geoCanvas.height));
    return x > diagonalX;
}

// Track mouse for right diagonal
window.addEventListener('mousemove', function (event) {
    if (isInRightDiagonal(event.x, event.y)) {
        mouseGeo.x = event.x;
        mouseGeo.y = event.y;
    } else {
        mouseGeo.x = null;
        mouseGeo.y = null;
    }
});

// Geometric shape class
class GeometricShape {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.baseX = x;
        this.baseY = y;
        this.type = type; // 'triangle', 'square', 'hexagon', 'circle'
        this.size = Math.random() * 35 + 20;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.02;
        this.opacity = Math.random() * 0.5 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.speedY = (Math.random() - 0.5) * 0.3;
        this.color = this.getColor();
    }

    getColor() {
        const colors = [
            'rgba(139, 92, 246, ',  // Purple
            'rgba(99, 102, 241, ',  // Indigo
            'rgba(59, 130, 246, ',  // Blue
            'rgba(168, 85, 247, ',  // Violet
            'rgba(192, 132, 252, ', // Light purple
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    draw() {
        geoCtx.save();
        geoCtx.translate(this.x, this.y);
        geoCtx.rotate(this.rotation);
        geoCtx.globalAlpha = this.opacity;

        // Simple glow effect
        geoCtx.shadowBlur = 10;
        geoCtx.shadowColor = this.color + '0.5)';
        geoCtx.strokeStyle = this.color + '0.7)';
        geoCtx.lineWidth = 2;
        this.drawShape();

        geoCtx.restore();
    }

    drawShape(fill = false) {
        switch (this.type) {
            case 'triangle':
                this.drawTriangle(fill);
                break;
            case 'square':
                this.drawSquare(fill);
                break;
            case 'hexagon':
                this.drawHexagon(fill);
                break;
            case 'circle':
                this.drawCircle(fill);
                break;
        }
    }

    drawTriangle(fill = false) {
        geoCtx.beginPath();
        geoCtx.moveTo(0, -this.size);
        geoCtx.lineTo(this.size * 0.866, this.size * 0.5);
        geoCtx.lineTo(-this.size * 0.866, this.size * 0.5);
        geoCtx.closePath();
        if (fill) geoCtx.fill();
        else geoCtx.stroke();
    }

    drawSquare(fill = false) {
        if (fill) {
            geoCtx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        } else {
            geoCtx.strokeRect(-this.size / 2, -this.size / 2, this.size, this.size);
        }
    }

    drawHexagon(fill = false) {
        geoCtx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const x = this.size * Math.cos(angle);
            const y = this.size * Math.sin(angle);
            if (i === 0) geoCtx.moveTo(x, y);
            else geoCtx.lineTo(x, y);
        }
        geoCtx.closePath();
        if (fill) geoCtx.fill();
        else geoCtx.stroke();
    }

    drawCircle(fill = false) {
        geoCtx.beginPath();
        geoCtx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
        if (fill) geoCtx.fill();
        else geoCtx.stroke();
    }

    update() {
        // Continuous movement
        this.x += this.speedX;
        this.y += this.speedY;
        this.rotation += this.rotationSpeed;

        // Bounce off edges
        if (this.x > geoCanvas.width || this.x < 0) {
            this.speedX = -this.speedX;
        }
        if (this.y > geoCanvas.height || this.y < 0) {
            this.speedY = -this.speedY;
        }

        // Mouse interaction - attract towards mouse
        if (mouseGeo.x != null && mouseGeo.y != null) {
            let distX = mouseGeo.x - this.x;
            let distY = mouseGeo.y - this.y;
            let distance = Math.sqrt(distX * distX + distY * distY);

            if (distance < 200) {
                let force = (200 - distance) / 200;
                this.x += (distX / distance) * force * 2;
                this.y += (distY / distance) * force * 2;
                this.rotationSpeed = force * 0.05;
            }
        }

        this.draw();
    }
}

// Initialize geometric shapes - reduced count for performance
function initGeometric() {
    geometricShapes = [];
    const numShapes = 15;  // Reduced from 25
    const types = ['triangle', 'square', 'hexagon', 'circle'];

    let attempts = 0;
    for (let i = 0; i < numShapes && attempts < numShapes * 10; i++) {
        let x = Math.random() * geoCanvas.width;
        let y = Math.random() * geoCanvas.height;

        if (isInRightDiagonal(x, y)) {
            const type = types[Math.floor(Math.random() * types.length)];
            geometricShapes.push(new GeometricShape(x, y, type));
        } else {
            i--;
        }
        attempts++;
    }
}

// Animate geometric shapes
function animateGeometric() {
    geoCtx.clearRect(0, 0, geoCanvas.width, geoCanvas.height);

    for (let shape of geometricShapes) {
        shape.update();
    }

    requestAnimationFrame(animateGeometric);
}

// Handle resize for geometric canvas
window.addEventListener('resize', function () {
    geoCanvas.width = window.innerWidth;
    geoCanvas.height = window.innerHeight;
    initGeometric();
});

// Start geometric animation
// Only initialize animations on desktop devices
if (!isMobileDevice()) {
    initGeometric();
    animateGeometric();
} else {
    // Hide canvas on mobile
    geoCanvas.style.display = 'none';
}

// ========== SCROLL TRANSITION EFFECTS ==========
// Intersection Observer for scroll animations
const heroSection = document.querySelector('.animated-bg-section');
const visionSection = document.querySelector('.vision-section');

// Mobile device detection
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
}

// Disable canvas animations on mobile devices for better performance
if (isMobileDevice()) {
    // Stop particle canvas animation
    canvas.style.display = 'none';
    geoCanvas.style.display = 'none';

    // Simplify scroll animations - disable complex transforms
    if (heroSection) {
        heroSection.style.transition = 'none';
    }

    if (visionSection) {
        visionSection.style.transition = 'opacity 0.5s ease';
    }

    // Disable rotation animations on mobile
    const visionCircles = document.querySelectorAll('.vision-circle');
    visionCircles.forEach(circle => {
        circle.style.animation = 'none';
    });

    // Disable complex hover effects
    const allCards = document.querySelectorAll('.feature-card, .benefit-card, .ecosystem-card');
    allCards.forEach(card => {
        card.style.transition = 'background 0.3s ease';
    });
}

// Options for the intersection observer
const observerOptions = {
    root: null,
    threshold: [0, 0.15, 0.3, 0.5],
    rootMargin: '-10% 0px -10% 0px'
};

// ========== SEAMLESS FLUID TRANSITION SYSTEM ==========
let isTransitioning = false;

// Create Ultra-Smooth Energy Flow Animation
function createFluidTransition() {
    if (isTransitioning) return;
    isTransitioning = true;

    const isMobile = isMobileDevice();
    const waveCount = isMobile ? 4 : 7;
    const particleCount = isMobile ? 15 : 40;
    const streakCount = isMobile ? 5 : 12;

    // Ambient Glow Effect
    const glow = document.createElement('div');
    glow.className = 'transition-glow';
    document.body.appendChild(glow);
    glow.animate([
        { opacity: 0 },
        { opacity: 1, offset: 0.3 },
        { opacity: 0 }
    ], {
        duration: 1500,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    });
    setTimeout(() => glow.remove(), 1500);

    // Energy Waves
    for (let i = 0; i < waveCount; i++) {
        setTimeout(() => {
            const wave = document.createElement('div');
            wave.className = 'energy-wave';
            wave.style.top = `${35 + (i * 8)}%`;
            wave.style.left = '0';
            wave.style.opacity = '0';
            document.body.appendChild(wave);

            wave.animate([
                { opacity: 0, transform: 'translateX(-50%) scaleX(0.5)' },
                { opacity: 1, transform: 'translateX(0) scaleX(1)', offset: 0.4 },
                { opacity: 0, transform: 'translateX(50%) scaleX(0.5)' }
            ], {
                duration: 1200,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
            });

            setTimeout(() => wave.remove(), 1200);
        }, i * 80);
    }

    // Energy Particles
    for (let i = 0; i < particleCount; i++) {
        setTimeout(() => {
            const particle = document.createElement('div');
            particle.className = 'energy-particle';
            const startX = Math.random() * window.innerWidth;
            const startY = window.innerHeight * 0.5 + (Math.random() - 0.5) * window.innerHeight * 0.4;
            particle.style.left = startX + 'px';
            particle.style.top = startY + 'px';
            document.body.appendChild(particle);

            const angle = (Math.random() - 0.5) * Math.PI;
            const distance = 150 + Math.random() * 200;
            const endX = startX + Math.cos(angle) * distance;
            const endY = startY + Math.sin(angle) * distance - 100;

            particle.animate([
                {
                    left: startX + 'px',
                    top: startY + 'px',
                    opacity: 0,
                    transform: 'scale(0.5)'
                },
                {
                    opacity: 1,
                    transform: 'scale(1.5)',
                    offset: 0.3
                },
                {
                    left: endX + 'px',
                    top: endY + 'px',
                    opacity: 0,
                    transform: 'scale(0.3)'
                }
            ], {
                duration: 1000 + Math.random() * 400,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
            });

            setTimeout(() => particle.remove(), 1400);
        }, i * 25);
    }

    // Light Streaks
    if (!isMobile) {
        for (let i = 0; i < streakCount; i++) {
            setTimeout(() => {
                const streak = document.createElement('div');
                streak.className = 'light-streak';
                const streakY = 30 + Math.random() * 40;
                const width = 100 + Math.random() * 300;
                streak.style.width = width + 'px';
                streak.style.top = streakY + '%';
                streak.style.left = '-' + width + 'px';
                document.body.appendChild(streak);

                streak.animate([
                    { left: -width + 'px', opacity: 0 },
                    { opacity: 0.8, offset: 0.3 },
                    { left: window.innerWidth + 'px', opacity: 0 }
                ], {
                    duration: 800 + Math.random() * 400,
                    easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
                });

                setTimeout(() => streak.remove(), 1200);
            }, i * 70);
        }
    }

    // Glow Trail Effect
    for (let i = 0; i < particleCount / 2; i++) {
        setTimeout(() => {
            const trail = document.createElement('div');
            trail.className = 'glow-trail';
            const x = Math.random() * window.innerWidth;
            const y = window.innerHeight * 0.5 + (Math.random() - 0.5) * window.innerHeight * 0.3;
            trail.style.left = x + 'px';
            trail.style.top = y + 'px';
            document.body.appendChild(trail);

            const endY = y - 150 - Math.random() * 100;
            trail.animate([
                { top: y + 'px', opacity: 0, transform: 'scale(0.5)' },
                { opacity: 1, transform: 'scale(1.2)', offset: 0.4 },
                { top: endY + 'px', opacity: 0, transform: 'scale(0.3)' }
            ], {
                duration: 900 + Math.random() * 300,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
            });

            setTimeout(() => trail.remove(), 1200);
        }, i * 40);
    }

    setTimeout(() => {
        isTransitioning = false;
    }, 1500);
}

// Observer with Fluid Transition - Modified to work with new scroll animations
const visionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            if (!visionSection.classList.contains('transition-triggered')) {
                createFluidTransition();
                visionSection.classList.add('transition-triggered');
            }
            heroSection.classList.add('scrolled-down');
        } else {
            if (entry.boundingClientRect.top > 0) {
                heroSection.classList.remove('scrolled-down');
            }
        }
    });
}, observerOptions);

// Observe the vision section
if (visionSection) {
    visionObserver.observe(visionSection);
}

// Create observer for CTA section
const ctaWrapper = document.querySelector('.join-cta-wrapper');
const ctaObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            ctaWrapper.classList.add('visible');
        }
    });
}, {
    root: null,
    threshold: 0.2,
    rootMargin: '0px'
});

// Observe the CTA wrapper
if (ctaWrapper) {
    ctaObserver.observe(ctaWrapper);
}

// Smooth scroll behavior
document.documentElement.style.scrollBehavior = 'smooth';

// Throttle function for performance
function throttle(func, wait) {
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

// Enhanced scroll tracker with smooth transitions
let lastScrollTop = 0;
const handleScroll = throttle(function () {
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    // Detect scroll direction
    if (scrollTop > lastScrollTop) {
        // Scrolling down
        if (scrollTop > 150) {
            heroSection.classList.add('scrolled-down');
        }
    } else {
        // Scrolling up
        if (scrollTop < 100) {
            heroSection.classList.remove('scrolled-down');
        }
    }

    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
}, isMobileDevice() ? 100 : 50);

window.addEventListener('scroll', handleScroll, { passive: true });

// Touch events for mobile devices
let touchStartY = 0;
window.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
}, { passive: true });

window.addEventListener('touchend', (e) => {
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY - touchEndY;

    if (Math.abs(diff) > 50) {
        handleScroll();
    }
}, { passive: true });

// ========== VISION SECTION BACKGROUND ANIMATIONS ==========
// Create floating dots for vision section
if (!isMobileDevice()) {
    const floatingDotsContainerVision = document.getElementById('floatingDotsVision');

    if (floatingDotsContainerVision) {
        // Create 30 floating dots
        for (let i = 0; i < 30; i++) {
            const dot = document.createElement('div');
            dot.className = 'dot';

            // Random starting position
            const startX = Math.random() * 100;
            const startY = Math.random() * 100;
            dot.style.left = startX + '%';
            dot.style.top = startY + '%';

            // Random animation duration and delay
            const duration = 15 + Math.random() * 10; // 15-25 seconds
            const delay = Math.random() * 5; // 0-5 seconds delay

            // Create unique floating animation for each dot
            const animationName = `floatDotVision${i}`;
            const endX = startX + (Math.random() * 40 - 20); // Move -20 to +20%
            const endY = startY + (Math.random() * 40 - 20);
            const midX = startX + (Math.random() * 30 - 15);
            const midY = startY + (Math.random() * 30 - 15);

            // Add keyframe animation dynamically
            const keyframes = `
                        @keyframes ${animationName} {
                            0%, 100% { 
                                transform: translate(0, 0); 
                                opacity: ${0.3 + Math.random() * 0.4};
                            }
                            50% { 
                                transform: translate(${midX - startX}vw, ${midY - startY}vh); 
                                opacity: ${0.6 + Math.random() * 0.4};
                            }
                        }
                    `;

            const styleSheet = document.createElement('style');
            styleSheet.textContent = keyframes;
            document.head.appendChild(styleSheet);

            dot.style.animation = `${animationName} ${duration}s ease-in-out ${delay}s infinite`;

            floatingDotsContainerVision.appendChild(dot);
        }
    }
}

// ========== NAVBAR FUNCTIONALITY ==========
const navbarToggle = document.getElementById('navbarToggle');
const navbarMenu = document.getElementById('navbarMenu');

navbarToggle.addEventListener('click', () => {
    navbarMenu.classList.toggle('active');
    // Animate toggle button
    navbarToggle.textContent = navbarMenu.classList.contains('active') ? '✕' : '☰';
});

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.glass-navbar')) {
        navbarMenu.classList.remove('active');
        navbarToggle.textContent = '☰';
    }
});

// Close menu when clicking on a link
document.querySelectorAll('.navbar-menu a').forEach(link => {
    link.addEventListener('click', () => {
        navbarMenu.classList.remove('active');
        navbarToggle.textContent = '☰';
    });
});

// Add scroll effect to navbar
const body = document.body;
let lastScroll = 0;
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.glass-navbar');
    const currentScroll = window.pageYOffset;
    if (currentScroll > 100) {
        {
            navbar.style.background = 'rgba(26, 21, 53, 0.8)';
            navbar.style.boxShadow = '0 10px 40px rgba(0, 0, 0, 0.5)';
        }
    } else {
        {
            navbar.style.background = 'rgba(255, 255, 255, 0.05)';
            navbar.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
        }
    }

    lastScroll = currentScroll;
});

// Create floating dots for community section (only on desktop)
if (!isMobileDevice()) {
    const communityDotsContainer = document.getElementById('communityFloatingDots');
    if (communityDotsContainer) {
        const communityDotCount = 20;

        for (let i = 0; i < communityDotCount; i++) {
            const dot = document.createElement('div');
            dot.className = 'dot';

            // Random position
            dot.style.left = Math.random() * 100 + '%';
            dot.style.top = Math.random() * 100 + '%';

            // Random animation
            const duration = Math.random() * 10 + 15;
            const delay = Math.random() * 5;
            const xMovement = (Math.random() - 0.5) * 150;
            const yMovement = (Math.random() - 0.5) * 150;

            dot.style.animation = `floatCommunityDot${i} ${duration}s ${delay}s ease-in-out infinite`;

            // Create unique animation for each dot
            const styleSheet = document.styleSheets[0];
            const keyframes = `
                        @keyframes floatCommunityDot${i} {
                            0%, 100% {
                                transform: translate(0, 0);
                                opacity: 0.3;
                            }
                            50% {
                                transform: translate(${xMovement}px, ${yMovement}px);
                                opacity: 0.8;
                            }
                        }
                    `;
            styleSheet.insertRule(keyframes, styleSheet.cssRules.length);

            communityDotsContainer.appendChild(dot);
        }
    }
}

// ========== SCROLL ARRIVAL ANIMATION SYSTEM ==========

// Intersection Observer for scroll-triggered animations
const scrollObserverOptions = {
    root: null,
    threshold: 0.15,
    rootMargin: '0px 0px -100px 0px'
};

const scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        } else {
            // Remove 'visible' class when element leaves viewport
            // This allows re-animation when scrolling back
            entry.target.classList.remove('visible');
        }
    });
}, scrollObserverOptions);

// Function to initialize scroll animations
function initScrollAnimations() {
    // Select all elements to animate
    const animatedElements = document.querySelectorAll(
        '.scroll-animate, .fade-in, .parallax-layer-1, .parallax-layer-2, .parallax-layer-3, ' +
        '.stagger-children, .slide-from-left, .slide-from-right, .scale-fade, .card-reveal'
    );

    animatedElements.forEach(element => {
        scrollObserver.observe(element);
    });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollAnimations);
} else {
    initScrollAnimations();
}

// Parallax scroll effect for layered motion
let ticking = false;

function updateParallax() {
    const scrolled = window.pageYOffset;

    // Apply parallax to visible elements
    const parallaxElements = document.querySelectorAll('.parallax-layer-1.visible, .parallax-layer-2.visible, .parallax-layer-3.visible');

    parallaxElements.forEach((element, index) => {
        const speed = element.classList.contains('parallax-layer-1') ? 0.3 :
            element.classList.contains('parallax-layer-2') ? 0.5 : 0.7;

        const yPos = -(scrolled * speed);
        element.style.transform = `translateY(${yPos * 0.1}px)`;
    });

    ticking = false;
}

function requestParallaxTick() {
    if (!ticking && !isMobileDevice()) {
        window.requestAnimationFrame(updateParallax);
        ticking = true;
    }
}

window.addEventListener('scroll', requestParallaxTick, { passive: true });

// ========== NEWSLETTER GOOGLE SHEETS INTEGRATION ==========

// IMPORTANT: Replace this URL with your Google Apps Script Web App URL
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx7q8yfwzJ7qXL-GCgPUIh-U2lrtYwHsQjNu7MNauAqkr-tTzbglqTxyR2ztIFQT8nS/exec';

const newsletterBtn = document.getElementById('newsletterBtn');
const newsletterEmail = document.getElementById('newsletterEmail');
const newsletterMessage = document.getElementById('newsletterMessage');

function showMessage(message, type) {
    newsletterMessage.textContent = message;
    newsletterMessage.className = `newsletter-message ${type} show`;

    setTimeout(() => {
        newsletterMessage.classList.remove('show');
    }, 5000);
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}

newsletterBtn.addEventListener('click', async function () {
    const email = newsletterEmail.value.trim();

    // Validate email
    if (!email) {
        showMessage('Please enter your email address', 'error');
        return;
    }

    if (!validateEmail(email)) {
        showMessage('Please enter a valid email address', 'error');
        return;
    }

    // Disable button and show loading state
    newsletterBtn.disabled = true;
    newsletterBtn.textContent = 'Subscribing...';

    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                timestamp: new Date().toISOString(),
                source: 'Website Newsletter'
            })
        });

        // Since mode is 'no-cors', we can't read the response
        // Assume success if no error is thrown
        showMessage('✓ Successfully subscribed! Check your inbox.', 'success');
        newsletterEmail.value = '';

    } catch (error) {
        console.error('Newsletter subscription error:', error);
        showMessage('✗ Something went wrong. Please try again.', 'error');
    } finally {
        // Re-enable button
        newsletterBtn.disabled = false;
        newsletterBtn.textContent = 'Subscribe';
    }
});

// Allow Enter key to submit
newsletterEmail.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        newsletterBtn.click();
    }
});

// ========== FUTURISTIC CUSTOM CURSOR SYSTEM ==========
(function () {
    // Check if device supports hover (desktop only)
    if (window.matchMedia("(hover: none)").matches) return;

    // Create cursor elements
    const cursorWrapper = document.createElement('div');
    cursorWrapper.className = 'custom-cursor';

    // Main cursor with diamond shape
    const cursorMain = document.createElement('div');
    cursorMain.className = 'cursor-main';
    cursorMain.innerHTML = '<div class="cursor-diamond"></div>';

    // Follower cursor
    const cursorFollower = document.createElement('div');
    cursorFollower.className = 'cursor-follower';

    // Orbiting particles
    for (let i = 0; i < 4; i++) {
        const orbit = document.createElement('div');
        orbit.className = 'cursor-orbit';
        cursorWrapper.appendChild(orbit);
    }

    cursorWrapper.appendChild(cursorMain);
    cursorWrapper.appendChild(cursorFollower);
    document.body.appendChild(cursorWrapper);

    // Cursor position tracking with smooth lerp
    let mouseX = 0, mouseY = 0;
    let cursorX = 0, cursorY = 0;
    let followerX = 0, followerY = 0;

    // Lerp (linear interpolation) for smooth movement
    const lerp = (start, end, factor) => start + (end - start) * factor;

    // Track mouse position
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    // Animate cursor with RAF for smooth 60fps
    function animateCursor() {
        // Main cursor follows mouse closely (fast lerp)
        cursorX = lerp(cursorX, mouseX, 0.25);
        cursorY = lerp(cursorY, mouseY, 0.25);

        // Follower cursor has slower lerp for trailing effect
        followerX = lerp(followerX, mouseX, 0.1);
        followerY = lerp(followerY, mouseY, 0.1);

        // Apply transforms
        cursorMain.style.transform = `translate(${cursorX}px, ${cursorY}px) translate(-50%, -50%) rotate(45deg)`;
        cursorFollower.style.transform = `translate(${followerX}px, ${followerY}px) translate(-50%, -50%) rotate(45deg)`;

        // Update orbiting particles
        const orbits = cursorWrapper.querySelectorAll('.cursor-orbit');
        orbits.forEach(orbit => {
            orbit.style.left = followerX + 'px';
            orbit.style.top = followerY + 'px';
        });

        requestAnimationFrame(animateCursor);
    }
    animateCursor();

    // Hover effects on interactive elements
    const interactiveElements = 'a, button, input, textarea, select, [onclick], .clickable';

    document.addEventListener('mouseover', (e) => {
        if (e.target.matches(interactiveElements)) {
            cursorWrapper.classList.add('cursor-hover');
        }

        // Special state for text/links
        if (e.target.matches('a, button, .nav-link, .cta-button')) {
            cursorWrapper.classList.add('cursor-text');
        }
    });

    document.addEventListener('mouseout', (e) => {
        if (e.target.matches(interactiveElements)) {
            cursorWrapper.classList.remove('cursor-hover');
            cursorWrapper.classList.remove('cursor-text');
        }
    });

    // Click ripple effect
    document.addEventListener('mousedown', (e) => {
        cursorWrapper.classList.add('cursor-clicking');

        // Create ripple element
        const ripple = document.createElement('div');
        ripple.className = 'cursor-ripple';
        ripple.style.left = e.clientX + 'px';
        ripple.style.top = e.clientY + 'px';
        document.body.appendChild(ripple);

        // Create spark particles on click
        for (let i = 0; i < 6; i++) {
            createSpark(e.clientX, e.clientY, i);
        }

        // Remove ripple after animation
        setTimeout(() => {
            ripple.remove();
        }, 600);
    });

    document.addEventListener('mouseup', () => {
        cursorWrapper.classList.remove('cursor-clicking');
    });

    // Create spark particle effect
    function createSpark(x, y, index) {
        const spark = document.createElement('div');
        spark.style.position = 'fixed';
        spark.style.width = '4px';
        spark.style.height = '4px';
        spark.style.background = '#ff6b35';
        spark.style.borderRadius = '50%';
        spark.style.pointerEvents = 'none';
        spark.style.zIndex = '99997';
        spark.style.left = x + 'px';
        spark.style.top = y + 'px';
        spark.style.boxShadow = '0 0 10px rgba(255, 107, 53, 0.8)';

        const angle = (index / 6) * Math.PI * 2;
        const velocity = 3;
        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity;

        document.body.appendChild(spark);

        let posX = x, posY = y;
        let opacity = 1;
        let frame = 0;

        function animateSpark() {
            frame++;
            posX += vx;
            posY += vy;
            opacity -= 0.03;

            spark.style.transform = `translate(${posX - x}px, ${posY - y}px)`;
            spark.style.opacity = opacity;

            if (opacity > 0 && frame < 60) {
                requestAnimationFrame(animateSpark);
            } else {
                spark.remove();
            }
        }
        animateSpark();
    }

    // Hide cursor when leaving window
    document.addEventListener('mouseleave', () => {
        cursorWrapper.style.opacity = '0';
    });

    document.addEventListener('mouseenter', () => {
        cursorWrapper.style.opacity = '1';
    });

    // Smooth cursor visibility transition
    cursorWrapper.style.transition = 'opacity 0.3s ease';
})();