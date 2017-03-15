var DefaultBuilder = require("truffle-default-builder");
module.exports = {
  build: new DefaultBuilder({
    "index.html": "index.html",
    "app.js": [
      "javascripts/jquery.min.js",
      "javascripts/bootstrap-select.min.js",
      "javascripts/bootstrap.min.js",
      "javascripts/moment.min.js",
      "javascripts/bootstrap-datetimepicker.min.js",
      "javascripts/main.js"
    ],
    "app.css": [
      "stylesheets/bootstrap.min.css",
      "stylesheets/bootstrap-datetimepicker.min.css",
      "stylesheets/bootstrap-select.min.css",
      "stylesheets/styles.css"
    ],
    "fonts/" : "fonts/"
  }),
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*"
    }
  }
};
