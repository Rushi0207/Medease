# MedEase Backend API

A comprehensive Node.js backend API for the MedEase Patient Health Dashboard, providing healthcare management functionality including patient profiles, doctor directory, appointment booking, real-time chat, and medical document management.

## 🚀 Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Patient Management**: Health metrics, medical conditions, profile management
- **Doctor Directory**: Search, filter, and view doctor profiles
- **Appointment System**: Book, manage, and track appointments
- **Real-time Chat**: WebSocket-based messaging between patients and doctors
- **Document Management**: Upload and manage medical documents
- **Security**: Rate limiting, input validation, CORS protection
- **Database**: PostgreSQL with connection pooling

## 🛠️ Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Real-time**: Socket.IO
- **Authentication**: JWT with bcrypt
- **Validation**: express-validator
- **Testing**: Jest with Supertest
- **Security**: Helmet, CORS, Rate limiting

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v13 or higher)
- npm or yarn

## 🚀 Getting Started

### 1. Installation

```bash
# Clone the repository
git clone <repository-url>
cd medease-backend

# Install dependencies
npm install
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your configuration
nano .env
```

### 3. Database Setup

```bash
# Create PostgreSQL database
createdb medease_db

# Run migrations (will be added in subsequent tasks)
npm run migrate
```

### 4. Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 📚 API Documentation

### Health Check
- `GET /health` - Server health status

### Authentication (Coming Soon)
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `POST /api/auth/refresh` - Token refresh

### Patient Management (Coming Soon)
- `GET /api/patients/profile` - Get patient profile
- `PUT /api/patients/profile` - Update patient profile
- `POST /api/patients/conditions` - Add medical condition
- `PUT /api/patients/health-metrics` - Update health metrics

### Doctor Directory (Coming Soon)
- `GET /api/doctors/all` - Get all doctors
- `GET /api/doctors/search` - Search doctors
- `GET /api/doctors/:id` - Get doctor by ID

### Appointments (Coming Soon)
- `POST /api/appointments/book` - Book appointment
- `GET /api/appointments/patient` - Get patient appointments
- `DELETE /api/appointments/:id` - Cancel appointment

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 🔧 Development Scripts

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build TypeScript to JavaScript
npm run start        # Start production server
npm run test         # Run test suite
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
```

## 📁 Project Structure

```
src/
├── config/          # Configuration files
├── controllers/     # Request handlers
├── middleware/      # Custom middleware
├── models/          # Database models
├── routes/          # API route definitions
├── services/        # Business logic
├── sockets/         # WebSocket handlers
├── tests/           # Test files
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
└── server.ts        # Application entry point
```

## 🔒 Security Features

- JWT authentication with refresh tokens
- Password hashing with bcrypt
- Rate limiting to prevent abuse
- Input validation and sanitization
- CORS protection
- Security headers with Helmet
- Environment variable protection

## 🚀 Deployment

### Docker (Coming Soon)
```bash
# Build Docker image
docker build -t medease-backend .

# Run container
docker run -p 8080:8080 medease-backend
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `8080` |
| `NODE_ENV` | Environment | `development` |
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `5432` |
| `DB_NAME` | Database name | `medease_db` |
| `DB_USER` | Database user | `medease_user` |
| `DB_PASSWORD` | Database password | - |
| `JWT_SECRET` | JWT secret key | - |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run tests and linting
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions, please open an issue in the repository.

---

Built with ❤️ for modern healthcare experiences