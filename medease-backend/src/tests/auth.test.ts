import request from 'supertest';
import { app } from '../server';
import { JWTUtils } from '../utils/jwt';
import { PasswordUtils } from '../utils/password';

describe('Authentication Endpoints', () => {
  const testUser = {
    email: 'test@example.com',
    password: 'TestPassword123!',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+1234567890',
    roles: ['PATIENT']
  };

  describe('POST /api/auth/signup', () => {
    it('should register a new patient successfully', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'User registered successfully');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('tokens');
      expect(response.body.data.user.email).toBe(testUser.email);
    });

    it('should register a new doctor successfully', async () => {
      const doctorUser = {
        ...testUser,
        email: 'doctor@example.com',
        roles: ['DOCTOR'],
        specialty: 'Cardiology',
        licenseNumber: 'DOC123456',
        experience: 5,
        consultationFee: 150
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(doctorUser)
        .expect(201);

      expect(response.body.data).toHaveProperty('doctorProfile');
      expect(response.body.data.doctorProfile.specialty).toBe('Cardiology');
    });

    it('should reject registration with weak password', async () => {
      const weakPasswordUser = {
        ...testUser,
        email: 'weak@example.com',
        password: '123'
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(weakPasswordUser)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.code).toBe('WEAK_PASSWORD');
    });

    it('should reject registration with invalid email', async () => {
      const invalidEmailUser = {
        ...testUser,
        email: 'invalid-email'
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(invalidEmailUser)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject duplicate email registration', async () => {
      // First registration
      await request(app)
        .post('/api/auth/signup')
        .send({ ...testUser, email: 'duplicate@example.com' })
        .expect(201);

      // Duplicate registration
      const response = await request(app)
        .post('/api/auth/signup')
        .send({ ...testUser, email: 'duplicate@example.com' })
        .expect(409);

      expect(response.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
    });
  });

  describe('POST /api/auth/signin', () => {
    beforeEach(async () => {
      // Register a user for login tests
      await request(app)
        .post('/api/auth/signup')
        .send({ ...testUser, email: 'login@example.com' });
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/signin')
        .send({
          email: 'login@example.com',
          password: testUser.password
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('tokens');
      expect(response.body.data.tokens).toHaveProperty('accessToken');
      expect(response.body.data.tokens).toHaveProperty('refreshToken');
    });

    it('should reject login with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/signin')
        .send({
          email: 'nonexistent@example.com',
          password: testUser.password
        })
        .expect(401);

      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should reject login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/signin')
        .send({
          email: 'login@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('POST /api/auth/refresh', () => {
    let refreshToken: string;

    beforeEach(async () => {
      const signupResponse = await request(app)
        .post('/api/auth/signup')
        .send({ ...testUser, email: 'refresh@example.com' });
      
      refreshToken = signupResponse.body.data.tokens.refreshToken;
    });

    it('should refresh token successfully', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('expiresIn');
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body.error.code).toBe('INVALID_REFRESH_TOKEN');
    });
  });

  describe('Protected Routes', () => {
    let accessToken: string;

    beforeEach(async () => {
      const signupResponse = await request(app)
        .post('/api/auth/signup')
        .send({ ...testUser, email: 'protected@example.com' });
      
      accessToken = signupResponse.body.data.tokens.accessToken;
    });

    describe('GET /api/auth/profile', () => {
      it('should get profile with valid token', async () => {
        const response = await request(app)
          .get('/api/auth/profile')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(response.body.data).toHaveProperty('user');
      });

      it('should reject request without token', async () => {
        const response = await request(app)
          .get('/api/auth/profile')
          .expect(401);

        expect(response.body.error.code).toBe('TOKEN_REQUIRED');
      });

      it('should reject request with invalid token', async () => {
        const response = await request(app)
          .get('/api/auth/profile')
          .set('Authorization', 'Bearer invalid-token')
          .expect(401);

        expect(response.body.error.code).toBe('INVALID_TOKEN');
      });
    });

    describe('POST /api/auth/change-password', () => {
      it('should change password successfully', async () => {
        const response = await request(app)
          .post('/api/auth/change-password')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            currentPassword: testUser.password,
            newPassword: 'NewPassword123!'
          })
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
      });

      it('should reject with wrong current password', async () => {
        const response = await request(app)
          .post('/api/auth/change-password')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            currentPassword: 'wrongpassword',
            newPassword: 'NewPassword123!'
          })
          .expect(401);

        expect(response.body.error.code).toBe('INVALID_CURRENT_PASSWORD');
      });
    });

    describe('POST /api/auth/logout', () => {
      it('should logout successfully', async () => {
        const response = await request(app)
          .post('/api/auth/logout')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
      });
    });
  });
});

describe('JWT Utils', () => {
  const testPayload = {
    userId: 'test-user-id',
    email: 'test@example.com',
    roles: ['PATIENT'] as any
  };

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const token = JWTUtils.generateAccessToken(testPayload);
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', () => {
      const token = JWTUtils.generateAccessToken(testPayload);
      const decoded = JWTUtils.verifyAccessToken(token);
      
      expect(decoded.userId).toBe(testPayload.userId);
      expect(decoded.email).toBe(testPayload.email);
      expect(decoded.roles).toEqual(testPayload.roles);
    });

    it('should reject an invalid token', () => {
      expect(() => {
        JWTUtils.verifyAccessToken('invalid-token');
      }).toThrow();
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from valid Bearer header', () => {
      const token = 'test-token';
      const header = `Bearer ${token}`;
      const extracted = JWTUtils.extractTokenFromHeader(header);
      expect(extracted).toBe(token);
    });

    it('should return null for invalid header format', () => {
      const extracted = JWTUtils.extractTokenFromHeader('Invalid header');
      expect(extracted).toBeNull();
    });

    it('should return null for undefined header', () => {
      const extracted = JWTUtils.extractTokenFromHeader(undefined);
      expect(extracted).toBeNull();
    });
  });
});

describe('Password Utils', () => {
  const testPassword = 'TestPassword123!';

  describe('hashPassword', () => {
    it('should hash a valid password', async () => {
      const hashed = await PasswordUtils.hashPassword(testPassword);
      expect(typeof hashed).toBe('string');
      expect(hashed).not.toBe(testPassword);
      expect(hashed.length).toBeGreaterThan(50); // bcrypt hashes are long
    });

    it('should reject weak passwords', async () => {
      await expect(PasswordUtils.hashPassword('weak')).rejects.toThrow();
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const hashed = await PasswordUtils.hashPassword(testPassword);
      const isValid = await PasswordUtils.verifyPassword(testPassword, hashed);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const hashed = await PasswordUtils.hashPassword(testPassword);
      const isValid = await PasswordUtils.verifyPassword('wrongpassword', hashed);
      expect(isValid).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should accept strong password', () => {
      expect(() => {
        PasswordUtils.validatePasswordStrength('StrongPassword123!');
      }).not.toThrow();
    });

    it('should reject short password', () => {
      expect(() => {
        PasswordUtils.validatePasswordStrength('Short1!');
      }).toThrow();
    });

    it('should reject password without uppercase', () => {
      expect(() => {
        PasswordUtils.validatePasswordStrength('lowercase123!');
      }).toThrow();
    });

    it('should reject password without numbers', () => {
      expect(() => {
        PasswordUtils.validatePasswordStrength('NoNumbers!');
      }).toThrow();
    });

    it('should reject password without special characters', () => {
      expect(() => {
        PasswordUtils.validatePasswordStrength('NoSpecialChars123');
      }).toThrow();
    });
  });

  describe('getPasswordStrengthScore', () => {
    it('should return high score for strong password', () => {
      const result = PasswordUtils.getPasswordStrengthScore('VeryStrongPassword123!@#');
      expect(result.score).toBeGreaterThan(6);
      expect(result.strength).toBe('Strong');
    });

    it('should return low score for weak password', () => {
      const result = PasswordUtils.getPasswordStrengthScore('weak');
      expect(result.score).toBeLessThan(3);
      expect(result.strength).toBe('Very Weak');
    });
  });
});