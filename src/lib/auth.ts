import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import db from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'apex-instruments-secret-key-2026';
const COOKIE_NAME = 'apex_auth_token';

export interface UserPayload {
  userId: string;
  email: string;
  role: string;
  name: string;
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Compare password
export async function comparePassword(password: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(password, hashed);
}

// Sign JWT token
export function signToken(payload: UserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// Verify JWT token
export function verifyToken(token: string): UserPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserPayload;
  } catch (error) {
    return null;
  }
}

// In-memory fast user cache to eliminate repeated db queries during rapid operations
const userCache = new Map<string, { user: any; expiresAt: number }>();

// Get user from cookies (Server Components / Server Actions / Route Handlers)
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) return null;

    const payload = verifyToken(token);
    if (!payload) return null;

    // Check fast memory cache (valid for 60 seconds)
    const cached = userCache.get(payload.userId);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.user;
    }

    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        whatsapp: true,
        company: true,
        country: true,
        address: true,
        city: true,
        zipCode: true,
        createdAt: true,
      },
    });

    if (user) {
      userCache.set(payload.userId, {
        user,
        expiresAt: Date.now() + 60 * 1000, // 60s cache
      });
    }

    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// Log in: set cookie
export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

// Log out: clear cookie
export async function deleteAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}
