# AuraTask - مدیریت هوشمند وظایف

AuraTask یک برنامه مدیریت وظایف مدرن و هوشمند است که با استفاده از هوش مصنوعی به شما کمک می‌کند تا وظایف خود را به صورت کارآمد مدیریت کنید.

## ویژگی‌ها

- 🎯 مدیریت هوشمند وظایف با کمک هوش مصنوعی
- 🎨 رابط کاربری مدرن و زیبا با پشتیبانی از تم‌های مختلف
- 📱 طراحی واکنش‌گرا برای استفاده در تمام دستگاه‌ها
- 🔄 همگام‌سازی خودکار با سرور
- 🏷️ دسته‌بندی و برچسب‌گذاری هوشمند وظایف
- 📊 آمار و نمودارهای پیشرفته
- 🔐 احراز هویت امن با Supabase
- 🌐 پشتیبانی از زبان فارسی

## پیش‌نیازها

- Node.js 18 یا بالاتر
- pnpm
- حساب کاربری Supabase
- کلید API Gemini (برای قابلیت‌های هوش مصنوعی)

## نصب و راه‌اندازی

1. کلون کردن مخزن:
```bash
git clone https://github.com/yourusername/auratask.git
cd auratask
```

2. نصب وابستگی‌ها:
```bash
pnpm install
```

3. تنظیم متغیرهای محیطی:
فایل `.env.local` را در ریشه پروژه ایجاد کنید و متغیرهای زیر را تنظیم کنید:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

4. اجرای برنامه در محیط توسعه:
```bash
pnpm dev
```

5. ساخت نسخه تولید:
```bash
pnpm build
```

## ساختار پروژه

```
auratask/
├── app/                    # صفحات و API routes
├── components/            # کامپوننت‌های React
├── lib/                   # توابع و کلاس‌های کمکی
├── public/               # فایل‌های استاتیک
├── styles/               # استایل‌های CSS
└── types/                # تعاریف TypeScript
```

## تکنولوژی‌ها

- Next.js 14
- React
- TypeScript
- Tailwind CSS
- Supabase
- Framer Motion
- Zustand
- Gemini AI

## مشارکت

از مشارکت شما در بهبود این پروژه استقبال می‌کنیم. لطفاً مراحل زیر را دنبال کنید:

1. Fork کردن مخزن
2. ایجاد یک شاخه جدید (`git checkout -b feature/amazing-feature`)
3. Commit کردن تغییرات (`git commit -m 'Add some amazing feature'`)
4. Push کردن به شاخه (`git push origin feature/amazing-feature`)
5. ایجاد یک Pull Request

## مجوز

این پروژه تحت مجوز MIT منتشر شده است. برای اطلاعات بیشتر به فایل `LICENSE` مراجعه کنید.

## پشتیبانی

اگر سوال یا مشکلی دارید، لطفاً یک issue در GitHub ایجاد کنید یا با ما از طریق ایمیل تماس بگیرید.

## تشکر و قدردانی

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [Google Gemini](https://deepmind.google/technologies/gemini/)
