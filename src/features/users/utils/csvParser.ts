export const parseCsvFile = async (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const csv = event.target?.result as string;
        const lines = csv.split('\n');
        const headers = lines[0].split(',').map(header => header.trim());
        
        const users = lines.slice(1).map((line, index) => {
          const values = line.split(',').map(value => value.trim());
          const user: any = {};
          
          headers.forEach((header, i) => {
            user[header] = values[i];
          });
          
          return user;
        });
        
        resolve(users.filter(user => user.email)); // Filter out empty rows
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