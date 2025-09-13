# 🚁 DroneFlow - Drone Service Request & Tracking System

A comprehensive web application for managing drone services with real-time tracking, modern UI/UX, and complete administrative features.

## ✨ Features

### 🎯 Core Features
- **Service Request System** - Users can submit detailed drone service requests
- **Real-time Tracking** - Track request status from submission to completion
- **Admin Dashboard** - Complete management interface for operators
- **Status Management** - Automated workflow (Pending → Confirmed → In Progress → Completed)
- **Modern UI/UX** - Bootstrap-powered responsive design with smooth animations

### 🔧 Service Types
- **Aerial Photography** - Professional photography and videography
- **Delivery Service** - Fast and secure package delivery
- **Agriculture Spraying** - Precision crop protection and fertilization
- **Surveillance** - Security monitoring and inspection
- **Mapping & Surveying** - Detailed area mapping and analysis
- **Custom Services** - Flexible options for specialized needs

### 💡 Advanced Features
- **Real-time Updates** - Live status notifications and dashboard updates
- **Priority Management** - Normal, High, and Urgent request handling
- **Data Export** - CSV export functionality for reporting
- **Form Validation** - Comprehensive client and server-side validation
- **Responsive Design** - Mobile-first approach with cross-device compatibility
- **Search & Filtering** - Advanced search and filter capabilities

## 🛠 Tech Stack

### Frontend
- **HTML5** - Semantic markup structure
- **CSS3** - Modern styling with custom properties
- **JavaScript (ES6+)** - Interactive functionality
- **Bootstrap 5.3.2** - Responsive framework
- **Font Awesome 6.4.0** - Icon library
- **Google Fonts (Poppins)** - Typography

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **Supabase** - Database and real-time features
- **PostgreSQL** - Primary database
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment configuration

### Database
- **Supabase/PostgreSQL** - Production database
- **Row Level Security** - Data protection
- **Real-time Subscriptions** - Live updates
- **Mock Data** - Development fallback

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Supabase Account** (for production database)

### 1. Clone Repository
```bash
git clone <repository-url>
cd droneflow
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your configuration
nano .env
```

### 4. Database Setup (Optional - uses mock data by default)
If you want to use Supabase (recommended for production):

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Get your project URL and API keys
3. Run the SQL schema in the Supabase SQL editor:
```sql
-- Copy and paste the contents of database/schema.sql
```
4. Update your `.env` file with Supabase credentials

### 5. Start the Application
```bash
# Development mode
npm run dev

# Production mode
npm start
```

### 6. Access the Application
- **Website**: http://localhost:3000
- **API**: http://localhost:3000/api
- **Health Check**: http://localhost:3000/health

## 📁 Project Structure

```
droneflow/
├── public/                 # Frontend files
│   ├── css/
│   │   └── style.css      # Main stylesheet
│   ├── js/
│   │   ├── main.js        # Core JavaScript
│   │   ├── request.js     # Request form handling
│   │   ├── tracking.js    # Tracking functionality
│   │   ├── admin.js       # Admin dashboard
│   │   └── realtime.js    # Real-time updates
│   ├── index.html         # Homepage
│   ├── request.html       # Service request form
│   ├── tracking.html      # Request tracking
│   └── admin.html         # Admin dashboard
├── routes/
│   └── requests.js        # API routes
├── database/
│   └── schema.sql         # Database schema
├── server.js              # Express server
├── package.json           # Dependencies
├── .env.example           # Environment template
└── README.md              # Documentation
```

## 🔧 Configuration

### Environment Variables
```env
# Server Configuration
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:3000

# Supabase Configuration (Optional)
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Database Schema
The application includes a complete PostgreSQL schema with:
- Service requests table with full audit trail
- Operators management (future feature)
- Notifications system for real-time updates
- Automated triggers for status tracking
- Sample data for testing

## 📡 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Endpoints

#### Service Requests
- `GET /requests` - Get all requests (with filtering)
- `GET /requests/stats` - Get dashboard statistics
- `GET /requests/:id` - Get specific request
- `POST /requests` - Create new request
- `PUT /requests/:id` - Update request
- `DELETE /requests/:id` - Delete request

#### Health Check
- `GET /health` - Server health status

### Request Example
```javascript
// Create new service request
POST /api/requests
Content-Type: application/json

{
  "clientName": "John Smith",
  "email": "john@example.com",
  "phone": "(555) 123-4567",
  "serviceType": "aerial_photography",
  "location": "123 Main St, City, State",
  "preferredDate": "2024-01-15",
  "preferredTime": "morning",
  "priority": "normal",
  "description": "Aerial photography for real estate",
  "terms": true,
  "updates": true
}
```

## 🎨 Usage Guide

### For Customers

#### 1. Requesting Service
1. Visit the homepage at http://localhost:3000
2. Click "Request Service" or navigate to `/request.html`
3. Fill out the detailed service request form
4. Submit and receive a unique Request ID
5. Save the Request ID for tracking

#### 2. Tracking Requests
1. Navigate to "Track Request" or `/tracking.html`
2. Enter your Request ID (format: DR-2024-XXXXXX)
3. View real-time status and progress timeline
4. Receive automatic updates on status changes

### For Administrators

#### 1. Dashboard Access
1. Navigate to `/admin.html`
2. View comprehensive dashboard with statistics
3. Monitor all active requests in real-time

#### 2. Request Management
1. **Search & Filter** - Find requests by ID, name, or service type
2. **Status Updates** - Change request status with timestamps
3. **Quick Actions** - Use quick status progression buttons
4. **Detailed View** - Click any request for full details
5. **Notes Management** - Add operator notes and updates

#### 3. Data Export
1. Use the "Export" button to download CSV reports
2. Filter data before export for specific insights

## 🔄 Real-time Features

The application includes comprehensive real-time functionality:

- **Live Status Updates** - Automatic page updates when request status changes
- **Connection Status** - Visual indicator showing real-time connection status
- **Desktop Notifications** - Browser notifications for important updates
- **Auto-refresh** - Background data synchronization

## 🧪 Development Mode

### Mock Data
The application works without a database connection using mock data:
- 3 sample service requests with different statuses
- Complete workflow demonstration
- All features functional for testing

### Database Integration
For production use with Supabase:
1. Set up Supabase project
2. Import database schema
3. Configure environment variables
4. Restart application

## 🐛 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Kill process using port 3000
npx kill-port 3000

# Or use different port
PORT=3001 npm start
```

#### Database Connection Issues
```bash
# Check environment variables
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY

# Verify database schema is imported
# Check Supabase dashboard for tables
```

#### Real-time Not Working
- Check browser console for errors
- Verify server-sent events are enabled
- Test connection at `/api/events`

## 🔒 Security Features

- **Rate Limiting** - Prevents API abuse
- **Input Validation** - Server-side request validation
- **CORS Protection** - Configured cross-origin policies
- **SQL Injection Prevention** - Parameterized queries
- **XSS Protection** - Content Security Policy headers

## 🚀 Production Deployment

### Heroku Deployment
```bash
# Install Heroku CLI
# Login to Heroku
heroku login

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set SUPABASE_URL=your_url
heroku config:set SUPABASE_ANON_KEY=your_key

# Deploy
git push heroku main
```

### Docker Deployment
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation

## 🎯 Roadmap

### Future Enhancements
- [ ] User authentication and accounts
- [ ] Email notifications system
- [ ] File upload for service requests
- [ ] Advanced reporting and analytics
- [ ] Mobile app development
- [ ] Payment integration
- [ ] Multi-language support
- [ ] Advanced operator assignment
- [ ] GPS tracking integration
- [ ] Service history and ratings

---

**Made with ❤️ for the drone services industry**

*DroneFlow - Professional Drone Services at Your Fingertips* 🚁