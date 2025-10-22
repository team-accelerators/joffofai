import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { mockRecipes, mockIngredients, mockVendors, mockCommunityPosts, simulateApiDelay } from '../data/mockData';
import { SearchParams, LocationParams, PantryItem, ApiResponse } from '../types/api';
import { Recipe, CommunityPost } from '../types/models';

const IS_OFFLINE_MODE = import.meta.env.VITE_OFFLINE_MODE === 'true';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API Service with offline mode support
export class ApiService {
  // Recipe endpoints
  static async generateRecipes(ingredients: string, method: "text" | "voice" | "image" = "text"): Promise<ApiResponse<any>> {
    if (IS_OFFLINE_MODE) {
      await simulateApiDelay();
      return { data: mockRecipes.slice(0, method === "image" ? 3 : 2) };
    }
    
    try {
      const response = await api.post('/recipes/generate', {
        ingredients,
        method,
      });
      return response.data;
    } catch (error) {
      console.error('Error generating recipes:', error);
      throw error;
    }
  }

  static async getRecipes(params: Partial<SearchParams> = {}): Promise<ApiResponse<any[]>> {
    if (IS_OFFLINE_MODE) {
      await simulateApiDelay();
      let recipes = [...mockRecipes];
      
      if (params.cuisine) {
        recipes = recipes.filter(r => r.cuisine.toLowerCase() === params.cuisine!.toLowerCase());
      }
      if (params.difficulty) {
        recipes = recipes.filter(r => r.difficulty.toLowerCase() === params.difficulty!.toLowerCase());
      }
      if (params.search) {
        const searchTerm = params.search.toLowerCase();
        
        if (params.searchMethod) {
          console.log(`Recipe search via ${params.searchMethod}: "${searchTerm}"`);
        }
        
        recipes = recipes.filter(r => 
          r.title.toLowerCase().includes(searchTerm) ||
          r.description.toLowerCase().includes(searchTerm) ||
          r.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
        
        if (params.searchMethod === 'voice') {
          recipes = recipes.filter(r => {
            const ingredients = r.ingredients?.join(' ').toLowerCase() || '';
            return r.title.toLowerCase().includes(searchTerm) ||
                   r.description.toLowerCase().includes(searchTerm) ||
                   ingredients.includes(searchTerm) ||
                   r.tags.some(tag => tag.toLowerCase().includes(searchTerm));
          });
        }
      }
      
      return { data: recipes };
    }
    
    const response = await api.get('/recipes', { params });
    return response.data;
  }

  static async getRecipe(id: string): Promise<ApiResponse<any>> {
    if (IS_OFFLINE_MODE) {
      await simulateApiDelay();
      const recipe = mockRecipes.find(r => r.id === id);
      if (!recipe) {
        throw new Error('Recipe not found');
      }
      return { data: recipe };
    }
    
    const response = await api.get(`/recipes/${id}`);
    return response.data;
  }

  static async createRecipe(recipeData: Record<string, any>): Promise<ApiResponse<any>> {
    if (IS_OFFLINE_MODE) {
      await simulateApiDelay();
      const newRecipe: Recipe = {
        id: String(mockRecipes.length + 1),
        title: recipeData.title || '',
        description: recipeData.description || '',
        cuisine: recipeData.cuisine || 'Nigerian',
        difficulty: recipeData.difficulty || 'Medium',
        prepTime: recipeData.prepTime || 30,
        cookTime: recipeData.cookTime || 45,
        servings: recipeData.servings || 4,
        ingredients: recipeData.ingredients || [],
        instructions: recipeData.instructions || [],
        image: recipeData.image || '/images/default-recipe.jpg',
        author: { 
          name: 'Demo User', 
          id: 'demo-user',
          avatar: '/images/demo-avatar.jpg'
        },
        rating: 0,
        reviews: 0,
        createdAt: new Date().toISOString(),
        nutritionalInfo: recipeData.nutritionalInfo || {},
        tags: recipeData.tags || []
      };
      mockRecipes.push(newRecipe);
      return { data: newRecipe };
    }
    
    const response = await api.post('/recipes', recipeData);
    return response.data;
  }

  static async updateRecipe(id: string, recipeData: Record<string, any>): Promise<ApiResponse<any>> {
    if (IS_OFFLINE_MODE) {
      await simulateApiDelay();
      const index = mockRecipes.findIndex(r => r.id === id);
      if (index === -1) {
        throw new Error('Recipe not found');
      }
      mockRecipes[index] = { ...mockRecipes[index], ...recipeData };
      return { data: mockRecipes[index] };
    }
    
    const response = await api.put(`/recipes/${id}`, recipeData);
    return response.data;
  }

  static async deleteRecipe(id: string): Promise<ApiResponse<{ message: string }>> {
    if (IS_OFFLINE_MODE) {
      await simulateApiDelay();
      const index = mockRecipes.findIndex(r => r.id === id);
      if (index === -1) {
        throw new Error('Recipe not found');
      }
      mockRecipes.splice(index, 1);
      return { data: { message: 'Recipe deleted successfully' } };
    }
    
    const response = await api.delete(`/recipes/${id}`);
    return response.data;
  }

  // Vendor endpoints
  static async getVendors(params: Partial<LocationParams> = {}): Promise<ApiResponse<any[]>> {
    if (IS_OFFLINE_MODE) {
      await simulateApiDelay();
      let vendors = [...mockVendors];
      
      if (params.city) {
        vendors = vendors.filter(v => 
          v.location.toLowerCase().includes(params.city!.toLowerCase())
        );
      }
      
      return { data: vendors };
    }
    
    const response = await api.get('/vendors/vendor/nearby', { params });
    return response.data;
  }

  static async getVendor(id: string): Promise<ApiResponse<any>> {
    if (IS_OFFLINE_MODE) {
      await simulateApiDelay();
      const vendor = mockVendors.find(v => v.id === id);
      if (!vendor) {
        throw new Error('Vendor not found');
      }
      return { data: vendor };
    }
    
    const response = await api.get(`/vendors/vendor/${id}`);
    return response.data;
  }

  // Pantry endpoints
  static async getPantryItems(): Promise<ApiResponse<PantryItem[]>> {
    if (IS_OFFLINE_MODE) {
      await simulateApiDelay();
      return {
        data: [
          { id: '1', name: 'Rice', quantity: '2 kg', category: 'Grains', expiryDate: '2024-12-31' },
          { id: '2', name: 'Tomatoes', quantity: '1 kg', category: 'Vegetables', expiryDate: '2024-02-15' },
          { id: '3', name: 'Palm Oil', quantity: '500ml', category: 'Oils', expiryDate: '2025-01-30' }
        ]
      };
    }
    
    const response = await api.get('/pantry/items');
    return response.data;
  }

  static async addPantryItem(item: Partial<PantryItem>): Promise<ApiResponse<PantryItem>> {
    if (IS_OFFLINE_MODE) {
      await simulateApiDelay();
      return { 
        data: { 
          ...item, 
          id: String(Date.now()),
          name: item.name || '',
          quantity: item.quantity || 0,
          category: item.category || 'Other'
        } as PantryItem 
      };
    }
    
    const response = await api.post('/pantry/items', item);
    return response.data;
  }

  // Community endpoints
  static async getCommunityPosts(category?: string): Promise<ApiResponse<any[]>> {
    if (IS_OFFLINE_MODE) {
      await simulateApiDelay();
      let posts = [...mockCommunityPosts];
      
      if (category && category !== 'all') {
        posts = posts.filter(p => p.category === category);
      }
      
      return { data: posts };
    }
    
    const params = category && category !== 'all' ? { category } : {};
    const response = await api.get('/community/posts', { params });
    return response.data;
  }

  static async createCommunityPost(postData: Record<string, any>): Promise<ApiResponse<any>> {
    if (IS_OFFLINE_MODE) {
      await simulateApiDelay();
      const newPost: CommunityPost = {
        id: String(Date.now()),
        title: postData.title || '',
        content: postData.content || '',
        category: postData.category || 'General',
        author: {
          id: '1',
          fullName: 'Current User',
          email: 'user@example.com'
        },
        likes: 0,
        likedBy: [],
        comments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: postData.tags || []
      };
      mockCommunityPosts.unshift(newPost);
      return { data: newPost };
    }
    
    const response = await api.post('/community/posts', postData);
    return response.data;
  }

  static async likeCommunityPost(postId: string): Promise<ApiResponse<any>> {
    if (IS_OFFLINE_MODE) {
      await simulateApiDelay();
      const post = mockCommunityPosts.find(p => p.id === postId);
      if (!post) {
        throw new Error('Post not found');
      }
      post.likes += 1;
      post.likedBy = post.likedBy || [];
      post.likedBy.push('1'); // Current user ID
      return { data: post };
    }
    
    const response = await api.post(`/community/posts/${postId}/like`);
    return response.data;
  }
}

// Export as default
export default new ApiService();