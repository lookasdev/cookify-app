import React, { useState, useEffect } from 'react';
import { api, ProfileResponse, SavedRecipe } from '../api';

interface ProfileCardProps {
  onLogout: () => void;
  savedRecipes: SavedRecipe[];
  onUnsaveRecipe: (recipeId: string) => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ onLogout, savedRecipes, onUnsaveRecipe }) => {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profileData = await api.getProfile();
        setProfile(profileData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
        // If token is invalid, logout
        if (err instanceof Error && err.message.includes('Invalid authentication')) {
          onLogout();
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [onLogout]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    onLogout();
  };

  const toggleExpanded = (recipeId: string) => {
    setExpandedRecipe(expandedRecipe === recipeId ? null : recipeId);
  };

  if (isLoading) {
    return (
      <div className="profile-card">
        <h2>Profile</h2>
        <div className="loading">Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-card">
        <h2>Profile</h2>
        <div className="error-message">{error}</div>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="profile-card">
      <h2>Profile</h2>
      
      {profile && (
        <div className="profile-info">
          <div className="profile-field">
            <label>ID:</label>
            <span>{profile.id}</span>
          </div>
          <div className="profile-field">
            <label>Email:</label>
            <span>{profile.email}</span>
          </div>
        </div>
      )}

      <div className="saved-recipes-section">
        <h3>Saved Recipes</h3>
        {savedRecipes.length === 0 ? (
          <div className="empty-saved">
            No favorites yet
          </div>
        ) : (
          <div className="saved-recipes-list">
            {savedRecipes.map((recipe) => (
              <div key={recipe.id} className={`saved-recipe-item ${recipe.is_ai_generated ? 'ai-recipe' : ''}`}>
                <div className="saved-recipe-header">
                  {recipe.is_ai_generated ? (
                    <div className="ai-placeholder-small">
                      <span className="ai-icon">🤖</span>
                    </div>
                  ) : (
                    <img 
                      src={recipe.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZWVlIi8+PHRleHQgeD0iMjAiIHk9IjIwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4='} 
                      alt={recipe.title}
                      className="saved-recipe-image"
                    />
                  )}
                  <div className="saved-recipe-info">
                    <div className="saved-recipe-title">{recipe.title}</div>
                    <div className="saved-recipe-meta">
                      <span className="source">{recipe.source}</span>
                      {recipe.cuisine && <span className="cuisine">🌍 {recipe.cuisine}</span>}
                      {recipe.meal_type && <span className="meal-type">🍽️ {recipe.meal_type}</span>}
                      {recipe.time_minutes && <span className="time">⏱️ {recipe.time_minutes} min</span>}
                      {recipe.servings && <span className="servings">👥 {recipe.servings} servings</span>}
                    </div>
                  </div>
                  <button 
                    className="expand-button-small"
                    onClick={() => toggleExpanded(recipe.id)}
                  >
                    {expandedRecipe === recipe.id ? '−' : '+'}
                  </button>
                </div>

                {expandedRecipe === recipe.id && (
                  <div className="saved-recipe-details">
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
                      <button
                        className="unsave-button"
                        onClick={() => onUnsaveRecipe(recipe.recipe_id)}
                      >
                        Remove
                      </button>
                    </div>
                    {recipe.nutrition_summary && (
                      <div className="nutrition-section">
                        <h4>Nutrition:</h4>
                        <p>{recipe.nutrition_summary}</p>
                      </div>
                    )}
                    
                    {recipe.tags.length > 0 && (
                      <div className="tags-section">
                        <h4>Tags:</h4>
                        <div className="recipe-tags">
                          {recipe.tags.map((tag, index) => (
                            <span key={index} className="tag">#{tag}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="ingredients-section">
                      <h4>Ingredients:</h4>
                      <ul className="ingredients-list">
                        {recipe.ingredients.map((ingredient, index) => (
                          <li key={index}>
                            <span className="measure">{ingredient.measure}</span>
                            <span className="ingredient-name">{ingredient.name}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="instructions-section">
                      <h4>Instructions:</h4>
                      <ol className="instructions-list">
                        {recipe.instructions.map((instruction, index) => (
                          <li key={index}>{instruction}</li>
                        ))}
                      </ol>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <button onClick={handleLogout} className="logout-btn">
        Logout
      </button>
    </div>
  );
};
