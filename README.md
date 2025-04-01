# PickleBall App

A modern web application for connecting pickleball enthusiasts, managing sessions, and building a vibrant community around the sport.

## Features

- 🏓 Create and join pickleball sessions
- 👥 Connect with fellow players
- ⭐ Rate and review players
- 📊 Track your playing history
- 🗺️ Find nearby sessions
- 📱 Responsive design for all devices

## Tech Stack

- **Frontend**: Next.js 14, React, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Styling**: TailwindCSS with custom components

## Prerequisites

- Node.js 18.x or later
- PostgreSQL 12.x or later
- npm or yarn package manager

## Local Development Setup

1. Clone the repository:
   ```bash
   git clone [your-repo-url]
   cd pickleballapp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   # Create a .env file and add these variables
   DATABASE_URL="postgresql://username:password@localhost:5432/pickleball?schema=public"
   NEXTAUTH_SECRET="your-nextauth-secret"
   JWT_SECRET="your-jwt-secret"
   ```

4. Set up the database:
   ```bash
   # Create the database
   createdb pickleball

   # Run Prisma migrations
   npx prisma migrate dev
   
   # Seed the database (optional)
   npm run seed
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Production Deployment

### Option 1: Vercel (Recommended)

Vercel is the recommended platform for Next.js applications, offering:
- Zero-configuration deployment
- Automatic SSL certificates
- Global CDN
- Automatic CI/CD

1. Push your code to GitHub
2. Import your repository in Vercel
3. Configure environment variables
4. Deploy

### Option 2: Manual Ubuntu Setup

1. Update system packages:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. Install Node.js and npm:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs
   ```

3. Install PostgreSQL:
   ```bash
   sudo apt install postgresql postgresql-contrib
   ```

4. Configure PostgreSQL:
   ```bash
   sudo -u postgres createuser -P your_username
   sudo -u postgres createdb -O your_username pickleball
   ```

5. Clone and setup the application:
   ```bash
   git clone [your-repo-url]
   cd pickleballapp
   npm install
   ```

6. Set up environment variables:
   ```bash
   nano .env
   # Add your environment variables
   ```

7. Build and start the application:
   ```bash
   npm run build
   npm start
   ```

8. Set up Nginx as reverse proxy:
   ```bash
   sudo apt install nginx
   sudo nano /etc/nginx/sites-available/pickleballapp
   ```
   
   Add this configuration:
   ```nginx
   server {
       listen 80;
       server_name your_domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

9. Enable the site and restart Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/pickleballapp /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

10. Set up SSL with Let's Encrypt:
    ```bash
    sudo apt install certbot python3-certbot-nginx
    sudo certbot --nginx -d your_domain.com
    ```

### Option 3: Netlify

While Netlify is a great platform, for this application, we recommend Vercel because:
1. Better integration with Next.js
2. Superior handling of server-side functionality
3. Better performance for Next.js API routes

## Environment Variables

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Secret for NextAuth.js
- `JWT_SECRET`: Secret for JWT tokens

Optional environment variables:
- `NEXT_PUBLIC_APP_URL`: Public URL of your application
- `PORT`: Port number (default: 3000)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email [your-email] or open an issue on GitHub. 