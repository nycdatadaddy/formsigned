# Deploying ContractStage to Cloudflare Pages

This guide will walk you through deploying your ContractStage application to Cloudflare Pages.

## Prerequisites

1. A Cloudflare account (free tier is sufficient)
2. Your Supabase project URL and anon key
3. This React application built and ready for deployment

## Step 1: Build the Application

First, build the production version of your React application:

```bash
npm run build:cloudflare
```

This will create a `dist` folder with all the optimized static files.

## Step 2: Set Up Cloudflare Pages

### Option A: Direct Upload (Recommended for quick setup)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Pages** in the sidebar
3. Click **Create a project**
4. Choose **Upload assets**
5. Upload the contents of your `dist` folder
6. Set your project name (e.g., "contractstage")

### Option B: Git Integration (Recommended for ongoing development)

1. Push your code to a Git repository (GitHub, GitLab, etc.)
2. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
3. Navigate to **Pages** in the sidebar
4. Click **Create a project**
5. Choose **Connect to Git**
6. Select your repository
7. Configure build settings:
   - **Build command**: `npm run build:cloudflare`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (or leave empty)

## Step 3: Configure Environment Variables

In your Cloudflare Pages project settings:

1. Go to **Settings** → **Environment variables**
2. Add the following variables for **Production**:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

**Important**: Make sure to use the `VITE_` prefix as these are build-time variables.

## Step 4: Configure Custom Domain (Optional)

1. In your Pages project, go to **Custom domains**
2. Click **Set up a custom domain**
3. Enter your domain name
4. Follow the DNS configuration instructions

## Step 5: Set Up Supabase Backend

Since we're using Supabase for the backend, ensure your Supabase project is properly configured:

1. **Database**: Run the migration script to set up your database schema
2. **Authentication**: Configure email authentication in Supabase Auth settings
3. **Storage**: Set up the contracts bucket for file uploads
4. **Row Level Security**: Ensure RLS policies are properly configured

## Build Configuration Details

The application is configured with:

- **Output directory**: `dist` (standard for Vite)
- **Code splitting**: Vendor libraries and Supabase are split into separate chunks
- **Security headers**: Configured via `_headers` file
- **SPA routing**: Configured via `_redirects` file for client-side routing

## Performance Optimizations

The deployment includes several optimizations:

1. **Static asset caching**: Long-term caching for CSS/JS files
2. **Code splitting**: Reduces initial bundle size
3. **Cloudflare CDN**: Global content delivery
4. **Compression**: Automatic gzip/brotli compression

## Monitoring and Analytics

After deployment, you can monitor your application through:

1. **Cloudflare Analytics**: Built-in traffic and performance metrics
2. **Pages Functions**: For any serverless functions you might add later
3. **Real User Monitoring**: Available in Cloudflare's Speed tab

## Troubleshooting

### Common Issues:

1. **Environment variables not working**: Ensure they have the `VITE_` prefix
2. **404 errors on refresh**: Check that `_redirects` file is in the build output
3. **Supabase connection issues**: Verify your environment variables are correct

### Build Failures:

- Check that all dependencies are installed
- Ensure TypeScript compilation passes
- Verify environment variables are set correctly

## Security Considerations

The deployment includes security headers and follows best practices:

- Content Security Policy headers
- XSS protection
- Frame options to prevent clickjacking
- Secure referrer policy

## Next Steps

After successful deployment:

1. Test all functionality thoroughly
2. Set up monitoring and alerts
3. Configure backup procedures
4. Consider setting up staging environment
5. Plan for future Cloudflare Workers integration if needed

Your ContractStage application should now be live and accessible via your Cloudflare Pages URL!