
import { UserUploadError } from '../types';

export const validateUserData = (users: any[]): UserUploadError[] => {
  const errors: UserUploadError[] = [];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const seenEmails = new Set<string>();

  users.forEach((user, index) => {
    const rowNumber = index + 2; // Add 2 to account for header row and 0-based index

    // Handle case-insensitive field names
    const name = user.Name || user.name;
    const email = user.Email || user.email;
    const role = user.Role || user.role;

    // Required fields
    if (!name?.trim()) {
      errors.push({ row: rowNumber, message: 'Name is required' });
    }

    if (!email?.trim()) {
      errors.push({ row: rowNumber, message: 'Email is required' });
    } else if (!emailRegex.test(email)) {
      errors.push({ row: rowNumber, message: 'Invalid email format' });
    } else if (seenEmails.has(email.toLowerCase())) {
      errors.push({ row: rowNumber, message: 'Duplicate email address' });
    } else {
      seenEmails.add(email.toLowerCase());
    }

    // Role validation
    const validRoles = ['user', 'trainer', 'labadmin'];
    if (role && !validRoles.includes(role.toLowerCase())) {
      errors.push({ row: rowNumber, message: 'Invalid role' });
    }
  });

  return errors;
};
