const express = require('express');
const router = express.Router();
const path = require('path');

// Define valid pages
const validPages = ['meal', 'accomodation', 'contact', 'punct-gastronomic', 'admin', 'terms', 'privacy'];

const getFilePath = (page) => {
    if (page == 'index') {
        return path.join(__dirname, '..', 'index.html');
    }
    return path.join(__dirname, '..', 'src', 'Pages', `${page}.html`);
}

// Principal route for serving pages
router.get('/', (req, res) => {
    res.sendFile(getFilePath('index'), (err) => {
        if (err) {
            console.error('Error sending index.html:', err);
            res.status(500).send('Internal Server Error');
        }
    });
});

validPages.forEach((page) => {
    router.get(`/${page}`, (req, res) => {
        res.sendFile(getFilePath(page), (err) => {
            if (err) {
                console.error(`Error sending ${page}.html:`, err);
                res.status(500).send('Internal Server Error');
            }
        });
    });
});

// Clean URL routes (without .html extension)
validPages.forEach((page) => {
    router.get(`/${page}`, (req, res) => {
        res.sendFile(getFilePath(page), (err) => {
            if (err) {
                console.error(`Error sending ${page}.html:`, err);
                res.status(500).send('Internal Server Error');
            }
        });
    });
});

// Backwards compatibility: serve pages with .html extension
router.get('/:page.html', (req, res) => {
    const page = req.params.page;
    const allPages = ['index', ...validPages];

    if (allPages.includes(page)) {
        res.sendFile(getFilePath(page), (err) => {
            if (err) {
                console.error(`Error sending ${page}.html:`, err);
                res.status(500).send('Internal Server Error');
            }
        });
    } else {
        res.status(404).send('Page not found');
    }
});

// Catch-all 404 handler for unmatched routes
router.use((req, res) => {
    res.status(404).send('Page not found');
});

module.exports = router;