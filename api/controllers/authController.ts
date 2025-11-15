import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db';
import { User, UserResponse, RegisterRequest, LoginRequest, JWTPayload, AuthRequest } from '../types';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Register new user
export const register = async (req: AuthRequest, res: Response) => {
  try {
    const { first_name, last_name, email, mobile_number, birthday, password, password_confirmation } = req.body;

    // Validation
    if (!first_name || !last_name || !email || !mobile_number || !birthday || !password) {
      return res.status(422).json({ message: 'All fields are required' });
    }

    if (password !== password_confirmation) {
      return res.status(422).json({ message: 'Passwords do not match' });
    }

    if (password.length < 8) {
      return res.status(422).json({ message: 'Password must be at least 8 characters' });
    }

    // Check if user exists
    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    
    if (existing.length > 0) {
      return res.status(422).json({ message: 'Email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO users (first_name, last_name, email, mobile_number, birthday, password, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [first_name, last_name, email, mobile_number, birthday, hashedPassword, 'user']
    );

    // Get created user
    const [users] = await pool.query<RowDataPacket[]>(
      'SELECT id, first_name, last_name, email, mobile_number, birthday, role FROM users WHERE id = ?',
      [result.insertId]
    );
    
    const user = users[0] as UserResponse;

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role } as JWTPayload,
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      user,
      token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Login existing user
export const login = async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(422).json({ message: 'Email and password are required' });
    }

    // Find user
    const [users] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      return res.status(422).json({ 
        errors: { email: ['The provided credentials are incorrect.'] }
      });
    }

    const user = users[0] as User;

    // Check password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(422).json({ 
        errors: { email: ['The provided credentials are incorrect.'] }
      });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role } as JWTPayload,
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Logout user (client-side token removal, but endpoint exists for consistency)
export const logout = async (req: AuthRequest, res: Response) => {
  res.json({ message: 'Logged out successfully' });
};

// Get current authenticated user
export const me = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthenticated' });
    }

    const [users] = await pool.query<RowDataPacket[]>(
      'SELECT id, first_name, last_name, email, mobile_number, birthday, role FROM users WHERE id = ?',
      [req.user.id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user: users[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Forgot password (placeholder for future email implementation)
export const forgotPassword = async (req: AuthRequest, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(422).json({ message: 'Email is required' });
    }

    const [users] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      return res.status(422).json({ message: 'Email not found' });
    }

    // TODO: Implement email sending later
    res.json({ message: 'Password reset link sent to your email' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};