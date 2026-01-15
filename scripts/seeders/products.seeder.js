  /* imports of images aren't valid in Node.js environment 
const BlackDenimJeans1 = require('../images/Black_denim_jeans_1.webp');
const BlackDenimJeans2 = require('../images/Black_denim_jeans_2.webp');
const BlackDenimJeans3 = require('../images/Black_denim_jeans_3.webp');
const BlackDenimJeans4 = require('../images/Black_denim_jeans_4.webp');
const EveryoneHoodie1 = require('../images/Everyone_hoodie_1.avif');
const EveryoneHoodie2 = require('../images/Everyone_hoodie_2.avif');
const EveryoneHoodie3 = require('../images/Everyone_hoodie_3.avif');
const EveryoneHoodie4 = require('../images/Everyone_hoodie_4.avif');
const ShortSleeveBoxyTee1 = require('../images/Short_sleeve_boxy_tee_1.webp');
const ShortSleeveBoxyTee2 = require('../images/Short_sleeve_boxy_tee_2.webp');
const ShortSleeveBoxyTee3 = require('../images/Short_sleeve_boxy_tee_3.webp');
const ShortSleeveBoxyTee4 = require('../images/Short_sleeve_boxy_tee_4.webp');
const SweatShort1 = require('../images/Sweat_short_1.webp');
const SweatShort2 = require('../images/Sweat_short_2.webp');
const SweatShort3 = require('../images/Sweat_short_3.webp');
const SweatShort4 = require('../images/Sweat_short_4.webp'); */

// Deps 
const mongoose = require("mongoose");
 // Models
const Product = require("../../src/models/product");
const Category = require("../../src/models/category");


const seedProducts = async () => {
  try {
  
    // Get categories
     const tShirtsCategory = await Category.findOne({ slug: "t-shirts" });
    const sweatshirtsCategory = await Category.findOne({ slug: "sweatshirts" });
    const shortsCategory = await Category.findOne({ slug: "shorts" });
    const trousersCategory = await Category.findOne({ slug: "trousers" });
    
    // Check if categories exist
    if (!tShirtsCategory || !sweatshirtsCategory || !shortsCategory || !trousersCategory) {
      console.error('❌ ERROR: Categories not found! Please seed categories first.');
      console.log('Run: node scripts/seeders/categories.seeder.js');
      process.exit(1);
    }

    const products = [
      {
        name: 'Black denim jeans',
        price: 110,
        description: "Our Black Jeans are cut from a 100% organic cotton 3/1 twill, engineered for long lasting comfort. Available in our custom Stay Black (yes, they'll stay black) and a no-frills Grey Wash that will continue to acquire character and patinate with time. Go clean with Black jeans, white oxford and chelsea boots - or stay casual with the Grey Wash, Grey T-Shirt and your favorite sneakers.",
        mainImage: {
          url: '/uploads/Black_denim_jeans_1.webp',
          altText: 'black_denim_jeans_1'
        },
        additionalImages: [
          {
            url: '/uploads/Black_denim_jeans_2.webp',
            altText: 'black_denim_jeans_2',
            _id: new mongoose.Types.ObjectId()
          },
          {
            url: '/uploads/Black_denim_jeans_3.webp',
            altText: 'black_denim_jeans_3',
            _id: new mongoose.Types.ObjectId()
          },
          {
            url: '/uploads/Black_denim_jeans_4.webp',
            altText: 'black_denim_jeans_4',
            _id: new mongoose.Types.ObjectId()
          }
        ],
        categoryId: trousersCategory._id,
        gender: 'men',
        badge: 'Best Seller',
        sizes: { M: 5, XL: 12, L: 22 },
        stock: 39
      },
      {
        name: 'Everyone hoodie',
        price: 59,
        description: 'A hoodie to end all hoodies. Made from a mix of organic cotton and cotton waste (don\'t worry, we wash it), the Everyone Hoodie features a roomy body, and vintage-inspired hood and collar with adjustable drawstrings. You probably need it — and the matching pants.',
        mainImage: {
          url: '/uploads/Everyone_hoodie_1.avif',
          altText: 'Everyone_hoodie_1'
        },
        additionalImages: [
          {
            url: '/uploads/Everyone_hoodie_2.avif',
            altText: 'Everyone_hoodie_2',
            _id: new mongoose.Types.ObjectId()
          },
          {
            url: '/uploads/Everyone_hoodie_3.avif',
            altText: 'Everyone_hoodie_3',
            _id: new mongoose.Types.ObjectId()
          },
          {
            url: '/uploads/Everyone_hoodie_4.avif',
            altText: 'Everyone_hoodie_4',
            _id: new mongoose.Types.ObjectId()
          }
        ],
        categoryId: sweatshirtsCategory._id,
        gender: 'unisex',
        badge: 'Best Seller',
        sizes: { M: 5, XL: 12, L: 22 },
        stock: 39
      },
      {
        name: 'Short sleeve boxy tee',
        price: 51,
        description: 'This short-sleeved tee has curved hems and is slightly longer in the back, giving it a nice shape. The relaxed fit makes it easy to style, either as a basic top paired with casual shorts or pants, or elegantly tucked into a high-waisted skirt.',
        mainImage: {
          url: '/uploads/Short_sleeve_boxy_tee_1.webp',
          altText: 'Short_sleeve_boxy_tee_1'
        },
        additionalImages: [
          {
            url: '/uploads/Short_sleeve_boxy_tee_2.webp',
            altText: 'Short_sleeve_boxy_tee_2',
            _id: new mongoose.Types.ObjectId('695124e14f3ca02ccd186a74')
          },
          {
            url: '/uploads/Short_sleeve_boxy_tee_3.webp',
            altText: 'Short_sleeve_boxy_tee_3',
            _id: new mongoose.Types.ObjectId('695124e14f3ca02ccd186a75')
          },
          {
            url: '/uploads/Short_sleeve_boxy_tee_4.webp',
            altText: 'Short_sleeve_boxy_tee_4',
            _id: new mongoose.Types.ObjectId('695124e14f3ca02ccd186a76')
          }
        ],
        categoryId: tShirtsCategory._id,
        gender: 'women',
        badge: 'New Arrivals',
        sizes: { M: 5, XL: 12, L: 22 },
        stock: 39
      },
      {
        name: 'Sweat Shorts',
        price: 48,
        description: 'It\'s a bit too warm for sweats, but a bit too much to put on real bottoms — enter these super soft sweat shorts made from a blend of organic cotton and rescued fabric scraps found on cutting room floors. Super cozy for you, nice and easy on the planet.',
        mainImage: {
          url: '/uploads/Sweat_short_1.webp',
          altText: 'sweat_short_1'
        },
        additionalImages: [
          {
            url: '/uploads/Sweat_short_2.webp',
            altText: 'sweat_short_2',
            _id: new mongoose.Types.ObjectId()
          },
          {
            url: '/uploads/Sweat_short_3.webp',
            altText: 'sweat_short_3',
            _id: new mongoose.Types.ObjectId()
          },
          {
            url: '/uploads/Sweat_short_4.webp',
            altText: 'sweat_short_4',
            _id: new mongoose.Types.ObjectId()
          }
        ],
        categoryId: shortsCategory._id,
        gender: 'women',
        badge: 'Best Seller',
        sizes: { M: 5, XL: 12, L: 22 },
        stock: 39
      }
    ];
    
    // Insert new products
    console.log('Seeding products...');
    const result = await Product.insertMany(products);
    
    console.log(`✅ ${result.length} products seeded successfully!`);
    
    console.log('\n📦 Seeded Products:');
    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} - $${product.price}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding products:", error);
    process.exit(1);
  }
};

module.exports = seedProducts;

// If this file is run directly, execute the seeder
if (require.main === module) {
  seedProducts();
}
module.exports = { seedProducts };