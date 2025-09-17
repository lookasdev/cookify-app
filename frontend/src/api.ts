const BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';

export interface RegisterData {
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface TokenResponse {
  access: string;
}

export interface ProfileResponse {
  id: string;
  email: string;
}

export interface Ingredient {
  name: string;
  measure: string;
}

export interface Recipe {
  id: string;
  title: string;
  image: string;
  cuisine: string;
  meal_type: string;
  tags: string[];
  ingredients: Ingredient[];
  instructions: string[];
  match_count: number;
  total_searched: number;
}

export interface AIRecipe {
  id: string;
  title: string;
  image: string;
  cuisine: string;
  meal_type: string;
  tags: string[];
  ingredients: Ingredient[];
  instructions: string[];
  time_minutes?: number;
  servings?: number;
  difficulty?: string;
  nutrition_summary?: string;
  source: string;
  is_ai_generated: boolean;
}

export interface AIRecipeRequest {
  ingredients: string[];
  filters?: Record<string, any>;
}

export interface AIRecipeResponse {
  items: AIRecipe[];
}

export interface RecipeSearchRequest {
  ingredients: string[];
}

export interface RecipeSearchResponse {
  items: Recipe[];
}

export interface SaveRecipeRequest {
  title: string;
  image?: string;
  source: string;
}

export interface SavedRecipe {
  id: string;
  recipe_id: string;
  title: string;
  image?: string;
  source: string;
  created_at: string;
  // Full recipe details for viewing
  cuisine?: string;
  meal_type?: string;
  tags: string[];
  ingredients: Ingredient[];
  instructions: string[];
  // AI-specific fields
  time_minutes?: number;
  servings?: number;
  difficulty?: string;
  nutrition_summary?: string;
  is_ai_generated: boolean;
}

export interface SavedRecipesResponse {
  items: SavedRecipe[];
}

export interface OkResponse {
  ok: boolean;
}

export interface ApiError {
  detail: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = localStorage.getItem('token');

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData: ApiError = await response.json();
        throw new Error(errorData.detail || 'Request failed');
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error');
    }
  }

  async register(data: RegisterData): Promise<User> {
    return this.request<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: LoginData): Promise<TokenResponse> {
    return this.request<TokenResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getProfile(): Promise<ProfileResponse> {
    return this.request<ProfileResponse>('/auth/me');
  }

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request<{ status: string; timestamp: string }>('/health');
  }

  async searchRecipes(data: RecipeSearchRequest): Promise<RecipeSearchResponse> {
    return this.request<RecipeSearchResponse>('/recipes/search', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async saveRecipe(recipeId: string, data: SaveRecipeRequest): Promise<OkResponse> {
    return this.request<OkResponse>(`/recipes/${recipeId}/save`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getSavedRecipes(): Promise<SavedRecipesResponse> {
    return this.request<SavedRecipesResponse>('/users/me/saved');
  }

  async deleteSavedRecipe(recipeId: string): Promise<OkResponse> {
    return this.request<OkResponse>(`/users/me/saved/${recipeId}`, {
      method: 'DELETE',
    });
  }

  async generateAIRecipes(data: AIRecipeRequest): Promise<AIRecipeResponse> {
    return this.request<AIRecipeResponse>('/recipes/ai', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiClient(BASE_URL);
