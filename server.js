var bodyParser = require("body-parser");
var cheerio = require("cheerio");
var express = require("express");
var expressHandlebars = require("express-handlebars");
var mongoose = require("mongoose");
var request = require("request");

var logger = require("morgan");
var axios = require("axios");

var db = require("./models");

var PORT = 3000;
var env = process.env.NODE_ENV || 'development';
var dbURL = '';
var app = express();

app.use(logger("dev"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));

mongoose.Promise = Promise;
// if (env == 'development') {
//   dbURL = 'mongodb://localhost/week18Populater';
// } else {
//   dbURL = process.env['MONGODB_URI'];
// }
dbURL = 'mongodb://heroku_9p7k661k:bmnk7idnhbm0ldj7h1r7bssita@ds135966.mlab.com:35966/heroku_9p7k661k'
mongoose.connect(dbURL, {
  useMongoClient: true
});
console.log('connect to mongo at:', dbURL);


app.get("/scrape", function(req, res) {
  axios.get("https://www.npr.org").then(function(response) {
    var $ = cheerio.load(response.data);

    $("article .story-wrap .story-text").each(function(i, element) {
      var result = {};

      result.headline = $(this)
        .children("a")
        .children(".title")
        .text();
      result.link = $(this)
        .children("a")
        .attr("href");
      result.summary = $(this)
        .first(".teaser")
        .text();

          console.log('result:', result);
      if (result.headline && result.link) {
        db.Article
          .create(result)
          .then(function(dbArticle) {
            //res.send("Scrape Complete");
            console.log('db article saved');
          })
          .catch(function(err) {
            //res.json(err);
            console.log('error:', err);
          });
        }
    });
  });
});

app.get("/articles", function(req, res) {
  db.Article
    .find({})
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

app.get("/articles/:id", function(req, res) {
  db.Article
    .findOne({ _id: req.params.id })
    .populate("note")
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

app.post("/articles/:id", function(req, res) {
  db.Note
    .create(req.body)
    .then(function(dbNote) {
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});

