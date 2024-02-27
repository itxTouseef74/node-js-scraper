const axios = require("axios");
const cheerio = require("cheerio");
const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});


const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("Connected to the database");

  const scrapedDataSchema = new mongoose.Schema({
    quote: String,
    author: String,
    tags: [String],
  });


  const ScrapedData = mongoose.model("ScrapedData", scrapedDataSchema);


  const scrapePage = async (url) => {
    try {
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);

      const quotes = [];
      $("div.quote").each((index, element) => {
        const quote = $(element).find("span.text").text().trim();
        const author = $(element).find("small.author").text().trim();
        const tags = [];
        $(element)
          .find("div.tags a.tag")
          .each((tagIndex, tagElement) => {
            tags.push($(tagElement).text().trim());
          });

        quotes.push({ quote, author, tags });
      });

      quotes.forEach(async (quoteData, index) => {
        console.log(`Quote ${index + 1}: ${quoteData.quote}`);
        console.log(`Author ${index + 1}: ${quoteData.author}`);
        console.log(`Tags ${index + 1}: ${quoteData.tags.join(", ")}`);
        console.log("--------");

        const scrapedData = new ScrapedData({
          quote: quoteData.quote,
          author: quoteData.author,
          tags: quoteData.tags,
        });

        await scrapedData.save();
      });

      console.log(`Data from page ${url} saved to the database.`);
    } catch (error) {
      console.error(`Error fetching the page ${url}:`, error);
    }
  };

  const baseUrl = "https://quotes.toscrape.com/page/";


  const totalPages = 20; 

  
  const scrapeAllPages = async () => {
    for (let page = 1; page <= totalPages; page++) {
      const url = `${baseUrl}${page}/`;
      await scrapePage(url);
    }
  };

  scrapeAllPages();
});
