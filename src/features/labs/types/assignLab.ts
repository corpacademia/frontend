export interface Lab {
  id: string;
  title: string;
  description: string;
  duration: number;
  technologies: string[];
}

export interface AssignLabFormData {
  labId: string;
  duration: number;
}