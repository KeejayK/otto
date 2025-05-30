import { defineStore } from 'pinia';
import { loginWithGoogle } from '@/services/auth';
import { auth } from '@/firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';

// Add this at the top of the file with other imports
const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
];

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    idToken: null,
    accessToken: null,
    calendarAccess: false,
    userProfile: null, // Add userProfile to store user's name and picture
  }),
  actions: {
    async login() {
      const { idToken, accessToken, user } = await loginWithGoogle();
      this.user = user;
      this.idToken = idToken;
      this.accessToken = accessToken;
      
      // Extract and save the user profile information
      if (user) {
        this.userProfile = {
          displayName: user.displayName || '',
          email: user.email || '',
          photoURL: user.photoURL || '',
          uid: user.uid
        };
      }

      const response = await fetch('http://localhost:3000/api/auth/google', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          accessToken,
          profile: this.userProfile // Send profile info to the server
        }),
      });

      if (response.ok) {
        const data = await response.json();
        this.calendarAccess = data.calendarAccess || false;
      }
    },

    async requestCalendarAccess() {
      if (!this.user || this.calendarAccess) return;

      try {
        const response = await fetch(
          'http://localhost:3000/api/auth/calendar-access',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${this.idToken}`,
              'Content-Type': 'application/json',
            },
          },
        );

        if (response.ok) {
          this.calendarAccess = true;
        }
      } catch (error) {
        console.error('Failed to request calendar access:', error);
        throw error;
      }
    },

    async logout() {
      await signOut(auth);
      this.user = null;
      this.idToken = null;
      this.accessToken = null;
      this.calendarAccess = false;
      this.userProfile = null;
    },

    getUserProfile() {
      return this.userProfile || this.user;
    },

    get isAuthenticated() {
      return !!this.user;
    },

    get hasCalendarAccess() {
      return this.calendarAccess;
    },

    initialize() {
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          this.user = user;
          this.idToken = await user.getIdToken();
          
          // Store user profile information when session is initialized
          this.userProfile = {
            displayName: user.displayName || '',
            email: user.email || '',
            photoURL: user.photoURL || '',
            uid: user.uid
          };
        } else {
          this.user = null;
          this.idToken = null;
          this.accessToken = null;
          this.calendarAccess = false;
          this.userProfile = null;
        }
      });
    },
  },
});
