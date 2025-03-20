import axios from 'axios';
import { useEffect, useState } from 'react';

interface FormData {
  name: string;
  email: string;
  role: string;
  organization?: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  role?: string;
  organization?: string;
  submit?: string;
}

export const useUserForm = (
  initialData: Partial<FormData> = {},
  onSubmit: (data: FormData) => Promise<void>
) => {
  const [formData, setFormData] = useState<FormData>({
    name: initialData.name || '',
    email: initialData.email || '',
    role: initialData.role || 'user',
    organization: initialData.organization || ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user_cred,setUser] = useState({});

  useEffect(() => {
    const getUserDetails = async () => {
      const response = await axios.get('http://localhost:3000/api/v1/user_ms/user_profile');
      setUser(response.data.user);
    };
    getUserDetails();
  }, []);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.role) {
      newErrors.role = 'Role is required';
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      const user = user_cred;
      const result = await axios.post('http://localhost:3000/api/v1/user_ms/addUser',{
           formData:formData,
           user:user.id
      })
      if(!result.data.success){
        setErrors(prev => ({
          ...prev,
          submit: 'Failed to add user. Please try again.'
        }));
       } 
       
       location.reload(true);
      }
    catch (error) {
      setErrors(prev => ({
        ...prev,
        submit:error?.response?.data?.detail ||  'Failed to add user. Please try again.'
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit
  };
};