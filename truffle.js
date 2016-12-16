module.exports = {
  build: {
    "index.html": "index.html",
    "app.js": [
      "javascripts/app.js"
    ],
    "app.css": [
      "stylesheets/app.css"
    ],
    "javascripts/": [
      "javascripts/"
    ],
    "stylesheets/": [
      "stylesheets/"
    ],    "fonts/": [
      "fonts/"
    ],
    "images/": "images/"
  },
  rpc: {
    host: "localhost",
    port: 8545
  }
};
