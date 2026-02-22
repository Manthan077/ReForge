<div align="center">
  <img src="frontend/public/ReForge.png" alt="ReForge Logo" width="120" height="120" style="border-radius: 60px; object-fit: cover;">
  
  # ReForge
  
  ### Clone, Customize, and Export Any Website in Minutes
  
  [![React](https://img.shields.io/badge/React-19.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
  [![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
  [![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

  <p align="center">
    <a href="#-features">Features</a> •
    <a href="#-demo">Demo</a> •
    <a href="#-installation">Installation</a> •
    <a href="#-usage">Usage</a> •
    <a href="#-tech-stack">Tech Stack</a>
  </p>
</div>

---

## 🚀 Overview

**ReForge** is a powerful web cloning and customization platform that allows you to scrape any website, edit its content in real-time, and export it as a complete, production-ready package. Perfect for developers, designers, and businesses looking to quickly prototype or recreate web designs.

### Why ReForge?

- 🎯 **Instant Cloning** - Clone any website with a single URL
- ✏️ **Live Editing** - Edit text and images directly in the preview
- 🎨 **Theme Toggle** - Switch between light and dark modes intelligently
- 📦 **Complete Export** - Download everything as a ready-to-deploy ZIP file
- 🔐 **User Authentication** - Secure signup/login with JWT
- 👤 **Profile Management** - Customize your profile with photo uploads
- 🌐 **Asset Bundling** - All CSS, JS, images, and fonts included

---

## ✨ Features

### Core Functionality
- **Website Scraping** - Powered by Puppeteer for accurate HTML/CSS extraction
- **Visual Editor** - Click-to-edit interface for text and images
- **Smart Theme Detection** - Automatically detects original theme (dark/light)
- **Theme Inversion** - Toggle between original and inverted color schemes
- **Asset Management** - Downloads and bundles all external resources
- **ZIP Export** - One-click export with complete file structure

### User Features
- **Authentication System** - Email/password authentication with bcrypt
- **Profile Management** - Edit name, date of birth, and profile photo
- **Secure Sessions** - JWT-based authentication
- **Responsive Design** - Works seamlessly on all devices

### Developer Features
- **Clean Code Architecture** - Modular and maintainable codebase
- **React Context API** - Efficient state management
- **RESTful API** - Well-structured backend endpoints
- **Error Handling** - Comprehensive error suppression for scraped sites
- **Base64 Image Support** - Profile photos stored efficiently

---

## 🎬 Demo

### Clone Any Website
```
1. Enter website URL (e.g., https://example.com)
2. Click "Extract Frontend"
3. Wait for scraping to complete
4. Preview and edit in real-time
```

### Edit Content
- **Text Editing**: Click any text element to modify
- **Image Replacement**: Click images to upload new ones
- **Theme Toggle**: Switch between light/dark modes
- **Live Preview**: See changes instantly

### Export Project
- Click "Export as ZIP"
- Get complete website package with all assets
- Deploy anywhere - it's production-ready!

---

## 📦 Installation

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or Atlas)

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
PORT=5000
MONGODB_URI=mongodb://localhost:27017/reforge
JWT_SECRET=your_super_secret_jwt_key_here
EOF

# Start backend server
node index.js
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

---

## 🎯 Usage

### 1. Create an Account
```
- Navigate to signup page
- Enter name, email, and password
- Click "Create Account"
- Login with your credentials
```

### 2. Clone a Website
```
- Enter target website URL
- Click "Clone Website"
- Wait for scraping to complete
- Preview the cloned site
```

### 3. Customize Content
```
- Click any text to edit
- Click images to replace
- Toggle theme mode
- See changes in real-time
```

### 4. Export Your Project
```
- Click "Export as ZIP"
- Download complete package
- Extract and deploy anywhere
```

---

## 🛠️ Tech Stack

### Frontend
- **React 19.2** - UI library
- **React Router DOM** - Client-side routing
- **TailwindCSS** - Utility-first CSS framework
- **Vite** - Build tool and dev server
- **JSZip** - ZIP file generation

### Backend
- **Node.js** - Runtime environment
- **Express 5** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing

### APIs & Services
- **Puppeteer** - Headless browser automation for rendering
- **Cheerio** - HTML parsing and manipulation
- **Node Fetch** - Asset downloading

---

## 📁 Project Structure

```
Reforge/
├── backend/
│   ├── index.js              # Express server
│   ├── routes/
│   │   └── auth.js           # Authentication routes
│   ├── models/
│   │   └── User.js           # User schema
│   ├── middleware/
│   │   └── auth.js           # JWT verification
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AuthNavbar.jsx    # Navigation bar
│   │   │   └── Layout.jsx        # Page layout
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx   # Home page
│   │   │   ├── ClonePage.jsx     # Clone interface
│   │   │   ├── PreviewPage.jsx   # Editor & preview
│   │   │   ├── LoginPage.jsx     # Login form
│   │   │   ├── SignupPage.jsx    # Signup form
│   │   │   └── ProfilePage.jsx   # User profile
│   │   ├── context/
│   │   │   ├── AuthContext.jsx   # Auth state
│   │   │   └── appContextStore.jsx # App state
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
└── README.md
```

---

## 🔐 API Endpoints

### Authentication
```
POST   /auth/signup          # Create new account
POST   /auth/login           # Login user
GET    /auth/me              # Get current user
PUT    /auth/profile         # Update profile
```

### Website Operations
```
POST   /scrape               # Scrape website
POST   /export-with-edits    # Export with modifications
```

---

## 🎨 Design Philosophy

ReForge follows a **premium dark theme** design language with:
- Purple/blue gradient accents
- Glassmorphism effects
- Smooth animations and transitions
- Professional typography
- Intuitive user experience

---

## 🔒 Security Features

- **Password Hashing** - bcrypt with salt rounds
- **JWT Authentication** - Secure token-based auth
- **Protected Routes** - Middleware-based route protection
- **Input Validation** - Server-side validation
- **CORS Configuration** - Controlled cross-origin requests
- **Error Suppression** - Prevents scraped site errors from breaking app

---

## 🚧 Roadmap

- [ ] Multi-page website cloning
- [ ] Collaborative editing
- [ ] Version history
- [ ] Custom CSS injection
- [ ] Component library
- [ ] AI-powered design suggestions
- [ ] Direct deployment to hosting platforms
- [ ] Browser extension

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Your Name**
- GitHub: [Manthan077](https://github.com/Manthan077)
- Email: manthan10041004@gmail.com

---

## 🙏 Acknowledgments

- [Puppeteer](https://pptr.dev) - Headless browser automation
- [Cheerio](https://cheerio.js.org) - HTML parsing
- [TailwindCSS](https://tailwindcss.com) - CSS framework
- [React](https://reactjs.org) - UI library

---

<div align="center">
  <p>Made with ❤️ by Manthan Sharma</p>
  <p>⭐ Star this repo if you find it useful!</p>
</div>
