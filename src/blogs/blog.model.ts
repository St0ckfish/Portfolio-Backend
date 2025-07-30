export interface Blog {
  id: number;
  title: string;
  content: string;
  author: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt?: Date;
  tags?: string[];
  views: number;
  likes: number;
  category?: string;
}
