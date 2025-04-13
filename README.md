# BuildMart Construction Materials Website

An e-commerce platform for construction materials with admin panel.

## Features
- Product management
- Order tracking
- User authentication
- Admin dashboard
- Responsive design

## Tech Stack
- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express
- Database: MongoDB

## Installation
1. Clone the repository
2. Install dependencies: `npm install`
3. Create `.env` file and set environment variables
4. Run: `npm start`

## Environment Variables
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/buildmart
JWT_SECRET=your_jwt_secret_here
NODE_ENV=development
```

## Setup

1. Create an admin user:
   ```npm run create-admin```

2. Add sample products:
   ```npm run create-products```

3. Or run both setup scripts at once:
   ```npm run setup```

## Running the Application

1. Start the development server:
   ```npm run dev```

2. Open your browser and navigate to:
   ```http://localhost:3000```

3. Access the admin panel at:
   ```http://localhost:3000/admin```
   Default admin credentials:
   - Email: admin@buildmart.com
   - Password: Admin123!

## Project Structure

- `/admin` - Admin panel files
- `/scripts` - Setup scripts for database initialization
- `/public` - Static assets
- `server.js` - Main Express server file
- `*.html` - Frontend HTML files
- `Style.css` - Main stylesheet
- `script.js` - Main client-side JavaScript

## API Endpoints

### Authentication
- `POST /api/login` - User login
- `POST /api/register` - User registration
- `POST /api/logout` - User logout
- `POST /api/refresh-token` - Refresh access token

### Products
- `GET /api/products` - Get all products or filter by category/search
- `POST /api/products` - Add a new product (admin only)
- `PUT /api/products/:id` - Update a product (admin only)
- `DELETE /api/products/:id` - Delete a product (admin only)

### Users
- `GET /api/users` - Get all users (admin only)
- `POST /api/users/promote` - Promote a user to admin (admin only)

### Contacts
- `POST /api/contact` - Submit a contact form
- `GET /api/contacts` - Get all contact submissions (admin only)
- `PUT /api/contacts/:id/status` - Update contact status (admin only)
- `DELETE /api/contacts/:id` - Delete a contact entry (admin only)

## License

This project is licensed under the MIT License.