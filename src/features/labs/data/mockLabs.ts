// import { useEffect, useState } from 'react';
// import { Lab } from '../types/assignLab';
// import axios from 'axios';

// const [labs,setLabs] = useState([]);

// useEffect(()=>{
//     const fetch = async()=>{
//         const lab = await axios.get('http://localhost:3000/api/v1/getCatalogues')
//         setLabs(lab.data.data)
//     }
//     fetch();
// },[])
// export const availableLabs: Lab[] = labs;



// // [
//   {
//     id: '1',
//     title: 'Advanced Cloud Architecture',
//     description: 'Design and implement scalable cloud solutions',
//     duration: 180,
//     technologies: ['AWS', 'Azure', 'GCP']
//   },
//   {
//     id: '2',
//     title: 'Kubernetes in Production',
//     description: 'Deploy and manage production-grade Kubernetes clusters',
//     duration: 240,
//     technologies: ['Kubernetes', 'Docker', 'Helm']
//   },
//   {
//     id: '3',
//     title: 'CI/CD Pipeline Implementation',
//     description: 'Build automated deployment pipelines',
//     duration: 120,
//     technologies: ['Jenkins', 'GitLab', 'GitHub Actions']
//   }
// ];