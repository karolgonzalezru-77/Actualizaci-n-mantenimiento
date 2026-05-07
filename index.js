require('dotenv').config();
const app = require('./src/app');
const port = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`Peluquería Canina App running on http://localhost:${port}`);
    });
}

module.exports = app;
