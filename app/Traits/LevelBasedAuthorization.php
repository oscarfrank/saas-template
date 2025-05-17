<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

trait LevelBasedAuthorization
{
    /**
     * Get the current user's authorization level
     * 
     * @return int
     */
    protected function getUserLevel(): int
    {
        $user = Auth::user();
        
        if (!$user) {
            return 0;
        }
        
        // Get the highest level from the user's roles
        return $user->roles->max('level') ?? 0;
    }
    
    /**
     * Check if user has sufficient level
     * 
     * @param int $requiredLevel The minimum level required
     * @return bool
     */
    protected function hasLevel(int $requiredLevel): bool
    {
        return $this->getUserLevel() >= $requiredLevel;
    }
    
    /**
     * Check if user owns a resource or has sufficient level
     * 
     * @param Model $model The model to check ownership against
     * @param int $requiredLevel The minimum level for non-owners
     * @param string $ownerColumn The column that identifies the owner (default: user_id)
     * @return bool
     */
    protected function canAccess(Model $model, int $requiredLevel, string $ownerColumn = 'user_id'): bool
    {
        $user = Auth::user();
        
        if (!$user) {
            return false;
        }
        
        // Check if user is the owner
        $isOwner = ($model->{$ownerColumn} == $user->id);
        
        // Owners can always access their own resources
        if ($isOwner) {
            return true;
        }
        
        // Non-owners need the required level
        return $this->hasLevel($requiredLevel);
    }
    
    /**
     * Authorize an action based on level or abort with 403
     * 
     * @param int $requiredLevel The minimum level required
     * @param Model|null $model Optional model to check ownership
     * @return void
     */
    protected function authorizeLevel(int $requiredLevel, ?Model $model = null): void
    {
        // If no model provided, just check the level
        if (!$model) {
            if (!$this->hasLevel($requiredLevel)) {
                abort(403, 'Insufficient access level.');
            }
            return;
        }
        
        // Check level or ownership
        if (!$this->canAccess($model, $requiredLevel)) {
            abort(403, 'Unauthorized action.');
        }
    }
}