    document.addEventListener('DOMContentLoaded', function() {
        // DOM Elements
        const addRecipeBtn = document.getElementById('addRecipeBtn');
        const recipeForm = document.getElementById('recipeForm');
        const recipeModal = document.getElementById('recipeModal');
        const confirmModal = document.getElementById('confirmModal');
        const closeBtns = document.querySelectorAll('.close-btn, #cancelBtn');
        const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        const recipeList = document.getElementById('recipeList');
        const recipeView = document.getElementById('recipeView');
        
        // State variables
        let recipes = JSON.parse(localStorage.getItem('recipes')) || [];
        let currentRecipeId = null;
        let deleteRecipeId = null;

        // Initialize the app
        renderRecipeList();
        
        // Event Listeners
        addRecipeBtn.addEventListener('click', () => openModal('add'));
        
        closeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                recipeModal.style.display = 'none';
                confirmModal.style.display = 'none';
                recipeForm.reset();
            });
        });
        
        cancelDeleteBtn.addEventListener('click', () => {
            confirmModal.style.display = 'none';
        });
        
        confirmDeleteBtn.addEventListener('click', () => {
            deleteRecipe(deleteRecipeId);
            confirmModal.style.display = 'none';
        });
        
        recipeForm.addEventListener('submit', handleFormSubmit);
        
        searchBtn.addEventListener('click', handleSearch);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSearch();
        });
        
        // Functions
        function openModal(mode, recipeId = null) {
            const modalTitle = document.getElementById('modalTitle');
            currentRecipeId = recipeId;
            
            if (mode === 'add') {
                modalTitle.textContent = 'Add New Recipe';
                document.getElementById('recipeId').value = '';
                recipeForm.reset();
            } else if (mode === 'edit') {
                modalTitle.textContent = 'Edit Recipe';
                const recipe = recipes.find(r => r.id === recipeId);
                if (recipe) {
                    document.getElementById('recipeId').value = recipe.id;
                    document.getElementById('recipeName').value = recipe.name;
                    document.getElementById('recipeImage').value = recipe.image || '';
                    document.getElementById('recipeIngredients').value = recipe.ingredients.join('\n');
                    document.getElementById('recipeSteps').value = recipe.steps.join('\n');
                }
            }
            
            recipeModal.style.display = 'flex';
        }
        
        function handleFormSubmit(e) {
            e.preventDefault();
            
            const id = document.getElementById('recipeId').value || generateId();
            const name = document.getElementById('recipeName').value.trim();
            const image = document.getElementById('recipeImage').value.trim();
            const ingredients = document.getElementById('recipeIngredients').value
                .split('\n')
                .filter(i => i.trim() !== '');
            const steps = document.getElementById('recipeSteps').value
                .split('\n')
                .filter(s => s.trim() !== '');
            
            if (!name || ingredients.length === 0 || steps.length === 0) {
                alert('Please fill in all required fields');
                return;
            }
            
            const recipe = { id, name, image, ingredients, steps };
            
            if (currentRecipeId) {
                // Update existing recipe
                const index = recipes.findIndex(r => r.id === currentRecipeId);
                if (index !== -1) {
                    recipes[index] = recipe;
                }
            } else {
                // Add new recipe
                recipes.push(recipe);
            }
            
            saveRecipes();
            renderRecipeList();
            renderRecipeView(recipe.id);
            recipeModal.style.display = 'none';
            recipeForm.reset();
        }
        
        function deleteRecipe(id) {
            recipes = recipes.filter(recipe => recipe.id !== id);
            saveRecipes();
            renderRecipeList();
            
            // Clear the view if the deleted recipe was being viewed
            if (currentRecipeId === id) {
                recipeView.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-utensils"></i>
                        <h2>No Recipe Selected</h2>
                        <p>Select a recipe from the list or add a new one</p>
                    </div>
                `;
                currentRecipeId = null;
            }
        }
        
        function renderRecipeList(filteredRecipes = null) {
            const recipesToRender = filteredRecipes || recipes;
            
            if (recipesToRender.length === 0) {
                recipeList.innerHTML = '<p class="empty-message">No recipes found. Add your first recipe!</p>';
                return;
            }
            
            recipeList.innerHTML = recipesToRender.map(recipe => `
                <div class="recipe-item ${currentRecipeId === recipe.id ? 'active' : ''}" data-id="${recipe.id}">
                    <h3>${recipe.name}</h3>
                    <p>${recipe.ingredients.slice(0, 3).join(', ')}${recipe.ingredients.length > 3 ? '...' : ''}</p>
                </div>
            `).join('');
            
            // Add click event to recipe items
            document.querySelectorAll('.recipe-item').forEach(item => {
                item.addEventListener('click', () => {
                    const id = item.getAttribute('data-id');
                    renderRecipeView(id);
                    
                    // Update active state
                    document.querySelectorAll('.recipe-item').forEach(i => {
                        i.classList.remove('active');
                    });
                    item.classList.add('active');
                });
            });
        }
        
        function renderRecipeView(id) {
            const recipe = recipes.find(r => r.id === id);
            if (!recipe) return;
            
            currentRecipeId = id;
            
            recipeView.innerHTML = `
                <div class="recipe-detail">
                    ${recipe.image ? `<img src="${recipe.image}" alt="${recipe.name}">` : ''}
                    <h2>${recipe.name}</h2>
                    
                    <h3>Ingredients</h3>
                    <ul>
                        ${recipe.ingredients.map(ing => `<li>${ing}</li>`).join('')}
                    </ul>
                    
                    <h3>Preparation Steps</h3>
                    <ol>
                        ${recipe.steps.map(step => `<li>${step}</li>`).join('')}
                    </ol>
                    
                    <div class="recipe-actions">
                        <button class="btn btn-secondary" id="editRecipeBtn">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-danger" id="deleteRecipeBtn">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;
            
            // Add event listeners to action buttons
            document.getElementById('editRecipeBtn').addEventListener('click', () => {
                openModal('edit', id);
            });
            
            document.getElementById('deleteRecipeBtn').addEventListener('click', () => {
                deleteRecipeId = id;
                confirmModal.style.display = 'flex';
            });
        }
        
        function handleSearch() {
            const query = searchInput.value.trim().toLowerCase();
            
            if (query === '') {
                renderRecipeList();
                return;
            }
            
            const filteredRecipes = recipes.filter(recipe => 
                recipe.name.toLowerCase().includes(query) ||
                recipe.ingredients.some(ing => ing.toLowerCase().includes(query))
            );
            
            renderRecipeList(filteredRecipes);
        }
        
        function saveRecipes() {
            localStorage.setItem('recipes', JSON.stringify(recipes));
        }
        
        function generateId() {
            return Date.now().toString(36) + Math.random().toString(36).substr(2);
        }
        
        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === recipeModal) {
                recipeModal.style.display = 'none';
                recipeForm.reset();
            }
            if (e.target === confirmModal) {
                confirmModal.style.display = 'none';
            }
        });
    });