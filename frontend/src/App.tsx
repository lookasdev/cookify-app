import { useState, useEffect } from 'react';
import { LoginForm } from './components/LoginForm';
import { ProfileCard } from './components/ProfileCard';
import { Recipes } from './components/Recipes';
import { Ingredients } from './components/Ingredients';
import { About } from './components/About';
// eslint-disable-next-line import/no-unresolved
import { Pantry } from './components/Pantry';
import { api, SavedRecipe, Recipe, AIRecipe, PantryItemOut, PantryItemIn } from './api';
import './App.css';

type Tab = 'auth' | 'profile' | 'recipes' | 'ingredients' | 'about' | 'pantry';

export interface PantryItem {
  name: string;
  quantity: string;
  expiryDate?: string; // YYYY-MM-DD
  addedAt: string;
}

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('auth');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [savedRecipeIds, setSavedRecipeIds] = useState<Set<string>>(new Set());
  const [searchIngredients, setSearchIngredients] = useState<string>('');
  const [pantry, setPantry] = useState<PantryItem[]>([]);

  // Check for existing token on app start
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          await api.getProfile();
          setIsLoggedIn(true);
          setActiveTab('profile');
        } catch {
          localStorage.removeItem('token');
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Fetch data when user becomes logged in/logs out
  useEffect(() => {
    if (isLoggedIn) {
      fetchSavedRecipes();
      fetchPantry();
    } else {
      setSavedRecipes([]);
      setSavedRecipeIds(new Set());
      setPantry([]);
    }
  }, [isLoggedIn]);

  // Saved recipes
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
    if (!isLoggedIn) {
      // Only allow auth, recipes, about when logged out
      const allowed: Tab[] = ['auth', 'recipes', 'about'];
      if (!allowed.includes(tab)) return;
    }
    if (tab === 'auth' && isLoggedIn) return;
    setActiveTab(tab);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setActiveTab('auth');
  };

  const updateIngredientsFromSelection = (list: string[]) => {
    setSearchIngredients(list.join(', '));
  };

  // Pantry backend integration
  const mapPantryOut = (p: PantryItemOut): PantryItem => ({
    name: p.name,
    quantity: p.quantity || '',
    expiryDate: p.expiry_date ? p.expiry_date.slice(0, 10) : undefined,
    addedAt: p.added_at,
  });

  const fetchPantry = async () => {
    try {
      const res = await api.getPantry();
      setPantry(res.items.map(mapPantryOut));
    } catch (e) {
      console.error('Failed to fetch pantry:', e);
    }
  };

  const addToPantry = async (name: string) => {
    try {
      const payload: PantryItemIn = { name, quantity: '' };
      const saved = await api.upsertPantryItem(payload);
      setPantry(prev => {
        const others = prev.filter(i => i.name.toLowerCase() !== name.toLowerCase());
        return [mapPantryOut(saved), ...others];
      });
    } catch (e) {
      console.error('Failed to add to pantry:', e);
      throw e;
    }
  };

  const updatePantryItem = async (name: string, updates: Partial<PantryItem>) => {
    try {
      const current = pantry.find(i => i.name === name);
      const merged = { ...current, ...updates } as PantryItem;
      const payload: PantryItemIn = {
        name,
        quantity: merged.quantity,
        expiry_date: merged.expiryDate ? new Date(merged.expiryDate).toISOString() : null,
      };
      const saved = await api.upsertPantryItem(payload);
      setPantry(prev => prev.map(i => i.name === name ? mapPantryOut(saved) : i));
    } catch (e) {
      console.error('Failed to update pantry item:', e);
      throw e;
    }
  };

  const removePantryItem = async (name: string) => {
    try {
      await api.deletePantryItem(name);
      setPantry(prev => prev.filter(i => i.name !== name));
    } catch (e) {
      console.error('Failed to remove pantry item:', e);
      throw e;
    }
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
            ingredientsValue={searchIngredients}
            onIngredientsChange={setSearchIngredients}
          />
        )}

        {activeTab === 'ingredients' && (
          <Ingredients 
            onSelectionChange={updateIngredientsFromSelection} 
            onAddToPantry={addToPantry}
            onRemoveFromPantry={removePantryItem}
            pantryNames={new Set(pantry.map(p => p.name.toLowerCase()))}
          />
        )}

        {activeTab === 'pantry' && (
          <Pantry 
            items={pantry}
            onUpdate={updatePantryItem}
            onRemove={removePantryItem}
          />
        )}

        {activeTab === 'about' && (
          <About />
        )}
      </main>

      <nav className="bottom-nav">
        {!isLoggedIn && (
          <>
            <button
              className={`nav-button ${activeTab === 'auth' ? 'active' : ''}`}
              onClick={() => handleTabChange('auth')}
            >
              🔐 Login/Register
            </button>

            <button
              className={`nav-button ${activeTab === 'recipes' ? 'active' : ''}`}
              onClick={() => handleTabChange('recipes')}
            >
              🍳 Recipes
            </button>

            <button
              className={`nav-button ${activeTab === 'about' ? 'active' : ''}`}
              onClick={() => handleTabChange('about')}
            >
              ℹ️ About
            </button>
          </>
        )}
        
        {isLoggedIn && (
          <>
            <button
              className={`nav-button ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => handleTabChange('profile')}
            >
              👤 Profile
            </button>

            <button
              className={`nav-button ${activeTab === 'recipes' ? 'active' : ''}`}
              onClick={() => handleTabChange('recipes')}
            >
              🍳 Recipes
            </button>

            <button
              className={`nav-button ${activeTab === 'ingredients' ? 'active' : ''}`}
              onClick={() => handleTabChange('ingredients')}
            >
              🧂 Ingredients
            </button>

            <button
              className={`nav-button ${activeTab === 'pantry' ? 'active' : ''}`}
              onClick={() => handleTabChange('pantry')}
            >
              🧺 Pantry
            </button>

            <button
              className={`nav-button ${activeTab === 'about' ? 'active' : ''}`}
              onClick={() => handleTabChange('about')}
            >
              ℹ️ About
            </button>
          </>
        )}
      </nav>
    </div>
  );
}

export default App;
