import express from 'express';
import cors from 'cors';
import { db, runMigrations } from './config/db';

(async () => {
  try {
    runMigrations();
    console.log('مهاجرت‌ها با موفقیت اجرا شد');
  } catch (error) {
    console.error('خطا در اجرای مهاجرت‌ها:', error);
    process.exit(1);
  }

  const app = express();
  const PORT = process.env.PORT || 3001;
  const CORS_ORIGIN = process.env.CORS_ORIGIN || '';

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cors({
    origin: CORS_ORIGIN,
    credentials: true,
  }));

  let apiRouter;
  try {
    const routesModule = await import('./routes/index');
    apiRouter = routesModule.default;
  } catch (e) {
    apiRouter = express.Router();
    apiRouter.all('*', (req, res) => {
      res.status(404).json({ error: 'مسیر یافت نشد' });
    });
  }

  apiRouter.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api', apiRouter);

  app.use((err, req, res, next) => {
    console.error(err);
    if (err.status === 404) {
      return res.status(404).json({ error: 'مسیر یافت نشد' });
    }
    res.status(err.status || 500).json({ 
      error: 'خطای سرور' 
    });
  });

  const server = app.listen(PORT, () => {
    console.log(`سرور پت‌شاپ روی پورت ${PORT} اجرا شد`);
  });

  const shutdown = async () => {
    console.log('در حال دریافت سیگنال’arrêt، در حال خاموش کردن سرور...');
    server.close(async () => {
      console.log('سرور HTTP بسته شد.');
      try {
        db.close();
        console.log('اتصال به پایگاه داده بسته شد.');
      } catch (error) {
        console.error('خطا در بستن اتصال به پایگاه داده:', error);
      }
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
})();
