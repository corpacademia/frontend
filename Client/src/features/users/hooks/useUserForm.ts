import axios from 'axios';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { ROLE_TO_FEATURE,useSubscription } from '../../labs/hooks/useSubscription';

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
  const {canUse,updateUsage,license} = useSubscription();
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user_cred,setUser] = useState({});
  const {user,orgUsers} = useAuthStore();
 

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
       if (user?.role !== 'superadmin') {
            const featureKey = ROLE_TO_FEATURE[formData?.role]; // e.g. 'trainers', 'students', 'labadmins'
            if (featureKey) {
              const currentCount = orgUsers.filter(u => u.role === formData?.role).length;
              if (!canUse(featureKey, currentCount)) {
                const label = { labadmins: 'Lab Admin', trainers: 'Trainer', students: 'Student' }[featureKey] ?? 'User';
                alert(`${label} limit reached on your current plan. Please upgrade to add more.`);
                return;
              }
            }
          }
      await onSubmit(formData);
      const result = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user_ms/addUser`,{
           formData:formData,
           user:user?.impersonating ? user?.impersonatedUserId : user?.id
      })
      if(!result.data.success){
        const featureKey = ROLE_TO_FEATURE[formData?.role]; 
        await updateUsage(license?.id,featureKey,1)
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