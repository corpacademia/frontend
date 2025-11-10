export const parseCsvFile = async (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const csv = (event.target?.result as string).replace(/\r/g, '').trim();
        const lines = csv.split('\n').filter(line => line.trim());

        if (lines.length === 0) {
          reject(new Error('CSV file is empty'));
          return;
        }

        // 🧠 Auto-detect delimiter
        const firstLine = lines[0];
        const delimiter =
          (firstLine.match(/;/g)?.length || 0) > (firstLine.match(/,/g)?.length || 0)
            ? ';'
            : ',';

        // ✅ CSV line parser that supports quotes
        const parseCSVLine = (line: string): string[] => {
          const result: string[] = [];
          let current = '';
          let inQuotes = false;

          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === delimiter && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result;
        };

        // ✅ Normalize headers
        const headers = parseCSVLine(lines[0]).map(header =>
          header.replace(/^["']|["']$/g, '').trim().toLowerCase()
        );

        // ✅ Map possible header variants
        const headerMap: Record<string, string> = {
          email: 'email',
          'e-mail': 'email',
          name: 'name',
          'first name': 'first_name',
          'last name': 'last_name',
          identifier: 'identifier',
        };

        const users = lines.slice(1)
          .map(line => {
            const values = parseCSVLine(line);
            const user: any = {};

            headers.forEach((header, i) => {
              const mapped = headerMap[header] || header;
              const value = values[i]?.replace(/^["']|["']$/g, '').trim();
              if (value) user[mapped] = value;
            });

            //  Combine first_name + last_name into a single name field
            if (!user.name && (user.first_name || user.last_name)) {
              user.name = [user.first_name, user.last_name].filter(Boolean).join(' ');
            }

            return user;
          })
          .filter(user => Object.values(user).some(v => v)); // Skip empty rows

        resolve(users);
      } catch (error) {
        reject(new Error('Failed to parse CSV file'));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};
