import bcrypt from 'bcryptjs';
import { createError } from '../middleware/errorHandler';
import { logger } from './logger';

export class PasswordUtils {
  private static readonly SALT_ROUNDS = 12;
  private static readonly MIN_LENGTH = 8;
  private static readonly MAX_LENGTH = 128;

  static async hashPassword(plainPassword: string): Promise<string> {
    try {
      this.validatePasswordStrength(plainPassword);
      const salt = await bcrypt.genSalt(this.SALT_ROUNDS);
      const hashedPassword = await bcrypt.hash(plainPassword, salt);
      
      logger.debug('Password hashed successfully');
      return hashedPassword;
    } catch (error: any) {
      if (error.statusCode) {
        throw error;
      }
      logger.error('Failed to hash password:', error);
      throw createError('Password hashing failed', 500, 'PASSWORD_HASH_FAILED');
    }
  }

  static async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      const isValid = await bcrypt.compare(plainPassword, hashedPassword);
      logger.debug(`Password verification: ${isValid ? 'success' : 'failed'}`);
      return isValid;
    } catch (error) {
      logger.error('Failed to verify password:', error);
      return false;
    }
  }

  static validatePasswordStrength(password: string): void {
    const errors: string[] = [];

    // Length check
    if (password.length < this.MIN_LENGTH) {
      errors.push(`Password must be at least ${this.MIN_LENGTH} characters long`);
    }

    if (password.length > this.MAX_LENGTH) {
      errors.push(`Password must not exceed ${this.MAX_LENGTH} characters`);
    }

    // Character requirements
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    if (!hasLowercase) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!hasUppercase) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!hasNumbers) {
      errors.push('Password must contain at least one number');
    }

    if (!hasSpecialChars) {
      errors.push('Password must contain at least one special character');
    }

    // Common password patterns to avoid
    const commonPatterns = [
      /^(.)\1+$/, // All same character
      /^(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i, // Sequential characters
      /^(password|123456|qwerty|admin|user|guest|test)/i, // Common passwords
    ];

    for (const pattern of commonPatterns) {
      if (pattern.test(password)) {
        errors.push('Password contains common patterns and is not secure');
        break;
      }
    }

    if (errors.length > 0) {
      throw createError(
        'Password does not meet security requirements',
        400,
        'WEAK_PASSWORD',
        { requirements: errors }
      );
    }
  }

  static generateSecurePassword(length: number = 16): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    const allChars = lowercase + uppercase + numbers + specialChars;
    
    let password = '';
    
    // Ensure at least one character from each category
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += specialChars[Math.floor(Math.random() * specialChars.length)];
    
    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  static getPasswordStrengthScore(password: string): {
    score: number;
    strength: 'Very Weak' | 'Weak' | 'Fair' | 'Good' | 'Strong';
    feedback: string[];
  } {
    let score = 0;
    const feedback: string[] = [];

    // Length scoring
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;
    else if (password.length < 8) feedback.push('Use at least 8 characters');

    // Character variety scoring
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Add lowercase letters');

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Add uppercase letters');

    if (/\d/.test(password)) score += 1;
    else feedback.push('Add numbers');

    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1;
    else feedback.push('Add special characters');

    // Bonus points for complexity
    const uniqueChars = new Set(password).size;
    if (uniqueChars >= password.length * 0.7) score += 1;

    // Penalty for common patterns
    if (/(.)\1{2,}/.test(password)) {
      score -= 1;
      feedback.push('Avoid repeating characters');
    }

    if (/^(012|123|234|345|456|567|678|789|890|abc|bcd|cde)/i.test(password)) {
      score -= 1;
      feedback.push('Avoid sequential characters');
    }

    // Determine strength level
    let strength: 'Very Weak' | 'Weak' | 'Fair' | 'Good' | 'Strong';
    if (score <= 2) strength = 'Very Weak';
    else if (score <= 4) strength = 'Weak';
    else if (score <= 6) strength = 'Fair';
    else if (score <= 8) strength = 'Good';
    else strength = 'Strong';

    return { score: Math.max(0, score), strength, feedback };
  }

  static async isPasswordCompromised(password: string): Promise<boolean> {
    // In a real implementation, you might check against a database of compromised passwords
    // For now, we'll just check against a small list of very common passwords
    const commonPasswords = [
      'password', '123456', 'password123', 'admin', 'qwerty',
      'letmein', 'welcome', 'monkey', '1234567890', 'abc123',
      'Password1', 'password1', '123456789', 'welcome123'
    ];

    return commonPasswords.includes(password.toLowerCase());
  }
}

export default PasswordUtils;