const { mdToPdf } = require('md-to-pdf');
(async () => {
  try {
    const pdf = await mdToPdf({ path: 'Product_Listing_Guide.md' }, { dest: 'Product_Listing_Guide.pdf' });
    console.log('PDF created successfully.');
  } catch (err) {
    console.error(err);
  }
})();
