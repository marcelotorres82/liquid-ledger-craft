import jwt from 'jsonwebtoken';
import cookie from 'cookie';

const TOKEN_NAME = 'token';

export function generateToken(userId, email) {
  return jwt.sign(
    { id: userId, email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function createTokenCookie(token) {
  return cookie.serialize(TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7,
    path: '/'
  });
}

export function clearTokenCookie() {
  return cookie.serialize(TOKEN_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/'
  });
}

export async function verifyToken(req) {
  const cookies = cookie.parse(req.headers.cookie || '');
  const bearer = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : null;
  const token = cookies[TOKEN_NAME] || bearer;

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.id;
  } catch (error) {
    return null;
  }
}
