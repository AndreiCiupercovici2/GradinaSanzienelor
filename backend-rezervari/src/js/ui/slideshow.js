// --- SLIDESHOW FUNCTIONALITY ---
let currentSlide = 1;
let slideShowInterval = null;
const SLIDESHOW_INTERVAL = 7000; // 7 seconds
const TOTAL_SLIDES = 11;
let slideshowInitialized = false;

function showSlide(n) {
    // Validate slide number
    if (n > TOTAL_SLIDES) currentSlide = 1;
    if (n < 1) currentSlide = TOTAL_SLIDES;

    // Hide all slides
    const slides = document.querySelectorAll('.slide');
    slides.forEach(slide => slide.classList.remove('active'));

    // Remove active class from all dots
    const dots = document.querySelectorAll('.dot');
    dots.forEach(dot => dot.classList.remove('active'));

    // Show current slide and highlight dot
    const currentSlideElement = document.querySelector(`.slide[data-slide="${currentSlide}"]`);
    const currentDot = document.querySelector(`.dot[data-slide="${currentSlide}"]`);

    if (currentSlideElement) currentSlideElement.classList.add('active');
    if (currentDot) currentDot.classList.add('active');
}

function nextSlide() {
    currentSlide++;
    if (currentSlide > TOTAL_SLIDES) currentSlide = 1;
    showSlide(currentSlide);
}

function previousSlide() {
    currentSlide--;
    if (currentSlide < 1) currentSlide = TOTAL_SLIDES;
    showSlide(currentSlide);
}

function goToSlide(n) {
    currentSlide = n;
    showSlide(currentSlide);
    resetAutoplay();
}

function startAutoplay() {
    if (slideShowInterval) clearInterval(slideShowInterval);
    slideShowInterval = setInterval(nextSlide, SLIDESHOW_INTERVAL);
}

function resetAutoplay() {
    if (slideShowInterval) clearInterval(slideShowInterval);
    startAutoplay();
}

function stopAutoplay() {
    if (slideShowInterval) {
        clearInterval(slideShowInterval);
        slideShowInterval = null;
    }
}

export function initHeroSlideshow() {
    if (slideshowInitialized) return; // Prevent multiple initializations
    slideshowInitialized = true;

    showSlide(currentSlide);
    startAutoplay();

    const prevSlideBtn = document.getElementById('prevSlideBtn');
    const nextSlideBtn = document.getElementById('nextSlideBtn');

    if (prevSlideBtn) {
        prevSlideBtn.addEventListener('click', () => {
            previousSlide();
            resetAutoplay();
        });
    }

    if (nextSlideBtn) {
        nextSlideBtn.addEventListener('click', () => {
            nextSlide();
            resetAutoplay();
        });
    }

    const arrowDown = document.querySelector('.arrow-down');
    if (arrowDown) {
        arrowDown.addEventListener('click', () => {
            window.scrollBy({
                top: window.innerHeight,
                behavior: 'smooth'
            });
        });
    }
}

export function initExtrasSlideshow(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let idx = 0;
    const slides = container.querySelectorAll('.extras-slide');
    const total = slides.length;
    if (total === 0) return;

    function showExtrasSlide(n) {
        slides.forEach(slide => slide.classList.remove('active'));
        slides[n].classList.add('active');
    }

    showExtrasSlide(0);
    setInterval(() => {
        idx = (idx + 1) % total;
        showExtrasSlide(idx);
    }, SLIDESHOW_INTERVAL);

    container.querySelector('.extras-prev-btn')?.addEventListener('click', () => {
        idx = (idx - 1 + total) % total;
        showExtrasSlide(idx);
    });

    container.querySelector('.extras-next-btn')?.addEventListener('click', () => {
        idx = (idx + 1) % total;
        showExtrasSlide(idx);
    });
}