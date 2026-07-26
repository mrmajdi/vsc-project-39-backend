import { db } from '../config/db';
import { randomUUID } from 'crypto';

// Helper functions for Persian data
const persianFirstNames = [
  'علی', 'رضا', 'محمد', 'حسن', 'حسین', 'محمد', 'سعيد', 'فرهاد', 'کامران', 'بهروز',
  'سارا', 'نیلوفر', 'زهرا', 'مهدیه', 'لیلا', 'الهام', 'فاطمه', 'مینا', 'نازنین', 'رومینا'
];
const persianLastNames = [
  'محمدی', 'احمدی', 'رضایی', 'کریمی', 'فرهنگی', 'نوری', 'جعفری', 'علوی', 'حسینی', 'باقری',
  'کاشانی', 'شیرازی', ' اصفهانی', 'تهرانی', 'مشهدی', 'قمی', 'اسدی', 'لاجوردی', 'زمانی', 'پور'
];
const persianCityNames = ['تهران', 'مشهد', 'اصفهان', 'شیراز', 'تبریز', 'اهواز', 'قم', 'کرج', 'رشت', 'زاهدان'];
const persianBrandNames = [
  'پت شاپ ایران', 'پت فود', 'پت کئیر', 'پت لوکس', 'پت استار', 'پت ویلا', 'پت گلد', 'پت سیلا'
];
const persianShopNames = [
  'فروشگاه پت happy', 'پت استور شیراز', 'پت مارکت تهران', 'پت سنتر اصفهان', 'پت پلاس مشهد',
  'پت زینب', 'پت آوا', 'پت لکسوس', 'پت گلدین', 'پت آریا'
];
const persianProductNames = [
  'غذای خشک سگ بزرگ', 'غذای rainy cat', 'اسکله چوبی برای گربه', 'آکواریوم 60 لیتری', 'چسب ماهی',
  'لباس شتوی سگ', 'لباس بارانی گربه', 'قابضه پرنده طوطی', 'فلتر آب اکواریوم', 'عصاره گوجه سگ',
  '장난감 سگ صدا دار', '장난감 گربه پرنده', 'شامپو ضد قارچ سگ', 'شامپو مو گربه', 'کرم ضد حشرات',
  'بسته ویتامین ماهی', 'بسته ویتامین سگ', 'بسته ویتامین گربه', 'کفش سگ ورزشی', 'کفش گربه دکور'
];
const persianDescriptions = [
  'غذای کامل و متعادل برای سگ‌های بزرگ سنی، با پروتئین بالا و ω-3.',
  'غذای rainy cat مناسب برای گربه‌های بالغ، با طعم ماهی و سبزیجات.',
  'اسکله چوبی با کیفیت عالی برای گربه‌ها، مقاوم و قابل تمیز کردن.',
  'آکواریوم 60 لیتری با شیشه ضد ضربه و فیلتر داخلی.',
  'چسب ماهی با فرمول خاص برای تثبیت دکور آکواریوم.',
  'لباس شتوی سگ با پارچه دوفلای، گرم و ضد آب.',
  'لباس بارانی گربه با پارچه ضد آب و دمای قابل تنظیم.',
  'قابضه پرنده طوطی با قابلیت تنظیم ارتفاع و مواد ایمن.',
  'فلتر آب اکواریوم با سه مرحله فیلتراسیون، مناسب تا 100 لیتر.',
  'عصاره گوجه سگ برای بهبود هضم و تقویت سیستم ایمنی.',
  '장난감 سگ صدا دار با صداهای جذاب و مواد غیر سم.',
  '장난감 گربه پرنده با پرهای طبیعی و beweglich.',
  'شامپو ضد قارچ سگ با فرمول دارویی و بدون پارابن.',
  'شامپو مو گربه با مواد تغذیه‌ای و براق‌سازی.',
  'کرم ضد حشرات برای سگ و گربه، ضد برغ و خارش.',
  'بسته ویتامین ماهی شامل ویتامین C، D و E.',
  'بسته ویتامین سگ شامل ویتامین A، B complejo و K.',
  'بسته ویتامین گربه شامل تاورین و ویتامین B12.',
  'کفش سگ ورزشی با底 مقاوم و верх تنفس‌پذیر.',
  'کفش گربه دکور با طراحی زیبا و پارچه نرم.'
];
const persianClinicNames = [
  'کلینیک Veterinary تهران', 'بیمارستان پت مشهد', 'مرکز درمانی پت اصفهان',
  'کلینیک Veterinary شیراز', 'بیمارستان پت تبریز', 'مرکز درمانی پت اهواز',
  'کلینیک Veterinary قم', 'بیمارستان پت کرج', 'مرکز درمانی پت رشت',
  'کلینیک Veterinary زاهدان'
];
const persianClinicServices = [
  'معاینه عمومی', 'تزریق واکسن', 'جراحی نرم tissュー', 'دندانپزشکی',
  'فוטولوژی', 'تغذیه治療', 'فيزیوتراپي', 'خدماتEmergency'
];
const persianBlogTitles = [
  'نحوه انتخاب غذای مناسب برای سگ',
  'مراقب از گربه در فصل سرد',
  'آکواریوم principiants: راهنمای کامل',
  'آموزش پرنده طوطی speaking',
  'مراقبت از ماهی ornamental در تانک'
];
const persianBlogContents = [
  'در این مقاله به بررسی نکات مهم در انتخاب غذای سگ می‌پردازیم...',
  'گربه‌ها در فصل سرد نیاز به مراقبت ویژه دارند؛ از تغذیه تا tempat خواب...',
  'برای شروع آکواریوم، ابتدا Tank مناسب و فیلتر انتخاب کنید...',
  'طوطی‌ها پرنده‌ای هوشمند هستند؛ آموزش صحیح说话 می‌تواند رابطه را تقویت کند...',
  'ماهی‌های ornamental نیاز به تنظیم pH و دما دارند؛ در این راهنمای کامل...'
];
const persianBannerTexts = [
  'تخفیف ۲۰٪ روی تمام غذاهای سگ',
  'بسته‌های ویژه برای گربه‌های سالم',
  'آکواریوم لوکس با تحویل رایگان',
  ' جشنواره پت: هدیه با هر خرید',
  'پکیج سلامت پت شامل ویزیت و واکسن'
];
const persianReviewComments = [
  'محصول عالی، سگم خیلی خوشحال شد.',
  'کیفیت خوب و قیمت مناسب.',
  'ارسال سریع و بسته‌بندی مراقب.',
  'غذای مورد علاقه گربه‌ام.',
  'پیشنهاد می‌کنم به همه دوستان.',
  'بعد از استفاده، مو سگ نرم‌تر شد.',
  'فلتر آب عالی عمل کرد، آب تمیز ماند.',
  'اسکله چوبی مقاوم و زیباست.',
  'بسته ویتامین باعث افزایش انرژی شد.',
  'خدمات clinik فوق العاده بود.'
];

function randomPersianName() {
  const first = persianFirstNames[Math.floor(Math.random() * persianFirstNames.length)];
  const last = persianLastNames[Math.floor(Math.random() * persianLastNames.length)];
  return `${first} ${last}`;
}
function randomPersianPhone() {
  const suffix = Math.floor(100000000 + Math.random() * 900000000).toString();
  return `0912${suffix}`;
}
function randomPersianCity() {
  return persianCityNames[Math.floor(Math.random() * persianCityNames.length)];
}
function randomDate(start = new Date(2023, 0, 1), end = new Date()) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}
function uuid() {
  return randomUUID();
}

// Clear tables in correct order (children first)
function clearTables() {
  const tables = [
    'order_items',
    'orders',
    'cart_items',
    'carts',
    'transactions',
    'vendor_settlements',
    'reviews',
    'special_deals',
    'vendor_listings',
    'products',
    'categories',
    'brands',
    'pet_vaccines',
    'pets',
    'clinic_services',
    'clinic_images',
    'clinic_working_hours',
    'clinics',
    'banners',
    'blog_posts',
    'addresses',
    'otp_codes',
    'users'
  ];
  for (const table of tables) {
    db.prepare(`DELETE FROM ${table}`).run();
    // Reset autoincrement if applicable (SQLite)
    db.prepare(`DELETE FROM sqlite_sequence WHERE name='${table}'`).run();
  }
}

// Insert data
function runSeed() {
  return db.transaction(() => {
    // 1. Users (admins, vendors, regular)
    const adminPhones = ['09121111111', '09122222222', '09123333333'];
    const vendorCount = 10;
    const regularCount = 20;

    const insertUser = db.prepare(`
      INSERT INTO users (id, phone, name, role, is_active, created_at, updated_at)
      VALUES (@id, @phone, @name, @role, @is_active, @created_at, @updated_at)
    `);

    const now = new Date().toISOString();

    // Admins
    adminPhones.forEach(phone => {
      insertUser.run({
        id: uuid(),
        phone,
        name: randomPersianName(),
        role: 'admin',
        is_active: 1,
        created_at: now,
        updated_at: now
      });
    });

    // Vendors
    for (let i = 0; i < vendorCount; i++) {
      insertUser.run({
        id: uuid(),
        phone: randomPersianPhone(),
        name: persianShopNames[i] || randomPersianName(),
        role: 'vendor',
        is_active: 1,
        created_at: now,
        updated_at: now
      });
    }

    // Regular users
    for (let i = 0; i < regularCount; i++) {
      insertUser.run({
        id: uuid(),
        phone: randomPersianPhone(),
        name: randomPersianName(),
        role: 'user',
        is_active: 1,
        created_at: now,
        updated_at: now
      });
    }

    // 2. OTP codes (optional, just a few)
    const insertOtp = db.prepare(`
      INSERT INTO otp_codes (id, phone, code, expires_at, created_at)
      VALUES (@id, @phone, @code, @expires_at, @created_at)
    `);
    const users = db.prepare('SELECT id, phone FROM users WHERE role = "user" LIMIT 5').all();
    users.forEach(u => {
      insertOtp.run({
        id: uuid(),
        phone: u.phone,
        code: Math.floor(100000 + Math.random() * 900000).toString(),
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        created_at: now
      });
    });

    // 3. Addresses
    const insertAddress = db.prepare(`
      INSERT INTO addresses (id, user_id, label, address_line, city, state, postal_code, is_default, created_at, updated_at)
      VALUES (@id, @user_id, @label, @address_line, @city, @state, @postal_code, @is_default, @created_at, @updated_at)
    `);
    const allUsers = db.prepare('SELECT id FROM users').all();
    allUsers.forEach((u, idx) => {
      const isDefault = idx === 0;
      insertAddress.run({
        id: uuid(),
        user_id: u.id,
        label: isDefault ? 'آدرس اصلی' : 'آدرس دوم',
        address_line: `پلاک ${Math.floor(Math.random() * 100) + 1}, واحد ${Math.floor(Math.random() * 10) + 1}`,
        city: randomPersianCity(),
        state: randomPersianCity(),
        postal_code: `${Math.floor(Math.random() * 90000) + 10000}`,
        is_default: isDefault ? 1 : 0,
        created_at: now,
        updated_at: now
      });
    });

    // 4. Brands
    const insertBrand = db.prepare(`
      INSERT INTO brands (id, name, logo_url, created_at, updated_at)
      VALUES (@id, @name, @logo_url, @created_at, @updated_at)
    `);
    persianBrandNames.forEach(name => {
      insertBrand.run({
        id: uuid(),
        name,
        logo_url: `https://example.com/logos/${name.replace(/\s+/g, '-').toLowerCase()}.png`,
        created_at: now,
        updated_at: now
      });
    });

    // 5. Categories (tree)
    const insertCategory = db.prepare(`
      INSERT INTO categories (id, name, parent_id, slug, created_at, updated_at)
      VALUES (@id, @name, @parent_id, @slug, @created_at, @updated_at)
    `);
    const mainCats = [
      { name: 'سگ', slug: 'dog' },
      { name: 'گربه', slug: 'cat' },
      { name: 'پرنده', slug: 'bird' },
      { name: 'ماهی', slug: 'fish' }
    ];
    const subCatTemplates = [
      { name: 'غذای خشک', slug: 'dry-food' },
      { name: 'غذای رطوبت دار', slug: 'wet-food' },
      { name: 'اسباب‌بازی', slug: 'toys' },
      { name: 'بهداشت', slug: 'hygiene' },
      { name: 'لوازم اکواریوم', slug: 'aquarium' }
    ];
    const categoryMap = new Map();
    mainCats.forEach(mc => {
      const id = uuid();
      insertCategory.run({
        id,
        name: mc.name,
        parent_id: null,
        slug: mc.slug,
        created_at: now,
        updated_at: now
      });
      categoryMap.set(mc.name, id);
      // subcategories
      subCatTemplates.forEach(sub => {
        const subId = uuid();
        insertCategory.run({
          id: subId,
          name: sub.name,
          parent_id: id,
          slug: `${mc.slug}-${sub.slug}`,
          created_at: now,
          updated_at: now
        });
        categoryMap.set(`${mc.name}-${sub.name}`, subId);
      });
    });

    // 6. Pets
    const insertPet = db.prepare(`
      INSERT INTO pets (id, owner_id, name, species, breed, age_months, unique_code, created_at, updated_at)
      VALUES (@id, @owner_id, @name, @species, @breed, @age_months, @unique_code, @created_at, @updated_at)
    `);
    const petOwners = db.prepare('SELECT id FROM users WHERE role = "user"').all();
    const speciesList = ['سگ', 'گربه', 'پرنده', 'ماهی'];
    const breedMap = {
      سگ: ['لابرادور', 'پودل', 'شیرازی', 'گارد'],
      گربه: ['اسپنگل', 'شیروزی', 'هیمالايا'],
      پرنده: ['طوطی', 'канарейка', 'کاکاتو'],
      ماهی: ['گوپی', 'انجل', 'ディスカ스']
    };
    for (let i = 0; i < 30; i++) {
      const owner = petOwners[Math.floor(Math.random() * petOwners.length)];
      const species = speciesList[Math.floor(Math.random() * speciesList.length)];
      insertPet.run({
        id: uuid(),
        owner_id: owner.id,
        name: randomPersianName(),
        species,
        breed: breedMap[species][Math.floor(Math.random() * breedMap[species].length)],
        age_months: Math.floor(Math.random() * 120),
        unique_code: uuid(),
        created_at: now,
        updated_at: now
      });
    }

    // 7. Pet vaccines
    const insertPetVaccine = db.prepare(`
      INSERT INTO pet_vaccines (id, pet_id, vaccine_name, administered_at, next_due_at, created_at, updated_at)
      VALUES (@id, @pet_id, @vaccine_name, @administered_at, @next_due_at, @created_at, @updated_at)
    `);
    const pets = db.prepare('SELECT id FROM pets').all();
    const vaccineNames = ['ربای', 'پاروا', 'ディ스템פר', 'Leptospirosis', 'Bordetella'];
    pets.forEach(pet => {
      const num = Math.floor(Math.random() * 3) + 1;
      for (let j = 0; j < num; j++) {
        const administered = randomDate(new Date(2022, 0, 1), new Date());
        const nextDue = new Date(administered);
        nextDue.setFullYear(nextDue.getFullYear() + 1);
        insertPetVaccine.run({
          id: uuid(),
          pet_id: pet.id,
          vaccine_name: vaccineNames[Math.floor(Math.random() * vaccineNames.length)],
          administered_at: administered.toISOString(),
          next_due_at: nextDue.toISOString(),
          created_at: now,
          updated_at: now
        });
      }
    });

    // 8. Products
    const insertProduct = db.prepare(`
      INSERT INTO products (id, brand_id, name, description, suitable_for, price, stock, image_url, created_at, updated_at)
      VALUES (@id, @brand_id, @name, @description, @suitable_for, @price, @stock, @image_url, @created_at, @updated_at)
    `);
    const brands = db.prepare('SELECT id FROM brands').all();
    const speciesOptions = ['سگ', 'گربه', 'پرنده', 'ماهی'];
    for (let i = 0; i < 50; i++) {
      const suitableFor = [];
      const numSpecies = Math.floor(Math.random() * 3) + 1;
      for (let s = 0; s < numSpecies; s++) {
        suitableFor.push(speciesOptions[Math.floor(Math.random() * speciesOptions.length)]);
      }
      insertProduct.run({
        id: uuid(),
        brand_id: brands[Math.floor(Math.random() * brands.length)].id,
        name: persianProductNames[i % persianProductNames.length] + ` ${i + 1}`,
        description: persianDescriptions[i % persianDescriptions.length],
        suitable_for: JSON.stringify([...new Set(suitableFor)]),
        price: Math.floor(Math.random() * 500) + 50,
        stock: Math.floor(Math.random() * 100),
        image_url: `https://example.com/products/${uuid()}.jpg`,
        created_at: now,
        updated_at: now
      });
    }

    // 9. Vendor listings
    const insertVendorListing = db.prepare(`
      INSERT INTO vendor_listings (id, vendor_id, product_id, price, stock, city, created_at, updated_at)
      VALUES (@id, @vendor_id, @product_id, @price, @stock, @city, @created_at, @updated_at)
    `);
    const vendors = db.prepare('SELECT id FROM users WHERE role = "vendor"').all();
    const products = db.prepare('SELECT id FROM products').all();
    for (let i = 0; i < 80; i++) {
      insertVendorListing.run({
        id: uuid(),
        vendor_id: vendors[Math.floor(Math.random() * vendors.length)].id,
        product_id: products[Math.floor(Math.random() * products.length)].id,
        price: Math.floor(Math.random() * 600) + 30,
        stock: Math.floor(Math.random() * 80),
        city: randomPersianCity(),
        created_at: now,
        updated_at: now
      });
    }

    // 10. Special deals
    const insertSpecialDeal = db.prepare(`
      INSERT INTO special_deals (id, vendor_listing_id, discount_percent, starts_at, ends_at, status, created_at, updated_at)
      VALUES (@id, @vendor_listing_id, @discount_percent, @starts_at, @ends_at, @status, @created_at, @updated_at)
    `);
    const listings = db.prepare('SELECT id FROM vendor_listings').all();
    const statuses = ['active', 'scheduled', 'expired'];
    for (let i = 0; i < 10; i++) {
      const starts = randomDate(new Date(2024, 0, 1), new Date());
      const ends = new Date(starts);
      ends.setDate(ends.getDate() + Math.floor(Math.random() * 15) + 1);
      insertSpecialDeal.run({
        id: uuid(),
        vendor_listing_id: listings[Math.floor(Math.random() * listings.length)].id,
        discount_percent: Math.floor(Math.random() * 50) + 10,
        starts_at: starts.toISOString(),
        ends_at: ends.toISOString(),
        status: statuses[Math.floor(Math.random() * statuses.length)],
        created_at: now,
        updated_at: now
      });
    }

    // 11. Clinics
    const insertClinic = db.prepare(`
      INSERT INTO clinics (id, name, address, city, phone, created_at, updated_at)
      VALUES (@id, @name, @address, @city, @phone, @created_at, @updated_at)
    `);
    persianClinicNames.forEach((name, idx) => {
      insertClinic.run({
        id: uuid(),
        name,
        address: `خیابان ${randomPersianName()}, پلاک ${Math.floor(Math.random() * 100) + 1}`,
        city: persianCityNames[idx % persianCityNames.length],
        phone: randomPersianPhone(),
        created_at: now,
        updated_at: now
      });
    });

    // 12. Clinic working hours
    const insertClinicWorkingHour = db.prepare(`
      INSERT INTO clinic_working_hours (id, clinic_id, day_of_week, opens_at, closes_at, is_closed, created_at, updated_at)
      VALUES (@id, @clinic_id, @day_of_week, @opens_at, @closes_at, @is_closed, @created_at, @updated_at)
    `);
    const clinics = db.prepare('SELECT id FROM clinics').all();
    const days = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];
    clinics.forEach(clinic => {
      days.forEach((day, index) => {
        const isClosed = index === 6; // Friday closed
        insertClinicWorkingHour.run({
          id: uuid(),
          clinic_id: clinic.id,
          day_of_week: index,
          opens_at: isClosed ? null : '09:00',
          closes_at: isClosed ? null : '20:00',
          is_closed: isClosed ? 1 : 0,
          created_at: now,
          updated_at: now
        });
      });
    });

    // 13. Clinic images
    const insertClinicImage = db.prepare(`
      INSERT INTO clinic_images (id, clinic_id, image_url, is_primary, created_at, updated_at)
      VALUES (@id, @clinic_id, @image_url, @is_primary, @created_at, @updated_at)
    `);
    clinics.forEach(clinic => {
      insertClinicImage.run({
        id: uuid(),
        clinic_id: clinic.id,
        image_url: `https://example.com/clinics/${clinic.id}-1.jpg`,
        is_primary: 1,
        created_at: now,
        updated_at: now
      });
      insertClinicImage.run({
        id: uuid(),
        clinic_id: clinic.id,
        image_url: `https://example.com/clinics/${clinic.id}-2.jpg`,
        is_primary: 0,
        created_at: now,
        updated_at: now
      });
    });

    // 14. Clinic services
    const insertClinicService = db.prepare(`
      INSERT INTO clinic_services (id, clinic_id, service_name, price, created_at, updated_at)
      VALUES (@id, @clinic_id, @service_name, @price, @created_at, @updated_at)
    `);
    clinics.forEach(clinic => {
      persianClinicServices.forEach(service => {
        insertClinicService.run({
          id: uuid(),
          clinic_id: clinic.id,
          service_name: service,
          price: Math.floor(Math.random() * 500) + 100,
          created_at: now,
          updated_at: now
        });
      });
    });

    // 15. Blog posts
    const insertBlogPost = db.prepare(`
      INSERT INTO blog_posts (id, title, content, author_id, published_at, created_at, updated_at)
      VALUES (@id, @title, @content, @author_id, @published_at, @created_at, @updated_at)
    `);
    const authors = db.prepare('SELECT id FROM users WHERE role IN ("admin", "vendor")').all();
    persianBlogTitles.forEach((title, idx) => {
      insertBlogPost.run({
        id: uuid(),
        title,
        content: persianBlogContents[idx % persianBlogContents.length],
        author_id: authors[Math.floor(Math.random() * authors.length)].id,
        published_at: randomDate(new Date(2023, 0, 1), new Date()).toISOString(),
        created_at: now,
        updated_at: now
      });
    });

    // 16. Banners
    const insertBanner = db.prepare(`
      INSERT INTO banners (id, title, subtitle, image_url, link_url, position, is_active, created_at, updated_at)
      VALUES (@id, @title, @subtitle, @image_url, @link_url, @position, @is_active, @created_at, @updated_at)
    `);
    persianBannerTexts.forEach((title, idx) => {
      insertBanner.run({
        id: uuid(),
        title,
        subtitle: 'توضیح مختصر بنر',
        image_url: `https://example.com/banners/${uuid()}.jpg`,
        link_url: '/products',
        position: 'hero',
        is_active: 1,
        created_at: now,
        updated_at: now
      });
    });

    // 17. Reviews
    const insertReview = db.prepare(`
      INSERT INTO reviews (id, user_id, product_id, rating, comment, created_at, updated_at)
      VALUES (@id, @user_id, @product_id, @rating, @comment, @created_at, @updated_at)
    `);
    const allUsersIds = db.prepare('SELECT id FROM users').all();
    const allProductsIds = db.prepare('SELECT id FROM products').all();
    for (let i = 0; i < 10; i++) {
      insertReview.run({
        id: uuid(),
        user_id: allUsersIds[Math.floor(Math.random() * allUsersIds.length)].id,
        product_id: allProductsIds[Math.floor(Math.random() * allProductsIds.length)].id,
        rating: Math.floor(Math.random() * 5) + 1,
        comment: persianReviewComments[i % persianReviewComments.length],
        created_at: now,
        updated_at: now
      });
    }

    // 18. Carts (one per user)
    const insertCart = db.prepare(`
      INSERT INTO carts (id, user_id, created_at, updated_at)
      VALUES (@id, @user_id, @created_at, @updated_at)
    `);
    allUsersIds.forEach(u => {
      insertCart.run({
        id: uuid(),
        user_id: u.id,
        created_at: now,
        updated_at: now
      });
    });

    // 19. Cart items (few per cart)
    const insertCartItem = db.prepare(`
      INSERT INTO cart_items (id, cart_id, product_id, quantity, created_at, updated_at)
      VALUES (@id, @cart_id, @product_id, @quantity, @created_at, @updated_at)
    `);
    const carts = db.prepare('SELECT id FROM carts').all();
    carts.forEach(cart => {
      const itemsCount = Math.floor(Math.random() * 5) + 1;
      for (let j = 0; j < itemsCount; j++) {
        insertCartItem.run({
          id: uuid(),
          cart_id: cart.id,
          product_id: allProductsIds[Math.floor(Math.random() * allProductsIds.length)].id,
          quantity: Math.floor(Math.random() * 3) + 1,
          created_at: now,
          updated_at: now
        });
      }
    });

    // 20. Orders
    const insertOrder = db.prepare(`
      INSERT INTO orders (id, user_id, status, total_amount, created_at, updated_at)
      VALUES (@id, @user_id, @status, @total_amount, @created_at, @updated_at)
    `);
    const orderStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    for (let i = 0; i < 8; i++) {
      const user = allUsersIds[Math.floor(Math.random() * allUsersIds.length)];
      insertOrder.run({
        id: uuid(),
        user_id: user.id,
        status: orderStatuses[Math.floor(Math.random() * orderStatuses.length)],
        total_amount: 0, // will update after order_items
        created_at: randomDate(new Date(2023, 0, 1), new Date()).toISOString(),
        updated_at: now
      });
    }

    // 21. Order items (with financial snapshots)
    const insertOrderItem = db.prepare(`
      INSERT INTO order_items (id, order_id, product_id, vendor_listing_id, quantity, price, commission, tax, total, created_at, updated_at)
      VALUES (@id, @order_id, @product_id, @vendor_listing_id, @quantity, @price, @commission, @tax, @total, @created_at, @updated_at)
    `);
    const orders = db.prepare('SELECT id FROM orders').all();
    const listingsAll = db.prepare('SELECT id, price FROM vendor_listings').all();
    orders.forEach(order => {
      let orderTotal = 0;
      const itemsCount = Math.floor(Math.random() * 4) + 1;
      for (let j = 0; j < itemsCount; j++) {
        const listing = listingsAll[Math.floor(Math.random() * listingsAll.length)];
        const unitPrice = listing.price;
        const quantity = Math.floor(Math.random() * 3) + 1;
        const commission = Math.round(unitPrice * 0.05);
        const tax = Math.round(unitPrice * 0.09);
        const total = Math.round((unitPrice + commission + tax) * quantity);
        insertOrderItem.run({
          id: uuid(),
          order_id: order.id,
          product_id: allProductsIds[Math.floor(Math.random() * allProductsIds.length)].id,
          vendor_listing_id: listing.id,
          quantity,
          price: unitPrice,
          commission,
          tax,
          total,
          created_at: now,
          updated_at: now
        });
        orderTotal += total;
      }
      // Update order total
      db.prepare('UPDATE orders SET total_amount = ?, updated_at = ? WHERE id = ?')
        .run(orderTotal, now, order.id);
    }

    // 22. Transactions (simplified)
    const insertTransaction = db.prepare(`
      INSERT INTO transactions (id, order_id, amount, status, created_at, updated_at)
      VALUES (@id, @order_id, @amount, @status, @created_at, @updated_at)
    `);
    orders.forEach(order => {
      insertTransaction.run({
        id: uuid(),
        order_id: order.id,
        amount: order.total_amount,
        status: 'completed',
        created_at: order.created_at,
        updated_at: now
      });
    });

    // 23. Vendor settlements
    const insertVendorSettlement = db.prepare(`
      INSERT INTO vendor_settlements (id, vendor_id, amount, status, created_at, updated_at)
      VALUES (@id, @vendor_id, @amount, @status, @created_at, @updated_at)
    `);
    const vendorUsers = db.prepare('SELECT id FROM users WHERE role = "vendor"').all();
    for (let i = 0; i < 5; i++) {
      const vendor = vendorUsers[Math.floor(Math.random() * vendorUsers.length)];
      insertVendorSettlement.run({
        id: uuid(),
        vendor_id: vendor.id,
        amount: Math.floor(Math.random() * 2000) + 500,
        status: ['pending', 'paid', 'failed'][Math.floor(Math.random() * 3)],
        created_at: now,
        updated_at: now
      });
    });
  })();
}

// Auto-run if executed directly
if (require.main === module) {
  runSeed()
    .then(() => {
      console.log('Seeding completed successfully.');
      process.exit(0);
    })
    .catch(err => {
      console.error('Seeding failed:', err);
      process.exit(1);
    });
}

module.exports = { runSeed };
