// Tab switching logic
const tabBtns = document.querySelectorAll('.tab-btn');
const sections = document.querySelectorAll('.section');
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active from all
        tabBtns.forEach(b => b.classList.remove('active'));
        sections.forEach(s => s.classList.remove('active'));
        // Add active to clicked
        btn.classList.add('active');
        document.getElementById(btn.dataset.section).classList.add('active');
    });
});