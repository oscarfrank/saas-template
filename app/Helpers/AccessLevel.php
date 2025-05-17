<?php

namespace App\Helpers;

class AccessLevel
{
    const USER = 10; // Only Admins or the Owners can view
    const SUPPORT = 20;
    const MANAGER = 50;
    const ADMIN = 50;
    const OWNER = 90;
    
    // You can also define action-specific levels
    const VIEW = 1;    // Anyone can view
    const EDIT = 20;    // Support and above can edit
    const CREATE = 30;  // Support and above can create
    const DELETE = 50;  // Manager and above can delete
    const MANAGE = 50; // Only admins can manage
    const OWN = 90; // Only owners can manage
}