import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface AuthState {
  userData: Record<string, any> | null;
  isGuest: boolean;
}

const initialState: AuthState = {
  userData: null,
  isGuest: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login(state, action: PayloadAction<Record<string, any>>) {
      state.userData = action.payload;
      state.isGuest = false;
    },
    guestLogin(state) {
        state.userData = { fullName: "Guest User", firstName: "Guest" };
        state.isGuest = true;
    },
    logout(state) {
      state.userData = null;
      state.isGuest = false;
    },
  },
});

export const { login, logout, guestLogin } = authSlice.actions;
export default authSlice.reducer;
