import { useState, useEffect } from 'react';
import { LoginForm } from './components/LoginForm';
import { ProfileCard } from './components/ProfileCard';
import { Recipes } from './components/Recipes';
import { api, SavedRecipe, Recipe, AIRecipe } from './api';
import './App.css';

type Tab = 'auth' | 'profile' | 'recipes';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('auth');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [savedRecipeIds, setSavedRecipeIds] = useState<Set<string>>(new Set());

  // Check for existing token on app start
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Verify token by fetching profile
          await api.getProfile();
          setIsLoggedIn(true);
          setActiveTab('profile');
        } catch (error) {
          // Token is invalid, remove it
          localStorage.removeItem('token');
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Fetch saved recipes whenever user becomes logged in
  useEffect(() => {
    if (isLoggedIn) {
      fetchSavedRecipes();
    } else {
      // Clear saved recipes when logged out
      setSavedRecipes([]);
      setSavedRecipeIds(new Set());
    }
  }, [isLoggedIn]);

  // Fetch saved recipes when user logs in
  const fetchSavedRecipes = async () => {
    try {
      const response = await api.getSavedRecipes();
      setSavedRecipes(response.items);
      setSavedRecipeIds(new Set(response.items.map(recipe => recipe.recipe_id)));
    } catch (error) {
      console.error('Failed to fetch saved recipes:', error);
    }
  };

  const handleLogin = async (_token: string) => {
    setIsLoggedIn(true);
    setActiveTab('profile');
  };

  const handleSaveRecipe = async (recipe: Recipe | AIRecipe) => {
    try {
      const saveData = {
        title: recipe.title,
        image: recipe.image,
        source: 'is_ai_generated' in recipe ? 'AI' : 'TheMealDB',
        cuisine: recipe.cuisine,
        meal_type: recipe.meal_type,
        tags: recipe.tags,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        time_minutes: 'time_minutes' in recipe ? recipe.time_minutes : undefined,
        servings: 'servings' in recipe ? recipe.servings : undefined,
        difficulty: 'difficulty' in recipe ? recipe.difficulty : undefined,
        nutrition_summary: 'nutrition_summary' in recipe ? recipe.nutrition_summary : undefined,
        is_ai_generated: 'is_ai_generated' in recipe ? recipe.is_ai_generated : false
      };
      
      await api.saveRecipe(recipe.id, saveData);
      
      // Update local state optimistically
      const newSavedRecipe: SavedRecipe = {
        id: `temp_${Date.now()}`,
        recipe_id: recipe.id,
        title: recipe.title,
        image: recipe.image,
        source: saveData.source,
        created_at: new Date().toISOString(),
        cuisine: recipe.cuisine,
        meal_type: recipe.meal_type,
        tags: recipe.tags,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        time_minutes: 'time_minutes' in recipe ? recipe.time_minutes : undefined,
        servings: 'servings' in recipe ? recipe.servings : undefined,
        difficulty: 'difficulty' in recipe ? recipe.difficulty : undefined,
        nutrition_summary: 'nutrition_summary' in recipe ? recipe.nutrition_summary : undefined,
        is_ai_generated: 'is_ai_generated' in recipe ? recipe.is_ai_generated : false
      };
      setSavedRecipes(prev => [newSavedRecipe, ...prev]);
      setSavedRecipeIds(prev => new Set([...prev, recipe.id]));
    } catch (error) {
      throw error;
    }
  };

  const handleUnsaveRecipe = async (recipeId: string) => {
    try {
      await api.deleteSavedRecipe(recipeId);
      // Update local state optimistically
      setSavedRecipes(prev => prev.filter(recipe => recipe.recipe_id !== recipeId));
      setSavedRecipeIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(recipeId);
        return newSet;
      });
    } catch (error) {
      throw error;
    }
  };

  const handleTabChange = (tab: Tab) => {
    // Prevent switching to auth tab when logged in
    if (tab === 'auth' && isLoggedIn) {
      return;
    }
    setActiveTab(tab);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setActiveTab('auth');
  };

  if (isLoading) {
    return (
      <div className="app">
        <div className="loading-screen">
          <h1>Auth App</h1>
          <div className="loading">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Cookify</h1>
      </header>

      <main className="app-main">
        {activeTab === 'auth' && (
          <LoginForm onLogin={handleLogin} />
        )}
        
        {activeTab === 'profile' && (
          <ProfileCard onLogout={handleLogout} savedRecipes={savedRecipes} onUnsaveRecipe={handleUnsaveRecipe} />
        )}

        {activeTab === 'recipes' && (
          <Recipes 
            isLoggedIn={isLoggedIn}
            savedRecipeIds={savedRecipeIds}
            onSaveRecipe={handleSaveRecipe}
            onUnsaveRecipe={handleUnsaveRecipe}
          />
        )}
      </main>

      <nav className="bottom-nav">
        {!isLoggedIn && (
          <button
            className={`nav-button ${activeTab === 'auth' ? 'active' : ''}`}
            onClick={() => handleTabChange('auth')}
          >
            🔐 Login/Register
          </button>
        )}
        
        <button
          className={`nav-button ${activeTab === 'profile' ? 'active' : ''} ${!isLoggedIn ? 'disabled' : ''}`}
          onClick={() => handleTabChange('profile')}
          disabled={!isLoggedIn}
        >
          👤 Profile
        </button>

        <button
          className={`nav-button ${activeTab === 'recipes' ? 'active' : ''}`}
          onClick={() => handleTabChange('recipes')}
        >
          🍳 Recipes
        </button>
      </nav>
    </div>
  );
}

export default App;
