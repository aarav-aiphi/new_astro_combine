export interface User {
    _id: string;
    name: string;
    avatar: string;
  }
  
  export interface Specialization {
    specialization: {
      name: string;
    };
  }
  
  export interface Ratings {
    average: number;
  }
  
  export interface AstrologerData {
  _id: string;
  user: User;
  specializations: Specialization[];
  languages: string[];
  experience: number;
  costPerMinute: number;
  ratePaisePerMin?: number;
  ratePaisePerMinChat?: number;
  ratePaisePerMinCall?: number;
  averageRating?: Ratings;
  chatStatus?: 'online' | 'offline';
  callStatus?: 'online' | 'offline';
  totalConsultations?: number;
}
  