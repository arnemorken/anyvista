<?php
/****************************************************************************************
 *
 * anyVista is copyright (C) 2011-2024 Arne D. Morken and Balanse Software.
 *
 * License: AGPLv3.0 for open source use or anyVista Commercial License for commercial use.
 * Get licences here: http://balanse.info/anyvista/license/ (coming soon).
 *
 ****************************************************************************************/
class Permission
{
  private $mCurrentUserId = -1;
  private $mIsLoggedIn    = false;
  private $mIsAdmin       = false;

  // Get permissions from permClass methods if set, if not, get
  // permissions from isLoggedIn, isAdmin and currentUserId, if set.
  public function __construct($permClass=null,$isLoggedIn=false,$isAdmin=false,$currentUserId=-1)
  {
    if (isset($permClass)) {
      $this->mCurrentUserId = method_exists($permClass,"getCurrentUserId") ? $permClass->getCurrentUserId() : -1;
      $this->mIsLoggedIn    = method_exists($permClass,"isLoggedIn")       ? $permClass->isLoggedIn()       : false;
      $this->mIsAdmin       = method_exists($permClass,"isAdmin")          ? $permClass->isAdmin()          : false;
    }
    else {
      $this->mCurrentUserId = $currentUserId;
      $this->mIsLoggedIn    = $isLoggedIn;
      $this->mIsAdmin       = $isAdmin;
    }
  } // constructor

  /////////////////////////
  // Getters
  /////////////////////////

  public function getCurrentUserId() { return $this->mCurrentUserId; }
  public function isLoggedIn()       { return $this->mIsLoggedIn; }
  public function isAdmin()          { return $this->mIsAdmin; }

  /////////////////////////
  // Setters
  /////////////////////////

  public function setCurrentUserId($currentUserId) { $this->mCurrentUserId = $currentUserId; }
  public function setIsLoggedIn($isLoggedIn)       { $this->mIsLoggedIn    = $isLoggedIn; }
  public function setIsAdmin   ($isAdmin)          { $this->mIsAdmin       = $isAdmin; }

} // class Permission
?>
