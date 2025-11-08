
export const parseCsvFile = async (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const csv = event.target?.result as string;
        const lines = csv.split('\n').filter(line => line.trim());
        
        if (lines.length === 0) {
          reject(new Error('CSV file is empty'));
          return;
        }
        
        // Parse CSV line handling quoted fields
        const parseCSVLine = (line: string): string[] => {
          const result = [];
          let current = '';
          let inQuotes = false;
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result;
        };
        
        const headers = parseCSVLine(lines[0]).map(header => 
          header.replace(/^["']|["']$/g, '').trim()
        );
        
        const users = lines.slice(1)
          .map((line, index) => {
            const values = parseCSVLine(line);
            const user: any = {};
            
            headers.forEach((header, i) => {
              const value = values[i] ? values[i].replace(/^["']|["']$/g, '').trim() : '';
              if (value) {
                user[header] = value;
              }
            });
            
            return user;
          })
          .filter(user => user.Email || user.email); // Filter out empty rows
        
        resolve(users);
      } catch (error) {
        reject(new Error('Failed to parse CSV file'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
};
