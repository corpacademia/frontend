import { UserUploadError } from '../types';

export const validateUserData = (users: any[]): UserUploadError[] => {
  const errors: UserUploadError[] = [];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const seenEmails = new Set<string>();

  users.forEach((user, index) => {
    const rowNumber = index + 2; // Add 2 to account for header row and 0-based index

    // Required fields
    if (!user.name?.trim()) {
      errors.push({ row: rowNumber, message: 'Name is required' });
    }

    if (!user.email?.trim()) {
      errors.push({ row: rowNumber, message: 'Email is required' });
    } else if (!emailRegex.test(user.email)) {
      errors.push({ row: rowNumber, message: 'Invalid email format' });
    } else if (seenEmails.has(user.email.toLowerCase())) {
      errors.push({ row: rowNumber, message: 'Duplicate email address' });
    } else {
      seenEmails.add(user.email.toLowerCase());
    }

    // Role validation
    const validRoles = ['user', 'trainer', 'orgadmin'];
    if (user.role && !validRoles.includes(user.role.toLowerCase())) {
      errors.push({ row: rowNumber, message: 'Invalid role' });
    }
  });

  return errors;
};