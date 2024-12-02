# Barbora Product Scraper

### Overview

This tool extracts all available products from [BARBORA.LV](https://barbora.lv). It iterates through all categories and automatically handles pagination to ensure all products are captured. The scraped data is then saved to a JSON file. **Note:** A Bright Data scraping browser instance is necessary to run this tool.

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/juris-daksa/barbora-product-scraper.git
   cd barbora-product-scraper
2. Install dependencies:

   ```bash
   npm install
3. Create a .env file in the root directory with the following content:

   ```plaintext
   BRD_CONFIG=your_brightdata_config
### Usage

Run the scraper:

 ```bash
 npm start
 ```

### Project Structure
```
|-src/
| |--  index.js: Main entry point of the application.
| |--  scraper.js: Contains the main scraping logic.
| |--  utils.js: Utility functions used by the scraper.
|- .env: Environment variables configuration file.
|- package.json: Project metadata and dependencies.
```
### Contributing
Contributions are welcome! Please open an issue or submit a pull request.
