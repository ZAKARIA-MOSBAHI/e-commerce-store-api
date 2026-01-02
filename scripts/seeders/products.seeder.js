// Images
import BlackDenimJeans1 from '../images/Black_denim_jeans_1.webp';
import BlackDenimJeans2 from '../images/Black_denim_jeans_2.webp';
import BlackDenimJeans3 from '../images/Black_denim_jeans_3.webp';
import BlackDenimJeans4 from '../images/Black_denim_jeans_4.webp';
import EveryoneHoodie1 from '../images/Everyone_hoodie_1.avif';
import EveryoneHoodie2 from '../images/Everyone_hoodie_2.avif';
import EveryoneHoodie3 from '../images/Everyone_hoodie_3.avif';
import EveryoneHoodie4 from '../images/Everyone_hoodie_4.avif';
import ShortSleeveBoxyTee1 from '../images/Short_sleeve_boxy_tee_1.webp';
import ShortSleeveBoxyTee2 from '../images/Short_sleeve_boxy_tee_2.webp';
import ShortSleeveBoxyTee3 from '../images/Short_sleeve_boxy_tee_3.webp';
import ShortSleeveBoxyTee4 from '../images/Short_sleeve_boxy_tee_4.webp';
import SweatShort1 from '../images/Sweat_short_1.webp';
import SweatShort2 from '../images/Sweat_short_2.webp';
import SweatShort3 from '../images/Sweat_short_3.webp';
import SweatShort4 from '../images/Sweat_short_4.webp';

// Deps 
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
// Models
const Product = require("../../src/models/product");
const Category = require("../../src/models/category");
// Categories 
const tShirtsCategory = await Category.findOne({ slug: "t-shirts" });
const sweatshirtsCategory = await Category.findOne({ slug: "sweatshirts" });
const shortsCategory = await Category.findOne({ slug: "shorts" });
const trousersCategory = await Category.findOne({ slug: "trousers" });
  
const products = [
    {
     name: 'Black denim jeans',
    price: 110,
    description: "Our Black Jeans are cut from a 100% organic cotton 3/1 twill, engineered for long lasting comfort. Available in our custom Stay Black (yes, they'll stay black) and a no-frills Grey Wash that will continue to acquire character and patinate with time. Go clean with Black jeans, white oxford and chelsea boots - or stay casual with the Grey Wash, Grey T-Shirt and your favorite sneakers.",
    mainImage: {
      url: BlackDenimJeans1,
      altText: 'black_denim_jeans_1'
    },
    additionalImages: [
      {
        url: BlackDenimJeans2,
        altText: 'black_denim_jeans_2',
        _id: ObjectId()
      },
      {
        url: BlackDenimJeans3,
        altText: 'black_denim_jeans_3',
        _id: ObjectId()
      },
      {
        url: BlackDenimJeans4,
        altText: 'black_denim_jeans_4',
        _id: ObjectId()
      }
    ],
    categoryId: trousersCategory._id,
    gender: 'men',
    badge: 'Best Seller',
    sizes: { M: 5, XL: 12, L: 22 },
     
     
  },
  {
     name: 'Everyone hoodie',
    price: 59,
    description: 'A hoodie to end all hoodies. Made from a mix of organic cotton and cotton waste (don’t worry, we wash it), the Everyone Hoodie features a roomy body, and vintage-inspired hood and collar with adjustable drawstrings. You probably need it — and the matching pants.',
    mainImage: {
      url: EveryoneHoodie1,
      altText: 'Everyone_hoodie_1'
    },
    additionalImages: [
      {
        url: EveryoneHoodie2,
        altText: 'Everyone_hoodie_2',
        _id: ObjectId()
      },
      {
        url: EveryoneHoodie3,
        altText: 'Everyone_hoodie_3',
        _id: ObjectId()
      },
      {
        url: EveryoneHoodie4,
        altText: 'Everyone_hoodie_4',
        _id: ObjectId()
      }
    ],
    categoryId: sweatshirtsCategory._id,
    gender: 'unisex',
    badge: 'Best Seller',
    sizes: { M: 5, XL: 12, L: 22 },
   }, 
{
     name: 'Short sleeve boxy tee',
    price: 51,
    description: 'This short-sleeved tee has curved hems and is slightly longer in the back, giving it a nice shape. The relaxed fit makes it easy to style, either as a basic top paired with casual shorts or pants, or elegantly tucked into a high-waisted skirt.',
    mainImage: {
      url: ShortSleeveBoxyTee1,
      altText: 'Short_sleeve_boxy_tee_1'
    },
    additionalImages: [
      {
        url: ShortSleeveBoxyTee2,
        altText: 'Short_sleeve_boxy_tee_2',
        _id: ObjectId('695124e14f3ca02ccd186a74')
      },
      {
        url: ShortSleeveBoxyTee3,
        altText: 'Short_sleeve_boxy_tee_3',
        _id: ObjectId('695124e14f3ca02ccd186a75')
      },
      {
        url: ShortSleeveBoxyTee4,
        altText: 'Short_sleeve_boxy_tee_4',
        _id: ObjectId('695124e14f3ca02ccd186a76')
      }
    ],
    categoryId: tShirtsCategory._id,
    gender: 'women',
    badge: 'New Arrivals',
    sizes: { M: 5, XL: 12, L: 22 },
  
  },
  {
     name: 'Sweat Shorts',
    price: 48,
    description: 'It\'s a bit too warm for sweats, but a bit too much to put on real bottoms — enter these super soft sweat shorts made from a blend of organic cotton and rescued fabric scraps found on cutting room floors. Super cozy for you, nice and easy on the planet.',
    mainImage: {
      url: SweatShort1,
      altText: 'sweat_short_1'
    },
    additionalImages: [
      {
        url: SweatShort2,
        altText: 'sweat_short_2',
        _id: ObjectId()
      },
      {
        url: SweatShort3,
        altText: 'sweat_short_3',
        _id: ObjectId()
      },
      {
        url: SweatShort4,
        altText: 'sweat_short_4',
        _id: ObjectId()
      }
    ],
    categoryId: shortsCategory._id,
    gender: 'women',
    badge: 'Best Seller',
    sizes: { M: 5, XL: 12, L: 22 },
     
  }



]
export const seedProducts = async () => {
    try {
        
        await Product.insertMany(products);
        console.log("Products seeded");
    } catch (error) {
        console.error("Error seeding products:", error);
    }
}
