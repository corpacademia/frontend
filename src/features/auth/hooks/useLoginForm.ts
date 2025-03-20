import { useState,useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import { authApi } from '../api/authApi';
import axios from 'axios';

interface FormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  submit?: string;
}

export const useLoginForm = () => {
  const navigate = useNavigate();
  const login = useAuthStore(state => state.login);
  
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  // const [admin,setAdmin] = useState({});

  // const admin = JSON.parse(localStorage.getItem('auth') ?? '{}').result || {};
  // useEffect(() => {
  //   const getUserDetails = async () => {
  //     const response = await axios.get('http://localhost:3000/api/v1/user_profile');
  //     setAdmin(response.data.user);
  //   };
  //   getUserDetails();
  // }, []);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      // const response1 = await authApi.login(formData.email, formData.password);
      // console.log(response1)
      // login(response1.user);
      const response = await axios.post('http://localhost:3000/api/v1/user_ms/login',
        {
          email:formData.email,
          password:formData.password,
        },
        {withCredentials:true}
      )
      if(response.data.success) {
        console.log('working')              
        // localStorage.setItem('auth',JSON.stringify(response.data))
       
        login(response.data.result);
        navigate('/dashboard');
      }
      else{
        setErrors(prev => ({
          ...prev,
          submit: 'Invalid email or password',
        }));
      }
      
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        submit: 'Invalid email or password',
      }));
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    errors,
    loading,
    handleChange,
    handleSubmit,
  };
};